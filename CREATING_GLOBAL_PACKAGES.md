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


## General Approach.

See [this
thread](https://github.com/jordwalke/esy/issues/7#issuecomment-278817518) for
more discussion.

0. We need to put all the binary wrappers into the `PATH` (this is solved by
   `reason-cli` and `npm` `-g` style installations).
1. We need the wrapping scripts `binaryName` to run the real `binaryName`, but
   with the `esy` environment prepared so that the real binary has all the
   environment variables set correctly (things like dynamically loaded library
   search paths etc). That's not difficult - we can just have the wrapper
   scripts run `cd correctLocation && esy binaryName` as they do in this
   package.
2. We need the `esy binaryName` command to completely scrub the environment, so
   that the npm addition to `PATH`, doesn't show up in the environment because
   `binaryName` (the real binary) could call `anotherBinaryName`, and we need
   that to reference the rean `anotherBinaryName` not another wrapper script,
   or else it will end up loading the `esy` environment *twice*. Thankfully,
   that is how `esy` currently works today (completely scrubs env), otherwise,
   we would need to change the wrapper scripts to use `esypure binaryName`.

So the fact that the wrapper scripts use `esy` to find the real location of the
binary and load up the environment coincidentally scrubs the environment which
prevents loading the environment twice if that binary calls another one.

The downside is that these binary wrappers scrub the environment so thoroughly,
that the binaries won't be able to see any env vars that you export. That
remains unsolved.

## Problems:
**Editors need the *real* path to binaries**

This is a pretty rare situation. Editors look for `refmt` and `ocamlmerlin` to
search for the location where IDE support is stored. If we create a wrapper
script `refmt` that does `cd correctLocation && esy refmt`, then editors can't
use this trick anymore. So for these two binaries, we ensure that we have
direct symlinks from `refmt`/`ocamlmerlin` to the real location of the binaries.
Luckily those two binaries happen to not need environments prepared carefully.
However, direct symlinking shouldn't always be necessary and we should normally
be able to create wrapping scripts that `cd correctLocation && esy binaryName`.

Also coincidentally, the fact that `ocamlmerlin/refmt` are the two binaries
that do not have wrapper scripts that load the environment also helps us
because `ocamlmerlin` uses environment variables for things like `$MERLIN_LOG`
and creating a typical wrapper script would reset those variables.

Also, since `ocamlmerlin-reason` and `refmt` will be called very frequently, we
would prefer that they don't need the environment setup upon each invocation
(50ms overhead). (We can [get this time
down](https://github.com/jordwalke/esy/issues/65) for global packages where we
know the env will never change across invocations).

**Temporary Warning: Wrapper Scripts Are Not For Heavy Use**

Wrapper scripts that actually invoke `esy` to determine the proper environment,
should not be used for heavy use, such as automated build scripts. For now,
each invocation of each binary will incur at least 50ms to setup the
environment but [this will be fixed]((We can [get this time
down](https://github.com/jordwalke/esy/issues/65)).

If we create automated tooling to generate global installs of packages, we
should have packages mark themselves as needing environment support (for
example binaries that load libraries at runtime and avoid generating wrapper
scripts in those cases. Even when we get the `50ms` overhead down to `5ms`,
that can significantly add up when the utility is used heavily in build tools.
