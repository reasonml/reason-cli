var fs = require('fs');
var path = require('path');

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
      echo >&2 "Could not perform binary installation because the location you are installing to ";
      echo >&2 "is too 'deep' in the file system. That sounds like a strange limitation, but ";
      echo >&2 "the scripts contain shebangs that encode this path to executable, and posix ";
      echo >&2 "systems limit the length of those shebang lines.";
    }
    repeatCh() {
     chToRepeat=$1
     times=$2
     printf "%0.s$chToRepeat" $(seq 1 $times)
    }
`;

var launchBinScriptSupport = `
    printError() {
      echo >&2 "ERROR:";
      echo >&2 "$0 command is not installed correctly. ";
      TROUBLESHOOTING="When installing <package_name>, did you see any errors in the log? "
      TROUBLESHOOTING="$TROUBLESHOOTING - What does (which <binary_name>) return? "
      TROUBLESHOOTING="$TROUBLESHOOTING - Please file a github issue on <package_name>'s repo."
      echo >&2 "$TROUBLESHOOTING";
    }
`;

var createLaunchBinSh = function(releaseType, packageNameUppercase, binaryName) {
  return `#!/usr/bin/env bash

export ESY__STORE_VERSION=${storeVersion}
${launchBinScriptSupport}
if [ -z \${${packageNameUppercase}_ENVIRONMENT_SOURCED_${binaryName}+x} ]; then
  if [ -z \${${packageNameUppercase}_ENVIRONMENT_SOURCED+x} ]; then
    # In windows this woudl be: a simple: %~dp0
    SOURCE="\${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
      SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
      SOURCE="$(readlink "$SOURCE")"
      [[ $SOURCE != /* ]] && SOURCE="$SCRIPTDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
    done
    SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    export ESY_EJECT__SANDBOX="$SCRIPTDIR/../actualInstall"
    export PACKAGE_ROOT="$SCRIPTDIR/.."
    # Remove dependency on esy and package managers in general
    export ESY_EJECT__STORE=\`cat $PACKAGE_ROOT/recordedClientInstallStorePath.txt\`
    ENV_PATH="$ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/eject-env"
    source "$ENV_PATH"
    export ${packageNameUppercase}_ENVIRONMENT_SOURCED="sourced"
    export ${packageNameUppercase}_ENVIRONMENT_SOURCED_${binaryName}="sourced"
  fi
  command -v $0 >/dev/null 2>&1 || {
    printError;
    exit 1;
  }
  if [ "$1" == "----where" ]; then
     which "${binaryName}"
  else
    exec "${binaryName}" $@
  fi
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
    compressBuiltPackages: '',
    decompressAndRelocateBuiltPackages: ''
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

var writeModifiedPackageJson = function(packageDir, package) {
  fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(package, null, 2));
};

var verifyBinSetup = function(package) {
  var whosInCharge = ' Run make clean first. The release script needs to be in charge of generating the binaries.';
  let binDirExists = fs.existsSync('./.bin');
  if (binDirExists) {
    throw new Error(whosInCharge + 'Found existing binaries dir .bin. This should not exist. Release script creates it.');
  }
  if (package.bin) {
    throw new Error(whosInCharge + 'Package.json has a bin field. It should have a "releasedBinaries" field instead - a list of released binary names.');
  }
};

var createPostinstallScript = function(releaseStage, releaseType, package, buildLocallyAndRelocate) {
  var shouldDownload = actions[releaseType].download === releaseStage;
  var shouldPack = actions[releaseType].pack === releaseStage;
  var shouldCompressPack = actions[releaseType].compressPack === releaseStage;
  var shouldDecompressPack = actions[releaseType].decompressPack === releaseStage;
  var shouldBuildPackages = actions[releaseType].buildPackages === releaseStage;
  var shouldCompressBuiltPackages = actions[releaseType].compressBuiltPackages === releaseStage;
  var shouldDecompressAndRelocateBuiltPackages = actions[releaseType].decompressAndRelocateBuiltPackages === releaseStage;
  var filePathPadding ='______________________this_space_intentionally_left_blank';
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
    cd ./actualInstall/
    ../node_modules/.bin/esy install
    cd ..`;
  var packCmds = `
    # Pack:
    # Peform build eject.  Warms up *just* the artifacts that require having a
    # modern node installed.
    cd ./actualInstall/
    # Generates the single Makefile etc.
    ../node_modules/.bin/esy build-eject
    cd ..`;
  var compressPackCmds = `
    # Compress:
    # Avoid npm stripping out vendored node_modules via tar. Merely renaming node_modules
    # is not sufficient!
    tar -czf actualInstallPacked.tar.gz actualInstall
    rm -rf ./actualInstall/`;
  var decompressPackCmds =`
    # Decompress:
    # Avoid npm stripping out vendored node_modules.
    gunzip actualInstallPacked.tar.gz
    if hash bsdtar 2>/dev/null; then
      bsdtar -xf actualInstallPacked.tar
    else
      if hash tar 2>/dev/null; then
        # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
        tar --warning=no-unknown-keyword -xf actualInstallPacked.tar
      else
        echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
      fi
    fi
    rm -rf actualInstallPacked.tar`;
  var localStorePrefixName = 'store';
  var buildPackagesCmds = `
    # BuildPackages: Always reserve enough path space to perform relocation.
    ${
      buildLocallyAndRelocate ?
        `export ESY_EJECT__STORE=$ESY_EJECT__SANDBOX/${localStorePrefixName}${filePathPadding}` :
        // Really they both should have the padding.
        `
        if [ -z "\${ESY_EJECT__STORE+x}" ]; then
          export ESY_EJECT__STORE="$HOME/.esy/$ESY__STORE_VERSION"
        fi
        `
    }
    cd ./actualInstall/
    make -j -f node_modules/.cache/_esy/build-eject/Makefile
    cd ..
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/recordedServerBuildStorePath.txt"
    # For client side builds, recordedServerBuildStorePath is equal to recordedClientInstallStorePath.
    # For prebuilt binaries these will differ, and recordedClientInstallStorePath.txt is overwritten.
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/recordedClientInstallStorePath.txt"`;
  var compressBuiltPackagesCmds = `
    # Remove the sources, keep the .cache which has some helpful information.
    mv "$ESY_EJECT__SANDBOX/node_modules" "$ESY_EJECT__SANDBOX/node_modules_tmp"
    mkdir -p "$ESY_EJECT__SANDBOX/node_modules"
    mv "$ESY_EJECT__SANDBOX/node_modules_tmp/.cache" "$ESY_EJECT__SANDBOX/node_modules/.cache"
    rm -rf "$ESY_EJECT__SANDBOX/node_modules_tmp"
    # Remove the non-binary artifacts, before compressing.
    rm -rf "$ESY_EJECT__STORE/_build/"
    rm -rf "$ESY_EJECT__STORE/_insttmp/"
    # Built packages have a special way of compressing the release, putting the
    # eject store in its own tar so that all the symlinks in the store can be
    # relocated using tools that exist in the eject sandbox.

    ${scrubBinaryReleaseCommandPathPatterns('"$ESY_EJECT__STORE/_install/"')}

    tar -czf actualInstallPacked.tar.gz actualInstall
    rm -rf ./actualInstall/`;
  var decompressAndRelocateBuiltPackagesCmds = `
    # We need to have stored the whole path to know the lenght that must be
    # replaced. We then need the basename of that path as well to know which
    # existing path to move in the output.
    serverEsyEjectStore=\`cat "$PACKAGE_ROOT/recordedServerBuildStorePath.txt"\`
    serverEsyEjectStoreDirName=\`basename "$serverEsyEjectStore"\`
    PRENORMALIZED_ESY_EJECT__STORE="$ESY_EJECT__SANDBOX/${localStorePrefixName}"
    oLang=$LANG
    LANG=C
    lenServerEsyEjectStore=\${#serverEsyEjectStore}
    lenPrenormalizedEsyEjectStore=\${#PRENORMALIZED_ESY_EJECT__STORE}
    byteLenDiff=\`expr $lenServerEsyEjectStore - $lenPrenormalizedEsyEjectStore \`
    LANG=$oLang
    # Discover how much of the reserved relocation padding must be consumed.
    if [ "$byteLenDiff" -lt "0" ]; then
      printByteLengthError;
      exit 1;
    fi
    adjustedSuffix=\`repeatCh '_' "$byteLenDiff"\`
    adjustedDirName="${localStorePrefixName}$adjustedSuffix"
    export ESY_EJECT__STORE="$ESY_EJECT__SANDBOX/$adjustedDirName"
    # Decompress the actual sandbox:
    gunzip actualInstallPacked.tar.gz
    # Beware of the issues of using "which". https://stackoverflow.com/a/677212
    # Also: hash is only safe/reliable to use in bash, so make sure shebang line is bash.
    if hash bsdtar 2>/dev/null; then
      bsdtar -s "|\${serverEsyEjectStore}|\${ESY_EJECT__STORE}|gs" -xf actualInstallPacked.tar
    else
      if hash tar 2>/dev/null; then
        # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
        tar --warning=no-unknown-keyword --transform="s|\${serverEsyEjectStore}|\${ESY_EJECT__STORE}|" -xf actualInstallPacked.tar
      else
        echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
      fi
    fi
    rm actualInstallPacked.tar
    mv "$ESY_EJECT__SANDBOX/$serverEsyEjectStoreDirName" "$ESY_EJECT__STORE"
    # Write the final store path, overwritting the (original) path on server.
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/recordedClientInstallStorePath.txt"

    for filename in \`find $ESY_EJECT__STORE -type f\`; do
      $ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/bin/fastreplacestring.exe "$filename" "$serverEsyEjectStore" "$ESY_EJECT__STORE"
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
    ESY__STORE_VERSION="${storeVersion}"
    SOURCE="\${BASH_SOURCE[0]}"
    while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
      SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
      SOURCE="$(readlink "$SOURCE")"
      [[ $SOURCE != /* ]] && SOURCE="$SCRIPTDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
    done
    SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    export ESY_EJECT__SANDBOX="$SCRIPTDIR/actualInstall"
    export PACKAGE_ROOT="$SCRIPTDIR"
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
      var packageNameUppercase =
        replaceAll(replaceAll(package.name.toUpperCase(), '_', '__'), '-', '_');
      ret.push({
        name: binaryName,
        path: destPath,
        contents: createLaunchBinSh(releaseType, packageNameUppercase, binaryName)
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
  var packageWithBins = addBins(packageJsonBins, package);
  var packageWithBinsAndPostInstall = addPostinstallScript(packageWithBins);

  var stageDependentSubstitutions = function(releaseStage) {
    var postinstallShPath = path.join(packageDir, 'postinstall.sh');
    var postinstallReleaseShPath = path.join(packageDir, 'postinstall.sh.release');
    var packageAdjustedReleaseDeps = adjustReleaseDependencies(releaseStage, releaseType, packageWithBinsAndPostInstall)
    writeModifiedPackageJson(packageDir, packageAdjustedReleaseDeps);
    var postinstall = createPostinstallScript(releaseStage, releaseType, package, buildLocallyAndRelocate[releaseType]);
    fs.writeFileSync(postinstallShPath, postinstall);
    if (releaseStage === 'forPreparingRelease') {
      // Recorded just so you can inspect what happened during the release.
      fs.writeFileSync(postinstallReleaseShPath, postinstall);
    }
    fs.chmodSync(postinstallShPath, 0755);
  };
  stageDependentSubstitutions('forPreparingRelease');
  logExec('npm install');

  logExec('rm -rf ' + path.join(packageDir, 'node_modules'));
  logExec('rm -rf ' + path.join(packageDir, 'actualInstall', 'yarn.lock'));
  // Now we re-substitute with releaseStage with 'forClientInstallation' before
  // publishing the release!
  stageDependentSubstitutions('forClientInstallation')
};


exports.release = function() {
  console.log(startMsg);
  [
    'git init',
    'git checkout -b branch-' + tagName + '',
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

