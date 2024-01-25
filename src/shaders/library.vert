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

struct RegisteredValues {
    float f1, f2, f3;
    int i1, i2, i3;
};
struct function_mapper {
    int generate_polygon;
    int stretch_coordinates;
    int wiggle_vertex;
    int modulate_op;
    int offset_coordinates;
};

// function map
const function_mapper function_map = function_mapper(1, 2, 3, 4, 5);

// global parameters

uniform FunctionCall[VS_STACK_SIZE] f_vert_pipeline; // the function pipeline: this contains all shader calls

RegisteredValues registered_values;
// the transforms we will apply to the geometry, these are global to the entire pipeline
uniform mat4 u_model;       // transform of the shape
uniform mat4 u_camera;      // where the camera is, where it looks at
uniform mat4 u_projection;  // effects applied on the camera
uniform float u_aspectRatio;
// debug stuff
uniform bool u_check_parameters;

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

const vec4 zerof_vec4 = vec4(0., 0., 0., 0.);
const vec4 onef_vec4 = vec4(1., 1., 1., 1.);

// be mindful that functions should not do geometry transforms on their own unless you really want to go wonky...
// function related defines go on top of the function they are here to help with syntax expression
#define u_sides arg1.x
#define p_aspectRatio (arg1.y)
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
    vec4 aspectVec = vec4(p_aspectRatio, 1.0, 1.0, 1.0);
    if ((flags & (1 << 1)) > 0) {
        aspectVec.x = u_aspectRatio;
    }
    vec2 pos = vec2(cos(ang), sin(ang));
    gl_Position = vec4(pos * mult, 0.0, 1.0) * aspectVec;
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

bool stretch_coordinates(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    gl_Position = gl_Position * vec4(arg1.xyz, 1);
    return true;
}

bool offset_coordinates(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    gl_Position = gl_Position + vec4(arg1.xyz, 0);
    return true;
}

#define wiggle_offset (arg1.y)
#define mul (arg1.x)
bool wiggle_vertex(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    float wiggleFactor = (hash11(u_time) + wiggle_offset) * mul;
    gl_Position += vec4(wiggleFactor, wiggleFactor, wiggleFactor, wiggleFactor);
    return true;
}

// modulators
// gives a normalized sinewave (0 < v < 1, not -1 < v < 1)
float sinewave_value(float cur_time, float period, float amplitude, float phase_shift, float offset) {
    // Calculate the phase of the sine wave with phase shift
    float phase = mod(fract((cur_time / period) + phase_shift), 1.);
    // Calculate the sine wave value and apply amplitude
    float sinValue = amplitude * ((sin(2.0 * PI * phase) + 1.) / 2.) + offset;
    return sinValue;
}

float trianglewave_value(float cur_time, float period, float amplitude, float phase_shift, float offset) {
    if (period == 0.) {
        return 0.;
    }
    // Calculate the phase of the triangle wave with phase shift
    float phase = fract((cur_time / period) + 0.5 + phase_shift); 
    // Calculate the triangle wave value
    float triangleValue = abs(2. * phase - 1.);
    // Scale by amplitude
    triangleValue *= amplitude;

    return triangleValue + offset;
}

// square wave 
float squarewave_value(float cur_time, float period, float amplitude, float phase_shift, float offset, float duty_cycle) {
    // Calculate the phase of the square wave with phase shift
    float phase = fract((cur_time / period) + phase_shift);

    // Calculate the square wave value and apply amplitude
    float squareValue = (float(phase < duty_cycle) + offset)  * amplitude;

    return squareValue;
}

// flags for modulation
#define MODULATE_X                      1 << 0
#define MODULATE_Y                      1 << 1
#define MODULATE_Z                      1 << 2
#define MODULATE_W                      1 << 3
#define APPLY_SIN                       1 << 4
#define APPLY_SQU                       1 << 5
#define APPLY_TRI                       1 << 6
#define OP_MULTIPLY                     1 << 7
#define CLAMPING                        1 << 8
#define STORE_TO_F1                     1 << 9
#define STORE_TO_F2                     1 << 10
#define STORE_TO_F3                     1 << 11
#define DO_MODULATE_X                   ((MODULATE_X & flags) > 0)
#define DO_MODULATE_Y                   ((MODULATE_Y & flags) > 0)
#define DO_MODULATE_Z                   ((MODULATE_Z & flags) > 0)
#define DO_MODULATE_W                   ((MODULATE_W & flags) > 0)
#define DO_MULTIPLY                     ((OP_MULTIPLY & flags) > 0)
#define DO_SIN                          ((APPLY_SIN & flags) > 0)
#define DO_SQU                          ((APPLY_SQU & flags) > 0)
#define DO_TRI                          ((APPLY_TRI & flags) > 0)
#define DO_CLAMP                        ((CLAMPING & flags) > 0)
// store modulation outputs to pseudo float registers
#define DO_STORE_TO_F1                  ((STORE_TO_F1 & flags) > 0)
#define DO_STORE_TO_F2                  ((STORE_TO_F2 & flags) > 0)
#define DO_STORE_TO_F3                  ((STORE_TO_F3 & flags) > 0)

