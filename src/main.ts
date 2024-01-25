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
import { Scene } from "./scenes/test2";
import { SceneType } from "./utils/baseTypes";
import { PipelineGeometry } from "./prims/PipelineGeometry";

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
    const outputs = Outputs.getOutputs(gl)
    scene.setGLContext(gl);
    scene.buildCameras();
    scene.buildObjects();
    const animate = (time: number): void => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      twgl.resizeCanvasToDisplaySize(canvas);
      AppState.appWidth = canvas.width;
      AppState.appHeight = canvas.height;
      for (let renderable of scene.renderObjs) {
        renderable.render(time);
      }
      if (outputs.push(null)) {
        outputs.render();
        outputs.wrapRender();
        outputs.pop();

      }
      scene.updateObjects(time);
      requestAnimationFrame(animate);
      
    }
    requestAnimationFrame(animate);
    if (scene.launchAsyncHandlers) {
      scene.launchAsyncHandlers();
    }

  }
  
    if (!gl) {
    throw new Error("Late error starting GL context");
  }
  runScene(gl, Scene);
}

main();
