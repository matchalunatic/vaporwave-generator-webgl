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
    int modulate_op;
};

// parameters
in vec4 v_to_fragment;
out vec4 out_color;
uniform float u_time;
uniform bool u_check_parameters;
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

// square wave 
float squarewave_value(float cur_time, float period, float amplitude, float phase_shift, float offset, float duty_cycle) {
    // Calculate the phase of the square wave with phase shift
    float phase = fract((cur_time / period) + phase_shift);

    // Calculate the square wave value and apply amplitude
    float squareValue = (float(phase < duty_cycle) + offset)  * amplitude;

    return squareValue;
}

// flags for modulation
#define MODULATE_R                      1
#define MODULATE_G                      2
#define MODULATE_B                      4
#define MODULATE_A                      8
#define APPLY_SIN                       32
#define APPLY_SQU                       64
#define APPLY_TRI                       128
#define OP_MULTIPLY                     256
#define NO_CLAMPING                     512
#define DO_MODULATE_R                   ((MODULATE_R & flags) > 0)
#define DO_MODULATE_G                   ((MODULATE_G & flags) > 0)
#define DO_MODULATE_B                   ((MODULATE_B & flags) > 0)
#define DO_MODULATE_A                   ((MODULATE_A & flags) > 0)
#define DO_MULTIPLY                     ((OP_MULTIPLY & flags) > 0)
#define DO_SIN                          ((APPLY_SIN & flags) > 0)
#define DO_SQU                          ((APPLY_SQU & flags) > 0)
#define DO_TRI                          ((APPLY_TRI & flags) > 0)
#define DO_NOT_CLAMP                    ((NO_CLAMPING & flags) > 0)

void errorTexture(vec4 col1, vec4 col2) {
    if ((int(gl_FragCoord.y) % 20) < 10)
            out_color = col1;
        else
            out_color = col2;
}

// display errors in case of invalid parameters
bool modulate_op_check_parameters(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
    bool isOk = true;
    if (DO_SIN && DO_SQU || DO_SIN && DO_TRI || DO_TRI && DO_SQU) {
        errorTexture(vec4(0.3, 0., 0.3, 1), vec4(0.8, 0.8, 0.8, 1.));
        isOk = false;
    }
    else if (arg1.x == 0.) {
        if ((int(gl_FragCoord.y) % 20) < 10)
            out_color = vec4(0.5, 0, 0.5, 1);
        else
            out_color = vec4(1., 0., 0.4, 1.);
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
    if (DO_MODULATE_R) {
        if (DO_MULTIPLY) out_color.r *= modulation;
        else out_color.r += modulation;
    }
    if (DO_MODULATE_G) {
        if (DO_MULTIPLY) out_color.g *= modulation;
        else out_color.g += modulation;
    }
    if (DO_MODULATE_B) {
        if (DO_MULTIPLY) out_color.b *= modulation;
        else out_color.b += modulation;
    }
    if (DO_MODULATE_A) {
        if (DO_MULTIPLY) out_color.a *= modulation;
        else out_color.a += modulation;
    }
    if (!DO_NOT_CLAMP) {
        out_color = clamp(out_color, zerof_vec4, onef_vec4);
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
        else if (function_map.modulate_op == fc.f_id) {
            if (u_check_parameters) {
                cont = modulate_op_check_parameters(fc.flags, fc.arg1, fc.arg2, fc.arg3);
                if (!cont) {
                    break;
                }
            }
            cont = modulate_op(fc.flags, fc.arg1, fc.arg2, fc.arg3);
        } else {
            cont = false;
        }
        if (!cont) {
            break;
        }
    }
}
