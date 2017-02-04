# reason-cli
Globally installable Reason toolchain.

# Install

```
npm install -g git://github.com/reasonml/reason-cli.git
```


# Usage


## Global Tools That Use `esy`

This project also serves as a good example of how to create npm
packages that publish global tools, but sharing the same
infrastructure, and package caching as local tools.

## Global Installs Shares the `esy` Build Cache:
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
