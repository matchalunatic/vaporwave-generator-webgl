import { Shapes } from "./prims/Shapes";
import { Outputs } from "./output/Outputs";
import * as twgl from "twgl.js";
import { AppState } from "./utils/appState";
import {
  createCamera,
  createOrthographicCamera,
  createPerspectiveCamera,
  moveCamera,
} from "./utils/gl";
import { pickRandomColor } from "./utils/colors";

const triangleWave = (
  time: number,
  phase: number,
  period: number,
  minAmplitude: number,
  maxAmplitude: number
): number => {
  const normalizedPhase = ((phase % 360) + 360) % 360;
  const normalizedTime =
    ((time + (normalizedPhase / 360) * period) % period) / period; // Normalize time to the range [0, 1]

  const triangleValue = Math.abs(2 * normalizedTime - 1); // Form a triangle wave using abs function

  return minAmplitude + triangleValue * (maxAmplitude - minAmplitude);
}

function bipolarSquareWave<T> (
  time: number,
  phase: number,
  period: number,
  lowValue: T,
  highValue: T
): T {
  const normalizedPhase = ((phase % 360) + 360) % 360;
  const normalizedTime =
    ((time + (normalizedPhase / 360) * period) % period) / period; // Normalize time to the range [0, 1]
  if (normalizedTime < 0.5) {
    return lowValue;
  }
  return highValue;
}

function main() {
  const canvas = document!.getElementById("app") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", {
    alpha: true,
  });
  if (!gl) {
    throw new Error("Could not initialize WebGL Context");
  }
  twgl.resizeCanvasToDisplaySize(canvas);
  AppState.appHeight = canvas.height;
  AppState.appWidth = canvas.width;

  // perspective = twgl.m4.identity();
  // outputs.outs[0].transformMatrix = twgl.m4.rotateZ(twgl.m4.identity(), 1);

  const setupEnvironment = (gl: WebGL2RenderingContext): void => {
    gl.depthMask(false);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const outputs = Outputs.getOutputs(gl);
    // outputs.debug(false);

    createCamera(
      "ortho",
      twgl.v3.create(0, 0, -1),
      twgl.v3.create(0, 0, 0),
      twgl.v3.create(0, 1, 0),
      null,
      true,
      {
        lateralOffset: 0,
        verticalOffset: 0,
        lateralHalfSpan: 2,
        verticalHalfSpan: 2,
        near: 0.1,
        far: 3000,
      }
    );
    createPerspectiveCamera(
      "slight-perspective",
      twgl.v3.create(3, 0, -3),
      twgl.v3.create(0, 0, 0),
      undefined,
      {
        aspect: 1.0,
        far: 3000,
        near: 0.1,
        fov: 70,
      }
    );
    createOrthographicCamera(
      "left-ortho",
      {
        near: 0.1,
        far: 2000,
        lateralHalfSpan: 0.5,
        verticalHalfSpan: 0.5,
        lateralOffset: 0,
        verticalOffset: 0,
      },
      twgl.v3.create(1, 0, 0),
      twgl.v3.create(0, 1, 0),
      90
    );
    // move output screens around
    outputs.outs[0].u_model = twgl.m4.translate(
      outputs.outs[0].u_model,
      twgl.v3.mulScalar(twgl.v3.create(0, 0, 0), 1)
    );
    outputs.outs[1].u_model = twgl.m4.translate(
      outputs.outs[0].u_model,
      twgl.v3.mulScalar(twgl.v3.create(0, 0, 1), 1)
    );
    outputs.outs[2].u_model = twgl.m4.translate(
      outputs.outs[0].u_model,
      twgl.v3.mulScalar(twgl.v3.create(0, 0, 2), 1)
    );
    outputs.outs[3].u_model = twgl.m4.translate(
      outputs.outs[0].u_model,
      twgl.v3.mulScalar(twgl.v3.create(0, 0, 3), 1)
    );
    // set outputs cameras
    const camName = "slight-perspective";
    outputs.setCamera(0, camName);
    outputs.setCamera(1, camName);
    outputs.setCamera(2, camName);
    outputs.setCamera(3, camName);

    outputs.checkReadiness();
  };

  const startRender = (gl: WebGL2RenderingContext): void => {
    const outputs = Outputs.getOutputs(gl);
    setupEnvironment(gl);
    const shapes = createObjects(gl);

    const render = (time: number): void => {
      twgl.resizeCanvasToDisplaySize(canvas);
      gl.viewport(0, 0, canvas.width, canvas.height);
      AppState.appHeight = canvas.height;
      AppState.appWidth = canvas.width;
      for (let shape of shapes) {
        shape.render(time);
      }
      if (outputs.push(null)) {
        outputs.render();
      } else {
        throw Error("Cannot switch to main render buffer");
      }
      outputs.wrapRender();
      updateObjects(time, shapes);
      requestAnimationFrame(render); // retrigger
    };
    requestAnimationFrame(render);
  };
  const createObjects = (gl: WebGL2RenderingContext): Shapes[] => {
    const shapeOne = new Shapes(gl, {
      fillColor: pickRandomColor().alpha(0.6),
      renderTriangles: true,
      renderEdges: false,
    });
    const shapeTwo = new Shapes(gl, {
      fillColor: pickRandomColor().alpha(0.6),
      renderTriangles: true,
      renderEdges: false,
    });
    const shapeThr = new Shapes(gl, {
      fillColor: pickRandomColor().alpha(0.6),
      renderTriangles: false,
      renderEdges: false,
    });
    const shapeFor = new Shapes(gl, {
      fillColor: pickRandomColor().alpha(0.6),
      renderTriangles: true,
      renderEdges: true,
    });
    shapeFor.setSideCount(6);

    shapeOne.setOutput(0);
    shapeTwo.setOutput(1);
    shapeThr.setOutput(2);
    shapeFor.setOutput(3);
    const shapeCamera = "identity";
    shapeOne.setCamera(shapeCamera);
    shapeTwo.setCamera(shapeCamera);
    shapeThr.setCamera(shapeCamera);
    shapeFor.setCamera(shapeCamera);
    const objs = [shapeOne, shapeTwo, shapeThr, shapeFor];
    return objs;
  };

  const updateObjects = (time: number, shapes: Shapes[]) => {
    const shapeOne = shapes[0];
    const shapeTwo = shapes[1];
    const shapeThr = shapes[2];
    shapeOne.setSideCount(Math.floor(triangleWave(time, 180, 1600, 3, 6)));
    shapeTwo.setSideCount(Math.floor(triangleWave(time, 0, 1600, 3, 4)));
    shapeThr.setSideCount(Math.floor(triangleWave(time, 0, 9000, 3, 20)));

    const left = twgl.v3.create(-0.05, 0, 0);
    const right = twgl.v3.create(0.05, 0, 0);
    const bpmPeriod = 120 / 60 / 4 * 1000;
    moveCamera("slight-perspective", bipolarSquareWave<twgl.v3.Vec3>(time, 180, bpmPeriod, left, right))
    twgl.m4.rotateY(shapeOne.u_model, -Math.PI * 0.02, shapeOne.u_model);
    twgl.m4.rotateZ(shapeOne.u_model, Math.PI * 0.01, shapeOne.u_model);
    twgl.m4.rotateX(shapeOne.u_model, -Math.PI * 0.01, shapeOne.u_model);
    twgl.m4.rotateY(
      shapeThr.u_model,
      Math.PI * 0.001 * bipolarSquareWave<number>(time, 0, 5000, -100, 100),
      shapeThr.u_model
    );
  };
  if (!gl) {
    throw new Error("Late error starting GL context");
  }
  startRender(gl);
}

main();
