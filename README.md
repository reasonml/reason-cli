# reason-cli
Globally installable Reason toolchain.

[![Build Status](https://travis-ci.org/reasonml/reason-cli.svg?branch=master)](https://travis-ci.org/reasonml/reason-cli)


Note, that this is beta software, and will likely break from time to time.
It's great if this works for you but there are some systems that install
doesn't work on yet (where you don't have a global `python2` binary for
example) as well as some rare linux distributions.

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


There are some challenges and things we can improve with global
packages. They are discussed in
[`CREATING_GLOBAL_PACKAGES.md`](./CREATING_GLOBAL_PACKAGES.md).

One thing that doesn't work well yet, is when you purge the global
`esy` cache after you install these global cli tools. The global
tools will be pointing to dangling references in the cache. We will
fix this eventually by relocating artifacts from the global cache to
the global installed packages.


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
tar --exclude-vcs --exclude=reason-cli/node_modules/esy/bin/EsyYarnCache-3.x.x -cvzf reason-cli-ejected.tar.gz reason-cli

# ... scp to host:
# 1. Make sure you never do anything that changes the mtimes!
#    - If copying, copy the entire tar/gzipped so as to preserve
#      the mtimes.
# 2. You can probably move the final root reason-cli once built
#    but you can not recursively copy it to a new location and
#    expect it to work there.
gunzip reason-cli-ejected.tar.gz
tar -xvf reason-cli-ejected.tar
cd reason-cli
./scripts/performBuild.sh
./scripts/fixupSymlinks.sh
```

# ORIGINS

See [ORIGINS](./ORIGINS.md).
