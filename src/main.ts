import { Shapes } from "./prims/Shapes";
import { Outputs } from "./output/Outputs";
import * as twgl from "twgl.js";
import { AppState } from "./utils/appState";
import {
  createCamera,
  createOrthographicCamera,
  createPerspectiveCamera,
  moveCamera,
} from "./utils/gl";
import { pickRandomColor } from "./utils/colors";
import { Scene } from "./scenes/test";
import { SceneType } from "./utils/baseTypes";
const triangleWave = (
  time: number,
  phase: number,
  period: number,
  minAmplitude: number,
  maxAmplitude: number
): number => {
  const normalizedPhase = ((phase % 360) + 360) % 360;
  const normalizedTime =
    ((time + (normalizedPhase / 360) * period) % period) / period; // Normalize time to the range [0, 1]

  const triangleValue = Math.abs(2 * normalizedTime - 1); // Form a triangle wave using abs function

  return minAmplitude + triangleValue * (maxAmplitude - minAmplitude);
}

function bipolarSquareWave<T> (
  time: number,
  phase: number,
  period: number,
  lowValue: T,
  highValue: T
): T {
  const normalizedPhase = ((phase % 360) + 360) % 360;
  const normalizedTime =
    ((time + (normalizedPhase / 360) * period) % period) / period; // Normalize time to the range [0, 1]
  if (normalizedTime < 0.5) {
    return lowValue;
  }
  return highValue;
}

function main() {
  const canvas = document!.getElementById("app") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", {
    alpha: true,
  });
  if (!gl) {
    throw new Error("Could not initialize WebGL Context");
  }
  twgl.resizeCanvasToDisplaySize(canvas);
  AppState.appHeight = canvas.height;
  AppState.appWidth = canvas.width;

  // perspective = twgl.m4.identity();
  // outputs.outs[0].transformMatrix = twgl.m4.rotateZ(twgl.m4.identity(), 1);

  const setupEnvironment = (gl: WebGL2RenderingContext): void => {
    gl.depthMask(false);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    Outputs.getOutputs(gl)
  };

  const runScene = (gl: WebGL2RenderingContext, scene: SceneType): void => {
    setupEnvironment(gl);
    scene.setGLContext(gl);
    scene.buildCameras();
    scene.buildObjects();
    const outputs = Outputs.getOutputs(gl)
    const animate = (time: number): void => {
      for (let renderable of scene.renderObjs) {
        renderable.render(time);
      }
      if (outputs.push(null)) {
        outputs.render();
        outputs.pop();
      }
      scene.updateObjects(time);
      requestAnimationFrame(animate);
      
    }
    requestAnimationFrame(animate);
  }
  const startRender = (gl: WebGL2RenderingContext): void => {
    const outputs = Outputs.getOutputs(gl);
    setupEnvironment(gl);

    /*const render = (time: number): void => {
      twgl.resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
      AppState.appHeight = canvas.height;
      AppState.appWidth = canvas.width;

      if (outputs.push(null)) {
        outputs.render();
      } else {
        throw Error("Cannot switch to main render buffer");
      }
      outputs.wrapRender();
      requestAnimationFrame(render); // retrigger
    };
    requestAnimationFrame(render);
    */
  };
  
    if (!gl) {
    throw new Error("Late error starting GL context");
  }
  // startRender(gl);
  runScene(gl, Scene);
}

main();
