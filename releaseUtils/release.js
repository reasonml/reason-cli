var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var storeVersion = '3.x.x';

var tagName =
  process.env['VERSION'] +
  '-' +
  process.env['TYPE'] +
  (process.env['TYPE'] === 'bin' ? '-' + require('os').platform() : '');

/**
 * TODO: Make this language agnostic. Nothing else in the eject/build process
 * is really specific to Reason/OCaml.  Binary _install directories *shouldn't*
 * contain some of these artifacts, but very often they do. For other
 * extensions, they are left around for the sake of linking/building against
 * those packages, but aren't useful as a form of binary executable releases.
 * This cleans up those files that just bloat the installation, creating a lean
 * executable distribution.
 */
var extensionsToDeleteForBinaryRelease = [
  "Makefile",
  "README",
  "CHANGES",
  "LICENSE",
  "_tags",
  "*.pdf",
  "*.md",
  "*.org",
  "*.org",
  "*.txt"
];

var pathPatternsToDeleteForBinaryRelease = [
  '*/doc/*'
];

var scrubBinaryReleaseCommandExtensions = function(searchDir) {
  return 'find ' + searchDir + ' -type f \\( -name ' +
  extensionsToDeleteForBinaryRelease.map((ext) => {return "'" + ext + "'";})
    .join(' -o -name ') +
    ' \\) -delete';
};

var scrubBinaryReleaseCommandPathPatterns = function(searchDir) {
  return 'find ' + searchDir + ' -type f \\( -path ' +
  pathPatternsToDeleteForBinaryRelease
    .join(' -o -path ') +
    ' \\) -delete';
};

var startMsg =`
--------------------------------------------
-- Preparing release ${tagName} --
--------------------------------------------
`;
var almostDoneMsg = `
----------------------------------------------------
-- Almost Done. Complete the following two steps ---
----------------------------------------------------

Directory package/ contains a git repository ready
to be pushed under a tag to remote.

1. [REQUIRED] cd package

2. git show HEAD
   Make sure you approve of what will be pushed to tag ${tagName}

3. git push origin HEAD:branch-${tagName}
   Push a release branch if needed.

4. [REQUIRED] git push origin ${tagName}
   Push a release tag.

You can test install the release by running:

    npm install '${process.env['ORIGIN']}'#${tagName}

> Note: If you are pushing an update to an existing tag, you might need to add -f to the push command.
`

var postinstallScriptSupport = `
    printByteLengthError() {
      echo >&2 "ERROR:";
      echo >&2 "  $1";
      echo >&2 "Could not perform binary build or installation because the location you are installing to ";
      echo >&2 "is too 'deep' in the file system. That sounds like a strange limitation, but ";
      echo >&2 "the scripts contain shebangs that encode this path to executable, and posix ";
      echo >&2 "systems limit the length of those shebang lines to 127.";
      echo >&2 "";
    }
    repeatCh() {
     chToRepeat=$1
     times=$2
     printf "%0.s$chToRepeat" $(seq 1 $times)
    }
    STRLEN_RESULT=0
    strLen() {
      oLang=$LANG
      LANG=C
      STRLEN_RESULT=\${#1}
      LANG=$oLang
    }
    checkEsyEjectStore() {
      if [[ $ESY_EJECT__STORE == *"//"* ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) has an invalid pattern \/\/";
        exit 1;
      fi
      if [[ $ESY_EJECT__STORE != "/"* ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) does not begin with a forward slash - it must be absolute.";
        exit 1;
      fi
      if [[ $ESY_EJECT__STORE == *"/./"*  ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) contains \/\.\/ and that is not okay.";
        exit 1;
      fi
      if [[ $ESY_EJECT__STORE == *"/"  ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) ends with a slash and it should not";
        exit 1;
      fi
    }
`;

