#version 300 es
precision highp float;

out vec4 out_color;
uniform float u_time;
uniform vec4 u_edgeColor;
uniform vec4 u_fillColor;
#define EDGE_WIDTH 0.008

in vec3 vBC;

void main() {
    if (abs(vBC.x) < EDGE_WIDTH || abs(vBC.y) < EDGE_WIDTH || abs(vBC.z) < EDGE_WIDTH) {
        if (u_edgeColor.a > 0.0) {
            out_color = u_edgeColor;
        } else {
            out_color = u_fillColor;
        }
    } else {
        out_color = u_fillColor;
    }
    
}
