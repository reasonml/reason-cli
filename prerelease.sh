#!/usr/bin/env bash
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
    repeatCh() {
     chToRepeat=$1
     times=$2
     printf "%0.s$chToRepeat" $(seq 1 $times)
    }
    STRLEN_RESULT=0
    strLen() {
      oLang=$LANG
      LANG=C
      STRLEN_RESULT=${#1}
      LANG=$oLang
    }
    checkEsyEjectStore() {
      if [[ $ESY_EJECT__STORE == *"//"* ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) has an invalid pattern //";
        exit 1;
      fi
      if [[ $ESY_EJECT__STORE != "/"* ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) does not begin with a forward slash - it must be absolute.";
        exit 1;
      fi
      if [[ $ESY_EJECT__STORE == *"/./"*  ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) contains /./ and that is not okay.";
        exit 1;
      fi
      if [[ $ESY_EJECT__STORE == *"/"  ]]; then
        echo >&2 "ESY_EJECT__STORE($ESY_EJECT__STORE) ends with a slash and it should not";
        exit 1;
      fi
    }

    
    # Release releaseType: "bin"
    # ------------------------------------------------------
    #  Executed while creating the release
    #
    #  Download: true
    #  Pack: true
    #  Compress Pack: false
    #  Decompress Pack: false
    #  Build Packages: true
    #  Compress Built Packages: true
    #  Decompress Built Packages: false

    #                server               |              client
    #                                     |
    # ESY_EJECT__STORE -> ESY_EJECT__TMP  |  ESY_EJECT__TMP -> ESY_EJECT__INSTALL_STORE
    # =================================================================================

    ESY__STORE_VERSION="3.x.x"
    SOURCE="${BASH_SOURCE[0]}"
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
    if [ -z "${PRENORMALIZED_ESY_EJECT__STORE+x}" ]; then
      PRENORMALIZED_ESY_EJECT__STORE="$HOME/.esy/$ESY__STORE_VERSION"
    else
      PRENORMALIZED_ESY_EJECT__STORE="$PRENORMALIZED_ESY_EJECT__STORE"
    fi
    # Remove trailing slash if any.
    PRENORMALIZED_ESY_EJECT__STORE="${PRENORMALIZED_ESY_EJECT__STORE%/}"
    strLen "$PRENORMALIZED_ESY_EJECT__STORE"
    lenPrenormalizedEsyEjectStore=$STRLEN_RESULT
    byteLenDiff=`expr 88 - $lenPrenormalizedEsyEjectStore `
    # Discover how much of the reserved relocation padding must be consumed.
    if [ "$byteLenDiff" -lt "0" ]; then
      printByteLengthError "$PRENORMALIZED_ESY_EJECT__STORE";
       exit 1;
    fi
    adjustedSuffix=`repeatCh '_' "$byteLenDiff"`
    export ESY_EJECT__STORE="${PRENORMALIZED_ESY_EJECT__STORE}$adjustedSuffix"


    # We Build into the ESY_EJECT__STORE, copy into ESY_EJECT__TMP, potentially
    # transport over the network then finally we copy artifacts into the
    # ESY_EJECT__INSTALL_STORE and relocate them as if they were built there to
    # begin with.  ESY_EJECT__INSTALL_STORE should not ever be used if we're
    # running on the server.
    PRENORMALIZED_ESY_EJECT__INSTALL_STORE="$ESY_EJECT__SANDBOX/$ESY__STORE_VERSION"
    # Remove trailing slash if any.
    PRENORMALIZED_ESY_EJECT__INSTALL_STORE="${PRENORMALIZED_ESY_EJECT__INSTALL_STORE%/}"
    strLen "$PRENORMALIZED_ESY_EJECT__INSTALL_STORE"
    lenPrenormalizedEsyEjectInstallStore=$STRLEN_RESULT
    byteLenDiff=`expr 88 - $lenPrenormalizedEsyEjectInstallStore `
    # Discover how much of the reserved relocation padding must be consumed.
    if [ "$byteLenDiff" -lt "0" ]; then
      printByteLengthError "$PRENORMALIZED_ESY_EJECT__INSTALL_STORE";
       exit 1;
    fi
    adjustedSuffix=`repeatCh '_' "$byteLenDiff"`
    export ESY_EJECT__INSTALL_STORE="${PRENORMALIZED_ESY_EJECT__INSTALL_STORE}$adjustedSuffix"


    # Regardless of where artifacts are actually built, or where they will be
    # installed to, or if we're on the server/client we will copy artifacts
    # here temporarily. Sometimes the build location is the same as where we
    # copy them to inside the sandbox - sometimes not.
    export PACKAGE_ROOT="$SCRIPTDIR"
    export ESY_EJECT__TMP="$PACKAGE_ROOT/relBinaries"
    checkEsyEjectStore
    
    # Download
    cd ./rel/
    ../node_modules/.bin/esy install
    cd ..
    
    # Pack:
    # Peform build eject.  Warms up *just* the artifacts that require having a
    # modern node installed.
    cd ./rel/
    # Generates the single Makefile etc.
    ../node_modules/.bin/esy build-eject
    cd ..
    
#    # Compress:
#    # Avoid npm stripping out vendored node_modules via tar. Merely renaming node_modules
#    # is not sufficient!
#    tar -czf rel.tar.gz rel
#    rm -rf ./rel/
    
#    # Decompress:
#    # Avoid npm stripping out vendored node_modules.
#    gunzip rel.tar.gz
#    if hash bsdtar 2>/dev/null; then
#      bsdtar -xf rel.tar
#    else
#      if hash tar 2>/dev/null; then
#        # Supply --warning=no-unknown-keyword to supresses warnings when packed on OSX
#        tar --warning=no-unknown-keyword -xf rel.tar
#      else
#        echo >&2 "Installation requires either bsdtar or tar - neither is found.  Aborting.";
#      fi
#    fi
#    rm -rf rel.tar
    
    # BuildPackages: Always reserve enough path space to perform relocation.
    cd ./rel/
    make -j -f node_modules/.cache/_esy/build-eject/Makefile
    cd ..
    mkdir $PACKAGE_ROOT/records
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/records/recordedServerBuildStorePath.txt"
    # For client side builds, recordedServerBuildStorePath is equal to recordedClientBuildStorePath.
    # For prebuilt binaries these will differ, and recordedClientBuildStorePath.txt is overwritten.
    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/records/recordedClientBuildStorePath.txt"
    
    ENV_PATH="$ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/eject-env"
    # Double backslash in es6 literals becomes one backslash
    # Must use . instead of source for some reason.
    shCmd=". $ENV_PATH && echo \$PATH"
    EJECTED_PATH=`sh -c "$shCmd"`
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
    for i in "${arr[@]}"; do
      res=`[[   "$i" =~ ^("$ESY_EJECT__STORE"/i/[a-z0-9._-]*) ]] && echo ${BASH_REMATCH[1]} || echo ''`
      if [[ "$res" != ""  ]]; then
        cp -r "$res" "$ESY_EJECT__TMP/i/"
        cd "$ESY_EJECT__TMP/i/"
        tar -czf `basename "$res"`.tar.gz `basename "$res"`
        rm -rf `basename "$res"`
        echo "$res" >> $PACKAGE_ROOT/records/recordedCoppiedArtifacts.txt
      fi
    done
    unset IFS
    cd "$PACKAGE_ROOT"
    find "$ESY_EJECT__TMP/i/" -type f \( -path */doc/* \) -delete
    rm relBinaries/i/*ounit-2.0.0-*.tar.gz
rm relBinaries/i/*camlp4-4.2.7-*.tar.gz
rm relBinaries/i/opam_installer_bin-*.tar.gz
rm relBinaries/i/*topkg-0.8.1-*.tar.gz
rm relBinaries/i/substs-0.0.1-*.tar.gz
rm relBinaries/i/*conf_which-1.0.0-*.tar.gz
rm relBinaries/i/*conf_m4-1.0.0-*.tar.gz
rm relBinaries/i/*cppo-1.4.1-*.tar.gz
rm relBinaries/i/*jbuilder-1.9.0-*.tar.gz
    # Built packages have a special way of compressing the release, putting the
    # eject store in its own tar so that all the symlinks in the store can be
    # relocated using tools that exist in the eject sandbox.

    tar -czf rel.tar.gz rel
    rm -rf ./rel/
    
#
#    if [ -d "$ESY_EJECT__INSTALL_STORE" ]; then
#      echo >&2 "$ESY_EJECT__INSTALL_STORE already exists. This will not work. It has to be a new directory.";
#      exit 1;
#    fi
#    serverEsyEjectStore=`cat "$PACKAGE_ROOT/records/recordedServerBuildStorePath.txt"`
#    serverEsyEjectStoreDirName=`basename "$serverEsyEjectStore"`
#
#    # Decompress the actual sandbox:
#    unzipAndUntarFixupLinks "$serverEsyEjectStore" "rel.tar.gz"
#
#    cd "$ESY_EJECT__TMP/i/"
#    # Executing the untar/unzip in parallel!
#    find . -name '*.gz' -print0 | xargs -0 -I {} -P 30 bash -c "unzipAndUntarFixupLinks $serverEsyEjectStore {}"
#
#    mv "$ESY_EJECT__TMP" "$ESY_EJECT__INSTALL_STORE"
#    # Write the final store path, overwritting the (original) path on server.
#    echo "$ESY_EJECT__INSTALL_STORE" > "$PACKAGE_ROOT/records/recordedClientInstallStorePath.txt"
#
#    # Not that this is really even used for anything once on the client.
#    # We use the install store. Still, this might be good for debugging.
#    echo "$ESY_EJECT__STORE" > "$PACKAGE_ROOT/records/recordedClientBuildStorePath.txt"
#    # Executing the replace string in parallel!
#    # https://askubuntu.com/questions/431478/decompressing-multiple-files-at-once
#    find $ESY_EJECT__INSTALL_STORE -type f -print0 | xargs -0 -I {} -P 30 "$ESY_EJECT__SANDBOX/node_modules/.cache/_esy/build-eject/bin/fastreplacestring.exe" "{}" "$serverEsyEjectStore" "$ESY_EJECT__INSTALL_STORE"
#    