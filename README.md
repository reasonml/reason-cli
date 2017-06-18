# reason-cli
Reason toolchain packaged for npm.

[![Build Status](https://travis-ci.org/reasonml/reason-cli.svg?branch=master)](https://travis-ci.org/reasonml/reason-cli)

Supported:

- Installing via `npm`. (Yarn support is untested and unsupported but it still
  might work)
- Mac OS, Linux.

Note, that this is beta software, and will likely break from time to time.

Please report bugs so that we are aware of the issues.

If you are comfortabe using `opam`, then `opam` installations of the Reason
toolchain may be more stable.

# Install

### 1. Install a specific release:

For each version of `reason-cli`, there are binary releases for linux and Mac
OS.


| type | install command                                                                   | Notes   |
|:----:|-----------------------------------------------------------------------------------|---------|
| **`binary` OSX** | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.6-bin-darwin.tar.gz` | Downloads Binaries |
| **`binary` Linux** | `npm install -g https://github.com/reasonml/reason-cli/archive/beta-v-1.13.6-bin-linux.tar.gz` | Downloads Binaries |


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

```share
/path/to/package/.bin/refmt
```

Alternatively, you can put something like this in your `.bashrc`:

```
export ESY_EJECT__STORE=`cat /path/to/package/records/recordedClientInstallStorePath.txt`
source /path/to/package/node_modules/.cache/_esy/build-eject/eject-env
```

## More Info

### Global Installs That Share the build cache:

Since these global tools use `esy`, globally installed tools (`dev` and `pack`
modes) warm the build cache for your local projects.

1. When building sandboxed projects, now those sandboxed projects
   build very fast because they share the same cache as the globally
   installed tools you've built.
2. One infrastructure to manage.

We do not have good examples of creating sandboxed projects yet, so this isn't
entirely useful yet.


### TroubleShooting:

- For failed installs try:

      npm install -g whateverReasonCliReleaseYouTried --ignore-scripts
      cd whereverYourGlobalNpmPackagesAreStored/reason-cli/
      ./scripts/postinstall.sh

  Does it give any better information about what is failing?


- Did you remember to install using `-g`?
- In general, try uninstalling and then reinstalling `reason-cli`.
- When updating, did you remember to uninstall the previous installation?
- If you're experiencing permissions issues, it could be due to the linux `npm`
  installs global `-g` packages when you use `sudo`. Instead of installing with
  `sudo` you should probably set up your packages as explained in this guide:
  https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md
  - Note: We are still going to work on solving permissions issues with
    installing `-g` packages with `sudo`, but following that guide should
    eliminate many issues with many different npm packages (not just
    reason-cli).
- If an error occurs during install, it likely tells you where the log is (not
  the npm log) that contains the build errors.
  - If not, you can find recent build attempts here in your home dir cache at these locations:
    `~/.esy/_build/packageName/_esy/build.log`. Find recently modified created
    build logs in those locations and create github gists, sharing them on the
    [Reason Discord Chanel](https://discord.gg/UugQtbW)
    in the channel `#packageManagementAndNativeBuildSystems`.
- If nothing else works, and the error isn't clear (especially if a previous
  version worked), you can do:
  - `mv ~/.esy ~/.esy-old`
  - Uninstall then *reinstall* `reason-cli`.
  - If it works when you do this, then it's a critical bug with `esy` and you
    can help us eliminate the bug by helping us spot some differences between
    those two `~/.esy` and `~/.esy-old`. Are there two corresponding package
    directories with the same name but different contents?


### Ways `Reason-Cli` Can Improve:

- One thing that doesn't work well yet, is when you purge the global `esy`
  cache after you install `pack` or `dev` releases, the global tools will be
  pointing to dangling references in the cache. We will fix this eventually by
  relocating artifacts from the global cache to the global installed packages.
  A simple uninstall and reinstall should fix that. This can be fixed by
  relocating all build artifacts from the cache to the installed `node_modules`
  directory (at a slight install performance hit).

- We can repurpose the `releaseUtils/release.js` to allow releasing other opam
packages as npm binaries.


### ORIGINS

See [ORIGINS](./ORIGINS.md).


