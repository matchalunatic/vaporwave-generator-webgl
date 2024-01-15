#version 300 es
precision highp float;


#define PI 3.1415926535897932384626433832795
#define FS_STACK_SIZE 16
// types
struct FunctionCall {
    int f_id;
    int flags;
    vec4 arg1;
    vec4 arg2;
    vec4 arg3;
};

struct function_mapper {
    int color_polygon;
};

// parameters
in vec4 v_to_fragment;
out vec4 out_color;
uniform float u_time;
uniform FunctionCall[FS_STACK_SIZE] f_frag_pipeline; // the function pipeline: this contains all shader calls

// uv style value
in vec2 v_texcoord;


// function map
const function_mapper function_map = function_mapper(1);

#define EDGE_WIDTH arg1.x
#define u_edgeColor arg2
#define u_fillColor arg3;
bool color_polygon(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    if (abs(v_to_fragment.x) < EDGE_WIDTH || abs(v_to_fragment.y) < EDGE_WIDTH || abs(v_to_fragment.z) < EDGE_WIDTH) {
        if (u_edgeColor.a > 0.0) {
            out_color = u_edgeColor;
        } else {
            out_color = u_fillColor;
        }
    } else {
        out_color = u_fillColor;
    }
    return true;
}

#define RM_MAX_STEPS 80
#define RM_MAX_DISTANCE 100

float sdf_sphere(vec3 point, vec3 center, float radius) {
    return distance(point, center) - radius;
}

float sdf_scene(vec3 p) {
    return min(
        sdf_sphere(
            p, vec3(-1, 0, 5), 1.),
        sdf_sphere(
            p, vec3(1, 0, 10), 0.5)
    );
}
bool raymarching_main(int flags, vec4 arg1, vec4 arg2 ,vec4 arg3) {
    vec3 camPos = vec3(arg1.xyz);
    vec3 rayDirection = vec3(v_texcoord, 1.);
    float tot_dist = 0.;
    for (int i = 0; i < RM_MAX_STEPS; i++) {
        // vec3 pos = 
    }
    return true;
}



void main() {
    bool cont = false;
    for (int i = 0; i < FS_STACK_SIZE; i++) {
        if (function_map.color_polygon == f_frag_pipeline[i].f_id) {
            cont = color_polygon(f_frag_pipeline[i].flags, f_frag_pipeline[i].arg1, f_frag_pipeline[i].arg2, f_frag_pipeline[i].arg3);
        } else {
            cont = false;
        }
        if (!cont) {
            break;
        }
    }
}
