#version 300 es

// constants

#define PI 3.1415926535897932384626433832795
#define VS_STACK_SIZE 16
// types
struct FunctionCall {
    int f_id;
    int flags;
    vec4 arg1;
    vec4 arg2;
    vec4 arg3;
};

struct function_mapper {
    int generate_polygon;
    int stretch_coordinates;
    int wiggle_vertex;
};

// function map
const function_mapper function_map = function_mapper(1, 2, 3);

// global parameters

uniform FunctionCall[VS_STACK_SIZE] f_vert_pipeline; // the function pipeline: this contains all shader calls

// the transforms we will apply to the geometry, these are global to the entire pipeline
uniform mat4 u_model;       // transform of the shape
uniform mat4 u_camera;      // where the camera is, where it looks at
uniform mat4 u_projection;  // effects applied on the camera

// time
uniform float u_time;

// out parameters to be forwarded to the fragment shader
out vec4 v_to_fragment;

// uv style coordinates
in vec2 a_texcoord;
out vec2 v_texcoord;

// utility functions

// nice hash / pseudo randomness from https://www.shadertoy.com/view/4djSRW 
float hash11(float p)
{
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

// be mindful that functions should not do geometry transforms on their own unless you really want to go wonky...
// function related defines go on top of the function they are here to help with syntax expression
#define u_sides arg1.x
#define u_aspectRatio arg1.y
#define b_renderCenters (((flags) & 1) == 1)

bool generate_polygon(int flags, vec4 arg1, vec4 _arg2, vec4 _arg3) {
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
    gl_Position = vec4(pos * mult, 0.0, 1.0);
    switch (vertexId) {
        case 0:
        v_to_fragment = vec4(1, 0, 0, 0);
        break;
        case 1:
        v_to_fragment = vec4(0, 1, 0, 0);
        break;
        case 2:
        // we want the centers to never be picked up by border matching so they can't be considered close
        if (b_renderCenters) {
            v_to_fragment = vec4(0, 0, 1, 0);
        } else {
            v_to_fragment = vec4(1, 1, 1, 0);
        }
        break;
    }

    return true;
}

#define factors vec4(arg1.xyz, 1)
bool stretch_coordinates(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    gl_Position = gl_Position * factors;
    return true;
}

#define offset (arg1.y)
#define mul (arg1.x)
bool wiggle_vertex(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    float wiggleFactor = (hash11(u_time) + offset) * mul;
    gl_Position += vec4(wiggleFactor, wiggleFactor, wiggleFactor, wiggleFactor);
    return true;
}   
void main() {
    bool cont = false;
    for (int i = 0; i < VS_STACK_SIZE; i++) {
        if (function_map.generate_polygon == f_vert_pipeline[i].f_id) {
            cont = generate_polygon(f_vert_pipeline[i].flags, f_vert_pipeline[i].arg1, f_vert_pipeline[i].arg2, f_vert_pipeline[i].arg3);
        } else if (function_map.stretch_coordinates == f_vert_pipeline[i].f_id) {
            cont = stretch_coordinates(f_vert_pipeline[i].flags, f_vert_pipeline[i].arg1, f_vert_pipeline[i].arg2, f_vert_pipeline[i].arg3);
        } else if (function_map.wiggle_vertex == f_vert_pipeline[i].f_id) {
            cont = wiggle_vertex(f_vert_pipeline[i].flags, f_vert_pipeline[i].arg1, f_vert_pipeline[i].arg2, f_vert_pipeline[i].arg3);
        }
        else {
            cont = false;
        }
        if (!cont) {
            break;
        }
    }
    // finally do the geometry transforms, but just once
    gl_Position = u_projection * u_camera * u_model * gl_Position;
}
