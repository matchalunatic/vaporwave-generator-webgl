import vs from "./Outputs.vert?raw";
import fs from "./Outputs.frag?raw";
import * as twgl from "twgl.js";
import { LengthArray, Vector4 } from "../utils/baseTypes";
import {
  LookMatricesHolder,
  getCamera,
  DefaultLookMatricesHolder,
} from "../utils/gl";
import { TransformablePrimitive } from "../utils/baseTypes";
import { AppState } from "../utils/appState";
import { AllColors, pickRandomColor } from "../utils/colors";
import { TransparentZero } from "../utils/colors";
import { applyMixins } from "../utils/misc";
import {
  FunctionCall,
  FunctionCallsArray,
  MAX_CALLS_PER_PIPELINE,
} from "../prims/FunctionCall";
let outputInstance: Outputs | null = null;

type valid_fb_non_null =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;
const MAX_SCREEN_COUNT = 16;
type valid_fb = valid_fb_non_null | null;

interface OutputParameters {
  clear?: boolean;
  clearColor?: Vector4;
  transformParams?: twgl.m4.Mat4;
  showBorders?: boolean;
}

interface RenderParameters {
  clear: boolean;
  clearColor: Vector4;
  transformParams: twgl.m4.Mat4;
  showBorders: boolean;
}

interface OutputClient {
  setOutput(n: valid_fb): void;
}

const DefaultOutputParameters: RenderParameters = {
  clear: true,
  clearColor: new Vector4(0, 0, 0, 0),
  transformParams: twgl.m4.identity(),
  showBorders: false,
};

// const UNITY_QUAD = [-1, -1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1];
const UNITY_QUAD = [
  //  -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, -1,
  [-1, -1, 0], // A
  [-1, 1, 0], // B
  [1, 1, 0], // C
  [1, 1, 0], // C
  [-1, -1, 0], // A
  [1, -1, 0], // D
];

const positionsArray: twgl.Arrays = {
  a_position: {
    numComponents: 3,
    data: UNITY_QUAD.flat(),
  },
  a_texcoord: {
    numComponents: 3,
    data: UNITY_QUAD.flat(),
  },
};

class Outputs {
  gl: WebGL2RenderingContext;
  outs: BufferedOutput[];
  outputStack: Array<valid_fb>;
  outputCount: number;
  renderParams: RenderParameters;
  registeredObjects: Array<number>;
  private programInfoBuilder: () => twgl.ProgramInfo;
  private bufferInfoBuilder: () => twgl.BufferInfo;

  private constructor(gl: WebGL2RenderingContext, params?: OutputParameters) {
    this.gl = gl;
    this.programInfoBuilder = () => {
      return twgl.createProgramInfo(this.gl, [vs, fs]);
    };
    this.bufferInfoBuilder = () => {
      return twgl.createBufferInfoFromArrays(this.gl, positionsArray);
    };
    this.renderParams = Object.assign(
      {},
      DefaultOutputParameters,
      params ?? {}
    );
    this.outputCount = 0;
    this.outs = [];
    this.registeredObjects = [];
    for (let i = 0; i < 8; i++) {
      const col1 = AllColors[i].toArray();
      const col2 = AllColors[i].toArray();
      if (!this.createOutput(this.renderParams.showBorders, col1, col2)) {
        console.error(`Could not create framebuffer ${i}`);
      }
      this.registeredObjects[i] = 0;
    }
    this.outputStack = [];
    this.push(null);
  }

  public createOutput = (
    displayBorders?: boolean,
    xBorderColor?: Array<number>,
    yBorderColor?: Array<number>
  ): boolean => {
    if (this.outputCount >= MAX_SCREEN_COUNT) {
      return false;
    }
    let out = new BufferedOutput(
      this.gl,
      this.renderParams,
      this.programInfoBuilder(),
      this.bufferInfoBuilder(),
      this.outputCount as valid_fb_non_null
    );
    if (displayBorders === true) {
      out.xBorderColor = xBorderColor ?? out.xBorderColor;
      out.yBorderColor = yBorderColor ?? out.yBorderColor;
    } else {
      out.xBorderColor = new Array<number>(1, 0, 0, 0);
      out.yBorderColor = out.xBorderColor;
      // console.log("no borders")
    }
    this.outputCount = this.outs.push(out);
    // console.log(`Created new output. Now have ${this.outputCount} outputs.`);
    return true;
  };