var launchBinScriptSupport = `
    STRLEN_RESULT=0
    strLen() {
      oLang=$LANG
      LANG=C
      STRLEN_RESULT=\${#1}
      LANG=$oLang
    }
    printError() {
      echo >&2 "ERROR:";
      echo >&2 "$0 command is not installed correctly. ";
      TROUBLESHOOTING="When installing <package_name>, did you see any errors in the log? "
      TROUBLESHOOTING="$TROUBLESHOOTING - What does (which <binary_name>) return? "
      TROUBLESHOOTING="$TROUBLESHOOTING - Please file a github issue on <package_name>'s repo."
      echo >&2 "$TROUBLESHOOTING";
    }
`;

var createLaunchBinSh = function(releaseType, package, binaryName) {
  var packageName = package.name;
  var packageNameUppercase =
    replaceAll(replaceAll(package.name.toUpperCase(), '_', '__'), '-', '_');
  var binaryNameUppercase =
    replaceAll(replaceAll(binaryName.toUpperCase(), '_', '___'), '-', '_');
  return `#!/usr/bin/env bash

export ESY__STORE_VERSION=${storeVersion}
${launchBinScriptSupport}
if [ -z \${${packageNameUppercase}__ENVIRONMENTSOURCED__${binaryNameUppercase}+x} ]; then
  if [ -z \${${packageNameUppercase}__ENVIRONMENTSOURCED+x} ]; then
    # In windows this woudl be: a simple: %~dp0
    SOURCE="\${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
      SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
      SOURCE="$(readlink "$SOURCE")"
      [[ $SOURCE != /* ]] && SOURCE="$SCRIPTDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
    done
    SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    export ESY_EJECT__SANDBOX="$SCRIPTDIR/../rel"
    export PACKAGE_ROOT="$SCRIPTDIR/.."
    # Remove dependency on esy and package managers in general
    # We fake it so that the eject store is the location where we relocated the
    # binaries to.
    export ESY_EJECT__STORE=\`cat $PACKAGE_ROOT/records/recordedClientInstallStorePath.txt\`
    ENV_PATH="$ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/eject-env"
    source "$ENV_PATH"
    export ${packageNameUppercase}__ENVIRONMENTSOURCED="sourced"
    export ${packageNameUppercase}__ENVIRONMENTSOURCED__${binaryNameUppercase}="sourced"
  fi
  command -v $0 >/dev/null 2>&1 || {
    printError;
    exit 1;
  }
${
  binaryName !== packageName ?
  `
  if [ "$1" == "----where" ]; then
     which "${binaryName}"
  else
    exec "${binaryName}" $@
  fi
  ` :
  `
  if [[ "$1" == ""  ]]; then
    echo "Welcome to ${packageName}"
    echo "-------------------------"
  ` +
  (package.releasedBinaries || []).map((binName) => 'echo "Installed: ' + binName + '"').join('\n') +
  `
    echo "- You may debug the location of the installed binaries by doing:"
    echo "  binaryName ----where"
    echo "- You may execute any other command within the context of the ocaml tooling by doing:"
    echo "    ${packageName} any command here"
    echo "  For example:"
    echo "    ${packageName} ocamlfind query utop"
    echo "- You may boost the performance of multiple invocations of published binaries"
    echo "  by wrapping the invocations with the special binary named ${packageName}."
  else
    exec $@
  fi
  `
}
else
  printError;
  exit 1;
fi
`
};

var debug = process.env['DEBUG'];

var packageDir = path.resolve(__dirname, '..');

process.chdir(packageDir);

