# reason-cli
Globally installable Reason toolchain.

# Install

```
npm install -g git://github.com/reasonml/reason-cli.git
```
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

# ORIGINS

See [ORIGINS](./ORIGINS.md).
