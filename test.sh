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
which reactjs_jsx_ppx_v2

# re-enable after esy@0.2.5 is released
# ocamlmerlin ----where
# ocamlmerlin-reason ----where
# rtop ----where
# utop ----where
# refmt ----where
# refmttype ----where
# reactjs_jsx_ppx_v2 ----where

refmt --version
ocamlmerlin -version
utop -version
rtop -version

echo 'print_endline (String.concat ", "  ["Hello"; "World!"]);;' \
  | utop -stdin

echo 'print_endline(String.concat(", ", ["Hello", "World!"]));' \
  | rtop -stdin
