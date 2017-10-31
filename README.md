# reason-cli
Reason toolchain packaged for npm.

[![Build Status](https://travis-ci.org/reasonml/reason-cli.svg?branch=master)](https://travis-ci.org/reasonml/reason-cli)

**Supported**: Installing via `NPM`/`Yarn`, on Mac OS or Linux.

## Install

### 1. Choose your platform

**[Are you using the new Reason syntax or the old one](https://twitter.com/reasonml/status/924043510977740800)**?

**The package's size over network is around 140mb. It takes a while to download,
especially on slower internet. If npm is stuck and doesn't produce any
errors then it's probably just downloading it. This will be fixed in the
following releases. Sorry.** (If you are having trouble, you can download the tarball to your machine separately, and run `npm install path/to/tarball`, to install from the local file).

### New Syntax (3)

| type     | platform  | install command                                                                                 | Notes   |
|:--------:|-----------|-------------------------------------------------------------------------------------------------|---------|
| `binary` | **OSX**   | `npm install -g https://github.com/reasonml/reason-cli/archive/3.0.1-bin-darwin.tar.gz` | Installs Binaries |
| `binary` | **Linux** | `npm install -g https://github.com/reasonml/reason-cli/archive/3.0.1-bin-linux.tar.gz`  | Installs Binaries |

(Or `yarn global add https://github.com/reasonml/reason-cli/archive/3.0.1-bin-darwin.tar.gz`, etc.)

### Old Syntax (2)

| type     | platform  | install command                                                                                 | Notes   |
|:--------:|-----------|-------------------------------------------------------------------------------------------------|---------|
| `binary` | **OSX**   | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.7-bin-darwin.tar.gz` | Installs Binaries |
| `binary` | **Linux** | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.7-bin-linux.tar.gz`  | Installs Binaries |

(Or `yarn global add https://github.com/reasonml/reason-cli/archive/beta-v-1.13.7-bin-darwin.tar.gz`, etc.)

**The installation requires glibc >=3.4.21**. If you're on macOS, you should be good to go. If you're on Ubuntu, reason-cli requires Ubuntu **16.04**. Otherwise the postinstall might fail.

### 2. Install your editor plugins

Pick your favorite editor plugin [here](https://reasonml.github.io/guide/editor-tools/editors-plugins#officially-supported-editors)

### 3. Updating when needed

Just reinstall over the previously installed package. It's usually a good idea
to uninstall the old reason-cli first.

```
npm uninstall -g reason-cli
npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.7-bin-darwin
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
- `ocamlrun`
- `ocamlc`/`ocamlopt`
- `ocamlfind`

## Advanced

### Optional `dev`/`pack` releases:
There are also two other types of releases, `dev` and `pack`.

- **`dev`**: Live on the bleeding edge and help us find bugs earlier. When
  installed, it downloads sources, packs them into a bundle, and then builds
  them from source - all on the client.

- **`pack`**: (Not yet released) (experimental) Builds a *prepacked* bundle of
  sources on the client. Suitable for offline installations, CI, isolated
  networks, and environments that require building on host.

| type | install command                                                                   | Notes   |
|:----:|-----------------------------------------------------------------------------------|---------|
| **`dev`** | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.7-dev.tar.gz`    | Downloads+Packs Source, Builds Source |
| **`pack`** | Not yet distributed. You can create your own release - see [releaseUtils/README.md](./releaseUtils/README.md)  | Builds Prepacked Source |



### Releasing

You need `esy@0.0.16` (at least) installed globally:

```sh
npm install -g esy
```

Now you can use `make release TYPE=...` command.

For *dev* releases (an installation process will download a copy of Esy, a set of
its deps and perform a build):

```sh
make release TYPE=dev
```

For *pack* releases (an installation process will perform only build, all deps
are bundled with the release):

```sh
make release TYPE=pack
```

For *bin* releases (an installation process will just copy prebuilt binaries to
the installation location):

```sh
make release TYPE=bin
```

After you've performed the release build you can release it:

### Using `pack` to build on isolated network host (using `npm -g` on the destination):

```sh
git clone git@github.com:reasonml/reason-cli.git
cd reason-cli
npm install -g esy
make build-release TYPE=pack
cd _release/pack
npm pack
npm install --global ./reason-cli-VERSION.tgz
```

You cannot move the installation once you have installed it into a location
(global or local). To move the package, uninstall it and reinstall it from the
new location. You can, however, install it anywhere you like.

### Using `pack` to build on isolated network host (without `npm`):

If you do not have `npm` installed on the destination host, then the setup is
largely the same but instead of the final `npm install ./package` command you
can simply extract `release.tar.gz` to the installation directory of your
choosing and then invoke the `postinstall.sh` yourself. Again, don't move the
package once it's installed.

On build host:

```sh
git clone git@github.com:reasonml/reason-cli.git
cd reason-cli
npm install -g esy
make build-release TYPE=pack
cd _release/pack
npm pack
```

On target host:

```sh
tar xzf reason-cli-VERSION.tgz
cd package
./postinstall.sh
```

Then you can simply invoke the binaries as part of a build script elsewhere, or
include the binary locations for `refmt` in your `bsconfig`.

```sh
/path/to/package/.bin/refmt
```

#### Debugging

After installing globally, you can put something like this in your `.bashrc` and all the underlying
toolchain binaries will be in your path, without having to go through the `npm` bin
links redirection. This is useful for debugging purposes:

```
export ESY_EJECT__STORE=`cat /path/to/global/reason-cli/records/recordedClientInstallStorePath.txt`
PREV_SHELL="$SHELL"
source /path/to/global/reason-cli/.cache/_esy/build-eject/eject-env
export SHELL="$PREV_SHELL"
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