var logExec = function (cmd) {
  if (debug) {
    console.log('LOG:', cmd);
  }
  child_process.execSync(cmd, {stdio: 'inherit'});
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

var types = ['dev', 'pack', 'bin'];
var releaseStage = ['forPreparingRelease', 'forClientInstallation'];

var actions = {
  'dev': {
    download: 'forClientInstallation',
    pack: 'forClientInstallation',
    compressPack: '',
    decompressPack: '',
    buildPackages: 'forClientInstallation',
    compressBuiltPackages: '',
    decompressAndRelocateBuiltPackages: ''
  },
  'pack': {
    download: 'forPreparingRelease',
    pack: 'forPreparingRelease',
    compressPack: 'forPreparingRelease',
    decompressPack: 'forClientInstallation',
    buildPackages: 'forClientInstallation',
    compressBuiltPackages: 'forClientInstallation',
    decompressAndRelocateBuiltPackages: 'forClientInstallation'
  },
  'bin': {
    download: 'forPreparingRelease',
    pack: 'forPreparingRelease',
    compressPack: '',
    decompressPack: '',
    buildPackages: 'forPreparingRelease',
    compressBuiltPackages: 'forPreparingRelease',
    decompressAndRelocateBuiltPackages: 'forClientInstallation'
  }
};

var buildLocallyAndRelocate = {
  'dev': false,
  'pack': false,
  'bin': true
};

/**
 * We get to remove a ton of dependencies for pack and bin based releases since
 * we don't need to even perform package management for native modules -
 * everything is vendored.
 */
var adjustReleaseDependencies =  function(releaseStage, releaseType, package) {
  // We only need esy to download and pack - everything else can just build the
  // prepacked release!
  if (actions[releaseType].download !== releaseStage && actions[releaseType].pack !== releaseStage) {
    var copy = JSON.parse(JSON.stringify(package));
    delete copy.dependencies['esy'];
    return copy;
  }
  return package;
};

var addBins = function(bins, package) {
  var copy = JSON.parse(JSON.stringify(package));
  copy.bin = bins;
  delete copy.releasedBinaries;
  return copy;
};

var addPostinstallScript = function(package) {
  var copy = JSON.parse(JSON.stringify(package));
  copy.scripts = copy.scripts || {};
  copy.scripts.postinstall = './postinstall.sh';
  return copy;
};

var removePostinstallScript = function(package) {
  var copy = JSON.parse(JSON.stringify(package));
  copy.scripts = copy.scripts || {};
  copy.scripts.postinstall = '';
  return copy;
};

var writeModifiedPackageJson = function(packageDir, package) {
  fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(package, null, 2));
};

var verifyBinSetup = function(package) {
  var whosInCharge = ' Run make clean first. The release script needs to be in charge of generating the binaries.';
  var binDirExists = fs.existsSync('./.bin');
  if (binDirExists) {
    throw new Error(whosInCharge + 'Found existing binaries dir .bin. This should not exist. Release script creates it.');
  }
  if (package.bin) {
    throw new Error(whosInCharge + 'Package.json has a bin field. It should have a "releasedBinaries" field instead - a list of released binary names.');
  }
};


/**
 * To relocate binary artifacts: We need to make sure that the length of
 * shebang lines do not exceed 127 (common on most linuxes).
 *
 * For binary releases, they will be built in the form of:
 *
 *        This will be replaced by the actual      This must remain.
 *        install location.
 *       +------------------------------+  +--------------------------------+
 *      /                                \/                                  \
 *   #!/path/to/rel/store___padding____/i/ocaml-4.02.3-d8a857f3/bin/ocamlrun
 *
 * The goal is to make this path exactly 127 characters long (maybe a little
 * less to allow room for some other shebangs like `ocamlrun.opt` etc?)
 *
 * Therefore, it is optimal to make this path as long as possible, but no
 * longer than 127 characters, while minimizing the size of the final
 * "ocaml-4.02.3-d8a857f3/bin/ocamlrun" portion. That allows installation of
 * the release in as many destinations as possible.
 */
