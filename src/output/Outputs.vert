#version 300 es
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_camera;
uniform mat4 u_model;
uniform float u_aspectRatio;
 
out vec2 v_texcoord;
void main() {
   vec4 aspectVec = vec4(u_aspectRatio, 1.0, 1.0, 1.0);
   gl_Position = u_projection * inverse(u_camera) * u_model * a_position * aspectVec;
   // gl_Position = a_position;
   
   v_texcoord = a_texcoord;
}
