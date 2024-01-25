#version 300 es
precision mediump float;
uniform sampler2D u_backbuffer;
// uniform sampler2D u_frontbuffer;
in vec2 v_texcoord;
layout(location = 0) out vec4 output_color;
layout(location = 1) out float u_stencil;
vec4 original_output_color;
uniform vec4 u_xBorderColor;
uniform vec4 u_yBorderColor;
uniform bool u_frame;
uniform int u_outputId;
// pipeline stuff
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

RegisteredValues registered_values;


struct function_mapper {
   int offset_channels;
   int invert_colors;
};

const function_mapper function_map = function_mapper(10, 20);
const vec4 zerocolor = vec4(0., 0., 0., 0.);
void circular_x(vec2 inlet_coordinates) {
   float intpart;
   float x_remainder = modf(inlet_coordinates.x, intpart);
   if (intpart < -1. && x_remainder > 0.) {
      intpart = 0.;
      x_remainder = 1. - x_remainder;
   }
   else if (intpart > 1. && x_remainder > 0.) {
      intpart = 0.;
      x_remainder = -1. + x_remainder;
   }
   inlet_coordinates.x = intpart + x_remainder;
}

void circular_y(vec2 inlet_coordinates) {
   float intpart;
   float y_remainder = modf(inlet_coordinates.x, intpart);
   if (intpart < -1. && y_remainder > 0.) {
      intpart = 0.;
      y_remainder = 1. - y_remainder;
   }
   else if (intpart > 1. && y_remainder > 0.) {
      intpart = 0.;
      y_remainder = -1. + y_remainder;
   }
   inlet_coordinates.y = intpart + y_remainder;  
}

vec2 circular_coordinates(vec2 inlet_coordinates) {
   // offset coordinates by one
   vec2 oc = inlet_coordinates + vec2(1., 1.);
   vec2 modulated = mod(oc, 2.);
   return modulated - vec2(1., 1.);
}
#define OUTPUT_FS_STACK_SIZE 8
uniform FunctionCall[OUTPUT_FS_STACK_SIZE] f_frag_pipeline;


// end pipeline stuff

bool btw(float v, float lowerBound, float upperBound) {
   return (lowerBound < v && v < upperBound);
}

bool inSpace(float v) {
   return -1.0 <= v && v <= 1.0;
}

bool border(float coord) {
   return btw(coord, -1.0, -0.995) || btw(coord, 0.995, 1.0);
}

#define CHO_R              ((flags & 1<<0) > 0)    // 1
#define CHO_G              ((flags & 1<<1) > 0)    // 2
#define CHO_B              ((flags & 1<<2) > 0)    // 4
#define CHO_A              ((flags & 1<<3) > 0)    // 8
#define DO_CIRCULAR        ((flags & 1<<4) > 0)    // 16
#define DO_MULTIPLY_CD     ((flags & 1<<5) > 0)    // 32
#define SUBSTRACT_ORIGINAL ((flags & 1<<6) > 0)    // 64
#define BLEND_MODE_ADD     ((flags & 1<<7) > 0)    // 128
#define BLEND_MODE_SUB     ((flags & 1<<8) > 0)    // 256
#define BLEND_MODE_MUL     ((flags & 1<<9) > 0)    // 512

#define CHO_DIRECTION      (arg1.xy)               // 2D vector of the channel shift
#define MOVE_AMOUNT        (arg1.z)                // how much of the original color is transferred
#define LOSS_FACTOR        (arg2.x)
/* channel_offset: do channel-wise RGBA color shift along a vector

make it so the output channel is a blend of the current output channel pixel value
and another sample offset by (arg1.xy).
arg1.xy may be considered as an addition offset or as a member-wise member multiplication offset i.e. 
vec2(a, b) + vec2(c, d) = vec2(a + c, b + d) vs. vec2(a, b) * vec2(c, d) = vec2(a * c, b * d)
MOVE_AMOUNT defines how much of the bleeding color is added
if SUBSTRACT_ORIGINAL is set, we tone the original color by (1 - MOVE_AMOUNT)
the default MOVE_AMOUNT is 0.5 (50%)

Careful: the destination fragment reads the transforming texture while the source fragment takes output_color
*/
bool channel_offset(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
   vec2 sampled_fragment_pos;
   vec2 change_direction = CHO_DIRECTION; // vec2(0.01, 0.01); // CHO_DIRECTION;
   float ma =  max(0.0, min(MOVE_AMOUNT, 1.0)); // 0.0 < ma <= 1.0
   /* if (ma <= 0.) {
      ma = 0.5;
   }*/

   // how we interpret offset coordinates: either as multiplicative or additive
   if (DO_MULTIPLY_CD) {
      sampled_fragment_pos = v_texcoord * change_direction;
   } else {
      sampled_fragment_pos = v_texcoord + change_direction;
   }
   vec2 sampled_texture_point = (sampled_fragment_pos + vec2(1.0, 1.0)) * 0.5; // normalized to (0, 1)(0, 1) as is proper
   vec2 destination_texture_point = (v_texcoord + vec2(1.0, 1.0)) * 0.5;
   if (DO_CIRCULAR) {
      sampled_texture_point = mod(sampled_texture_point, 1.);
      destination_texture_point = mod(destination_texture_point, 1.);
   }
   // get the color we are going to blend to the current pixel
   vec4 sampled_texture_piece = texture(u_backbuffer, sampled_texture_point);
   // get the color we are using as a target
   vec4 original_texture_piece = texture(u_backbuffer, destination_texture_point);
   if (sampled_texture_piece == zerocolor) {
      // stop processing if the piece we are sampling is 0
      return true;
   }
   float sampledMultiplicator =  ma;
   float originalMultiplicator = (1. - ma);
   vec4 tmp_output_color; // the output color as is currently set
   if (BLEND_MODE_ADD) {
      tmp_output_color = original_texture_piece + sampled_texture_piece;
   } else if (BLEND_MODE_SUB) {
      tmp_output_color = original_texture_piece - sampled_texture_piece;
   }
   else if (BLEND_MODE_MUL || true) {
      tmp_output_color = original_texture_piece * sampled_texture_piece;
   }
   if (SUBSTRACT_ORIGINAL) {
      tmp_output_color *= originalMultiplicator;
   }

   if (!CHO_R) {
      tmp_output_color.r = original_texture_piece.r;
   }
   if (!CHO_G) {
      tmp_output_color.g = original_texture_piece.g;
   }
   if (!CHO_B) {
      tmp_output_color.b = original_texture_piece.b;
   }
   tmp_output_color *= max(0., (1. - LOSS_FACTOR));
   // tmp_output_color.a = clamp(original_texture_piece.a + sampled_texture_piece.a, 0., 1.);
   tmp_output_color.a = sampled_texture_piece.a * sampledMultiplicator + original_texture_piece.a * originalMultiplicator;
   output_color.rgba = tmp_output_color.rgba;
   return true;
}

