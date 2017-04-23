#!/usr/bin/env bash

set -e

cd ./actualInstall/
../node_modules/.bin/esy install
cd ..
