#!/bin/bash
OUT=final.jsonl; : > $OUT
run() { r=$(TRACE=$5 timeout 120 node stress.js "$2" $3 $4 3 10 30 2>&1 | tail -1); echo "{\"v\":\"$1\",\"cfg\":\"$3 x$4\",\"r\":$r}" >> $OUT; }
for cfg in "chromium 1" "chromium 4" "webkit 1"; do set -- $cfg; run old http://127.0.0.1:8792/ $1 $2 1; done
for rep in 1 2 3; do
 for v in a b c; do V=$(echo $v | tr a-z A-Z)
  for cfg in "chromium 1" "chromium 4" "webkit 1"; do set -- $cfg; run $V http://127.0.0.1:8793/$v/ $1 $2 $([ $rep = 1 ] && echo 1 || echo 0); done
 done; echo rep $rep
done
echo DONE
