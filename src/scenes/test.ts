import { Shapes } from "../prims/Shapes";
import { RenderableType, SceneType } from "../utils/baseTypes"
import { createCamera, createOrthographicCamera, createPerspectiveCamera, getCamera } from "../utils/gl";
import { Outputs } from "../output/Outputs";
import * as twgl from "twgl.js"
import { pickRandomElement } from "../utils/misc";
import { pickRandomColor } from "../utils/colors";
const renderObjs: RenderableType[] = []
const cameras: string[] = []
let glContext: WebGL2RenderingContext;

const setGlContext = (gl: WebGL2RenderingContext): void => {
    glContext = gl;
}
const buildObjects = (): void => {
    let shapeCount: number = 4;
    let sidesCount: number = 0;
    while (shapeCount > 0) {
        shapeCount -= 1;
        sidesCount = Math.floor(Math.random() * 9 + 3)
        let s = new Shapes(glContext, {
            fillColor: pickRandomColor().alpha(0.3),
        });
        s.setCamera('identity');
        s.setSideCount(sidesCount);
        s.setOutput(0);
        renderObjs.push(s);
    }
}

const buildCameras = (): void => {
    /* createOrthographicCamera(
        "front-ortho",
        {
            lateralHalfSpan: 1,
            verticalHalfSpan: 1,
            lateralOffset: 0,
            verticalOffset: 0,
            near: 0.1,
            far: 100,
        },
        twgl.v3.create(0, 0, -1)
    );
    createOrthographicCamera(
        "left-ortho",
        {
            lateralHalfSpan: 1,
            verticalHalfSpan: 1,
            lateralOffset: 0,
            verticalOffset: 0,
            near: 0.1,
            far: 100,
        },
        twgl.v3.create(-1, 0, 0),
        twgl.v3.create(0, 1, 0),
        -90,
        true,
    );  
    createOrthographicCamera(
        "right-ortho",
        {
            lateralHalfSpan: 1,
            verticalHalfSpan: 1,
            lateralOffset: 0,
            verticalOffset: 0,
            near: 0.1,
            far: 100,
        },
        twgl.v3.create(1, 0, 0),
        twgl.v3.create(0, 1, 0),
        -90,
        true,
    );
    createOrthographicCamera(
        "top-ortho",
        {
            lateralHalfSpan: 1,
            verticalHalfSpan: 1,
            lateralOffset: 1,
            verticalOffset: 1,
            near: 0.1,
            far: 2000,
        },
        twgl.v3.create(0, 2, 0),
        twgl.v3.create(0, 0, 1),
        -90,
        true,
    );
    */
   createPerspectiveCamera(
    "front-perspective",
    twgl.v3.create(0, 0, -3),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 1, 0),
    {
        aspect: 1,
        far: 1000,
        near: 0.1,
        fov: 90,
    }
   );
   createPerspectiveCamera(
    "left-perspective",
    twgl.v3.create(-0.6, 0, -3),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 1, 0),
    {
        aspect: 1,
        far: 1000,
        near: 0.1,
        fov: 70,
    }
   )
   createPerspectiveCamera(
    "right-perspective",
    twgl.v3.create(0.6, 0, -3),
    twgl.v3.create(0, 0, 0),
    twgl.v3.create(0, 1, 0),
    {
        aspect: 1,
        far: 1000,
        near: 0.1,
        fov: 70,
    }
   )
    createPerspectiveCamera(
        "top-perspective",
        twgl.v3.create(0, 1, -3),
        twgl.v3.create(0, 0, 0),
        twgl.v3.create(0, 0, -1),
        {
            aspect: 1,
            far: 1000,
            near: 0.1,
            fov: 90,
        }
    )
    createPerspectiveCamera(
        "bottom-perspective",
        twgl.v3.create(0, -1, -3),
        twgl.v3.create(0, 0, 0),
        twgl.v3.create(0, 0, 1),
        {
            aspect: 1,
            far: 1000,
            near: 0.1,
            fov: 90,
        }
    )

    createPerspectiveCamera(
        "mobile-perspective",
        twgl.v3.create(0, 0, -3),
        twgl.v3.create(0, 0, 0),
        twgl.v3.create(0, 1, 0),
        {
            aspect: 1,
            far: 1000,
            near: 0.1,
            fov: 90,
        }
    )
    cameras.push('front-perspective', 'left-perspective', 'right-perspective', 'top-perspective', 'bottom-perspective', 'mobile-perspective');
    // cameras.push('mobile-perspective');
}

let counter = 0
let counterRefresh = 0;
const updateObjects = (time: number): void => {
    const persp = getCamera('mobile-perspective');
    twgl.m4.axisRotate(persp!.u_camera, twgl.v3.create(0, 1, 0), Math.PI / 180 / 3, persp!.u_camera);
    if (time < counter) {
        return;
    }

    if (time < counterRefresh) {
        return;
    }
    counterRefresh += 150;
    for (let obj of renderObjs) {
        let s = obj as Shapes;
        let sidesCount = Math.floor(Math.random() * 5 + 3)
        s.setSideCount(sidesCount);
    }
    counter += 1000;
    const outputs = Outputs.getOutputs(glContext);
    const nextCam = pickRandomElement<string>(cameras);
    outputs.setCamera(0, nextCam);
    console.log(`Camera: ${nextCam}`)

}

const Scene: SceneType = {
    setGLContext: setGlContext,
    buildCameras: buildCameras,
    buildObjects: buildObjects,
    updateObjects: updateObjects,
    renderObjs: renderObjs
};

export { Scene }
