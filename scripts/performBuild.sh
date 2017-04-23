#!/usr/bin/env bash

set -e

cd ./actualInstall/
(../node_modules/.bin/esy build || (ls ./node_modules/.cache/**/* && echo "FAILED TO BUILD"))
cd ..
