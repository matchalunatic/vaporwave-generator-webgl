import { RenderableType, SceneType } from "../utils/baseTypes";
import { createPerspectiveCamera } from "../utils/gl";
import { Outputs } from "../output/Outputs";
import * as twgl from "twgl.js";
import { Raymarcher } from "../prims/Raymarcher";
const renderObjs: RenderableType[] = [];
const cameras: string[] = [];
let glContext: WebGL2RenderingContext;

const setGlContext = (gl: WebGL2RenderingContext): void => {
  glContext = gl;
};

const buildObjects = (): void => {
  let rm = new Raymarcher({ gl: glContext });
  Outputs.getOutputs(glContext);
  rm.setOutput(null);
  // rm.setCamera("identity");
  renderObjs.push(rm);
  console.log(renderObjs);
};

const buildCameras = (): void => {
  createPerspectiveCamera(
    "mobile-perspective",
    twgl.v3.create(0, 0, -1),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 1, 0),
    {
      aspect: 1,
      far: 1000,
      near: 0.1,
      fov: 90,
    }
  );
  cameras.push("mobile-perspective");
};

const updateObjects = (time: number): void => {};

const Scene: SceneType = {
  setGLContext: setGlContext,
  buildCameras: buildCameras,
  buildObjects: buildObjects,
  updateObjects: updateObjects,
  renderObjs: renderObjs,
};

export { Scene };