  public bindOutput = (n: valid_fb): boolean => {
    if (n !== null) {
      this.outs[n].bind();
    } else {
      twgl.bindFramebufferInfo(this.gl, null);
    }
    return true;
  };

  public push = (n: valid_fb): boolean => {
    if (this.bindOutput(n)) {
      this.outputStack.push(n);
      return true;
    }
    console.error(`Could not push fb ${n}`);
    return false;
  };

  public pop = () => {
    const nval = this.outputStack.pop();
    if (nval === undefined) {
      this.bindOutput(null);
      return false;
    }

    this.bindOutput(this.outputStack[this.outputStack.length - 1]);
    return true;
  };
  // render a given framebuffer to the current framebuffer
  public renderOne = (n: valid_fb_non_null): void => {
    this.outs[n].render();
  };

  public render = (): void => {
    // first pass: render
    const directOuts = this.outs.filter((v: BufferedOutput) => {
      return v.targetOutput === null;
    });
    const indirectOuts = this.outs.filter((v: BufferedOutput) => {
      return v.targetOutput !== null;
    });
    /*
    // identify the right order for rendering outputs
    let renderingOrder: valid_fb_non_null[] = [];

    const insertO = (o: BufferedOutput): void => {
      if (renderingOrder.includes(o.ndx)) {
        return;
      } else if (o.targetOutput === null && !renderingOrder.includes(o.ndx)) {
        renderingOrder.push(o.ndx);
      } else if (o.targetOutput !== null && !renderingOrder.includes(o.targetOutput)) {
        // add the target output with insertO and then this one
        insertO(this.outs[o.targetOutput]);
        const tgtIdx = renderingOrder.indexOf(o.targetOutput);
        renderingOrder.splice(tgtIdx, 0, o.ndx);
      } else if (o.targetOutput !== null) {
        const tgtIdx = renderingOrder.indexOf(o.targetOutput);
        renderingOrder.splice(tgtIdx, 0, o.ndx);
      } else {
        console.log("heeee")
      }
    };
    for (let o of this.outs) {
      if (this.registeredObjects[o.ndx] === 0) {
        continue;
      }
      insertO(o);
    }

    for (const ndx of renderingOrder) {
      const out = this.getOutput(ndx);
      if (this.registeredObjects[ndx] === 0) {
        continue;
      }
      if (!this.push(out.targetOutput)) {
        throw new Error("Could not push target output");
      }
      out.render();
      this.pop();
    }
    */
    const renderOrder = [indirectOuts, directOuts];
    let rendered: valid_fb_non_null[] = [];
    const subren = (o: BufferedOutput): void => {
      if (this.registeredObjects[o.ndx] === 0 || o.ndx in rendered) {
        // do not render anything with no registered object
        return;
      }

      if (!this.push(o.targetOutput)) {
        throw Error("Could not push target output");
      }
      const ar = o.targetOutput === null;
      o.render(ar);
      rendered.push(o.ndx);
      this.pop();
    };
    for (const ocol of renderOrder) {
      for (let i = 0; i < ocol.length; i++) {
        const o = ocol[i];
        subren(o);
      }
    }
  };

  public wrapRender = (): void => {
    // second pass: clear
    const directOuts = this.outs.filter((v: BufferedOutput) => {
      return v.targetOutput === null;
    });
    const indirectOuts = this.outs.filter((v: BufferedOutput) => {
      return v.targetOutput !== null;
    });
    // first, clear indirect outputs, then direct ons
    for (let ocol of [directOuts, indirectOuts]) {
      for (let outie of ocol) {
        if (this.push(outie.ndx)) {
          const cc = outie.params.clearColor;
          this.gl.clearColor(cc.x, cc.y, cc.z, cc.a);
          this.gl.clear(
            this.gl.COLOR_BUFFER_BIT |
              this.gl.DEPTH_BUFFER_BIT |
              this.gl.STENCIL_BUFFER_BIT
          );
          this.pop();
        }
      }
    }
  };

  public getOutput = (n: valid_fb_non_null): BufferedOutput => {
    return this.outs[n];
  };

  public debug = (disable?: boolean): void => {
    if (!disable) {
      for (let i = 0; i < this.outs.length; i++) {
        if (this.push(i as valid_fb)) {
          this.gl.clearColor(0, 0, 1, 0.1);
          this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
          this.outs[i].setBorders(true);
          this.pop();
        }
      }
    } else {
      for (let outie of this.outs) {
        outie.setBorders(false);
      }
    }
  };

