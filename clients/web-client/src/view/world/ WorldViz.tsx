import { useEffect, useRef } from "react";
import Application from "../../application";
import { WorldDescriptor } from "renfrew-river-protocol-client";

/**
 * This component wraps a persistent `Canvas` element which hosts
 * a PIXI.js `Application` instance. The `Application` instance
 * is used to render the game map.
 */
export default function WorldViz(args: {
  worldDescriptor: WorldDescriptor,
}) {
  const { worldDescriptor } = args;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const canvas = canvasRef.current;
    const application = Application.getInstance();
   
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

      application.initSimulation(worldDescriptor);
      await application.initViz(canvas);
    })();

    return () => {
    };
  }, [canvasRef]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
