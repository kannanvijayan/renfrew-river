#!/bin/bash

count_loc() {
  subdir=$1
  filetype=$2
  find "$subdir" -name "$filetype" | xargs wc -l | tail -n 1 | awk '{print $1}'
}

RUST_LINES=$(count_loc ./src '*.rs')
SHADER_LINES=$(count_loc ./src '*.wgsl')
PROTOCOL_CLIENT_LINES=$(count_loc ./clients/protocol-client/src '*.ts')
WEB_UI_LINES_TS=$(count_loc ./clients/web-client/src '*.ts')
WEB_UI_LINES_TSX=$(count_loc ./clients/web-client/src '*.tsx')
WEB_UI_LINES=$(($WEB_UI_LINES_TS + $WEB_UI_LINES_TSX))

TOTAL=$(($RUST_LINES + $SHADER_LINES + $PROTOCOL_CLIENT_LINES + $WEB_UI_LINES))

echo "Rust: $RUST_LINES"
echo "Shader: $SHADER_LINES"
echo "Protocol Client: $PROTOCOL_CLIENT_LINES"
echo "Web UI: $WEB_UI_LINES"
echo "========"
echo "Total: $TOTAL"
