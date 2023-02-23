#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { BinaryLike, createHmac } from 'node:crypto';
import { parseArgs } from 'node:util';

import { base32 } from '@scure/base';

// https://www.rfc-editor.org/rfc/rfc4226#page-6
const hotp = (secret: BinaryLike, count: number, digits: number = 6) => {
  const c = Buffer.alloc(8);
  c.writeBigInt64BE(BigInt(count)); // c must be 64 bits integer
  const hs = createHmac('sha1', secret).update(c).digest(); // @ts-ignore // sha1 returns 20 bytes, so hs[19] is ok
  const s = (hs.readUInt32BE(hs[19] & 0x0f) & 0x7fffffff); // DT: dynamic truncation
  return (s % (10 ** digits)).toString().padStart(digits, '0'); // digits is 6 or 8, typically
};

// https://www.rfc-editor.org/rfc/rfc6238#page-4
const totp = (secret: BinaryLike, time: number, step: number = 30, digits: number = 6, t0: number = 0) => {
  const count = Math.floor((time - t0) / step);
  return hotp(secret, count, digits);
};

// https://github.com/google/google-authenticator/wiki/Key-Uri-Format#secret
const twoFA = (secret: string, length: number = 1) => {
  const sec = base32.decode(secret); // secret is base32 encoded without padding
  const now = Math.floor(Date.now() / 1000); // unix time in seconds
  return { totp: Array.from({ length }, (_, i) => totp(sec, now + 30 * i, 30, 6)), time: 30 - (now % 30) };
}

const isAlphanumeric = (str: string) => /^[a-zA-Z0-9]+$/.test(str);

const getSecret = (account: string, service: string) => {
  if (!isAlphanumeric(account) || !isAlphanumeric(service)) throw Error('account and service must be alphanumeric.');
  if (process.platform === 'darwin') {
    return spawnSync('security', ['find-generic-password', '-a', account, '-s', service, '-w']).stdout.toString().trim()
  } else if (process.platform === 'linux') {
    return spawnSync('pass', [`${service}/${account}`]).stdout.toString().trim();
  }
  throw Error('Add code here to get secret from your password manager.');
};

const showHelp = () => {
  console.log(`
Usage: twofa [-h] [-a account] [-s service] [-n num]

Options:
  -h, --help      Show this help message and exit.
  -a, --account   Account name.
  -s, --service   Service name.
  -n, --num       Number of codes to generate. Default is 1.
`);
};

type Options = {
  help: boolean;
  account: string;
  service: string;
  num: string;
};

const { values: { help, account, service, num } } = parseArgs({
  options: {
    'help': { type: 'boolean', short: 'h', default: false },
    'account': { type: 'string', short: 'a', default: '' },
    'service': { type: 'string', short: 's', default: '' },
    'num': { type: 'string', short: 'n', default: '1' },
  },
}) as { values: Options };

if (help) {
  showHelp();
  process.exit(0);
}

try {
  if (!getSecret(account, service)) throw Error('Secret not found.');
} catch (err: any) {
  console.error(err.toString().slice(0, 10)); // just print first 10 chars to avoid leaking secret accidentally
  process.exit(1);
}

const n = parseInt(num);

if (isNaN(n) || n < 1) {
  console.error('num must be a positive integer.');
  process.exit(1);
}

try {
  setInterval(() => {
    console.log(twoFA(getSecret(account, service), n));
  }, 1000);
} catch (err: any) {
  console.error(err.toString().slice(0, 10)); // just print first 10 chars to avoid leaking secret accidentally
}
