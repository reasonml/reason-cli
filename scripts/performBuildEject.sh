#!/usr/bin/env bash

set -e

# Peform build eject
cd ./actualInstall/
(../node_modules/.bin/esy build-eject || (ls ./node_modules/.cache/**/* && echo "FAILED TO BUILD-EJECT"))
cd ..
