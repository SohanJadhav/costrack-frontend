#!/bin/sh
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then npm install; fi
npm run dev > /tmp/costrack-vite.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID' EXIT
open http://localhost:5173
wait $SERVER_PID