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
import { FunctionCall, FunctionCallsArray, FunctionCallType } from "./FunctionCall";

type MAX_CALLS_PER_PIPELINE = 16;
const MAX_CALLS_PER_PIPELINE = 16;
const UNITY_QUAD = [-1, -1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0];

interface PipelineGeometryParameters {
  vertexShaderCalls?: LengthArray<FunctionCall, MAX_CALLS_PER_PIPELINE>;
  fragmentShaderCalls?: LengthArray<FunctionCall, MAX_CALLS_PER_PIPELINE>;
  drawFunction?: DrawFunctionTypes;
  drawCallback?: DrawCallbackType | undefined;
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
      this.setDrawFunction(
        this.parameters.drawFunction,
        this.parameters.drawCallback
      );
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
      u_check_parameters: AppState.debugShaders(time),
      f_vert_pipeline: this.vsCalls.toBasic(),
      f_frag_pipeline: this.fsCalls.toBasic(),
    };
    twgl.setUniforms(this.programInfo, uniforms);

    this.outputManager.push(this.output);
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

  drawQuad(): void {}
}

// vertex shader constants

const GENERATE_POLYGON = 1;
const STRETCH_COORDINATES = 2;
const WIGGLE_VERTEX = 3;
const MODULATE_VERTEX = 4;
const OFFSET_COORDINATES = 5;

// fragment shader constants
const COLOR_POLYGON = 1;
const MODULATE_COLOR = 2;

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
    flags: renderCenter ? 0b1 : 0b0,
    arg1: [sides, AppState.appHeight / AppState.appWidth],
    arg2: [],
    arg3: [],
  });

  const fcall_frag: FunctionCall = new FunctionCall({
    f_id: COLOR_POLYGON,
    flags: 0,
    arg1: [edgeSize],
    arg2: edgeColor.toArray(),
    arg3: fillColor.toArray(),
  });
  const drawCb: DrawCallbackType = (
    gl: WebGL2RenderingContext,
    ctx: PipelineGeometry
  ): void => {
    // console.log(ctx.programInfo.uniformSetters)
    gl.disable(gl.STENCIL_TEST);
    twgl.drawBufferInfo(
      gl,
      ctx.bufferInfo,
      gl.TRIANGLES,
      fcall_vert.arg1[0] * 3,
      0
    );
    gl.enable(gl.STENCIL_TEST);

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
  const fcall_vert = new FunctionCall({
    f_id: STRETCH_COORDINATES,
    arg1: [...factors.values(), 1],
    arg2: [],
    arg3: [],
    flags: 0,
  });
  return p.addVSCall(fcall_vert);
}

function addOffsetCoordinatesToPipelineGeometry(
  p: PipelineGeometry,
  factors: twgl.v3.Vec3
): boolean {
  const fcall_vert = new FunctionCall({
    f_id: OFFSET_COORDINATES,
    arg1: [...factors.values(), 0],
    arg2: [],
    arg3: [],
    flags: 0,
  });
  return p.addVSCall(fcall_vert);
}

function addWiggleVertexToPipelineGeometry(
  p: PipelineGeometry,
  offset: number = -0.5,
  factor: number = 0.01
): boolean {
  const fcall_vert = new FunctionCall({
    f_id: WIGGLE_VERTEX,
    flags: 0,
    arg1: [factor, offset, 0, 0],
    arg2: [],
    arg3: [],
  });
  return p.addVSCall(fcall_vert);
}

type ModulationParameters = {
  type: "SINE" | "SQUARE" | "TRIANGLE";
  period: number;
  amplitude: number;
  offset: number;
  phase: number;
  dutyCycle?: number;
  multiply: boolean;
  noClamping?: boolean;
};

type ColorModulationTargets = {
  r?: boolean;
  g?: boolean;
  b?: boolean;
  a?: boolean;
};

type VertexModulationShaders = {
  x?: boolean;
  y?: boolean;
  z?: boolean;
  w?: boolean;
};
function addColorModulatorToPipelineGeometry(
  p: PipelineGeometry,
  parm: ModulationParameters,
  colorTargets: ColorModulationTargets
) {
  let fcall_frag = new FunctionCall({
    f_id: MODULATE_COLOR,
    flags: 0,
    arg1: [0.0, 0, 0, 0],
    arg2: [0.0, 0, 0, 0],
    arg3: [0.0, 0, 0, 0],
  } as unknown as FunctionCall);
  let flags = 0;

  const tg = [parm.period, parm.amplitude, parm.phase, parm.offset];
  fcall_frag.arg1 = tg;

  if (parm.type == "SQUARE") {
    fcall_frag.arg2[0] = parm.dutyCycle ?? 0.5;
  }
  switch(parm.type) {
    case "SINE":
      flags = 32;
      break;
    case "SQUARE":
      flags = 64;
      break;
    case "TRIANGLE":
      flags = 128;
      break;
  }
  if (parm.multiply) {
    flags |= 256;
  }
  if (parm.noClamping) {
    flags |= 512;
  }
  flags |= colorTargets.r ? 1 : 0;
  flags |= colorTargets.g ? 2 : 0;
  flags |= colorTargets.b ? 4 : 0;
  flags |= colorTargets.a ? 8 : 0;
  fcall_frag.flags = flags;
  return p.addFSCall(fcall_frag);
}

function addVertexModulatorToPipelineGeometry(
  p: PipelineGeometry,
  parm: ModulationParameters,
  colorTargets: VertexModulationShaders
) {
  let fcall_vert = new FunctionCall({
    f_id: MODULATE_VERTEX,
    flags: 0,
    arg1: [0.0, 0, 0, 0],
    arg2: [0.0, 0, 0, 0],
    arg3: [0.0, 0, 0, 0],
  });
  let flags = 0;

  const tg = [parm.period, parm.amplitude, parm.phase, parm.offset];
  fcall_vert.arg1 = tg;

  if (parm.type == "SQUARE") {
    fcall_vert.arg2[0] = parm.dutyCycle ?? 0.5;
  }
  switch(parm.type) {
    case "SINE":
      flags = 32;
      break;
    case "SQUARE":
      flags = 64;
      break;
    case "TRIANGLE":
      flags = 128;
      break;
  }
  if (parm.multiply) {
    flags |= 256;
  }
  if (!parm.noClamping) {
    flags |= 512;
  }
  flags |= colorTargets.x ? 1 : 0;
  flags |= colorTargets.y ? 2 : 0;
  flags |= colorTargets.z ? 4 : 0;
  flags |= colorTargets.w ? 8 : 0;
  fcall_vert.flags = flags;
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

export {
  PipelineGeometry,
  addPolygonToPipelineGeometry,
  addStretchCoordinatesToPipelineGeometry,
  addWiggleVertexToPipelineGeometry,
  addColorModulatorToPipelineGeometry,
  addVertexModulatorToPipelineGeometry,
  addOffsetCoordinatesToPipelineGeometry,
};
export type { PipelineGeometryParameters };
