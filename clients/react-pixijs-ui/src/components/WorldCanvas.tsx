import React from 'react';

import "./WorldCanvas.css";

// Accepts a callback function to call when "Connect" button is clicked.
export default function WorldCanvas(
  props: {
    canvasRef: React.RefObject<HTMLCanvasElement>,
  }
) {
  console.log("KVKV WorldCanvas", { canvas: props.canvasRef.current });
  return (
    /* Make a vertical layout of a title, a labeled server selector input,
     * and a connect button.
     */
    <canvas className="WorldCanvas" ref={props.canvasRef} />
  );
};
