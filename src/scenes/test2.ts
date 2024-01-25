import { Shapes } from "../prims/Shapes";
import { LengthArray, RenderableType, SceneType } from "../utils/baseTypes";
import {
  createCamera,
  createOrthocam2,
  createOrthographicCamera,
  createPerspectiveCamera,
  getCamera,
} from "../utils/gl";
import {
  CHANNEL_OFFSET,
  INVERT_COLORS,
  Outputs,
  addChannelOffsetToOutput,
  addInvertColorsToOutput,
} from "../output/Outputs";
import * as twgl from "twgl.js";
import { pickRandomElement, polarRandom } from "../utils/misc";
import { pickRandomColor, Color, DarkRed, PureWhite } from "../utils/colors";
import {
  PipelineGeometry,
  addColorModulatorToPipelineGeometry,
  addOffsetCoordinatesToPipelineGeometry,
  addPolygonToPipelineGeometry,
  addStretchCoordinatesToPipelineGeometry,
  addVertexModulatorToPipelineGeometry,
  addWiggleVertexToPipelineGeometry,
} from "../prims/PipelineGeometry";
import { AppState } from "../utils/appState";
const renderObjs: RenderableType[] = [];
const cameras: string[] = [];
let glContext: WebGL2RenderingContext;

const setGlContext = (gl: WebGL2RenderingContext): void => {
  glContext = gl;
};

const MOVE_AMOUNT = 0.5;
const buildObjects = (): void => {
  const outputs = Outputs.getOutputs(glContext);
  let shapeCount: number = 1;
  let sidesCount: number = 0;
  const out0 = outputs.getOutput(0);
  const out1 = outputs.getOutput(1);

  out0.setOutput(out1.ndx);
  out1.setOutput(null);
  while (shapeCount > 0) {
    shapeCount -= 1;
    sidesCount = 5;
    let pgem = new PipelineGeometry({ gl: glContext });
    pgem.setCamera("mobile-perspective");
    pgem.setOutput(0);
    addPolygonToPipelineGeometry(
      pgem,
      sidesCount,
      true,
      DarkRed,
      PureWhite,
      0.01,
      true
    );
    addStretchCoordinatesToPipelineGeometry(pgem, twgl.v3.create(0.8, 0.8, 1));
    addOffsetCoordinatesToPipelineGeometry(
      pgem,
      twgl.v3.create(0.125, -0.25, 0)
    );
    renderObjs.push(pgem);
    // outputs.debug();
  }
  addChannelOffsetToOutput(out1, {
    offsetChannels: {
      r: true,
      g: false,
      b: false,
      a: false,
    },
    blendMode: "SUB",
    moveAmount: MOVE_AMOUNT,
    substractOriginal: true,
    offsetDirection: [0.125, 0],
    multiplyMovement: false,
    circular: true,
  });
  addChannelOffsetToOutput(out1, {
    offsetChannels: {
      r: true,
      g: false,
      b: false,
      a: false,
    },
    blendMode: "SUB",
    moveAmount: MOVE_AMOUNT,
    substractOriginal: true,
    offsetDirection: [0.125, 0],
    multiplyMovement: false,
    circular: true,
  });

  addChannelOffsetToOutput(out1, {
    offsetChannels: {
      r: false,
      g: true,
      b: false,
      a: false,
    },
    blendMode: "ADD",
    moveAmount: MOVE_AMOUNT,
    substractOriginal: true,
    offsetDirection: [-1, 1],
    multiplyMovement: true,
    circular: true,
  });
  addChannelOffsetToOutput(out1, {
    offsetChannels: {
      r: false,
      g: false,
      b: true,
      a: false,
    },
    blendMode: "MUL",
    moveAmount: MOVE_AMOUNT,
    substractOriginal: true,
    offsetDirection: [1, -1],
    multiplyMovement: true,
    circular: true,
  });

  //addInvertColorsToOutput(out0);
  addInvertColorsToOutput(out1, {});
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
      fov: 100,
    }
  );

  createOrthocam2("orthographic-fixed");
  //cameras.push('front-perspective', 'left-perspective', 'right-perspective', 'top-perspective', 'bottom-perspective', 'mobile-perspective');
  cameras.push("mobile-perspective", "orthographic-fixed");
};

