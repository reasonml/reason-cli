#!/usr/bin/env bash

# linkFromTo ()
# {
#   # ln -s target_path link_path
#   ln -s "${2}" "${1}"
# }
rm ./.bin/ocamlmerlin-reason
rm ./.bin/ocamlrun
rm ./.bin/ocamlc
rm ./.bin/ocamlopt
rm ./.bin/ocaml
rm ./.bin/rtop
rm ./.bin/utop
rm ./.bin/ocamlmerlin
rm ./.bin/rebuild
rm ./.bin/refmt
rm ./.bin/refmttype
rm ./.bin/refmt_merlin
rm ./.bin/reopt

cd ./actualInstall/ && ../node_modules/.bin/esy install && ../node_modules/.bin/esy build

OCAMLMERLIN_REASON_DEST=`../node_modules/.bin/esy which ocamlmerlin-reason`
OCAMLRUN_DEST=`../node_modules/.bin/esy which ocamlrun`
OCAMLC_DEST=`../node_modules/.bin/esy which ocamlc`
OCAMLOPT_DEST=`../node_modules/.bin/esy which ocamlopt`
OCAML_DEST=`../node_modules/.bin/esy which ocaml`
RTOP_DEST=`../node_modules/.bin/esy which rtop`
UTOP_DEST=`../node_modules/.bin/esy which utop`
OCAMLMERLIN_DEST=`../node_modules/.bin/esy which ocamlmerlin`
REBUILD_DEST=`../node_modules/.bin/esy which rebuild`
REFMT_DEST=`../node_modules/.bin/esy which refmt`
REFMTTYPE_DEST=`../node_modules/.bin/esy which refmttype`
REFMT_MERLIN_DEST=`../node_modules/.bin/esy which refmt_merlin`
REOPT_DEST=`../node_modules/.bin/esy which reopt`

cd ../
ln -s $OCAMLMERLIN_REASON_DEST ./.bin/ocamlmerlin-reason
ln -s $OCAMLRUN_DEST ./.bin/ocamlrun
ln -s $OCAMLC_DEST ./.bin/ocamlc
ln -s $OCAMLOPT_DEST ./.bin/ocamlopt
ln -s $OCAML_DEST ./.bin/ocaml
ln -s $RTOP_DEST ./.bin/rtop
ln -s $UTOP_DEST ./.bin/utop
ln -s $OCAMLMERLIN_DEST ./.bin/ocamlmerlin
ln -s $REBUILD_DEST ./.bin/rebuild
ln -s $REFMT_DEST ./.bin/refmt
ln -s $REFMTTYPE_DEST ./.bin/refmttype
ln -s $REFMT_MERLIN_DEST ./.bin/refmt_merlin
ln -s $REOPT_DEST ./.bin/reopt
