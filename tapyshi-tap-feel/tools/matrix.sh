#!/bin/bash
# usage: matrix.sh out.jsonl
OUT=${1:-results.jsonl}; : > $OUT
for u in "old|http://127.0.0.1:8792/" "A|http://127.0.0.1:8793/a/" "B|http://127.0.0.1:8793/b/" "C|http://127.0.0.1:8793/c/"; do
  n=${u%%|*}; url=${u#*|}
  for cfg in "chromium 1" "chromium 4" "webkit 1" "webkit 1"; do
    set -- $cfg
    r=$(timeout 120 node stress.js "$url" $1 $2 3 10 30 2>&1 | tail -1)
    echo "{\"v\":\"$n\",\"cfg\":\"$1 x$2\",\"r\":$r}" >> $OUT
    echo "$n $1 x$2 done"
  done
done
