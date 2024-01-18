#version 300 es
precision highp float;


#define PI 3.1415926535897932384626433832795
#define FS_STACK_SIZE 16
#define EPSILON 0.0001
const float f_epsilon = 0.0000001; 
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
    int modulate_color;
};

// parameters
in vec4 v_to_fragment;
out vec4 out_color;
uniform float u_time;
uniform FunctionCall[FS_STACK_SIZE] f_frag_pipeline; // the function pipeline: this contains all shader calls

// uv style value
in vec2 v_texcoord;
vec4 debug_value;

// function map
const function_mapper function_map = function_mapper(1, 2);
const vec4 zerof_vec4 = vec4(0., 0., 0., 0.);
const vec4 onef_vec4 = vec4(1., 1., 1., 1.);


#define EDGE_WIDTH (arg1.x)
#define u_edgeColor (arg2)
#define u_fillColor (arg3)
bool color_polygon(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    if (abs(v_to_fragment.x) < EDGE_WIDTH || abs(v_to_fragment.y) < EDGE_WIDTH || abs(v_to_fragment.z) < EDGE_WIDTH) {
        if (u_edgeColor.a > 0.0) {
            out_color = vec4(u_edgeColor);
        } else {
            out_color = vec4(u_fillColor);
        }
    } else {
        out_color = vec4(u_fillColor);
    }
    return true;
}

// gives a normalized sinewave (0 < v < 1, not -1 < v < 1)
float sinewave_value(float cur_time, float period, float amplitude, float phase_shift, float offset) {
    // Calculate the phase of the sine wave with phase shift
    if (period == 0.) {
        return 0.;
    }
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

float squarewave_value(float cur_time, float period, float amplitude, float phase_shift, float offset, float duty_cycle) {
    if (period == 0.) {
        return 0.;
    }
    // Calculate the phase of the square wave with phase shift
    float phase = fract((cur_time / period) + phase_shift);

    // Calculate the square wave value and apply amplitude
    float squareValue = float(phase < duty_cycle) * amplitude;

    return squareValue + offset;
}


// takes time as input and reads flags to modulate out_color based on simple modular functions
// you can repeat this modulator several times if you want to apply different functions
// this does the operation 
bool modulate_color(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
#define MODULATE_R                      1
#define MODULATE_G                      2
#define MODULATE_B                      4
#define MODULATE_A                      8
#define OP_MULTIPLY                     16
#define APPLY_SIN                       32
#define APPLY_SQU                       64
#define APPLY_TRI                       128
#define MULTIPLY_MASK                   (256 | 512 | 1024) // add sin, add squ, add tri
#define ADD_MASK                        (2048 | 4096 | 8192) // mul sin, mul squ, mul tri
#define DO_MODULATE_R                   ((MODULATE_R & flags) > 0)
#define DO_MODULATE_G                   ((MODULATE_G & flags) > 0)
#define DO_MODULATE_B                   ((MODULATE_B & flags) > 0)
#define DO_MODULATE_A                   ((MODULATE_A & flags) > 0)
#define DO_MULTIPLY                     ((OP_MULTIPLY & flags) > 0)
#define DO_SIN                          ((APPLY_SIN & flags) > 0)
#define DO_SQU                          ((APPLY_SQU & flags) > 0)
#define DO_TRI                          ((APPLY_TRI & flags) > 0)
#define MUL_SIN                         ((256 & flags) > 0)
#define MUL_SQU                         ((512 & flags) > 0)
#define MUL_TRI                         ((1024 & flags) > 0)
#define ADD_SIN                         ((2048 & flags) > 0)
#define ADD_SQU                         ((4096 & flags) > 0)
#define ADD_TRI                         ((8192 & flags) > 0)
#define SIN_MODULATION_PERIOD           (arg1.r)
#define SIN_MODULATION_AMPLITUDE        (arg1.g)
#define SIN_MODULATION_OFFSET           (arg1.b)
#define SIN_MODULATION_PHASE            (arg1.a)
#define SQU_MODULATION_PERIOD           (arg2.r)
#define SQU_MODULATION_AMPLITUDE        (arg2.g)
#define SQU_MODULATION_OFFSET           (arg2.b)
#define SQU_MODULATION_PHASE            (arg2.a)
#define TRI_MODULATION_PERIOD           (arg3.r)
#define TRI_MODULATION_AMPLITUDE        (arg3.g)
#define TRI_MODULATION_OFFSET           (arg3.b)
#define TRI_MODULATION_PHASE            (arg3.a)
    float mod_value_sin = sinewave_value(
        u_time,
        SIN_MODULATION_PERIOD,
        SIN_MODULATION_AMPLITUDE,
        SIN_MODULATION_PHASE,
        SIN_MODULATION_OFFSET);

    float mod_value_tri = trianglewave_value(
        u_time,
        TRI_MODULATION_PERIOD,
        TRI_MODULATION_AMPLITUDE,
        TRI_MODULATION_PHASE,
        TRI_MODULATION_OFFSET);
    float mod_value_squ = squarewave_value(
        u_time,
        SQU_MODULATION_PERIOD,
        SQU_MODULATION_AMPLITUDE,
        SQU_MODULATION_PHASE,
        SQU_MODULATION_OFFSET, 0.75);
    float mod_value = 0.;
    float mod_value_mul = 1.;
    float mod_value_add = 0.;
    vec4 modules;
    if (MUL_SIN) {
        mod_value_mul *= mod_value_sin;
    }
    if (MUL_SQU) {
        mod_value_mul *= mod_value_squ;
    }
    if (MUL_TRI) {
        mod_value_mul *= mod_value_tri;
    }
    if (ADD_SIN) {
        mod_value_add += mod_value_sin;
    }
    if (ADD_SQU) {
        mod_value_add += mod_value_squ;
    }
    if (ADD_TRI) {
        mod_value_add += mod_value_tri;
    }
    mod_value = mod_value_mul + mod_value_add;


    if (DO_MULTIPLY) {
    modules = vec4(
        DO_MODULATE_R ? mod_value : 1.,
        DO_MODULATE_G ? mod_value : 1.,
        DO_MODULATE_B ? mod_value : 1.,
        DO_MODULATE_A ? mod_value : 1.
    );
        out_color = clamp(out_color * modules, zerof_vec4, onef_vec4);
    } else {
        modules = vec4(
        DO_MODULATE_R ? mod_value : 0.,
        DO_MODULATE_G ? mod_value : 0.,
        DO_MODULATE_B ? mod_value : 0.,
        DO_MODULATE_A ? mod_value : 0.
    );
        out_color = clamp(out_color + modules, zerof_vec4, onef_vec4);
    }
    return true;
}

void main() {
    bool cont = false;
    FunctionCall fc;
    for (int i = 0; i < FS_STACK_SIZE; i++) {
        fc = f_frag_pipeline[i];
        if (function_map.color_polygon == fc.f_id) {
            cont = color_polygon(fc.flags, fc.arg1, fc.arg2, fc.arg3);
        }
        else if (function_map.modulate_color == fc.f_id) {
            cont = modulate_color(fc.flags, fc.arg1, fc.arg2, fc.arg3);
        } else {
            cont = false;
        }
        if (!cont) {
            break;
        }
    }
}
