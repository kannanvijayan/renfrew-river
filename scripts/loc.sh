#!/bin/bash

count_loc() {
  subdir=$1
  filetype=$2
  find "$subdir" -name "$filetype" | xargs wc -l | tail -n 1 | awk '{print $1}'
}

RUST_LINES=$(count_loc ./src '*.rs')
SHADER_LINES=$(count_loc ./src '*.wgsl')
PIXIJS_UI_LINES=$(count_loc ./clients/pixijs-ui/src '*.ts')

TOTAL=$(($RUST_LINES + $SHADER_LINES + $PIXIJS_UI_LINES))

echo "Rust: $RUST_LINES"
echo "Shader: $SHADER_LINES"
echo "PixiJS UI: $PIXIJS_UI_LINES"
echo "========"
echo "Total: $TOTAL"