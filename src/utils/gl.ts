import * as twgl from "twgl.js";
import { AppState } from "./appState";
type LookMatricesHolder = {
  u_camera: twgl.m4.Mat4; // this holds the camera position and direction
  u_projection: twgl.m4.Mat4; // this holds the camera distortion and clipping parameters
  projParams: ProjectionParameters | OrthographicProjectionParameters | null;
  orthographic: boolean;
  camParams: CameraParameters | null;
};

const isLookMatricesHolder = (m: any): m is LookMatricesHolder => {
  console.log("foo", (typeof m))
  return (typeof m) === "LookMatricesHolder";
}

type degrees = number;

type CameraParameters = {
  eye: twgl.v3.Vec3;
  lookAt: twgl.v3.Vec3;
  up: twgl.v3.Vec3;
};
type ProjectionParameters = {
  fov: degrees;
  aspect: number; // this is not the main aspect ratio
  near: number;
  far: number;
};

type OrthographicProjectionParameters = {
  lateralHalfSpan: number;
  verticalHalfSpan: number;
  near: number;
  far: number;
  lateralOffset?: number;
  verticalOffset?: number;
};

const DefaultOrthographicParameters: OrthographicProjectionParameters = {
  lateralHalfSpan: 1,
  verticalHalfSpan: 1,
  near: 0.1,
  far: 2000,
  lateralOffset: 0,
  verticalOffset: 0,
};

const degToRad = (degrees: number): number => {
  return (degrees / 360.0) * Math.PI * 2;
};

const defaultCamParams: CameraParameters = {
  eye: twgl.v3.create(0.5, 0.5, 1),
  lookAt: twgl.v3.create(0.5, 0.5, 0),
  up: twgl.v3.create(0, 1, 0),
};
const defaultProjParams: ProjectionParameters = {
  fov: 60,
  aspect: 1,
  near: 0.1,
  far: 3000,
};

const defaultLookMatricesHolder: LookMatricesHolder = {
  u_camera: twgl.m4.inverse(
    twgl.m4.lookAt(
      defaultCamParams.eye,
      defaultCamParams.lookAt,
      defaultCamParams.up
    )
  ),
  u_projection: twgl.m4.perspective(
    degToRad(defaultProjParams.fov),
    defaultProjParams.aspect,
    defaultProjParams.near,
    defaultProjParams.far
  ),
  projParams: defaultProjParams,
  camParams: defaultCamParams,
  orthographic: false,
};

const identityCam = twgl.m4.identity();
const identityLookHolder: LookMatricesHolder = {
  u_camera: identityCam,
  u_projection: twgl.m4.identity(),
  projParams: null,
  camParams: null,
  orthographic: true,
};

let camerasHolder = new Map<string, LookMatricesHolder>([
  ["default", defaultLookMatricesHolder],
  ["perspectiveInitial", defaultLookMatricesHolder],
  ["identity", identityLookHolder],
]);

const buildProjectionMatrix = (p: ProjectionParameters): twgl.m4.Mat4 => {
  return twgl.m4.perspective(degToRad(p.fov), p.aspect, p.near, p.far);
};
const createCamera = (
  name: string,
  eye: twgl.v3.Vec3,
  lookAt: twgl.v3.Vec3,
  up?: twgl.v3.Vec3,
  projection?: ProjectionParameters | undefined | null,
  orthographic?: boolean,
  orthographicParameters?: OrthographicProjectionParameters | undefined | null,
): LookMatricesHolder | undefined => {
  if (camerasHolder.get(name) !== undefined) {
    console.error(`Camera ${name} already exists`);
    return;
  }
  if (orthographic) {
    return createOrthographicCamera(name, orthographicParameters);
  } else if (projection || projection === null) {
    return createPerspectiveCamera(name, eye, lookAt, up, projection);
  }
};

const createOrthographicCamera = (
  name: string,
  o: OrthographicProjectionParameters | null | undefined,
  translation?: twgl.v3.Vec3,
  rotationAxis?: twgl.v3.Vec3,
  rotationAngle?: degrees,
  relativeRotation?: boolean,
): LookMatricesHolder => {
  if (!o) {
    o = DefaultOrthographicParameters;
  }
  const lo = o.lateralOffset ?? 0;
  const vo = o.verticalOffset ?? 0;

  let orthocam = twgl.m4.frustum(
    lo - o.lateralHalfSpan,
    lo + o.lateralHalfSpan,
    vo + o.verticalHalfSpan,
    vo - o.verticalHalfSpan,
    o.near,
    o.far
  );
  if (rotationAxis && rotationAngle) {
    if (relativeRotation && translation) {
      twgl.v3.add(rotationAxis, translation, rotationAxis);
    }
    twgl.m4.axisRotate(orthocam, rotationAxis, degToRad(rotationAngle), orthocam);
  }
  if (translation) {
    twgl.m4.translate(orthocam, translation, orthocam);
  }
  camerasHolder.set(name, {
    u_camera: twgl.m4.identity(),
    u_projection: orthocam,
    camParams: null,
    orthographic: true,
    projParams: o,
  });
  const res = camerasHolder.get(name);
  if (!res) {
    throw new Error("error creating the camera");
  }
  return res;
};

const createPerspectiveCamera = (
  name: string,
  eye: twgl.v3.Vec3,
  lookAt: twgl.v3.Vec3,
  up?: twgl.v3.Vec3,
  projection?: ProjectionParameters | null
): LookMatricesHolder => {
  let projectionMatrix: twgl.m4.Mat4;
  if (projection === undefined || projection === null) {
    projectionMatrix = twgl.m4.identity();
    projection = null;
  } else {
    projectionMatrix = buildProjectionMatrix(projection);
  }
  if (!up) {
    up = twgl.v3.cross(eye, twgl.v3.create(0, 1, 0));
    
  }
  const cameraMat = twgl.m4.lookAt(eye, lookAt, up);
  camerasHolder.set(name, {
    u_camera: cameraMat,
    u_projection: projectionMatrix,
    orthographic: false,
    projParams: projection,
    camParams: {
      eye: eye,
      lookAt: lookAt,
      up: up,
    },
  });
  const res = camerasHolder.get(name);
  if (!res) {
    throw new Error("error creating camera");
  }
  return res;
};

const getCamera = (name: string): LookMatricesHolder | undefined => {
  return camerasHolder.get(name);
};

const moveCamera = (
  cam: string,
  movement: twgl.v3.Vec3 | null | undefined,
  gaze?: twgl.v3.Vec3 | null | undefined,
  tilt?: twgl.v3.Vec3 | null | undefined
): void => {
  let camObj = camerasHolder.get(cam);
  if (camObj === undefined || camObj === null || camObj.camParams === null) {
    return;
  }
  if (movement) {
    camObj.camParams.eye = twgl.v3.add(camObj.camParams.eye, movement);
  }
  if (gaze) {
    camObj.camParams.lookAt = twgl.v3.add(camObj.camParams.lookAt, gaze);
  }
  if (tilt) {
    camObj.camParams.up = twgl.v3.add(camObj.camParams.up, tilt);
  }
  camObj.u_camera = twgl.m4.inverse(
    twgl.m4.lookAt(
      camObj.camParams.eye,
      camObj.camParams.lookAt,
      camObj.camParams.up
    )
  );
};

export {
  defaultLookMatricesHolder as DefaultLookMatricesHolder,
  getCamera,
  createCamera,
  createOrthographicCamera,
  createPerspectiveCamera,
  moveCamera,
  isLookMatricesHolder
};
export type {
  LookMatricesHolder,
  ProjectionParameters,
  OrthographicProjectionParameters,
};
