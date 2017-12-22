#!/bin/bash
set -e
set -o pipefail
set -x

which ocamlmerlin
which ocamlmerlin-reason
which rtop
which utop
which refmt
which refmttype
which reopt
which rebuild
which reactjs_jsx_ppx_v2
which reactjs_jsx_ppx_v3

ocamlmerlin ----where
ocamlmerlin-reason ----where
rtop ----where
utop ----where
refmt ----where
refmttype ----where
reopt ----where
rebuild ----where
reactjs_jsx_ppx_v2 ----where
reactjs_jsx_ppx_v3 ----where

refmt --version
ocamlmerlin -version
utop -version
rtop -version

echo 'print_endline (String.concat ", "  ["Hello"; "World!"]);;' \
  | utop -stdin

echo 'print_endline(String.concat(", ", ["Hello", "World!"]));' \
  | rtop -stdin
