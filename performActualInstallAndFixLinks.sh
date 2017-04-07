#!/usr/bin/env bash

set -e

# Not letting failure to rm block the build because when debugging,
# you might have already rm'd them. Every other failure should block
# the outer npm install/build though (that's what set -e does).
(rm ./.bin/ocamlmerlin-reason || true)
(rm ./.bin/ocamlrun || true)
(rm ./.bin/ocamlc || true)
(rm ./.bin/ocamlopt || true)
(rm ./.bin/ocaml || true)
# (rm ./.bin/rtop || true)
# (rm ./.bin/utop || true)
(rm ./.bin/ocamlmerlin || true)
# rm ./.bin/rebuild
(rm ./.bin/refmt || true)
(rm ./.bin/refmttype || true)
(rm ./.bin/refmt_merlin || true)
(rm ./.bin/reactjs_jsx_ppx || true)
# (rm ./.bin/berror || true)
# (rm ./.bin/reopt || true)

cd ./actualInstall/
../node_modules/.bin/esy install
(../node_modules/.bin/esy build || (ls ./node_modules/.cache/**/* && echo "FAILED TO BUILD"))


OCAMLMERLIN_REASON_DEST=`../node_modules/.bin/esy which ocamlmerlin-reason`
OCAMLRUN_DEST=`../node_modules/.bin/esy which ocamlrun`
OCAMLC_DEST=`../node_modules/.bin/esy which ocamlc`
OCAMLOPT_DEST=`../node_modules/.bin/esy which ocamlopt`
OCAML_DEST=`../node_modules/.bin/esy which ocaml`
# RTOP_DEST=`../node_modules/.bin/esy which rtop`
# UTOP_DEST=`../node_modules/.bin/esy which utop`
OCAMLMERLIN_DEST=`../node_modules/.bin/esy which ocamlmerlin`
# REBUILD_DEST=`../node_modules/.bin/esy which rebuild`
REFMT_DEST=`../node_modules/.bin/esy which refmt`
REFMTTYPE_DEST=`../node_modules/.bin/esy which refmttype`
REFMT_MERLIN_DEST=`../node_modules/.bin/esy which refmt_merlin`
REACTJS_JSX_PPX_DEST=`../node_modules/.bin/esy which reactjs_jsx_ppx`
# BERROR_DEST=`../node_modules/.bin/esy which berror`
# REOPT_DEST=`../node_modules/.bin/esy which reopt`

cd ../
ln -s $OCAMLMERLIN_REASON_DEST ./.bin/ocamlmerlin-reason
ln -s $OCAMLRUN_DEST ./.bin/ocamlrun
ln -s $OCAMLC_DEST ./.bin/ocamlc
ln -s $OCAMLOPT_DEST ./.bin/ocamlopt
ln -s $OCAML_DEST ./.bin/ocaml
# ln -s $RTOP_DEST ./.bin/rtop
# ln -s $UTOP_DEST ./.bin/utop
ln -s $OCAMLMERLIN_DEST ./.bin/ocamlmerlin
# ln -s $REBUILD_DEST ./.bin/rebuild
ln -s $REFMT_DEST ./.bin/refmt
ln -s $REFMTTYPE_DEST ./.bin/refmttype
ln -s $REFMT_MERLIN_DEST ./.bin/refmt_merlin
ln -s $REACTJS_JSX_PPX_DEST ./.bin/reactjs_jsx_ppx
# ln -s $BERROR_DEST ./.bin/berror
# ln -s $REOPT_DEST ./.bin/reopt
