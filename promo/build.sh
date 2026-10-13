#!/usr/bin/env bash
# בונה את סרטון התדמית: פריימים (Playwright) + פסקול מסונתז (numpy) -> MP4
# דרישות: node + playwright, python3 + numpy, ffmpeg
# שימוש: PLAYWRIGHT_PATH=/path/to/node_modules/playwright ./promo/build.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="${WORK_DIR:-$(mktemp -d)}"
mkdir -p "$work/frames"

node "$here/render.mjs" "$work/frames" "${WORKERS:-4}"
python3 -I "$here/audio.py" "$work/frames/events.json" "$work/audio.wav"

ffmpeg -y -loglevel error -framerate 30 -i "$work/frames/f_%05d.jpg" -i "$work/audio.wav" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 192k \
  -movflags +faststart -shortest "$here/promo.mp4"
echo "נוצר: $here/promo.mp4"
