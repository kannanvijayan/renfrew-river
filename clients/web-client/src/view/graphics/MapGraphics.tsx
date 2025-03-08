import { useEffect, useRef } from "react";
import HexMesh from "../../graphics/hex_mesh";
import Graphics from "../../graphics/graphics";

/**
 * This component wraps a persistent `Canvas` element which hosts
 * a PIXI.js `Application` instance. The `Application` instance
 * is used to render the game map.
 */
export default function MapGraphics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const canvas = canvasRef.current;
   
    (async () => {
      console.log("Initializing PIXI Application");

      // Get the pixel width of the canvas element
      //const width = canvas.clientWidth;
      //const height = canvas.clientHeight;

      const { width, height } = canvas.getBoundingClientRect();
      console.log("Client dimensions", {width, height});

      // Multiply the width and height by the device pixel ratio.
      const resolution = window.devicePixelRatio;
      const scaledWidth = width * resolution;
      const scaledHeight = height * resolution;
      console.log("Scaled dimensions", {scaledWidth, scaledHeight});

      // Set the resolution of canvas.
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      Graphics.create(canvas);
    })();

    return () => {
    };
  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
