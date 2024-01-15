import { Outputs, valid_fb } from "../output/Outputs";
import { LookMatricesHolder, getCamera, isLookMatricesHolder } from "./gl";
import * as twgl from "twgl.js";

class WithCapabilities {
  capabilities: Array<string> = [];
  addCapabilities(): void {}
  initialize(..._p: any[]) {
    this.addCapabilities();
    console.log("capabilities:", this, this.capabilities);
  }
}

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
  toArray = (): number[] => {
    return [this.x, this.y, this.z, this.a];
  };
}

class OutputtablePrimitive extends WithCapabilities {
  output?: valid_fb;
  outputManager?: Outputs;
  static objectCount: number = 0;
  objectId?: number;
  outputIsInitialized(): this is {
    output: valid_fb;
    outputManager: Outputs;
    objectId: number;
  } {
    return (
      this.outputManager !== undefined &&
      this.output !== undefined &&
      this.objectId !== undefined
    );
  }
  addCapabilities(): void {
    this.capabilities.push("outputtable");
  }

  initializeOutputtable(manager: Outputs): this is {
    output: valid_fb;
    outputManager: Outputs;
    objectId: number;
  } {
    this.output = null;
    this.outputManager = manager;
    this.objectId = OutputtablePrimitive.objectCount;
    OutputtablePrimitive.objectCount += 1;
    return true;
  }

  setOutput(n: valid_fb): void {
    if (!this.outputIsInitialized()) {
      throw Error("outputManager is not initialized, will not proceed");
    }
    console.log(
      `${this.objectId}: register output ${n} instead of ${this.output}`
    );
    if (this.output !== null) {
      this.outputManager.unregisterOutput(this.output);
    }
    if (n !== null) {
      this.outputManager.registerOutput(n);
      this.output = n;
    }
  }
}
class CameraSubjectPrimitive extends WithCapabilities {
  cameraHolder: LookMatricesHolder;

  addCapabilities(): void {
    this.capabilities.push("camera-able");
  }
  constructor(cam: LookMatricesHolder | string | undefined) {
    const defaultCam = getCamera("default");
    let chosenCam: LookMatricesHolder | undefined;
    if (typeof cam === "string") {
      chosenCam = getCamera(cam);
    } else if (isLookMatricesHolder(cam)) {
      chosenCam = cam;
    } else {
      chosenCam = defaultCam;
    }
    if (chosenCam === undefined) {
      throw Error(
        "Could not assign a camera to CameraSubjectPrimitive, not creating it. Ensure a default camera is defined."
      );
    }
    super();
    this.cameraHolder = chosenCam;
  }
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
}

interface TransformablePrimitive {
  u_model?: twgl.m4.Mat4;
  setTransformation(transform: twgl.m4.Mat4): void;
}

class TransformablePrimitive extends WithCapabilities {
  u_model?: twgl.m4.Mat4;
  setTransformation(transform: twgl.m4.Mat4): void {
    this.u_model = transform;
  }
  addCapabilities(): void {
    this.capabilities.push("transformable");
  }
}

interface RenderableType {
  render(time: number): void;
}

type SceneType = {
  setGLContext: (gl: WebGL2RenderingContext) => void;
  buildCameras: () => void;
  buildObjects: () => void;
  updateObjects: (time: number) => void;
  renderObjs: RenderableType[];
};

type LengthArray<T, N extends number, R extends T[] = []> = number extends N
  ? T[]
  : R["length"] extends N
  ? R
  : LengthArray<T, N, [T, ...R]>;
export type { Vector4Params, RenderableType, SceneType, LengthArray };
export {
  Vector4,
  OutputtablePrimitive,
  CameraSubjectPrimitive,
  TransformablePrimitive,
};
