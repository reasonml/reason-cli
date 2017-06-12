# reason-cli
Globally installable Reason toolchain.

[![Build Status](https://travis-ci.org/reasonml/reason-cli.svg?branch=master)](https://travis-ci.org/reasonml/reason-cli)

Supported:

- Installing via `npm`. (Yarn support is untested, unsupported but might work)
- Mac OS, Linux.


Note, that this is beta software, and will likely break from time to time.
`opam` installations of the Reason toolchain tend to be more stable, but please
file issues for all troubles installing `reason-cli` and mention your version
of `npm`, `node`, OS. 

> Note: There is a [new version](./README.next.md) of the `README` which
> describes the upcoming `reason-cli` releases, including support for prebuilt
> binaries.

# Install

Install a specific version of `reason-cli` which corresponds to the version of
Reason that is bundled with it.

The supported versions are below:

```
# Reason 1.13.3 and ocaml 4.02.3
npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.3
```

```
# Reason 1.13.5 and ocaml 4.02.3
npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.5
```

Or you can install whichever `master` happens to point to. (You probably don't
want this).

```
npm install -g git://github.com/reasonml/reason-cli.git
```

# Updating

Any time you update, make sure to first uninstall the old version, then run the
global install command for the new version you want to install.  When an update
/ bug fix has been pushed to a release, you should `uninstall -g` and then
install that same release you just uninstalled.


```
npm uninstall -g reason-cli
npm install -g git://github.com/reasonml/reason-cli.git#beta-v-1.13.5
```


Updating should be fairly fast.

## Included Binaries

`reason-cli` places the following tools in your path:

- `ocamlmerlin`
- `refmt`
- `ocamlrun`
- `ocamlc`/`ocamlopt`

# Usage

- Just start your editor like you normally would, and it should see `ocamlmerlin`,
and `refmt`.
- The only downside is that `merlin` doesn't know where you have your findlib
packages installed for sandboxed projects, but you can fix that by running
`esy sh -c 'echo $OCAMLFIND_CONF' >> ./.merlin` in your project root. All build
systems that generate `.merlin` should put the equivalent line in your merlin
automatically, but you will have to add it manually for other build systems.

You will still need to install your editor plugin loaders etc.

# Why?

Normally when you work on a project, that project should have everything necessary
to edit that project in your IDE locally. To edit that project so that all the
IDE tools are in your `PATH`, you would normally launch the editor with
`esy vim` or `esy atom`, etc. Some people don't like to do that and would rather
install a set of IDE tools such as `ocamlmerlin` in the global path so that they
don't have to start their editor using `esy vim`.

## Global Installs That Share the `esy` Build Cache:
Since these global tools use `esy`, everything is actually executed
from the global cache. That has huge benefits:

1. When building sandboxed projects, now those sandboxed projects
   build very fast because they share the same cache as the globally
   installed tools you've built.
2. One infrastructure to manage.

## TroubleShooting:

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


## Ways `Reason-Cli` Can Improve:

- We can distribute a version of `reason-cli` with prebuilt binaries.
  - Some of those can be dirt simple prebuilt binaries just copied from build
    artifacts.
  - Others like `rtop` and `ocamlmerlin` likely require anything from a little
    bit of path rewriting, to some more involved environment wrapping but it
    should be doable.
- Even if we release binary versions, we can also make the *non* binary version
  of `reason-cli` more robust by creating tarballs of ejected builds. This
  means that we can make `npm` installations much faster, and virtually
  equivalent to downloading a single package whose contents are a vendorred
  tarball of sources + one Make file that builds everything.
- One thing that doesn't work well yet, is when you purge the global `esy`
  cache after you install these global cli tools. The global tools will be
  pointing to dangling references in the cache. We will fix this eventually by
  relocating artifacts from the global cache to the global installed packages.
  A simple uninstall and reinstall should fix that. This can be fixed by
  relocating all build artifacts from the cache to the installed `node_modules`
  directory (at a slight install performance hit).


## Global Installs: Approach

This project also serves as a good example of how to create npm
packages that publish global tools, but sharing the same
infrastructure, and package caching as local tools.


## Ejecting To A Network Disconnected Host:

```sh
git clone git@github.com:reasonml/reason-cli.git
cd reason-cli
npm install --ignore-scripts
./scripts/performDownload.sh
./scripts/performBuildEject.sh
cd ..
tar --exclude=reason-cli/.git --exclude=reason-cli/node_modules/esy/bin/EsyYarnCache-3.x.x -cvzf reason-cli-ejected.tar.gz reason-cli

# ... scp to host:
# 1. Make sure you never do anything that changes the mtimes!
#    - If copying, copy the entire tar/gzipped so as to preserve
#      the mtimes.
# 2. You can probably move the final root reason-cli once built
#    but you can not recursively copy it to a new location and
#    expect it to work there.
gunzip reason-cli-ejected.tar.gz
tar -xvf reason-cli-ejected.tar
./scripts/resumeBuildEject.sh
./scripts/fixupSymlinks.sh
```

# ORIGINS

See [ORIGINS](./ORIGINS.md).
