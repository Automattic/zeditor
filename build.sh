#!/bin/sh

if [ "x$INSIDE_MAKE" = "x" ]; then
  if [ "x$MAKE" = "x" ]; then
    export MAKE=make
  fi
  if [ "x$MAKEFLAGS" = "x" ]; then
    CPUS=$(node -p "Math.max(1, (require('os').cpus().length / 2) | 0)")
    export MAKEFLAGS="-j$CPUS"
  fi
  touch package.json;
  $MAKE $MAKEFLAGS;
  for i in `find lib -name *.jadejs`; do mv "$i" "`dirname $i`/`basename $i .jadejs`.js"; done
  for i in `find lib -name *.tsjs`; do mv "$i" "`dirname $i`/`basename $i .tsjs`.js"; done
  for i in `find lib -name *.es6js`; do mv "$i" "`dirname $i`/`basename $i .es6js`.js"; done
fi