var desiredShebangPathLength = 127 - "!#".length;
var pathLengthConsumedByOcamlrun = "/i/ocaml-n.00.0-########/bin/ocamlrun".length;
var desiredEsyEjectStoreLength = desiredShebangPathLength - pathLengthConsumedByOcamlrun;
var createPostinstallScript = function(releaseStage, releaseType, package, buildLocallyAndRelocate) {
  var shouldDownload = actions[releaseType].download === releaseStage;
  var shouldPack = actions[releaseType].pack === releaseStage;
  var shouldCompressPack = actions[releaseType].compressPack === releaseStage;
  var shouldDecompressPack = actions[releaseType].decompressPack === releaseStage;
  var shouldBuildPackages = actions[releaseType].buildPackages === releaseStage;
  var shouldCompressBuiltPackages = actions[releaseType].compressBuiltPackages === releaseStage;
  var shouldDecompressAndRelocateBuiltPackages = actions[releaseType].decompressAndRelocateBuiltPackages === releaseStage;
  var message =`
    # Release releaseType: "${releaseType}"
    # ------------------------------------------------------
    #  Executed ${releaseStage === 'forPreparingRelease' ? 'while creating the release' : 'while installing the release on client machine'}
    #
    #  Download: ${shouldDownload}
    #  Pack: ${shouldPack}
    #  Compress Pack: ${shouldCompressPack}
    #  Decompress Pack: ${shouldDecompressPack}
    #  Build Packages: ${shouldBuildPackages}
    #  Compress Built Packages: ${shouldCompressBuiltPackages}
    #  Decompress Built Packages: ${shouldDecompressAndRelocateBuiltPackages}`;

  var downloadCmds = `
    # Download
    cd ./rel/
    ../node_modules/.bin/esy install
    cd ..`;
  var packCmds = `
    # Pack:
    # Peform build eject.  Warms up *just* the artifacts that require having a
    # modern node installed.
    cd ./rel/
    # Generates the single Makefile etc.
    ../node_modules/.bin/esy build-eject
    cd ..`;
  var compressPackCmds = `
    # Compress:
    # Avoid npm stripping out vendored node_modules via tar. Merely renaming node_modules
    # is not sufficient!
    tar -czf releasePacked.tar.gz rel
    rm -rf ./rel/`;
  var decompressPackCmds =`
    # Decompress:
    # Avoid npm stripping out vendored node_modules.
    gunzip releasePacked.tar.gz
    if hash bsdtar 2>/dev/null; then
      bsdtar -xf releasePacked.tar
    else
      if hash tar 2>/dev/null; then
        # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
        tar --warning=no-unknown-keyword -xf releasePacked.tar
      else
        echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
      fi
    fi
    rm -rf releasePacked.tar`;
  var buildPackagesCmds = `
    # BuildPackages: Always reserve enough path space to perform relocation.
    cd ./rel/
    make -j -f node_modules/.cache/_esy/build-eject/Makefile
    cd ..
    mkdir $PACKAGE_ROOT/records
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/records/recordedServerBuildStorePath.txt"
    # For client side builds, recordedServerBuildStorePath is equal to recordedClientBuildStorePath.
    # For prebuilt binaries these will differ, and recordedClientBuildStorePath.txt is overwritten.
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/records/recordedClientBuildStorePath.txt"`;

  /**
   * In bash:
   * [[ "hellow4orld" =~ ^h(.[a-z]*) ]] && echo ${BASH_REMATCH[0]}
   * Prints out: hellow
   * [[ "zzz" =~ ^h(.[a-z]*) ]] && echo ${BASH_REMATCH[1]}
   * Prints out: ellow
   * [[ "zzz" =~ ^h(.[a-z]*) ]] && echo ${BASH_REMATCH[1]}
   * Prints out empty
   */
  var compressBuiltPackagesCmds = `
    ENV_PATH="$ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/eject-env"
    # Double backslash in es6 literals becomes one backslash
    # Must use . instead of source for some reason.
    shCmd=". $ENV_PATH && echo \\$PATH"
    EJECTED_PATH=\`sh -c "$shCmd"\`
    # Remove the sources, keep the .cache which has some helpful information.
    mv "$ESY_EJECT__SANDBOX/node_modules" "$ESY_EJECT__SANDBOX/node_modules_tmp"
    mkdir -p "$ESY_EJECT__SANDBOX/node_modules"
    mv "$ESY_EJECT__SANDBOX/node_modules_tmp/.cache" "$ESY_EJECT__SANDBOX/node_modules/.cache"
    rm -rf "$ESY_EJECT__SANDBOX/node_modules_tmp"
    # Copy over the installation artifacts.

    mkdir -p "$ESY_EJECT__TMP/i"
    # Grab all the install directories by scraping what was added to the PATH.
    # This deserves a better supported approach directly from esy.
    IFS=':' read -a arr <<< "$EJECTED_PATH"
    for i in "\${arr[@]}"; do
      res=\`[[   "$i" =~ ^("$ESY_EJECT__STORE"/i/[a-z0-9\._-]*) ]] && echo \${BASH_REMATCH[1]} || echo ''\`
      if [[ "$res" != ""  ]]; then
        cp -r "$res" "$ESY_EJECT__TMP/i/"
        cd "$ESY_EJECT__TMP/i/"
        tar -czf \`basename "$res"\`.tar.gz \`basename "$res"\`
        rm -rf \`basename "$res"\`
        echo "$res" >> $PACKAGE_ROOT/records/recordedCoppiedArtifacts.txt
      fi
    done
    unset IFS
    cd "$PACKAGE_ROOT"
    ${releaseType === 'forPreparingRelease' ? scrubBinaryReleaseCommandPathPatterns('"$ESY_EJECT__TMP/i/"') : '#'}
    # Built packages have a special way of compressing the release, putting the
    # eject store in its own tar so that all the symlinks in the store can be
    # relocated using tools that exist in the eject sandbox.

    tar -czf releasePacked.tar.gz rel
    rm -rf ./rel/`;
  var decompressAndRelocateBuiltPackagesCmds = `

    if [ -d "$ESY_EJECT__INSTALL_STORE" ]; then
      echo >&2 "$ESY_EJECT__INSTALL_STORE already exists. This will not work. It has to be a new directory.";
      exit 1;
    fi
    serverEsyEjectStore=\`cat "$PACKAGE_ROOT/records/recordedServerBuildStorePath.txt"\`
    serverEsyEjectStoreDirName=\`basename "$serverEsyEjectStore"\`

    # Decompress the actual sandbox:
    gunzip releasePacked.tar.gz
    # Beware of the issues of using "which". https://stackoverflow.com/a/677212
    # Also: hash is only safe/reliable to use in bash, so make sure shebang line is bash.
    if hash bsdtar 2>/dev/null; then
      bsdtar -s "|\${serverEsyEjectStore}|\${ESY_EJECT__INSTALL_STORE}|gs" -xf releasePacked.tar
    else
      if hash tar 2>/dev/null; then
        # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
        tar --warning=no-unknown-keyword --transform="s|\${serverEsyEjectStore}|\${ESY_EJECT__INSTALL_STORE}|" -xf releasePacked.tar
      else
        echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
      fi
    fi
    rm releasePacked.tar

    cd "$ESY_EJECT__TMP/i/"
    for f in *.gz
    do
      gunzip "$f"
      if hash bsdtar 2>/dev/null; then
        bsdtar -s "|\${serverEsyEjectStore}|\${ESY_EJECT__INSTALL_STORE}|gs" -xf ./\`basename "$f" .gz\`
      else
        if hash tar 2>/dev/null; then
          # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
          tar --warning=no-unknown-keyword --transform="s|\${serverEsyEjectStore}|\${ESY_EJECT__INSTALL_STORE}|" -xf ./\`basename "$f" .gz\`
        else
          echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
        fi
      fi
      # remove the .tar file
      rm ./\`basename "$f" .gz\`
    done

    mv "$ESY_EJECT__TMP" "$ESY_EJECT__INSTALL_STORE"
    # Write the final store path, overwritting the (original) path on server.
    echo "$ESY_EJECT__INSTALL_STORE" > "$PACKAGE_ROOT/records/recordedClientInstallStorePath.txt"

    # Not that this is really even used for anything once on the client.
    # We use the install store. Still, this might be good for debugging.
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/records/recordedClientBuildStorePath.txt"

    for filename in \`find $ESY_EJECT__INSTALL_STORE -type f\`; do
      $ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/bin/fastreplacestring.exe "$filename" "$serverEsyEjectStore" "$ESY_EJECT__INSTALL_STORE"
    done
    `;
  // Notice how we comment out each section which doesn't apply to this
  // combination of releaseStage/releaseType.
  var download = downloadCmds.split('\n').join(shouldDownload ? '\n' : '\n#');
  var pack = packCmds.split('\n').join(shouldPack ? '\n' : '\n#');
  var compressPack = compressPackCmds.split('\n').join(shouldCompressPack ? '\n' : '\n#');
  var decompressPack = decompressPackCmds.split('\n').join(shouldDecompressPack ? '\n' : '\n#');
  var buildPackages = buildPackagesCmds.split('\n').join(shouldBuildPackages ? '\n' : '\n#');
  var compressBuiltPackages = compressBuiltPackagesCmds.split('\n').join(shouldCompressBuiltPackages ? '\n' : '\n#');
  var decompressAndRelocateBuiltPackages =
      decompressAndRelocateBuiltPackagesCmds.split('\n').join(shouldDecompressAndRelocateBuiltPackages ? '\n' : '\n#');
  return `#!/usr/bin/env bash
    set -e
    ${postinstallScriptSupport}
    ${message}

    #                server               |              client
    #                                     |
    # ESY_EJECT__STORE -> ESY_EJECT__TMP  |  ESY_EJECT__TMP -> ESY_EJECT__INSTALL_STORE
    # =================================================================================

    ESY__STORE_VERSION="${storeVersion}"
    SOURCE="\${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
      SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
      SOURCE="$(readlink "$SOURCE")"
      [[ $SOURCE != /* ]] && SOURCE="$SCRIPTDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
    done
    SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    export ESY_EJECT__SANDBOX="$SCRIPTDIR/rel"

    # We allow the ESY_EJECT__STORE to be customized at build time. But at
    # install time, we always want to copy the artifacts to the install
    # directory. We need to distinguish between where artifacts are build
    # into, and where they are relocated to.
    # Regardless of if we're building on the client or server, when building
    # we usually want to default the store to the global cache. Then we can
    # copy the artifacts into the release, and use that as the eject store
    # when running binaries etc. This will ensure that no matter what - binary
    # or pack modes, you get artifacts coppied and relocated into your
    # installation so there are no dangling things.
    if [ -z "\${PRENORMALIZED_ESY_EJECT__STORE+x}" ]; then
      PRENORMALIZED_ESY_EJECT__STORE="$HOME/.esy/$ESY__STORE_VERSION"
    else
      PRENORMALIZED_ESY_EJECT__STORE="$PRENORMALIZED_ESY_EJECT__STORE"
    fi
    # Remove trailing slash if any.
    PRENORMALIZED_ESY_EJECT__STORE="\${PRENORMALIZED_ESY_EJECT__STORE%/}"
    strLen "$PRENORMALIZED_ESY_EJECT__STORE"
    lenPrenormalizedEsyEjectStore=$STRLEN_RESULT
    byteLenDiff=\`expr ${desiredEsyEjectStoreLength} - $lenPrenormalizedEsyEjectStore \`
    # Discover how much of the reserved relocation padding must be consumed.
    if [ "$byteLenDiff" -lt "0" ]; then
      printByteLengthError "$PRENORMALIZED_ESY_EJECT__STORE";
       exit 1;
    fi
    adjustedSuffix=\`repeatCh '_' "$byteLenDiff"\`
    export ESY_EJECT__STORE="\${PRENORMALIZED_ESY_EJECT__STORE}$adjustedSuffix"


    # We Build into the ESY_EJECT__STORE, copy into ESY_EJECT__TMP, potentially
    # transport over the network then finally we copy artifacts into the
    # ESY_EJECT__INSTALL_STORE and relocate them as if they were built there to
    # begin with.  ESY_EJECT__INSTALL_STORE should not ever be used if we're
    # running on the server.
    PRENORMALIZED_ESY_EJECT__INSTALL_STORE="$ESY_EJECT__SANDBOX/$ESY__STORE_VERSION"
    # Remove trailing slash if any.
    PRENORMALIZED_ESY_EJECT__INSTALL_STORE="\${PRENORMALIZED_ESY_EJECT__INSTALL_STORE%/}"
    strLen "$PRENORMALIZED_ESY_EJECT__INSTALL_STORE"
    lenPrenormalizedEsyEjectInstallStore=$STRLEN_RESULT
    byteLenDiff=\`expr ${desiredEsyEjectStoreLength} - $lenPrenormalizedEsyEjectInstallStore \`
    # Discover how much of the reserved relocation padding must be consumed.
    if [ "$byteLenDiff" -lt "0" ]; then
      printByteLengthError "$PRENORMALIZED_ESY_EJECT__INSTALL_STORE";
       exit 1;
    fi
    adjustedSuffix=\`repeatCh '_' "$byteLenDiff"\`
    export ESY_EJECT__INSTALL_STORE="\${PRENORMALIZED_ESY_EJECT__INSTALL_STORE}$adjustedSuffix"


    # Regardless of where artifacts are actually built, or where they will be
    # installed to, or if we're on the server/client we will copy artifacts
    # here temporarily. Sometimes the build location is the same as where we
    # copy them to inside the sandbox - sometimes not.
    export PACKAGE_ROOT="$SCRIPTDIR"
    export ESY_EJECT__TMP="$PACKAGE_ROOT/releasePackedBinaries"
    checkEsyEjectStore
    ${download}
    ${pack}
    ${compressPack}
    ${decompressPack}
    ${buildPackages}
    ${compressBuiltPackages}
    ${decompressAndRelocateBuiltPackages}`
};

