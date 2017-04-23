#!/usr/bin/env bash

set -e

./performDownload.sh
./performBuild.sh
./fixupSymlinks.sh
