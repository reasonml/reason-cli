#!/usr/bin/env bash

set -e

./scripts/performDownload.sh
./scripts/performBuild.sh
./scripts/fixupSymlinks.sh