var getBinsToWrite = function(releaseType, packageDir, package) {
  var ret = [];
  if (package.releasedBinaries) {
    for (var i = 0; i < package.releasedBinaries.length; i++) {
      var binaryName = package.releasedBinaries[i];
      var destPath = path.join('.bin', binaryName);
      ret.push({
        name: binaryName,
        path: destPath,
        contents: createLaunchBinSh(releaseType, package, binaryName)
      });
      /*
       * ret.push({
       *   name: binaryName + '.cmd',
       *   path: path.join(destPath + '.cmd'),
       *   contents: createLaunchBinSh(releaseType, packageNameUppercase, binaryName)
       * });
       */
    }
  }
  var destPath = path.join('.bin', package.name);
  ret.push({
    name: package.name,
    path: destPath,
    contents: createLaunchBinSh(releaseType, package, package.name)
  });
  return ret;
};

var checkVersion = function() {
  if (!process.env['VERSION']) {
    throw new Error('VERSION is undefined. Usage: make release VERSION=beta-v-0.0.1 TYPE=dev|pack|bin');
  }
};

var checkOrigin = function() {
  if (!process.env['ORIGIN']) {
    throw new Error('ORIGIN is undefined. The Makefile wrapper should have set this.');
  }
};

var checkReleaseType = function() {
  if (process.env['TYPE'] !== 'dev' && process.env['TYPE'] !== 'pack' &&  process.env['TYPE'] !== 'bin') {
    throw new Error('TYPE is undefined or invalid. Usage: make release VERSION=beta-v-0.0.1 TYPE=dev|pack|bin');
  }
};

