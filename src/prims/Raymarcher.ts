import vs_Raymarcher from "./Raymarcher.vert?raw";
import fs_Raymarcher from "./Raymarcher.frag?raw";
import {
  BufferInfo,
  ProgramInfo,
  createBufferInfoFromArrays,
  createProgram,
  createProgramInfo,
  drawBufferInfo,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js";
import { Outputs, valid_fb } from "../output/Outputs";
import { OutputtablePrimitive, RenderableType } from "../utils/baseTypes";
import { applyMixins } from "../utils/misc";
import { AppState } from "../utils/appState";

type RaymarcherParameters = {
  gl: WebGL2RenderingContext;
  output?: valid_fb;
};

const SINGLE_GIANT_TRI = [
  [-10, -10, 0], // A
  [-10, 10, 0], // B
  [10, 5, 0], // C 
  /*[-1, -1, 0], // A
  [-1, 1, 0],  // B
  [1, 1, 0],   // C
  [1, 1, 0],   // C
  [-1, -1, 0], // A
  [1, -1, 0],  // D*/

];
class Raymarcher implements RenderableType {
  params: RaymarcherParameters;
  private programInfo: ProgramInfo;
  private bufferInfo: BufferInfo;
  constructor(params: RaymarcherParameters) {
    this.params = params;
    if (this.params.output !== undefined) {
      this.setOutput(this.params.output);
    }
    this.programInfo = createProgramInfo(this.params.gl, [
      vs_Raymarcher,
      fs_Raymarcher,
    ]);
    this.bufferInfo = createBufferInfoFromArrays(this.params.gl, {
      vtx_i: {
        numComponents: 3,
        data: SINGLE_GIANT_TRI.flat(1),
      },
    });
    this.initializeOutputtable(Outputs.getOutputs(this.params.gl));
    if (this.outputManager === undefined) {
        throw Error("Will not work without outputManager")
    }
  }
  render(time: number) {
    this.outputManager!.push(this.output ?? null)
    this.params.gl.useProgram(this.programInfo.program);
    setUniforms(this.programInfo, {
      u_time: time,
      u_aspectRatio: AppState.appWidth / AppState.appHeight,
    });
    setBuffersAndAttributes(this.params.gl, this.programInfo, this.bufferInfo);
    drawBufferInfo(
      this.params.gl,
      this.bufferInfo,
      this.params.gl.TRIANGLES,
      SINGLE_GIANT_TRI.length,
      0
    );
    this.outputManager!.pop();
  }
}

interface Raymarcher extends OutputtablePrimitive {}

applyMixins(Raymarcher, [OutputtablePrimitive]);
export { Raymarcher };
