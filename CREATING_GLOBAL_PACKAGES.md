## Things That Don't Work Well Yet:
1. Though these globally installed packages share the global cache with local
   sandboxed projects, it does so via *reference*.  That means that if you
   purche the cache the global installs have dangling references. We can
   improve `esy` so that we can tell it to relocate all built artifacts into
   the globally installed packages as a backup.
2. If you see how this project was setup, it is kind of a pain to
   create `-g`, globally installed packages. Part of the reason is that `esy`
   doesn't use `npm` `postinstall` to build packages (which is a good thing).
   Another reason is that `esy` uses special package manager tricks to depend
   on things like `"@opam/foo"` that don't actually exist in `npm`. That means
   that we have to create separate `-g` installable packages that

   - *Don't* actually include the real dependencies, and only include
     placeholders in the `.bin` directory.
   - Executes a `postinstall` step that performs the *real* `esy install` and
     `esy build`.

There's likely not much we can do about this since we want to use a custom
package manager to handle more cases than `npm` handles, and we want to use our
own build step instead of postinstall (it's way worth it). But we should create
some utilities that make it easier to create `-g` installable packages for
applications that use `esy`.
