import vs_Library from "../shaders/library.vert?raw";
import fs_Library from "../shaders/library.frag?raw";
import * as twgl from "twgl.js";
import { Outputs } from "../output/Outputs";
import {
  CameraSubjectPrimitive,
  LengthArray,
  OutputtablePrimitive,
  TransformablePrimitive,
  RenderableType,
  Vector4,
} from "../utils/baseTypes";
import { applyMixins } from "../utils/misc";
import { AppState } from "../utils/appState";
import { Color, pickRandomColor } from "../utils/colors";

type MAX_CALLS_PER_PIPELINE = 16;
const MAX_CALLS_PER_PIPELINE = 16;
const UNITY_QUAD = [
 -1, -1, 0,
 -1,  1, 0,
  1,  1, 0,
  1,  1, 0,
 -1, -1, 0,
  1, -1, 0,
];

interface FunctionCall {
  f_id: number;
  flags: number;
  arg1: Array<number>;
  arg2: Array<number>;
  arg3: Array<number>;
}

class FunctionCallsArray extends Array<FunctionCall> {
  toBasic() {
    let out = [];
    for (let v of this) {
      out.push(v);
    }
    return out;
  }
}
type FunctionCallType = FunctionCall;
class FunctionCall {
  constructor(p: FunctionCallType) {
    this.f_id = p.f_id;
    this.flags = p.flags;
    this.arg1 = Array<number>(4);
    this.arg2 = Array<number>(4);
    this.arg3 = Array<number>(4);
    for (let i = 0; i < 4; i++) {
      if (p.arg1.length > i) {
        this.arg1[i] = p.arg1[i];
      }
      if (p.arg2.length > i) {
        this.arg2[i] = p.arg2[i];
      }
      if (p.arg3.length > i) {
        this.arg3[i] = p.arg3[i];
      }
    }
  }
  toBasic() {
    this.arg1.length = 4;
    this.arg2.length = 4;
    this.arg3.length = 4;
    return {
      f_id: this.f_id,
      flags: this.flags,
      arg1: this.arg1,
      arg2: this.arg2,
      arg3: this.arg3,
    };
  }
}

interface PipelineGeometryParameters {
  vertexShaderCalls?: LengthArray<FunctionCall, MAX_CALLS_PER_PIPELINE>;
  fragmentShaderCalls?: LengthArray<FunctionCall, MAX_CALLS_PER_PIPELINE>;
  drawFunction?: DrawFunctionTypes,
  drawCallback?: DrawCallbackType|undefined,
  gl: WebGL2RenderingContext;
}

type DrawFunctionTypes = "QUAD" | "CUSTOM";
type DrawCallbackType = (
  gl: WebGL2RenderingContext,
  ctx: PipelineGeometry
) => void;
class PipelineGeometry implements RenderableType {
  private parameters: PipelineGeometryParameters;
  programInfo: twgl.ProgramInfo;
  bufferInfo: twgl.BufferInfo;
  private drawFunction: DrawFunctionTypes = "QUAD";
  vsCalls: FunctionCallsArray;
  fsCalls: FunctionCallsArray;
  private drawCb?: DrawCallbackType;
  constructor(p: PipelineGeometryParameters) {
    this.parameters = p;
    this.vsCalls = new FunctionCallsArray(
      ...(this.parameters.vertexShaderCalls ?? [])
    );
    this.fsCalls = new FunctionCallsArray(
      ...(this.parameters.fragmentShaderCalls ?? [])
    );

    this.initializeOutputtable(Outputs.getOutputs(this.parameters.gl));
    if (this.parameters.drawFunction) {
      this.setDrawFunction(this.parameters.drawFunction, this.parameters.drawCallback)
    }
    this.programInfo = twgl.createProgramInfo(this.parameters.gl, [
      vs_Library,
      fs_Library,
    ]);
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.parameters.gl, {
      dummy: [0, 0, 0],
    });
  }

  setDrawFunction(t: DrawFunctionTypes, callback?: DrawCallbackType) {
    this.drawFunction = t;
    if (t === "CUSTOM" && callback === undefined) {
      throw Error(
        "setDrawFunction(CUSTOM) must be called with a valid callback"
      );
    }
    this.drawCb = callback;
  
  if (t === "QUAD") {
    // prepare buffer info
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.parameters.gl, {
      a_position: {
        numComponents: 3,
        data: UNITY_QUAD,
      },
      a_texcoord: {
        numComponents: 3,
        data: UNITY_QUAD,
      },
    });

  }
}
  private addCall(
    tgt: "vs" | "fs",
    f: FunctionCall,
    position: number | undefined
  ): boolean {
    const target = tgt === "vs" ? this.vsCalls : this.fsCalls;
    if (position && (position < 0 || position > 15)) {
      throw Error("Incorrect position requested");
    } else if (position) {
      target[position] = f;
    }
    if (target.length > MAX_CALLS_PER_PIPELINE) {
      console.error("Cannot add call to stack, too mny");
      return false;
    }
    target.push(f);
    return true;
  }

  addVSCall(f: FunctionCall, position?: number): boolean {
    return this.addCall("vs", f, position);
  }
  addFSCall(f: FunctionCall, position?: number): boolean {
    return this.addCall("fs", f, position);
  }

  render(time: number): void {
    if (!this.outputIsInitialized()) {
      throw Error("Outputs are not intialized, exiting");
    }
    this.parameters.gl.useProgram(this.programInfo.program);
    this.outputManager.push(this.output);
    twgl.setBuffersAndAttributes(
      this.parameters.gl,
      this.programInfo,
      this.bufferInfo
    );
    // now set uniforms based on our programmed calls
    const uniforms = {
      u_time: time,
      u_model: this.u_model ?? twgl.m4.identity(),
      u_camera: this.cameraHolder.u_camera,
      u_projection: this.cameraHolder.u_projection,
      f_vert_pipeline: this.vsCalls.toBasic(),
      f_frag_pipeline: this.fsCalls.toBasic(),
    };
    twgl.setUniforms(this.programInfo, uniforms);

    this.draw();
    this.outputManager.pop();
  }

  draw(): void {
    // does the actual drawing
    switch (this.drawFunction) {
      case "QUAD":
        this.drawQuad();
        break;
      case "CUSTOM":
        if (this.drawCb === undefined) {
          throw Error("custom draw but no callback defined");
        }
        this.drawCb.call(this, this.parameters.gl, this);
        break;
    }
  }

  drawQuad(): void {
  }
}

