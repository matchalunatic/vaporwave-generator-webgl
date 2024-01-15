import { Shapes } from "../prims/Shapes";
import { RenderableType, SceneType } from "../utils/baseTypes";
import {
  createCamera,
  createOrthographicCamera,
  createPerspectiveCamera,
  getCamera,
} from "../utils/gl";
import { Outputs } from "../output/Outputs";
import * as twgl from "twgl.js";
import { pickRandomElement } from "../utils/misc";
import { pickRandomColor } from "../utils/colors";
import { PipelineGeometry, addPolygonToPipelineGeometry, addStretchCoordinatesToPipelineGeometry, addWiggleVertexToPipelineGeometry } from "../prims/PipelineGeometry";
const renderObjs: RenderableType[] = [];
const cameras: string[] = [];
let glContext: WebGL2RenderingContext;

const setGlContext = (gl: WebGL2RenderingContext): void => {
  glContext = gl;
};
const buildObjects = (): void => {
  let shapeCount: number = 1;
  let sidesCount: number = 0;
  while (shapeCount > 0) {
    shapeCount -= 1;
    sidesCount = Math.floor(Math.random() * 9 + 3);
    let pgem =  new PipelineGeometry({gl: glContext})
    pgem.setCamera("identity");
    pgem.setOutput(0);
    addPolygonToPipelineGeometry(pgem, sidesCount, true, pickRandomColor(), pickRandomColor(), Math.random() / 100.0)
    // addStretchCoordinatesToPipelineGeometry(pgem, twgl.v3.create(1, 1, 1));
    addWiggleVertexToPipelineGeometry(pgem, -0.5, 0.01);
    renderObjs.push(pgem);
  }
};

const buildCameras = (): void => {
  createPerspectiveCamera(
    "front-perspective",
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
  createPerspectiveCamera(
    "left-perspective",
    twgl.v3.create(-0.6, 0, -1),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 1, 0),
    {
      aspect: 1,
      far: 1000,
      near: 0.1,
      fov: 70,
    }
  );
  createPerspectiveCamera(
    "right-perspective",
    twgl.v3.create(0.6, 0, -3),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 1, 0),
    {
      aspect: 1,
      far: 1000,
      near: 0.1,
      fov: 70,
    }
  );
  createPerspectiveCamera(
    "top-perspective",
    twgl.v3.create(0, 1, -1),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 0, -1),
    {
      aspect: 1,
      far: 1000,
      near: 0.1,
      fov: 90,
    }
  );
  createPerspectiveCamera(
    "bottom-perspective",
    twgl.v3.create(0, -1, -1),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 0, 1),
    {
      aspect: 1,
      far: 1000,
      near: 0.1,
      fov: 90,
    }
  );

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
  //cameras.push('front-perspective', 'left-perspective', 'right-perspective', 'top-perspective', 'bottom-perspective', 'mobile-perspective');
  cameras.push("mobile-perspective");
};

let counter = 0;
let counterRefresh = 0;
let rotateDirection = 1;
const updateObjects = (time: number): void => {
  const persp = getCamera("mobile-perspective");
  twgl.m4.rotateY(persp!.u_camera,  rotateDirection * Math.PI / 180 / 30, persp!.u_camera);
  // console.log(persp?.u_camera);
  /*const t = time / 1000;
  persp!.u_camera = twgl.m4.inverse(
    twgl.m4.lookAt(
      twgl.v3.create(Math.cos(t) * 3, 0, Math.sin(t) * 3),
      twgl.v3.create(0, 0, 0),
      twgl.v3.create(0, 1, 0)
    )
  );*/
  for (let obj of renderObjs) {
    let s = obj as PipelineGeometry;
    // s.fsCalls[0].arg1[0] = Math.random() / 20.0;
    // deform object
    const fact = 1 / (1000 * 3.14);
    let x = Math.sin(time * fact);
    let y = Math.cos(time * fact) * Math.sin(time * fact);
    let z = 1;
    if (x < 0.01 && x > 0) {
      x = 0.01
    } else if (x > -0.01 && x < 0) {
      x = -0.01;
    }
    if (y < 0.01 && y > 0) {
      y = 0.01
    } else if (y > -0.01 && y < 0) {
      y = -0.01;
    }
    if (z < 0.01 && z > 0) {
      z = 0.01
    } else if (z > -0.01 && z < 0) {
      z = -0.01;
    }
    // s.vsCalls[1].arg1[0] = x
    // s.vsCalls[1].arg1[1] = y
    // s.vsCalls[1].arg1[2] = z
  }
  if (time < counter) {
    return;
  }

  if (time < counterRefresh) {
    return;
  }
  let r = Math.random() - 0.5;
  r = r / Math.abs(r);
  rotateDirection = r;
  counterRefresh += 150;
  for (let obj of renderObjs) {
    let s = obj as PipelineGeometry;
    let sidesCount = Math.floor(Math.random() * 5 + 3);
    s.vsCalls[0].arg1[0] = sidesCount;

  }
  counter += 1000;
  const outputs = Outputs.getOutputs(glContext);
  const nextCam = pickRandomElement<string>(cameras);
  outputs.setCamera(0, nextCam);
  console.log(`Camera: ${nextCam}`);
};

const Scene: SceneType = {
  setGLContext: setGlContext,
  buildCameras: buildCameras,
  buildObjects: buildObjects,
  updateObjects: updateObjects,
  renderObjs: renderObjs,
};

export { Scene };
