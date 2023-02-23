# TwoFA: Two-Factor Authentication CLI

Two-Factor Authentication CLI for macOS and Linux.

## Install

```sh
node -v  # I have tested with v18.14.1
git clone https://github.com/susumuota/twofa.git
cd twofa
npm ci
npm run build
```

## Usage

### Add secret of two-factor authentication

Add base32 encoded `secret` string (e.g. `JBSWY3DPEHPK3PXP`) to your keychain application. You can see the `secret` string when you add the QR code to your two-factor authentication application. `username` and `servicename` must be alphanumeric.

- for macOS, use `security` command.

```sh
security add-generic-password -a username -s servicename -T "" -w
```

- for Linux, use [pass](https://www.passwordstore.org/). `pass` is a command line password manager.

```sh
pass insert servicename/username
```

- for Windows, use `cmdkey` command. (WIP, adding secret is done but retrieving secret is not implemented yet)

```sh
cmdkey /generic:servicename /user:username /pass
```

### Show help

```sh
node dist/twofa.mjs -h

Usage: twofa [-h] [-a account] [-s service] [-n num]

Options:
  -h, --help      Show this help message and exit.
  -a, --account   Account name.
  -s, --service   Service name.
  -n, --num       Number of codes to generate. Default is 1.
```

### Generate codes

- Generate two-factor authentication codes, current one and next one.

```sh
node dist/twofa.mjs -a username -s servicename -n 2
```

## Related Links

- HMAC-Based One-Time Password (HOTP)
  - An one-time password algorithm using hash.
  - https://www.rfc-editor.org/rfc/rfc4226#page-6
- Time-Based One-Time Password (TOTP)
  - Popular one-time password algorithm among two-factor authentication applications. e.g. Google Authenticator, Authy, etc.
  - https://www.rfc-editor.org/rfc/rfc6238#page-4
- Google Authenticator Key URI Format
  - De facto standard key format for two-factor authentication applications.
  - https://github.com/google/google-authenticator/wiki/Key-Uri-Format


## License

MIT, see [LICENSE](LICENSE) file.

## Author

Susumu OTA
