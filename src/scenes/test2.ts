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
  if (changeColorHandler === -1) {
    changeColor();
  }
  if (changeSideCountHandler === -1) {
    changeSideCount(3000);
  }
};

const delay = (n: number): Promise<void> => {
  return new Promise<void>( resolve => setTimeout(resolve, n));
}

const changeColor = async () => {
  const geom = renderObjs[0] as PipelineGeometry;
  while (true) {
    await delay(10);
    const col = Color.fromArray(geom.fsCalls[0].arg3 as LengthArray<number, 4>);
    const coeffs = [0, polarRandom(0.2, 0.0), polarRandom(0.5, 0.0)];
    col.rotate(0, coeffs[1], coeffs[2]);
    geom.fsCalls[0].arg3 = col.toArray();
    
  }  
}
const changeSideCount = (delay: number): void => {
  const geom = renderObjs[0] as PipelineGeometry;
  geom.vsCalls[0].arg1[0] = Math.floor(Math.random() * 12) + 3;
  console.log("change side count", delay, geom.vsCalls[0].arg1[0])
  changeSideCountHandler = setTimeout(() => changeSideCount(delay), delay);
};

const Scene: SceneType = {
  setGLContext: setGlContext,
  buildCameras: buildCameras,
  buildObjects: buildObjects,
  updateObjects: updateObjects,
  renderObjs: renderObjs,
};

export { Scene };
