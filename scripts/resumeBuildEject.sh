#!/usr/bin/env bash

set -e

cd ./actualInstall/
(make -f node_modules/.cache/_esy/build-eject/Makefile || (ls ./node_modules/.cache/**/* && echo "FAILED TO BUILD"))
cd ..
