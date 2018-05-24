# reason-cli
Reason toolchain packaged for npm.

[![Build Status](https://travis-ci.org/reasonml/reason-cli.svg?branch=master)](https://travis-ci.org/reasonml/reason-cli)

**Supported**: Installing via `NPM`/`Yarn`, on Mac OS or Linux.

## Install

### 1. Choose your platform

**The package's size is rather big. It takes a while to download,
especially on slower internet. If npm is stuck and doesn't produce any
errors then it's probably just downloading it. This will be fixed in the
following releases. Sorry.** (If you are having trouble, you can download the tarball to your machine separately, and run `npm install path/to/tarball`, to install from the local file).

| type     | platform  | install command                          | Notes             |
|:--------:|-----------|------------------------------------------|-------------------|
| `binary` | **macOS** | `npm install -g reason-cli@3.1.0-darwin` | Installs Binaries |
| `binary` | **Linux** | `npm install -g reason-cli@3.1.0-linux`  | Installs Binaries |
| ---      |**Windows**| Please see https://github.com/reasonml/reasonml.github.io/issues/195

(Or `yarn global add reason-cli@3.1.0-darwin`, etc.)

**The installation requires glibc >=3.4.21**. If you're on macOS, you should be good to go. If you're on Ubuntu, reason-cli requires Ubuntu **16.04**. Otherwise the postinstall might fail.

### 2. Install your editor plugins

Pick your favorite editor plugin [here](https://reasonml.github.io/docs/en/editor-plugins.html#officially-supported-editors)

### 3. Updating when needed

Just reinstall over the previously installed package. It's usually a good idea
to uninstall the old reason-cli first.

```
npm uninstall -g reason-cli
npm install -g reason-cli@3.1.0-darwin
```

### Optional: Install as local developer tool:
`reason-cli` now supports being installed as a dev-time dependency in an `npm`
project. Simply omit the `-g` flag. The binaries will show up in your
`node_modules/.bin` directory.

#### Included Binaries

When installed with `npm install -g`, `reason-cli` places the following tools
in your path:

- `ocamlmerlin`
- `ocamlmerlin-reason`
- `refmt`
- `rtop`

### Releasing

You need `esy@0.0.62` installed globally: (First remove any existing global esy you have)

```sh
npm remove -g esy
npm install -g esy@preview
```

Now you can use `make release` command.

For *binary* releases (an installation process will just copy prebuilt binaries
to the installation location):

```sh
rm -rf ./_release # Start fresh
esy install # Make sure there were no changes to lockfile after running this.
make release
cd _release/bin-darwin  #or bin-linux if you're on linux
```

Edit the `package.json` version to include the "prerelease" hyphen the
scope/name you wish to publish `reason-cli` under.  Typically this will be
appending `-darwin` or `-linux` to the version number like:

```json
{
  "name": "reason-cli",
  "version": "3.1.0-darwin",
  ...
```

```
npm publish
```


## More Info


### TroubleShooting:

- For failed installs try:

      npm install -g whateverReasonCliReleaseYouTried --ignore-scripts
      cd whereverYourGlobalNpmPackagesAreStored/reason-cli/
      ./postinstall.sh

  - Does it give any better information about what is failing?
  - Is there a specific log file that it claims the actual error is written into?

- Did you remember to install using `-g`?
- When updating, did you try to uninstall the previous installation?

Each published binary includes the built-in ability to troubleshoot where each
binary is resolved to.  If something is going wrong with your `refmt` command,
you can see which released binary `refmt` *actually* invokes in the release. We
use the `----where` flag with four `-` characters because it's unlikely to
conflict with any meaningful parameters of binaries like `refmt`.

```
refmt ----where

> /path/to/npm-packages/lib/reason-cli/actualInstall/builds/reason/bin/refmt

```

### ORIGINS

See [ORIGINS](./ORIGINS.md).


