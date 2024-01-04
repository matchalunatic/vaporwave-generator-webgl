import { Outputs, valid_fb } from "../output/Outputs";

interface Vector4Params {
  x?: number;
  y?: number;
  z?: number;
  a?: number;
}
class Vector4 {
  x: number;
  y: number;
  z: number;
  a: number;
  constructor();
  constructor(x: number, y: number, z: number, a: number);
  constructor(p: Vector4Params);
  constructor(...args: any[]) {
    if (args.length == 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.a = 0;
    } else if (args.length == 1 && args[0].x !== undefined) {
      const p = args[0] as Vector4Params;
      this.x = p.x || 0;
      this.y = p.y || 0;
      this.z = p.z || 0;
      this.a = p.a || 0;
    } else {
      this.x = args[0] || 0;
      this.y = args[1] || 0;
      this.z = args[2] || 0;
      this.a = args[3] || 0;
    }
  }
  toArray = () : number[] => {
    return [this.x, this.y, this.z, this.a];
  }
}

class OutputtablePrimitive {
  output: valid_fb;
  outputManager: Outputs
  static objectCount: number = 0;
  objectId: number;
  constructor(manager: Outputs) {
    this.output = null;
    this.outputManager = manager;
    this.objectId = OutputtablePrimitive.objectCount;
    OutputtablePrimitive.objectCount += 1;
  }
  setOutput = (n: valid_fb): void => {
    console.log(`${this.objectId}: register output ${n} instead of ${this.output}`)
    if (this.output !== null) {
      this.outputManager.unregisterOutput(this.output);
    }
    if (n !== null) {
      this.outputManager.registerOutput(n);
      this.output = n;
    }
  }
}


export type { Vector4Params }
export { Vector4, OutputtablePrimitive }
