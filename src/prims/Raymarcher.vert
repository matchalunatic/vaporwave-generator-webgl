#version 300 es
in vec4 vtx_i;
out vec2 uv;
uniform float u_time;
uniform float u_aspectRatio;
void main() {
    uv = vtx_i.xy * vec2(u_aspectRatio, 1);
    gl_Position = vec4(vtx_i);
    gl_Position.w = 1.;
}
