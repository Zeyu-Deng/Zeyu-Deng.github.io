#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# 确保日志实时输出
export NODE_OPTIONS="--no-deprecation"

echo "Building patent globe data from patent_globe/settings.json ..."
node scripts/build_patent_globe_data.js

PORT="$(node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('patent_globe/settings.json','utf8')); console.log((s.server&&s.server.port)||8081)")"
HOST="$(node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('patent_globe/settings.json','utf8')); console.log((s.server&&s.server.host)||'0.0.0.0')")"
CACHE_SECONDS="$(node -e "const fs=require('fs'); const s=JSON.parse(fs.readFileSync('patent_globe/settings.json','utf8')); console.log((s.server&&s.server.cacheSeconds!==undefined)?s.server.cacheSeconds:-1)")"

echo "Starting local server on http://localhost:${PORT} ..."
node_modules/.bin/http-server -a "$HOST" -p "$PORT" -c"$CACHE_SECONDS"