// vertex shader constants

const GENERATE_POLYGON = 1;
const STRETCH_COORDINATES = 2;
const WIGGLE_VERTEX = 3;

// fragment shader constants
const COLOR_POLYGON = 1;

function addPolygonToPipelineGeometry(
  p: PipelineGeometry,
  sides: number = 3,
  renderCenter: boolean,
  edgeColor: Color,
  fillColor: Color,
  edgeSize: number
): boolean {
  const fcall_vert: FunctionCall = new FunctionCall({
    f_id: GENERATE_POLYGON,
    flags: 0b1,
    arg1: [sides],
    arg2: [],
    arg3: [],
  } as unknown as FunctionCallType);

  const fcall_frag: FunctionCall = new FunctionCall({
    f_id: COLOR_POLYGON,
    flags: 0,
    arg1: [edgeSize],
    arg2: edgeColor.toArray(),
    arg3: fillColor.toArray(),
  } as unknown as FunctionCallType);
  const drawCb: DrawCallbackType = (
    gl: WebGL2RenderingContext,
    ctx: PipelineGeometry
  ): void => {
    // console.log(ctx.programInfo.uniformSetters)
    twgl.drawBufferInfo(gl, ctx.bufferInfo, gl.TRIANGLES, sides * 3, 0);
  };
  let res = true;
  res = res && p.addVSCall(fcall_vert);
  res = res && p.addFSCall(fcall_frag);
  p.setDrawFunction("CUSTOM", drawCb);
  return res;
}

function addStretchCoordinatesToPipelineGeometry(
  p: PipelineGeometry,
  factors: twgl.v3.Vec3
): boolean {
  const fcall_vert = {
    f_id: STRETCH_COORDINATES,
    arg1: [...factors.values(), 1],
    arg2: [],
    arg3: [],
    flags: 0,
  } as unknown as FunctionCall;
  console.log(fcall_vert);
  return p.addVSCall(fcall_vert);
}

function addWiggleVertexToPipelineGeometry(
  p: PipelineGeometry,
  offset: number = -0.5,
  factor: number = 0.01
): boolean {
  const fcall_vert = {
    f_id: WIGGLE_VERTEX,
    arg1: [factor, offset, 0, 0],
    arg2: [],
    arg3: [],
  } as unknown as FunctionCall;
  return p.addVSCall(fcall_vert);
}
interface PipelineGeometry
  extends CameraSubjectPrimitive,
    TransformablePrimitive,
    OutputtablePrimitive {}
applyMixins(PipelineGeometry, [
  CameraSubjectPrimitive,
  TransformablePrimitive,
  OutputtablePrimitive,
]);

console.log(PipelineGeometry);
export {
  PipelineGeometry,
  addPolygonToPipelineGeometry,
  addStretchCoordinatesToPipelineGeometry,
  addWiggleVertexToPipelineGeometry,
};
export type { PipelineGeometryParameters };
