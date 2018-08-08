# reason-cli
Reason toolchain packaged for npm.

[![CircleCI](https://circleci.com/gh/reasonml/reason-cli/tree/master.svg?style=svg)](https://circleci.com/gh/reasonml/reason-cli/tree/master)

**Supported**: Installing via `NPM`/`Yarn`, on Mac OS or Linux.

## Install


| platform  | install command                          |
|-----------|------------------------------------------|
| **macOS** | `npm install -g reason-cli@latest-macos` |
| **Linux** | `npm install -g reason-cli@latest-linux`  |
|**Windows**| Please see https://github.com/reasonml/reasonml.github.io/issues/195

(Or `yarn global add reason-cli@3.1.0-darwin`, etc.)


**The package's size is rather big. It takes a while to download,
especially on slower internet. If npm is stuck and doesn't produce any
errors then it's probably just downloading it. This will be fixed in the
following releases. Sorry.**

**The installation requires glibc >=3.4.21**. If you're on macOS, you should be good to go. If you're on Ubuntu, reason-cli requires Ubuntu **16.04**. Otherwise the postinstall might fail.

If you are having trouble, you can download the tarball to your machine separately, and run `npm install path/to/tarball`, to install from the local file.

### Install your editor plugins

Pick your favorite editor plugin [here](https://reasonml.github.io/docs/en/editor-plugins.html#officially-supported-editors)

### Updating:

Just reinstall over the previously installed package. It's usually a good idea
to uninstall the old reason-cli first.

```
npm uninstall -g reason-cli
npm install -g reason-cli@3.2.0-darwin
```

#### Included Binaries

When installed with `npm install -g`, `reason-cli` places the following tools
in your path:

- `ocamlmerlin`
- `ocamlmerlin-reason`
- `refmt`
- `rtop`

### Releasing (For Maintainers):

Repeat the following for both most recent reason-cli linux and macos circle CI
builds that succeed.


0. Bump the versions/config in `package.json` to your liking, and make sure to
   locally run `esy install` to regenerate any lockfiles. Send a commit with
   those lockfiles and config changes.
1. When that diff builds on `master`, grab the results from the **Artifacts**
   tab on the CircleCI build results for the build of the platform you want to
   release.
2. Verify the release can be installed: `npm remove -g reason-cli && npm
   install reason-cli.tar.gz`
3. Make sure `rtop` works.
4. **Uninstall** the release you just installed: `npm remove -g reason-cli`
   (otherwise npm freaks out).
5. Extract the release locally: `tar -xvf reason-cli.tar.gz`.
6. `cd package`
7. Edit the version number in `package.json` to be `3.3.2-linux` or
   `3.3.2-darwin` (adjust for the version and platform you downloaded for
   accordingly).
8. `npm publish`

Repeat steps 1-8 for both linux and macos builds.

9. Update dist tags:
   ```
   npm dist-tags add reason-cli@3.3.2-linux latest-linux
   npm dist-tags add reason-cli@3.3.2-macos latest-macos
   ```
   (adjust for the version and platform you downloaded for accordingly)



### Releasing (without CI):

You can just recreate what the circle CI steps do locally and then perform the steps above.


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


