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
  // this is a crazy typeguard
  const candidate = m as LookMatricesHolder;
  return (
    candidate.u_camera !== undefined &&
    candidate.u_projection !== undefined &&
    candidate.projParams !== undefined &&
    candidate.orthographic !== undefined &&
    candidate.camParams !== undefined &&
    candidate.u_camera.reduce !== undefined &&
    candidate.u_projection.reduce !== undefined &&
    (candidate.projParams === null ||
      (typeof candidate.projParams.far === "number" &&
        typeof candidate.projParams.near === "number")) &&
    (candidate.camParams === null ||
      (candidate.camParams.eye !== undefined &&
        candidate.camParams.lookAt !== undefined &&
        candidate.camParams.up !== undefined &&
        candidate.camParams.eye.copyWithin !== undefined &&
        candidate.camParams.lookAt.copyWithin !== undefined &&
        candidate.camParams.up.copyWithin !== undefined))
  );
};

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
  orthographicParameters?: OrthographicProjectionParameters | undefined | null
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

const createOrthocam2 = (
  name: string,

): LookMatricesHolder => {
  const newcam = twgl.m4.ortho(-1, 1, -1, 1, 0, 2);
  const projCam = twgl.m4.scale(twgl.m4.identity(), twgl.v3.create(AppState.appWidth / AppState.appHeight, 1, 1));

  camerasHolder.set(name, {
    orthographic: true,
    camParams: null,
    projParams: null,
    u_camera: newcam,
    u_projection: projCam,
  });
  const setcam = camerasHolder.get(name);
  if (!setcam) {
    throw Error("camera could not be created")
  }
  return setcam;
}
const createOrthographicCamera = (
  name: string,
  o: OrthographicProjectionParameters | null | undefined,
  translation?: twgl.v3.Vec3,
  rotationAxis?: twgl.v3.Vec3,
  rotationAngle?: degrees,
  relativeRotation?: boolean
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
    twgl.m4.axisRotate(
      orthocam,
      rotationAxis,
      degToRad(rotationAngle),
      orthocam
    );
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
  createOrthocam2,
  createOrthographicCamera,
  createPerspectiveCamera,
  moveCamera,
  isLookMatricesHolder,
};
export type {
  LookMatricesHolder,
  ProjectionParameters,
  OrthographicProjectionParameters,
};