  public checkReadiness = (): Record<string, boolean> => {
    let output = new Map<string, boolean>();
    for (let i = 0; i < this.outs.length; i++) {
      if (this.push(i as valid_fb)) {
      }
      output.set(
        `out${i}`,
        this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) ==
          this.gl.FRAMEBUFFER_COMPLETE
      );
      this.pop();
    }
    return Object.fromEntries(output.entries());
  };

  public setCamera = (n: valid_fb_non_null, camName: string): boolean => {
    const cam = getCamera(camName);
    if (!cam) {
      console.log("Cannot setCamera", n, camName);
      return false;
    }
    this.outs[n].setCamera(cam);
    return true;
  };

  public registerOutput(n: valid_fb_non_null): void {
    this.registeredObjects[n] += 1;
  }

  public unregisterOutput(n: valid_fb_non_null): void {
    this.registeredObjects[n] -= 1;
  }
  static getOutputs = (gl: WebGL2RenderingContext): Outputs => {
    if (outputInstance === null) {
      outputInstance = new Outputs(gl);
    }
    return outputInstance;
  };
}

class BufferedOutput implements OutputClient {
  gl: WebGL2RenderingContext;
  params: RenderParameters;
  framebuffer: twgl.FramebufferInfo;
  programInfo: twgl.ProgramInfo;
  bufferInfo: twgl.BufferInfo;
  ndx: valid_fb_non_null;
  cameraMatrix: twgl.m4.Mat4;
  projectionMatrix: twgl.m4.Mat4;
  camHolder: LookMatricesHolder;
  u_model: twgl.m4.Mat4;
  xBorderColor: Array<number>;
  yBorderColor: Array<number>;
  fsCalls: FunctionCallsArray;
  vsCalls: FunctionCallsArray;
  targetOutput: valid_fb;

  constructor(
    gl: WebGL2RenderingContext,
    params: RenderParameters,
    programInfo: twgl.ProgramInfo,
    bufferInfo: twgl.BufferInfo,
    ndx: valid_fb_non_null,
    cameraName?: string
  ) {
    this.gl = gl;
    this.params = params;
    const attachments = [
      {
        format: gl.RGBA,
        type: gl.UNSIGNED_BYTE,
        min: gl.LINEAR,
        wrap: gl.CLAMP_TO_EDGE,
      },
      { format: gl.DEPTH_STENCIL },
    ];
    this.framebuffer = twgl.createFramebufferInfo(this.gl, attachments);
    this.programInfo = programInfo;
    this.bufferInfo = bufferInfo;
    this.ndx = ndx;
    this.u_model = twgl.m4.identity();
    this.fsCalls = new FunctionCallsArray();
    this.vsCalls = new FunctionCallsArray();
    this.targetOutput = null;
    if (cameraName === undefined) {
      cameraName = "default";
    }
    const cam = getCamera(cameraName) ?? DefaultLookMatricesHolder;
    this.setCamera(cam);

    this.camHolder = cam;
    this.cameraMatrix = cam.u_camera;
    this.projectionMatrix = cam.u_projection;
    this.xBorderColor = new Array<number>(0.3, 0.3, 0, 0.5);
    this.yBorderColor = new Array<number>(0.0, 0.3, 0.3, 0.5);
  }

