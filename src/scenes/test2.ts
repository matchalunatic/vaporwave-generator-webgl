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
import { pickRandomColor, Color } from "../utils/colors";
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
    addStretchCoordinatesToPipelineGeometry(pgem, twgl.v3.create(1, 0.5, 0.5));
    addWiggleVertexToPipelineGeometry(pgem, -0.5, 0.005);
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

let changeSideCountHandler: number = -1;
let changeColorHandler: number = -1;
const updateObjects = (time: number): void => {
  const outputs = Outputs.getOutputs(glContext);
  outputs.setCamera(0, "mobile-perspective");
};

const launchAsyncHandler = (): void => {
  changeColor(100);
  changeSideCount(3000);
  changeCamera(10);
}

const delay = (n: number): Promise<void> => {
  return new Promise<void>( resolve => setTimeout(resolve, n));
}

const changeCamera = async(period: number, stepY?: number, maxAmountY?: number, stepX?: number, maxAmountX?: number, stepZ?: number, maxAmountZ?: number) => {
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
    maxAmountZ = Math.PI / 32.0
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
      stepZ = - stepZ;
    }
  }
  
}
const changeColor = async (period: number) => {
  const geom = renderObjs[0] as PipelineGeometry;
  while (true) {
    await delay(period);
    const col = Color.fromArray(geom.fsCalls[0].arg3 as LengthArray<number, 4>);
    const coeffs = [0, polarRandom(0.2, 0.0), polarRandom(0.5, 0.0)];
    col.rotate(0, coeffs[1], coeffs[2]);
    geom.fsCalls[0].arg3 = col.toArray();    
  }  
}
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