// set flag bit 1 to 1 to skip 
// flag bit 2: skip R
// flag bit 3: skip G
// flag bit 4: skip B
// flag bit 5: swap R / G
// flag bit 6: swap R / B
// flag bit 7: swap G / B
bool invert_colors(int flags, vec4 arg1, vec4 arg2, vec4 arg3) {
   if ((flags & 1) > 0) {
      return true;
   }
   vec4 o_color = output_color;
   output_color.rgb = vec3(1., 1., 1.) - output_color.rgb;
   if ((flags & 1 << 1) > 0) {
      output_color.r = o_color.r;
   }
   if ((flags & 1 << 2) > 0) {
      output_color.g = o_color.g;
   }
   if ((flags & 1 << 3) > 0) {
      output_color.b = o_color.b;
   }
   if ((flags & 1 << 4) > 0) {
      output_color.rg = output_color.gr;
   }
   if ((flags & 1 << 5) > 0) {
      output_color.rb = output_color.br;
   }
   if ((flags & 1 << 6) > 0) {
      output_color.gb = output_color.gb;
   }

   return true;
}

void main() {
   // normalize texcoords (0,0) to (1,1) to clip space (-1,-1) to (1,1): * 2 - (1, 1)
   // v_texcoord = a_texcoord * 2.0 - vec2(1, 1);
   // from this, normalize clip space to texture space by doing the opposite
   vec2 coordinates = (v_texcoord + vec2(1.0, 1.0)) * 0.5;
   // set the initial output color as the contents of the texture in the beginning
   output_color = texture(u_backbuffer, coordinates);
   original_output_color = output_color;
   bool mayDiscard;
   bool skipProcessing = false;

   // apply the border management system
   // handle border debug display and other wrongspace culling
   if (border(v_texcoord.x) && inSpace(v_texcoord.y) && u_xBorderColor.a > 0.0) {
      output_color = u_xBorderColor;
      skipProcessing = true;
   } else if (border(v_texcoord.y) && inSpace(v_texcoord.x) && u_yBorderColor.a > 0.0) {
      output_color = u_yBorderColor;
      skipProcessing = true;
   }
   else if (!inSpace(v_texcoord.x) || !inSpace(v_texcoord.y)) {
      mayDiscard = true; 
      skipProcessing = true;
      // output_color = vec4(.1, .5, 0.5, .2); // should discard actually
   }
   else if (output_color.a == 0.0) {
      mayDiscard = true;
   }

   // now apply the output effects pipeline
   FunctionCall fc;
   bool cont = false;
   for (int i = 0; i < OUTPUT_FS_STACK_SIZE && !skipProcessing; i++) {
      fc = f_frag_pipeline[i];
      switch (fc.f_id) {
         case function_map.offset_channels:
         cont = channel_offset(fc.flags, fc.arg1, fc.arg2, fc.arg3);
         break;
         case function_map.invert_colors:
         cont = invert_colors(fc.flags, fc.arg1, fc.arg2, fc.arg3);
         default:
         cont = false;
         break;
      }
      if (!cont) {
         break;
      }
   }
   

   // mayDiscard = (output_color.a == 0.);
   if (mayDiscard) {
      // output_color.a = 0.1;
      // output_color.rgb = vec3(1., 1., 1.);
      // discard;
   }



   // myOutputColor.r += 0.1;
   // myOutputColor.a = 0.5;
}
