#!/bin/bash
E="$1"; S="$2"; SL="$3"
OUT="/tmp/scraped/${E}_${S}_${SL}.json"
agent-browser close 2>/dev/null
sleep 1
agent-browser open "https://questions.examside.com/past-years/jee/${E}/${S}/${SL}" 2>/dev/null
sleep 4
agent-browser wait --load networkidle 2>/dev/null
sleep 2
agent-browser eval "JSON.stringify(Array.from(document.querySelectorAll('a.flex.gap-2[href*=question]')).map(c=>({t:c.querySelector('.flex.flex-col')?.children[0]?.textContent?.trim().substring(0,250)||'',m:c.querySelector('.flex.flex-col')?.children[1]?.textContent?.trim()||'',u:c.getAttribute('href')||''})))" 2>/dev/null > "${OUT}.raw"
COUNT=$(python3 -c "
import json,re,sys
raw=open('$OUT.raw','r',errors='replace').read().strip()
if not raw or raw=='{}':
  open('$OUT','w').write(json.dumps({'q':[],'n':0}))
  print('0'); sys.exit()
try:
  if raw[0]=='\"' and raw[-1]=='\"':
    raw=raw[1:-1]
  # Fix common JSON issues from truncation
  while raw.count('\"')%2==1: raw=raw[:-1]  # Remove trailing char if unbalanced quotes
  d=json.loads(raw)
  if isinstance(d,list): d={'q':d,'n':len(d)}
  open('$OUT','w').write(json.dumps(d))
  print(d.get('n',0))
except Exception as e:
  # Try to recover partial data
  try:
    # Add closing bracket/brace
    for suffix in [']','}]','}]}','"}]}','}]','}']:
      try: d=json.loads(raw+suffix); open('$OUT','w').write(json.dumps(d if isinstance(d,dict) else {'q':d,'n':len(d)})); print(len(d) if isinstance(d,list) else d.get('n',0)); sys.exit()
      except: pass
  except: pass
  open('$OUT','w').write(json.dumps({'q':[],'n':0}))
  print('0')
" 2>&1)
echo "$SL: $COUNT questions"
rm -f "${OUT}.raw"