  setOutput(n: valid_fb): void {
    const mgr = Outputs.getOutputs(this.gl);
    if (this.targetOutput !== null) {
      mgr.unregisterOutput(this.targetOutput);
    }
    this.targetOutput = n;
    if (n !== null) {
      mgr.registerOutput(n);
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
      console.error("Cannot add call to stack, too many");
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

  setCamera(cam: LookMatricesHolder): void {
    this.camHolder = cam;
    this.updateCamera();
  }

  setBorders(v: boolean, color?: Array<number>): void {
    if (!v) {
      this.xBorderColor = TransparentZero.toArray();
    } else {
      this.xBorderColor = color ?? pickRandomColor().toArray();
    }
    this.yBorderColor = this.xBorderColor;
    console.log("Border color:", this.yBorderColor);
  }
  updateCamera(): void {
    this.cameraMatrix = this.camHolder.u_camera;
    this.projectionMatrix = this.camHolder.u_projection;
  }

  public bind = (): boolean => {
    twgl.bindFramebufferInfo(this.gl, this.framebuffer, this.gl.FRAMEBUFFER);
    return true;
  };

  public clear = (): void => {
    const cc = this.params.clearColor;
    this.gl.clearColor(cc.x, cc.y, cc.z, cc.a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  };

  public render = (aspectRatio?: boolean): void => {
    this.updateCamera();
    let uniforms = {
      u_backbuffer: this.framebuffer.attachments[0],
      u_stencil: this.framebuffer.attachments[1],
      u_depth: this.ndx,
      u_camera: this.camHolder.u_camera,
      u_projection: this.camHolder.u_projection,
      u_aspectRatio: aspectRatio ? AppState.appHeight / AppState.appWidth : 1,
      u_model: this.u_model,
      u_xBorderColor: this.xBorderColor,
      u_yBorderColor: this.yBorderColor,
      f_frag_pipeline: this.fsCalls.toBasic(),
      f_vert_pipeline: this.vsCalls.toBasic(),
      u_outputId: this.ndx,
    };
    // console.log(`${this.ndx}: ${this.framebuffer.attachments}`);
    this.gl.useProgram(this.programInfo.program);

    twgl.setUniforms(this.programInfo, uniforms);

    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);

    // simply render texture on a dual triangle quad
    twgl.drawBufferInfo(this.gl, this.bufferInfo, this.gl.TRIANGLES, 6, 0);
    // console.log("render", 2);
  };
}

type ChannelOffsetParameters = {
  offsetDirection: LengthArray<number, 2>;
  circular?: boolean;
  moveAmount?: number;
  multiplyMovement?: boolean;
  substractOriginal?: boolean;
  blendMode?: "ADD" | "MUL" | "SUB";
  lossFactor?: number;
  offsetChannels: {
    r?: boolean;
    g?: boolean;
    b?: boolean;
    a?: boolean;
  };
};

const CHANNEL_OFFSET = 10;
const INVERT_COLORS = 20;

type InvertColorsParms = {
  skip?: boolean;
  skipR?: boolean;
  skipG?: boolean;
  skipB?: boolean;
  swapRG?: boolean;
  swapRB?: boolean;
  swapGB?: boolean;
};
const addInvertColorsToOutput = (
  bo: BufferedOutput,
  parms: InvertColorsParms
): boolean => {
  let fcall_frag: FunctionCall = new FunctionCall({
    f_id: INVERT_COLORS,
    flags:
      0 |
      (parms.skip ? 1 << 0 : 0) |
      (parms.skipR ? 1 << 1 : 0) |
      (parms.skipG ? 1 << 2 : 0) |
      (parms.skipB ? 1 << 3 : 0) |
      (parms.swapRG ? 1 << 4 : 0) |
      (parms.swapRB ? 1 << 5 : 0) |
      (parms.swapGB ? 1 << 6 : 0),
    arg1: [0, 0, 0, 0],
    arg2: [0, 0, 0, 0],
    arg3: [0, 0, 0, 0],
  });
  return bo.addFSCall(fcall_frag);
};
const addChannelOffsetToOutput = (
  bo: BufferedOutput,
  parm: ChannelOffsetParameters
): boolean => {
  const oc = parm.offsetChannels;
  let fcall_frag: FunctionCall = new FunctionCall({
    f_id: CHANNEL_OFFSET,
    flags:
      0 |
      (oc.r ? 1 : 0) |
      (oc.g ? 2 : 0) |
      (oc.b ? 4 : 0) |
      (oc.a ? 8 : 0) |
      (parm.circular ? 16 : 0) |
      (parm.multiplyMovement ? 32 : 0) |
      (parm.substractOriginal ? 64 : 0) |
      (parm.blendMode === "ADD" ? 128 : 0) |
      (parm.blendMode === "SUB" ? 256 : 0) |
      (parm.blendMode === "MUL" ? 512 : 0),
    arg1: [...parm.offsetDirection, parm.moveAmount ?? 0.5, 0],
    arg2: [parm.lossFactor ?? 0.8, 0, 0, 0],
    arg3: [0, 0, 0, 0],
  } as unknown as FunctionCall);
  return bo.addFSCall(fcall_frag);
};

interface BufferedOutput extends TransformablePrimitive {}
applyMixins(BufferedOutput, [TransformablePrimitive]);
export {
  Outputs,
  addChannelOffsetToOutput,
  CHANNEL_OFFSET,
  addInvertColorsToOutput,
  INVERT_COLORS,
};
export type { valid_fb, valid_fb_non_null, OutputParameters, OutputClient };
