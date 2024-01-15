import vs from "./Outputs.vert?raw";
import fs from "./Outputs.frag?raw";
import * as twgl from "twgl.js";
import { Vector4 } from "../utils/baseTypes";
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
  -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0,

];

const positionsArray: twgl.Arrays = {
  a_position: {
    numComponents: 3,
    data: UNITY_QUAD,
  },
  a_texcoord: {
    numComponents: 3,
    data: UNITY_QUAD,
  },
};

class Outputs {
  gl: WebGL2RenderingContext;
  outs: BufferedOutput[];
  outputStack: Array<valid_fb>;
  outputCount: number;
  renderParams: RenderParameters;
  registeredObjects: Array<number>;
  private programInfo: twgl.ProgramInfo;
  private bufferInfo: twgl.BufferInfo;

  private constructor(gl: WebGL2RenderingContext, params?: OutputParameters) {
    this.gl = gl;
    this.programInfo = twgl.createProgramInfo(this.gl, [vs, fs]);
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, positionsArray);
    this.renderParams = Object.assign(
      {},
      DefaultOutputParameters,
      params ?? {}
    );
    this.outputCount = 0;
    this.outs = [];
    this.registeredObjects = [];
    for (let i = 0; i < 8; i++) {
      const col1 = AllColors[i];
      const col2 = AllColors[i];
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
    xBorderColor?: Vector4,
    yBorderColor?: Vector4
  ): boolean => {
    if (this.outputCount >= MAX_SCREEN_COUNT) {
      return false;
    }
    let out = new BufferedOutput(
      this.gl,
      this.renderParams,
      this.programInfo,
      this.bufferInfo,
      this.outputCount as valid_fb_non_null
    );
    if (displayBorders === true) {
      out.xBorderColor = xBorderColor ?? out.xBorderColor;
      out.yBorderColor = yBorderColor ?? out.yBorderColor;
    } else {
      out.xBorderColor = new Vector4(1, 0, 0, 0);
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
    for (let i = 0; i < this.outs.length; i++) {
      if (this.registeredObjects[i] === 0) {
        continue;
      }
      this.outs[i].render();
    }
  };

  public wrapRender = (): void => {
    // second pass: clear
    for (let outie of this.outs) {
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
    }} else {
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

class BufferedOutput {
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
  xBorderColor: Vector4;
  yBorderColor: Vector4;

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
    this.framebuffer = twgl.createFramebufferInfo(this.gl);
    this.programInfo = programInfo;
    this.bufferInfo = bufferInfo;
    this.ndx = ndx;
    this.u_model = twgl.m4.identity();

    if (cameraName === undefined) {
      cameraName = "default";
    }
    const cam = getCamera(cameraName) ?? DefaultLookMatricesHolder;
    this.setCamera(cam);

    this.camHolder = cam;
    this.cameraMatrix = cam.u_camera;
    this.projectionMatrix = cam.u_projection;
    this.xBorderColor = new Vector4(0.3, 0.3, 0, 0.5);
    this.yBorderColor = new Vector4(0.0, 0.3, 0.3, 0.5);
  }

  setCamera(cam: LookMatricesHolder): void {
    this.camHolder = cam;
    this.updateCamera();
  }

  setBorders(v: boolean, color?: Vector4): void {
    if (!v) {
      this.xBorderColor = TransparentZero;
    } else {
      this.xBorderColor = color ?? pickRandomColor().alpha(0.9);
    }
    this.yBorderColor = this.xBorderColor;
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

  public render = (): void => {
    this.updateCamera();
    let uniforms = {
      u_texture: this.framebuffer.attachments[0],
      u_depth: this.ndx,
      u_camera: this.cameraMatrix,
      u_projection: this.projectionMatrix,
      u_aspectRatio: AppState.appHeight / AppState.appWidth,
      u_model: this.u_model,
      u_xBorderColor: this.xBorderColor.toArray(),
      u_yBorderColor: this.yBorderColor.toArray(),
    };
    this.gl.useProgram(this.programInfo.program);
    twgl.setUniforms(this.programInfo, uniforms);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
    // simply render texture on a dual triangle quad
    twgl.drawBufferInfo(this.gl, this.bufferInfo, this.gl.TRIANGLES, 6, 0);
    // console.log("render", 2);
  };
}

interface BufferedOutput extends TransformablePrimitive {};
applyMixins(BufferedOutput, [TransformablePrimitive]);
export { Outputs };
export type { valid_fb, valid_fb_non_null, OutputParameters, OutputClient };
