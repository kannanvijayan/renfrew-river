import { useEffect, useRef } from "react";
import Application from "../../application";
import GeneratingWorldViewState from "../../state/view/create_world/generating_world";

/**
 * This component wraps a persistent `Canvas` element which hosts
 * a PIXI.js `Application` instance. The `Application` instance
 * is used to render the game map.
 */
export default function WorldViz(args: {
  viewState: GeneratingWorldViewState,
}) {
  const { viewState } = args;
  const { descriptor } = viewState;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let canvas = canvasRef.current;
    if (canvas === null) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    const application = Application.getInstance();
   
    (async () => {
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

      await application.initWorldCreationViz(canvas);
    })();

    return () => {
    };
  }, [canvasRef, descriptor]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}
