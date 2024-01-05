import vs_Shapes from "./Shapes.vert?raw";
import fs_Shapes from "./Shapes.frag?raw";
import * as twgl from "twgl.js";
import { Outputs } from "../output/Outputs";
import { OutputtablePrimitive, RenderableType, Vector4 } from "../utils/baseTypes";
import {
  DefaultLookMatricesHolder,
  LookMatricesHolder,
  TransformableModel,
  getCamera,
} from "../utils/gl";
import { AppState } from "../utils/appState";

interface ShapesParameters {
  initialSidesCount?: number;
  renderEdges?: boolean;
  renderTriangles?: boolean;
  fill?: boolean;
  edgeColor?: Vector4;
  fillColor?: Vector4;
  initialCamera?: string;
}

const defaultShapesParameters: ShapesParameters = {
  initialSidesCount: 3,
  renderEdges: true,
  renderTriangles: false,
  fill: true,
  edgeColor: new Vector4(0, 0.58, 0.86, 1),
  fillColor: new Vector4(1, 0.42, 0.14, 0.5),
  initialCamera: "default",
};

const disableCenterVec3 = [1.0, 1.0, 1.0];
const enableCenterVec3 = [0.0, 0.0, 1.0];

class Shapes extends OutputtablePrimitive implements TransformableModel, RenderableType {
  private gl: WebGL2RenderingContext;
  private programInfo: twgl.ProgramInfo;
  private bufferInfo: twgl.BufferInfo;
  private uniforms: Record<string, any>;
  parameters: ShapesParameters;
  sidesCount: number;
  newSidesCount: number;
  u_model: twgl.m4.Mat4;
  cameraHolder: LookMatricesHolder;

  setCamera(cam: LookMatricesHolder | string): boolean {
    if (typeof cam === "string") {
      const goodCam = getCamera(cam);
      if (!goodCam) {
        throw Error(`tried to set bad camera ${cam} on ${this}`);
      }
      this.cameraHolder = goodCam;
    } else {
      this.cameraHolder = cam;
    }
    return true;
  }

  setSideCount = (n: number) => {
    if (n >= 3) {
      this.newSidesCount = Math.floor(n);
    }
  };

  constructor(gl: WebGL2RenderingContext, params?: ShapesParameters) {
    super(Outputs.getOutputs(gl));
    this.gl = gl;
    if (!params) {
      this.parameters = Object.assign({}, defaultShapesParameters);
    } else {
      this.parameters = Object.assign({}, defaultShapesParameters, params);
    }
    this.sidesCount = 3;
    this.newSidesCount = 3;
    this.setSideCount(this.sidesCount);
    this.uniforms = new Map<string, any>();
    this.programInfo = twgl.createProgramInfo(this.gl, [vs_Shapes, fs_Shapes]);
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, {
      dummy: [0, 0, 0],
    });
    this.u_model = twgl.m4.identity();
    this.cameraHolder =
      getCamera(this.parameters.initialCamera ?? "default") ??
      DefaultLookMatricesHolder;
  }

  render = (time: number) => {
    this.sidesCount = this.newSidesCount;
    this.gl.useProgram(this.programInfo.program);
    this.outputManager.push(this.output);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
    const ec = this.parameters.edgeColor;
    const fc = this.parameters.fillColor;
    let ecA = ec!.toArray();
    let fcA = fc!.toArray();
    if (!this.parameters.renderEdges) {
      ecA[3] = 0;
    }
    if (!this.parameters.fill) {
      fcA[3] = 0;
    }
    twgl.setUniforms(
      this.programInfo,
      Object.assign(this.uniforms, {
        u_sides: this.sidesCount,
        u_time: time,
        u_edgeColor: ecA,
        u_fillColor: fcA,
        u_centerBary: this.parameters.renderTriangles
          ? enableCenterVec3
          : disableCenterVec3,
        u_camera: this.cameraHolder.u_camera,
        u_projection: this.cameraHolder.u_projection,
        u_model: this.u_model,
        u_aspectRatio: AppState.appHeight / AppState.appWidth,
      })
    );
    twgl.drawBufferInfo(
      this.gl,
      this.bufferInfo,
      this.gl.TRIANGLES,
      this.sidesCount * 3,
      0
    );
    this.outputManager.pop();
  };
}

export { Shapes };
export type { ShapesParameters };