var checkNoChanges = function(packageDir) {
  logExec(
    'git diff --exit-code || (echo ""  && echo "!!You have unstaged changes. Please clean up first." && exit 1)'
  );
  logExec(
    'git diff --cached --exit-code || (echo "" && echo "!!You have staged changes. Please reset them or commit them first." && exit 1)'
  );
};

/**
 * Builds the release from within the rootDirectory/package/ directory created
 * by `npm pack` command.
 */
exports.buildRelease = function() {
  var packageDir = path.resolve(__dirname, '..');
  checkVersion();
  checkReleaseType();
  checkNoChanges();
  var packageJson = fs.readFileSync('./package.json');
  var package = JSON.parse(packageJson.toString());
  var releaseType = process.env['TYPE'];
  console.log("*** Building " + package.name + ' ' + releaseType);
  verifyBinSetup(package);
  logExec('mkdir -p .bin');
  var binsToWrite = getBinsToWrite(releaseType, packageDir, package);
  var packageJsonBins = {};
  for (var i = 0; i < binsToWrite.length; i++) {
    var toWrite = binsToWrite[i];
    fs.writeFileSync(toWrite.path, toWrite.contents);
    fs.chmodSync(toWrite.path, 0755);
    packageJsonBins[toWrite.name] = toWrite.path;
  }
  package = addBins(packageJsonBins, package);

  // Prerelease: Will perform an initial installation to get dependencies, and
  // then run the prerelease "postinstall" on that set of package source.
  package = removePostinstallScript(package);
  package = adjustReleaseDependencies('forPreparingRelease', releaseType, package)
  writeModifiedPackageJson(packageDir, package);
  var prereleaseShPath = path.join(packageDir, 'prerelease.sh');
  var prerelease = createPostinstallScript('forPreparingRelease', releaseType, package, buildLocallyAndRelocate[releaseType]);
  fs.writeFileSync(prereleaseShPath, prerelease);
  fs.chmodSync(prereleaseShPath, 0755);

  logExec('npm install --ignore-scripts');
  logExec('./prerelease.sh');

  logExec('rm -rf ' + path.join(packageDir, 'node_modules'));
  logExec('rm -rf ' + path.join(packageDir, 'rel', 'yarn.lock'));

  // Actual Release: We leave the *actual* postinstall script to be executed on the host.
  package = addPostinstallScript(package);
  package = adjustReleaseDependencies('forClientInstallation', releaseType, package)
  writeModifiedPackageJson(packageDir, package);
  var postinstallShPath = path.join(packageDir, 'postinstall.sh');
  var postinstall = createPostinstallScript('forClientInstallation', releaseType, package, buildLocallyAndRelocate[releaseType]);
  fs.writeFileSync(postinstallShPath, postinstall);
  fs.chmodSync(postinstallShPath, 0755);
};


exports.release = function(forGithubLFS) {
  console.log(startMsg);
  [
    'git init',
    'git checkout -b branch-' + tagName + '',
    forGithubLFS ? 'git lfs track ./releasePacked.tar.gz' : '',
    forGithubLFS ? 'git lfs track releasePackedBinaries/i/*.tar.gz' : '',
    'git add .',
    'git remote add origin ' + process.env['ORIGIN'],
    'git fetch --tags --depth=1',
    'git commit -m "Preparing release ' + tagName + '"',
    '# Return code is inverted to receive boolean return value',
    '(git tag --delete ' + tagName + ' &> /dev/null) || echo "Tag ' + tagName + ' doesn\'t yet exist, creating it now."',
    'git tag -a ' + tagName + ' -m "' + tagName + '"',
  ].forEach(function(cmd) {
    logExec(cmd);
  });
  console.log (almostDoneMsg);
};


