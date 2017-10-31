#!/bin/bash

set -e


# Exporting so we can call it from xargs
# https://stackoverflow.com/questions/11003418/calling-functions-with-xargs-within-a-bash-script
unzipAndUntarFixupLinks() {
  serverEsyEjectStore=$1
  gunzip "$2"
  # Beware of the issues of using "which". https://stackoverflow.com/a/677212
  # Also: hash is only safe/reliable to use in bash, so make sure shebang line is bash.
  if hash bsdtar 2>/dev/null; then
    bsdtar -s "|${serverEsyEjectStore}|${ESY_EJECT__INSTALL_STORE}|gs" -xf ./`basename "$2" .gz`
  else
    if hash tar 2>/dev/null; then
      # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
      tar --warning=no-unknown-keyword --transform="s|${serverEsyEjectStore}|${ESY_EJECT__INSTALL_STORE}|" -xf ./`basename "$2" .gz`
    else
      echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
    fi
  fi
  # remove the .tar file
  rm ./`basename "$2" .gz`
}
export -f unzipAndUntarFixupLinks

printByteLengthError() {
  echo >&2 "ERROR:";
  echo >&2 "  $1";
  echo >&2 "Could not perform binary build or installation because the location you are installing to ";
  echo >&2 "is too 'deep' in the file system. That sounds like a strange limitation, but ";
  echo >&2 "the scripts contain shebangs that encode this path to executable, and posix ";
  echo >&2 "systems limit the length of those shebang lines to 127.";
  echo >&2 "";
}


#
# Release releaseType: "bin"
# ------------------------------------------------------
# Executed while installing the release on client machine
#
# Check if release is built:    true
# Configure Esy:                false
# Install Esy:                  false
# Download:                     false
# Pack:                         false
# Compress Pack:                false
# Decompress Pack:              false
# Build Packages:               false
# Compress Built Packages:      false
# Decompress Built Packages:    true
# Mark release as built:        true
#


#                server               |              client
#                                     |
# ESY_EJECT__STORE -> ESY_EJECT__TMP  |  ESY_EJECT__TMP -> ESY_EJECT__INSTALL_STORE
# =================================================================================


#
# Define $SCRIPTDIR
#

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$SCRIPTDIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"


#
# Esy utility functions
#

esyStrLength() {
  # run in a subprocess to override $LANG variable
  LANG=C /bin/bash -c 'echo "${#0}"' "$1"
}

esyRepeatCharacter() {
  chToRepeat=$1
  times=$2
  printf "%0.s$chToRepeat" $(seq 1 $times)
}

esyGetStorePathFromPrefix() {
  ESY_EJECT__PREFIX="$1"
  # Remove trailing slash if any.
  ESY_EJECT__PREFIX="${ESY_EJECT__PREFIX%/}"
  ESY_STORE_VERSION="3"

  prefixLength=$(esyStrLength "$ESY_EJECT__PREFIX/$ESY_STORE_VERSION")
  paddingLength=$(expr 86 - $prefixLength)

  # Discover how much of the reserved relocation padding must be consumed.
  if [ "$paddingLength" -lt "0" ]; then
    echo "$ESY_EJECT__PREFIX is too deep inside filesystem, Esy won't be able to relocate binaries"
    exit 1;
  fi

  padding=$(esyRepeatCharacter '_' "$paddingLength")
  echo "$ESY_EJECT__PREFIX/$ESY_STORE_VERSION$padding"
}


export PACKAGE_ROOT="$SCRIPTDIR"

mkdir -p "$PACKAGE_ROOT/records"

export ESY_EJECT__SANDBOX="$SCRIPTDIR/r"
export ESY_EJECT__ROOT="$ESY_EJECT__SANDBOX/_esyEjectRoot"

