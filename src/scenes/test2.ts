import { Shapes } from "../prims/Shapes";
import { LengthArray, RenderableType, SceneType } from "../utils/baseTypes";
import {
  createCamera,
  createOrthographicCamera,
  createPerspectiveCamera,
  getCamera,
} from "../utils/gl";
import { Outputs } from "../output/Outputs";
import * as twgl from "twgl.js";
import { pickRandomElement, polarRandom } from "../utils/misc";
import { pickRandomColor, Color, DarkRed, Yellow } from "../utils/colors";
import {
  PipelineGeometry,
  addColorModulatorToPipelineGeometry,
  addPolygonToPipelineGeometry,
  addStretchCoordinatesToPipelineGeometry,
  addWiggleVertexToPipelineGeometry,
} from "../prims/PipelineGeometry";
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
    let pgem = new PipelineGeometry({ gl: glContext });
    pgem.setCamera("identity");
    pgem.setOutput(0);
    addPolygonToPipelineGeometry(
      pgem,
      sidesCount,
      true,
      DarkRed,
      Yellow,
      0.01,
    );
    /*addStretchCoordinatesToPipelineGeometry(pgem, twgl.v3.create(1, 0.5, 0.5));
    addWiggleVertexToPipelineGeometry(pgem, -0.5, 0.005);*/
    // multiply colors by a cosine normalized wave (but do not clamp result)
    addColorModulatorToPipelineGeometry(pgem, {
      amplitude: .1,
      multiply: true,
      offset: 0.9,
      period: 1200,
      phase: 0.5,
      type: "SINE",
      noClamping: true,
    }, {
      r: false,
      g: true,
      b: true,
    })
    // modulate this by a fast sine wave
    addColorModulatorToPipelineGeometry(pgem, {
      amplitude: .05,
      multiply: true,
      offset: 0.95,
      phase: 0.,
      period: 1.,
      type: "SINE",
      noClamping: true,
    }, {
      r: false,
      g: true,
      b: true,
    }) 
    // blink color intensity with a 75% duty cycle square wavefor all color channels and do clamp
    /*addColorModulatorToPipelineGeometry(pgem, {
      amplitude: 1.,
      multiply: false,
      offset: -0.5,
      period: 2000,
      phase: 0.5,
      dutyCycle: 0.25,
      type: "SQUARE"
    }, {
      r: true,
      g: true,
      b: true,
    })*/
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

const updateObjects = (time: number): void => {
  const outputs = Outputs.getOutputs(glContext);
  outputs.setCamera(0, "mobile-perspective");
};

const launchAsyncHandler = (): void => {
  // changeColor(3000);
  changeSideCount(3000);
  // changeCamera(10);
  // changeProportions(1);
};

const delay = (n: number): Promise<void> => {
  return new Promise<void>((resolve) => setTimeout(resolve, n));
};

const changeCamera = async (
  period: number,
  stepY?: number,
  maxAmountY?: number,
  stepX?: number,
  maxAmountX?: number,
  stepZ?: number,
  maxAmountZ?: number
) => {
  if (stepY === undefined) {
    stepY = 0.01;
  }
  if (maxAmountY === undefined) {
    maxAmountY = Math.PI / 3.0;
  }
  if (stepX === undefined) {
    stepX = 0.005;
  }
  if (maxAmountX === undefined) {
    maxAmountX = Math.PI / 32.0;
  }
  if (stepZ === undefined) {
    stepZ = 0.008;
  }
  if (maxAmountZ === undefined) {
    maxAmountZ = Math.PI / 32.0;
  }
  const mob = getCamera("mobile-perspective")!;
  let accumY = 0;
  let accumX = 0;
  let accumZ = 0;
  while (true) {
    await delay(period);
    // rotate view
    twgl.m4.rotateY(mob.u_camera, stepY, mob.u_camera);
    accumY += stepY;
    if (Math.abs(accumY) >= maxAmountY) {
      stepY = -stepY;
    }
    // nod the cam head
    twgl.m4.rotateX(mob.u_camera, stepX, mob.u_camera);
    accumX += stepX;
    if (Math.abs(accumX) >= maxAmountX) {
      stepX = -stepX;
    }
    // bob the head a bit
    twgl.m4.rotateZ(mob.u_camera, stepZ, mob.u_camera);
    accumZ += stepZ;
    if (Math.abs(accumZ) >= maxAmountZ) {
      stepZ = -stepZ;
    }
  }
};
const changeColor = async (period: number) => {
  const geom = renderObjs[0] as PipelineGeometry;
  while (true) {
    await delay(period);
    /* const col = Color.fromArray(geom.fsCalls[0].arg3 as LengthArray<number, 4>);
    const coeffs = [0, polarRandom(0.2, 0.0), polarRandom(0.5, 0.0)];
    col.rotate(0, coeffs[1], coeffs[2]);
    geom.fsCalls[0].arg3 = col.toArray(); */
    geom.fsCalls[0].arg3 = pickRandomColor().toArray();
    geom.fsCalls[0].arg2 = pickRandomColor().toArray();
  }
};

const changeProportions = async (
  period: number,
  stepY?: number,
  maxAmountY?: number,
  stepX?: number,
  maxAmountX?: number,
  stepZ?: number,
  maxAmountZ?: number
): Promise<void> => {
  const geom = renderObjs[0] as PipelineGeometry;
  if (stepY === undefined) {
    stepY = 0.01;
  }
  if (maxAmountY === undefined) {
    maxAmountY = 0.3;
  }
  if (stepX === undefined) {
    stepX = 0.01;
  }
  if (maxAmountX === undefined) {
    maxAmountX = 0.3;
  }
  if (stepZ === undefined) {
    stepZ = 0.01;
  }
  if (maxAmountZ === undefined) {
    maxAmountZ = 0;
  }
  let accumX = 0;
  let accumY = 0;
  let accumZ = 0;
  while (true) {
    await delay(period);
    geom.vsCalls[1].arg1;
    accumX += stepX;
    accumY += stepY;
    accumZ += stepZ;
    if (Math.abs(accumX) >= maxAmountX) {
      stepX = -stepX;
    }
    if (Math.abs(accumY) >= maxAmountY) {
      stepY = -stepY;
    }
    if (Math.abs(accumZ) >= maxAmountZ) {
      stepZ -= stepZ;
    }
    geom.vsCalls[1].arg1[0] += stepX;
    geom.vsCalls[1].arg1[1] += stepY;
    geom.vsCalls[1].arg1[2] += stepZ;
  }
};

const changeSideCount = async (period: number) => {
  const geom = renderObjs[0] as PipelineGeometry;
  while (true) {
    await delay(period);
    geom.vsCalls[0].arg1[0] = Math.floor(Math.random() * 5) + 3;
  }
};

const Scene: SceneType = {
  setGLContext: setGlContext,
  buildCameras: buildCameras,
  buildObjects: buildObjects,
  updateObjects: updateObjects,
  launchAsyncHandlers: launchAsyncHandler,
  renderObjs: renderObjs,
};

export { Scene };
