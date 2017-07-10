
# Using And Releasing CLI apps.

### Using Released Packages

    npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.5-dev
    npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.5-pack
    npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.5-bin-darwin

There are three separate package releases for each version, which are simply
published "snapshots" of the typical full clean build. Throughout the process
of a full from scratch install and build, if you were to take snapshots along
the way, you'd see an increasingly simpler state of the world until finally you
end up with the pure binary release which does not need to download
dependencies, and does not need to build anything at all.

The release utility performs this download/build/install process and snapshots
the state of the world at three separate moments. The three snapshots are named
`dev`, `pack`, and `bin`.

**Dev**: Dev releases perform everything on the client installer machine
(download, build).

**Pack**: Pack releases perform download and "pack"ing on the "server", and
then only builds will be performed on the client. This snapshots a giant
tarball of all dependencies' source files into the release.

**Bin**: Bin releases perform everything on "the server", and "the client"
installs a package consisting only of binary executables.

In the main repo's package.json, a list of `releasedBinaries` is provided,
which will expose npm binary wrappers for each of the specified binary names.
When creating releases the `actualInstall/package.json` is used as a template
for the packages that are actually build/installed.

### TroubleShooting

Each published binary includes the built-in ability to troubleshoot where each
binary is resolved to.  If something is going wrong with your `refmt` command,
you can see which released binary `refmt` *actually* invokes in the release. We
use the `----where` flag with four `-` characters because it's unlikely to
conflict with any meaningful parameters of binaries like `refmt`.

```
refmt ----where

> /path/to/npm-packages/lib/reason-cli/actualInstall/builds/reason/bin/refmt

```

### Wrapping Features:

- Mitigates relocatability and cross platform packaging issues via command
  wrappers.
- When any one binary in the collection of "releasedBinaries" is invoked, that
  process can reference the other binaries in the collection without having to
  pay for wrapping cost. Suppose `merlin` invokes `refmt` often. Starting
  `merlin` via the released package, will ensure that `merlin`'s running
  process sees the `refmt` binary without the wrapper script.


### Making New Releases

Inside of your package's `package.json` field, specify a field `releasedBinaries:
["exeName", "anotherName"]`, then these release utilities will automatically
create releasable packages that expose those binaries via npm's standard `bin`
feature. You won't populate the `bin` field in your `package.json` - the
release utilities will do so for you in the releases.

The build stages are as follows. A release is created (essentially) by stopping
in between stages and publishing the state of the world to git/npm.

    Dev -> Pack -> Bin

If you `npm install` on the Dev Release, you essentially carry out the
remainder of the stages (Pack, and Bin) on the installing client.  If you `npm
install` the result of the Pack Release, you carry out the remaining stages on
the client (Bin). If you install the Bin release, you've installed the complete
compilation result onto the client.

There's some slight differences between that simple description and what
actually happens: we might do some trivial configuration to set the build
destination to be different for the bin release etc.

                                    RELEASE PROCESS



     ○ make release TYPE=dev        ○ make release TYPE=pack      ○─ make release TYPE=bin
     │                              │                             │
     ○ trivial configuration        ○ trivial configuration       ○ trivial configuration
     │                              │                             │
     ●─ Dev Release                 │                             │
     .                              │                             │
     .                              │                             │
     ○ npm install                  │                             │
     │                              │                             │
     ○ Download dependencies        ○ Download dependencies       ○ Download dependencies
     │                              │                             │
     ○ Pack all dependencies        ○ Pack all dependencies       ○ Pack all dependencies
     │ into single tar+Makefile     │ into single tar+Makefile    │ into single tar+Makefile
     │                              │                             │
     │                              ●─ Pack Release               │
     │                              .                             │
     │                              .                             │
     │                              ○ npm install                 │
     │                              │                             │
     ○─ Build Binaries              ○─ Build Binaries             ○─ Build Binaries
     │                              │                             │
     │                              │                             ●─ Bin Release
     │                              │                             .
     │                              │                             .
     │                              │                             ○ npm install
     │                              │                             │
     ○─ Npm puts binaries in path   ○─ Npm puts binaries in path  ○─ Npm puts binaries in path.



For BinRelease, it doesn't make sense to use any build cache, so the `Makefile`
at the root of this project substitutes placeholders in the generated binary
wrappers indicating where the build cache should be.

> Relocating: "But aren't binaries built with particular paths encoded? How do
we distribute binaries that were built on someone else's machine?"

That's one of the main challenges with distributing binaries. But most
applications that assume hard coded paths also allow overriding that hard
coded-ness in a wrapper script.  (Merlin, ocamlfind, and many more). Thankfully
we can have binary releases wrap the intended binaries that not only makes
Windows compatibility easier, but that also fixes many of the problems of
relocatability.

> NOTE: Many binary npm releases include binary wrappers that correctly resolve
> the binary depending on platform, but they use a node.js script wrapper. The
> problem with this is that it can *massively* slow down build times when your
> builds call out to your binary which must first boot an entire V8 runtime. For
> `reason-cli` binary releases, we create lighter weight shell scripts that load
> in a fraction of the time of a V8 environment.

The binary wrapper is generally helpful whether or *not* you are using
prereleased binaries vs. compiling from source, and whether or not you are
targeting linux/osx vs. Windows.

When using Windows:
  - The wrapper script allows your linux and osx builds to produce
    `executableName.exe` files while still allowing your windows builds to
    produce `executableName.exe` as well.  It's usually a good idea to name all
    your executables `.exe` regardless of platform, but npm gets in the way
    there because you can't have *three* binaries named `executableName.exe`
    all installed upon `npm install -g`. Wrapper scripts to the rescue.  We
    publish two script wrappers per exposed binary - one called
    `executableName` (a shell script that works on Mac/Linux) and one called
    `executableName.cmd` (Windows cmd script) and npm will ensure that both are
    installed globally installed into the PATH when doing `npm install -g`, but
    in windows command line, `executableName` will resolve to the `.cmd` file.
    The wrapper script will execute the *correct* binary for the platform.
When using binaries:
  - The wrapper script will typically make *relocated* binaries more reliable.
When building pack or dev releases:
  - Binaries do not exist at the time the packages are installed (they are
    built in postinstall), but npm requires that bin links exists *at the time*
    of installation. Having a wrapper script allows you to publish `npm`
    packages that build binaries, where those binaries do not yet exist, yet
    have all the bin links installed correctly at install time.

The wrapper scripts are common practice in npm packaging of binaries, and each
kind of release/development benefits from those wrappers in some way.

TODO:
 - Support local installations of <package_name> which would work for any of
   the three release forms.
   - With the wrapper script, it might already even work.
 - Actually create `.cmd` launcher.

NOTES: 

 We maintain two global variables that wrappers consult:

 - `<PACKAGE_NAME>_ENVIRONMENT_SOURCED`: So that if one wrapped binary calls
   out to another we don't need to repeatedly setup the path.

 - `<PACKAGE_NAME>_ENVIRONMENT_SOURCED_<binary_name>`: So that if
   `<binary_name>` ever calls out to the same `<binary_name>` script we know
   it's because the environment wasn't sourced correctly and therefore it is
   infinitely looping.  An early check detects this.

 Only if we even need to compute the environment will we do the expensive work
 of sourcing the paths. That makes it so merlin can repeatedly call
 `<binary_name>` with very low overhead for example.

 If the env didn't correctly load and no `<binary_name>` shadows it, this will
 infinitely loop. Therefore, we put a check to make sure that no
 `<binary_name>` calls out to ocaml again. See
 `<PACKAGE_NAME>_ENVIRONMENT_SOURCED_<binary_name>`