# We Build into the ESY_EJECT__STORE, copy into ESY_EJECT__TMP, potentially
# transport over the network then finally we copy artifacts into the
# ESY_EJECT__INSTALL_STORE and relocate them as if they were built there to
# begin with.  ESY_EJECT__INSTALL_STORE should not ever be used if we're
# running on the server.
export ESY_EJECT__INSTALL_ROOT="$ESY_EJECT__SANDBOX"
ESY_EJECT__INSTALL_STORE=$(esyGetStorePathFromPrefix $ESY_EJECT__INSTALL_ROOT)
if [ $? -ne 0 ]; then
  echo "error: $ESY_EJECT__INSTALL_STORE"
  exit 1
else
  export ESY_EJECT__INSTALL_STORE
fi

# Regardless of where artifacts are actually built, or where they will be
# installed to, or if we're on the server/client we will copy artifacts
# here temporarily. Sometimes the build location is the same as where we
# copy them to inside the sandbox - sometimes not.
export ESY_EJECT__TMP="$PACKAGE_ROOT/relBinaries"


#
# checkIfReleaseIsBuilt
#
if [ -f "$PACKAGE_ROOT/records/done.txt" ]; then
 exit 0;
fi



# #
# # configureEsy
# #
# export ESY_COMMAND="/home/jwalke/.npm-packages/lib/node_modules/esy/bin/esy"
# 


# #
# # installEsy
# #
# echo '*** Installing esy for the release...'
# LOG=$(npm install --global --prefix "$PACKAGE_ROOT/_esy" "esy@0.0.27")
# if [ $? -ne 0 ]; then
#   echo "error: failed to install esy..."
#   echo $LOG
#   exit 1
# fi
# # overwrite esy command with just installed esy bin
# export ESY_COMMAND="$PACKAGE_ROOT/_esy/bin/esy"
# 


# #
# # download
# #
# echo '*** Installing dependencies...'
# cd $ESY_EJECT__SANDBOX
# LOG=$($ESY_COMMAND install)
# if [ $? -ne 0 ]; then
#   echo "error: failed to install dependencies..."
#   echo $LOG
#   exit 1
# fi
# cd $PACKAGE_ROOT
# 


# #
# # Pack
# #
# # Peform build eject.  Warms up *just* the artifacts that require having a
# # modern node installed.
# # Generates the single Makefile etc.
# echo '*** Ejecting build environment...'
# cd $ESY_EJECT__SANDBOX
# $ESY_COMMAND build-eject
# mv $ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject $ESY_EJECT__SANDBOX/_esyEjectRoot
# cd $PACKAGE_ROOT
# 


# #
# # compressPack
# #
# # Avoid npm stripping out vendored node_modules via tar. Merely renaming node_modules
# # is not sufficient!
# echo '*** Packing the release...'
# tar -czf r.tar.gz r
# rm -rf $ESY_EJECT__SANDBOX
# 


# #
# # decompressPack
# #
# # Avoid npm stripping out vendored node_modules.
# echo '*** Unpacking the release...'
# gunzip "$ESY_EJECT__SANDBOX.tar.gz"
# if hash bsdtar 2>/dev/null; then
#   bsdtar -xf "$ESY_EJECT__SANDBOX.tar"
# else
#   if hash tar 2>/dev/null; then
#     # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
#     tar --warning=no-unknown-keyword -xf "$ESY_EJECT__SANDBOX.tar"
#   else
#     echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
#   fi
# fi
# rm -rf "$ESY_EJECT__SANDBOX.tar"
# 


# #
# # buildPackages
# #
# # Always reserve enough path space to perform relocation.
# echo '*** Building the release...'
# cd $ESY_EJECT__SANDBOX
# make -j -f "$ESY_EJECT__ROOT/Makefile"
# cd $PACKAGE_ROOT
# 
# cp       "$ESY_EJECT__ROOT/records/store-path.txt"       "$PACKAGE_ROOT/records/recordedServerBuildStorePath.txt"
# # For client side builds, recordedServerBuildStorePath is equal to recordedClientBuildStorePath.
# # For prebuilt binaries these will differ, and recordedClientBuildStorePath.txt is overwritten.
# cp       "$ESY_EJECT__ROOT/records/store-path.txt"       "$PACKAGE_ROOT/records/recordedClientBuildStorePath.txt"
# 


