#version 300 es
uniform int u_sides;
uniform vec3 u_centerBary;
uniform mat4 u_model;       // transform of the shape
uniform mat4 u_camera;      // where the camera is, where it looks at
uniform mat4 u_projection;  // effects applied on the camera
uniform float u_aspectRatio;

out vec3 vBC;
#define PI 3.1415926535897932384626433832795

// each 3rd vertex will be the center, the others will walk around the shape
void main() {
    int vertexId = gl_VertexID % 3;
    // int sliceId = int(floor(float(gl_VertexID) / 3.0));
    int sliceId = gl_VertexID / 3;
    float mult = 1.0 - step(1.5, float(vertexId)); // 0 for the center, 1 for the rest
    float oneSlice = 1.0 / float(u_sides);
    float oneAngle = oneSlice * 2.0 * PI;
    // for triangle x from 1 to n in a n-sided polygon,
    // the first vertex has angle (x-1) * oneAngle
    // the second vertex has angle (x) * oneAngle
    float angleMul = step(0.5, float(vertexId)) + 1.0 + float(sliceId);
    // we compute coordinates r, theta and we nullify through mult as needed
    float ang = angleMul * oneAngle;
    vec2 pos = vec2(cos(ang), sin(ang));
    vec4 aspectVec = vec4(u_aspectRatio, 1.0, 1.0, 1.0);
    gl_Position = u_projection * u_camera * u_model * vec4(pos * mult, 0.0, 1.0);
    switch (vertexId) {
        case 0:
        vBC = vec3(1, 0, 0);
        break;
        case 1:
        vBC = vec3(0, 1, 0);
        break;
        case 2:
        // we want the centers to never be picked up by border matching so they can't be considered close
        vBC = u_centerBary;
        break;
    }
}
