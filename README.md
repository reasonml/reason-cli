# reason-cli
Reason toolchain packaged for npm.

[![Build Status](https://travis-ci.org/reasonml/reason-cli.svg?branch=master)](https://travis-ci.org/reasonml/reason-cli)

**Supported**: Installing via `npm`, on Mac OS or Linux.

> Note, that this is beta software, and will likely break from time to time. Please report bugs so that we are aware of the issues. If you are comfortabe using `opam`, then `opam` installations of the Reason
toolchain may be more stable.

# Install

### 1. Install a specific release:

| type     | platform  | install command                                                                                 | Notes   |
|:--------:|-----------|-------------------------------------------------------------------------------------------------|---------|
| `binary` | **OSX**   | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.6-bin-darwin.tar.gz` | Installs Binaries |
| `binary` | **Linux** | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.6-bin-linux.tar.gz`  | Installs Binaries |


There are also two other types of releases, `dev` and `pack`.

- **`dev`**: Live on the bleeding edge and help us find bugs earlier. When
  installed, it downloads sources, packs them into a bundle, and then builds
  them from source - all on the client.

- **`pack`**: (Not yet released) (experimental) Builds a *prepacked* bundle of
  sources on the client. Suitable for offline installations, CI, isolated
  networks, and environments that require building on host.

| type | install command                                                                   | Notes   |
|:----:|-----------------------------------------------------------------------------------|---------|
| **`dev`** | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.6-dev.tar.gz`    | Downloads+Packs Source, Builds Source |
| **`pack`** | Not yet distributed. You can create your own release - see [releaseUtils/README.md](./releaseUtils/README.md)  | Builds Prepacked Source |



### 2. Install your editor plugins

- [vscode-reasonml](https://github.com/freebroccolo/vscode-reasonml)
- [vim-reason](https://github.com/chenglou/vim-reason)
- Someone please test on `emacs` plugins so we can add them to this list.


### 3. Optional: Install as local developer tool:
`reason-cli` now supports being installed as a dev-time dependency in an `npm`
project. Simply omit the `-g` flag. The binaries will show up in your
`node_modules/.bin` directory.

### Updating

Just reinstall over the previously installed package. It's usually a good idea
to uninstall the package first.

```
npm uninstall -g reason-cli
npm install -g git://github.com/reasonml/reason-cli.git#beta--v-1.13.6-bin-darwin
```

Updating should be fairly fast, even in the case of builds-from-source.


# Usage

- After installing `reason-cli` globally, and after installing your editor
  plugins, just start your editor like you normally would, and it should see
  `ocamlmerlin`, and `refmt`.
- One downside is that `merlin` doesn't know where you have your findlib
  packages installed within your local project, because it is built for the
  global environment.

#### Included Binaries

When installed with `npm install -g`, `reason-cli` places the following tools
in your path:

- `ocamlmerlin`
- `refmt`
- `ocamlrun`
- `ocamlc`/`ocamlopt`
- `ocamlfind`


# Releasing

See [the `README` in `releaseUtils`](./releaseUtils/README.md) to understand
what happens in each release. Each of the release forms may be created as
follows:

```sh
make release VERSION=beta-v-1.13.5 TYPE=dev
# Or
make release VERSION=beta-v-1.13.5 TYPE=pack
# Or
make release VERSION=beta-v-1.13.5 TYPE=bin
```

### Using `pack` to build on isolated network host (using `npm -g` on the destination):

```sh
git clone git@github.com:reasonml/reason-cli.git
cd reason-cli
make release VERSION=beta-v-1.13.5 TYPE=pack
tar --exclude=.git -cvzf release.tar.gz package

gunzip release.tar.gz
tar -xvf package.tar
npm install -g ./package

# You cannot move the installation once you have installed it into # a location
(global or local). To move the package, uninstall it # and reinstall it from
the new location. You can, however, install it anywhere you like.
```

### Using `pack` to build on isolated network host (without `npm`):

If you do not have `npm` installed on the destination host, then the setup is
largely the same but instead of the final `npm install ./package` command you
can simply extract `release.tar.gz` to the installation directory of your
choosing and then invoke the `postinstall.sh` yourself. Again, don't move the
package once it's installed.

```sh
git clone git@github.com:reasonml/reason-cli.git
cd reason-cli
make release VERSION=beta-v-1.13.5 TYPE=pack
tar --exclude=.git -cvzf release.tar.gz package

gunzip release.tar.gz
tar -xvf package.tar
npm install -g ./package
cd ./package
./postinstall.sh
```

Then you can simply invoke the binaries as part of a build script elsewhere, or
include the binary locations for `refmt` in your `bsconfig`.

```sh
/path/to/package/.bin/refmt
```

Alternatively, you can put something like this in your `.bashrc`:

```
export ESY_EJECT__STORE=`cat /path/to/package/records/recordedClientInstallStorePath.txt`
source /path/to/package/node_modules/.cache/_esy/build-eject/eject-env
```

## More Info


### TroubleShooting:

- For failed installs try:

      npm install -g whateverReasonCliReleaseYouTried --ignore-scripts
      cd whereverYourGlobalNpmPackagesAreStored/reason-cli/
      ./scripts/postinstall.sh

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

### Ways `Reason-Cli` Can Improve:

- We can repurpose the `releaseUtils/release.js` to allow releasing other opam
packages as npm binaries.


### ORIGINS

See [ORIGINS](./ORIGINS.md).