# #
# # compressBuiltPackages
# #
# # Double backslash in es6 literals becomes one backslash
# # Must use . instead of source for some reason.
# # Remove the sources, keep the .cache which has some helpful information.
# mv "$ESY_EJECT__SANDBOX/node_modules" "$ESY_EJECT__SANDBOX/node_modules_tmp"
# mkdir -p "$ESY_EJECT__SANDBOX/node_modules"
# mv "$ESY_EJECT__SANDBOX/node_modules_tmp/.cache" "$ESY_EJECT__SANDBOX/node_modules/.cache"
# rm -rf "$ESY_EJECT__SANDBOX/node_modules_tmp"
# # Copy over the installation artifacts.
# 
# mkdir -p "$ESY_EJECT__TMP/i"
# # Grab all the install directories
# for res in $(cat $ESY_EJECT__ROOT/records/final-install-path-set.txt); do
#   if [[ "$res" != ""  ]]; then
#     cp -r "$res" "$ESY_EJECT__TMP/i/"
#     cd "$ESY_EJECT__TMP/i/"
#     tar -czf `basename "$res"`.tar.gz `basename "$res"`
#     rm -rf `basename "$res"`
#     echo "$res" >> $PACKAGE_ROOT/records/recordedCoppiedArtifacts.txt
#   fi
# done
# cd "$PACKAGE_ROOT"
# #
# 
# # Built packages have a special way of compressing the release, putting the
# # eject store in its own tar so that all the symlinks in the store can be
# # relocated using tools that exist in the eject sandbox.
# 
# tar -czf r.tar.gz r
# rm -rf $ESY_EJECT__SANDBOX
# 


#
# decompressAndRelocateBuiltPackages
#
if [ -d "$ESY_EJECT__INSTALL_STORE" ]; then
  echo >&2 "error: $ESY_EJECT__INSTALL_STORE already exists. This will not work. It has to be a new directory.";
  exit 1;
fi
serverEsyEjectStore=`cat "$PACKAGE_ROOT/records/recordedServerBuildStorePath.txt"`
serverEsyEjectStoreDirName=`basename "$serverEsyEjectStore"`

# Decompress the actual sandbox:
unzipAndUntarFixupLinks "$serverEsyEjectStore" "$ESY_EJECT__SANDBOX.tar.gz"

cd "$ESY_EJECT__TMP/i/"
# Executing the untar/unzip in parallel!
echo '*** Decompressing artefacts...'
find . -name '*.gz' -print0 | xargs -0 -I {} -P 30 bash -c "unzipAndUntarFixupLinks $serverEsyEjectStore {}"

cd "$PACKAGE_ROOT"
mv "$ESY_EJECT__TMP" "$ESY_EJECT__INSTALL_STORE"
# Write the final store path, overwritting the (original) path on server.
echo "$ESY_EJECT__INSTALL_STORE" > "$PACKAGE_ROOT/records/recordedClientInstallStorePath.txt"

# Not that this is really even used for anything once on the client.
# We use the install store. Still, this might be good for debugging.
cp "$ESY_EJECT__ROOT/records/store-path.txt" "$PACKAGE_ROOT/records/recordedClientBuildStorePath.txt"
# Executing the replace string in parallel!
# https://askubuntu.com/questions/431478/decompressing-multiple-files-at-once
echo '*** Relocating artefacts to the final destination...'
find "$ESY_EJECT__INSTALL_STORE" -type f -print0       | xargs -0 -I {} -P 30 $ESY_EJECT__ROOT/bin/fastreplacestring.exe "{}" "$serverEsyEjectStore" "$ESY_EJECT__INSTALL_STORE"



#
# markReleaseAsBuilt
#
touch "$PACKAGE_ROOT/records/done.txt"