const updateObjects = (time: number): void => {
  const outputs = Outputs.getOutputs(glContext);
  //outputs.setCamera(3, "orthographic-fixed");
  //outputs.setCamera(2, "orthographic-fixed");
  outputs.setCamera(1, "orthographic-fixed");
  outputs.setCamera(0, "orthographic-fixed");
};

const delay = (n: number): Promise<void> => {
  return new Promise<void>((resolve) => setTimeout(resolve, n));
};

const changeSideCount = async (period: number) => {
  const geom = renderObjs[0] as PipelineGeometry;
  while (true) {
    await delay(period);
    geom.vsCalls[0].arg1[0] = Math.floor(Math.random() * 5) + 3;
  }
};

const launchAsyncHandler = (): void => {
  // changeColor(3000);
  // changeSideCount(3000);
  changeOffsets(10, 0.001, 0.001, 0.005, 0.5);
  changeInversion(1000);
  // changeCamera(10);
  // changeProportions(1);
};

const changeInversion = async (d: number) => {
  const out = Outputs.getOutputs(glContext).getOutput(1);
  const maskValues = {
    1: 0.1,
    2: 0.5,
    4: 0.5,
    8: 0.5,
    16: 0.2,
    32: 0.2,
    64: 0.2,
  };
  while (true) {
    await delay(d);
    for (let i = 0; i < out.fsCalls.length; i++) {
      const fc = out.fsCalls[i];
      if (fc.f_id !== INVERT_COLORS) {
        continue;
      }
      Object.entries(maskValues).forEach(([k, v]) => {
        if (Math.random() < v) {
          fc.flags = fc.flags | parseInt(k);
        } else {
          fc.flags = fc.flags & ~parseInt(k);
        }
      });
    }
  }
};

const randomMovementVector = (amplitude: number) => {
  const v = twgl.v3.create(Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
  twgl.v3.normalize(v, v);
  return twgl.v3.mulScalar(v, amplitude);
}

const randomMovement1D = (amplitude: number, offset: number) => {
  const v = twgl.v3.create(Math.random() * 2 - 1, 0, 0);
  twgl.v3.normalize(v, v);
  const toAdd = twgl.v3.create(offset, 0, 0);
  return twgl.v3.add(twgl.v3.mulScalar(v, amplitude), toAdd);
}

const changeOffsets = async (
  d: number,
  changeAmt: number,
  amplitude: number,
  largeChP: number,
  largeChS: number,
) => {
  const out = Outputs.getOutputs(glContext).getOutput(1);
  let originCoordinates: twgl.v3.Vec3[] = [];
  for (let i = 0; i < out.fsCalls.length; i++) {
    originCoordinates[i] = twgl.v3.create(...out.fsCalls[i].arg1.slice(0, 3));
  }
  let accum = 0;
  const amplitudeChange = 0.0;
  while (true) {
    await delay(d);
    amplitude += amplitudeChange;
    for (let i = 0; i < out.fsCalls.length; i++) {
      const fc = out.fsCalls[i];
      if (fc.f_id != CHANNEL_OFFSET) {
        continue;
      }
      if (Math.random() < largeChP) {
        originCoordinates[i] = randomMovementVector(largeChS);
      }
      // channel offset
      accum += changeAmt;
      fc.arg1 = [...twgl.v3.add(randomMovementVector(amplitude), originCoordinates[i]), 0];
      fc.arg2 = [...randomMovement1D(accum / 1000, fc.arg2[0]), 0];
    }
  }
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

const Scene: SceneType = {
  setGLContext: setGlContext,
  buildCameras: buildCameras,
  buildObjects: buildObjects,
  updateObjects: updateObjects,
  launchAsyncHandlers: launchAsyncHandler,
  renderObjs: renderObjs,
};

export { Scene };