void errorVertex(vec3 pos1, vec3 pos2) {
    int sli = gl_VertexID % 30;
    if (sli  < 10)
            gl_Position.xyz = pos1;
    else if (sli < 20)
            gl_Position.xyz = pos2;
    else 
        gl_Position.xyz = vec3(pos1.x, pos2.y, 0.5 * pos1.z + 0.5 * pos2.z);
}

// display errors in case of invalid parameters
bool modulate_op_check_parameters(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    bool isOk = true;
    if (DO_SIN && DO_SQU || DO_SIN && DO_TRI || DO_TRI && DO_SQU) {
        errorVertex(vec3(0., 0., 1.), vec3(.1, .1, 1.));
        isOk = false;
    }
    else if (arg1.x == 0.) {
        errorVertex(vec3(.9, .9, 1.), vec3(1., 1., 1.));
        isOk = false;
    }
    return isOk;
}

// modulate parameters through a given operator
// flags: as defined up there
// parameters:  arg1: [period, amplitude, phase shift, offset]
//              arg2: [duty cycle (for square wave), x, x, x]
//              arg3: [x, x, x, x]
bool modulate_op(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    float modulation;
    if (DO_SIN)
        modulation = sinewave_value(u_time, arg1.x, arg1.y, arg1.z, arg1.a  );
    else if (DO_SQU)
        modulation = squarewave_value(u_time, arg1.x, arg1.y, arg1.z, arg1.a, arg2.x);
    else if (DO_TRI)
        modulation = trianglewave_value(u_time, arg1.x, arg1.y, arg1.z, arg1.a);
    if (DO_STORE_TO_F1) {
        registered_values.f1 = modulation;
    }
    if (DO_STORE_TO_F2) {
        registered_values.f2 = modulation;
    }
        if (DO_STORE_TO_F3) {
        registered_values.f3 = modulation;
    }
    if (DO_MODULATE_X) {
        if (DO_MULTIPLY) gl_Position.x *= modulation;
        else gl_Position.x += modulation;
    }
    if (DO_MODULATE_Y) {
        if (DO_MULTIPLY) gl_Position.y *= modulation;
        else gl_Position.y += modulation;
    }
    if (DO_MODULATE_Z) {
        if (DO_MULTIPLY) gl_Position.z *= modulation;
        else gl_Position.z += modulation;
    }
    if (DO_MODULATE_W) {
        if (DO_MULTIPLY) gl_Position.w *= modulation;
        else gl_Position.w += modulation;
    }
    if (DO_CLAMP) {
        gl_Position = clamp(gl_Position, -onef_vec4, onef_vec4);
    }
    return true;
}


void main() {
    bool cont = false;
    FunctionCall fc;
    for (int i = 0; i < VS_STACK_SIZE; i++) {
        fc = f_vert_pipeline[i];
        switch(fc.f_id) {
            case function_map.generate_polygon:
            cont = generate_polygon(fc.flags, fc.arg1, fc.arg2, fc.arg3);
            break;
            case function_map.stretch_coordinates:
            cont = stretch_coordinates(fc.flags, fc.arg1, fc.arg2, fc.arg3);
            break;
            case function_map.wiggle_vertex:
            cont = wiggle_vertex(fc.flags, fc.arg1, fc.arg2, fc.arg3);
            break;
            case function_map.modulate_op:
            if (u_check_parameters) {
                cont = modulate_op_check_parameters(fc.flags, fc.arg1, fc.arg2, fc.arg3);
                if (!cont) break;
            }
            cont = modulate_op(fc.flags, fc.arg1, fc.arg2, fc.arg3);
            break;
            case function_map.offset_coordinates:
            cont = offset_coordinates(fc.flags, fc.arg1, fc.arg2, fc.arg3);
            case 0:
            cont = false;
            break;
            default:
            cont = false;
            errorVertex(vec3(0.5, 0.5, 1.), vec3(0.7, 0.7, 1.));
            break;
        }
        if (!cont) {
            break;
        }
    }
    // finally do the geometry transforms, but just once
    gl_Position = u_projection * u_camera * u_model * gl_Position;
}
