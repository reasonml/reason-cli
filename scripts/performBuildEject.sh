#!/usr/bin/env bash

set -e

# Peform build eject.
# Warms up *just* the artifacts that require having a modern node installed.
cd ./actualInstall/
# Generates all the make files etc.
(../node_modules/.bin/esy build-eject || (ls ./node_modules/.cache/**/* && echo "FAILED TO BUILD-EJECT"))
# Ensure the shell script is generated which constructs environments to execute
# commands within.
(../node_modules/.bin/esy dump-env || (ls ./node_modules/.cache/**/* && echo "FAILED TO DUMP-ENV"))
cd ..
