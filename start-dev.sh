#!/bin/bash
# Auto-restarting dev server wrapper
cd /home/z/my-project
rm -f dev.log
while true; do
  echo "[$(date)] Starting dev server..." >> /home/z/my-project/dev.log
  npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT=$?
  echo "[$(date)] Server exited with code $EXIT, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done