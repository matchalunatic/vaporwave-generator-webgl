#version 300 es
precision mediump float;
uniform sampler2D u_texture;
in vec2 v_texcoord;
out vec4 myOutputColor;
uniform vec4 u_xBorderColor;
uniform vec4 u_yBorderColor;
bool btw(float v, float lowerBound, float upperBound) {
   return (lowerBound < v && v < upperBound);
}

bool inSpace(float v) {
   return -1.0 <= v && v <= 1.0;
}

bool border(float coord) {
   return btw(coord, -1.0, -0.995) || btw(coord, 0.995, 1.0);
}

void main() {
   // normalize texcoords (0,0) to (1,1) to clip space (-1,-1) to (1,1): * 2 - (1, 1)
   // v_texcoord = a_texcoord * 2.0 - vec2(1, 1);
   // from this, normalize clip space to texture space by doing the opposite
   vec2 coordinates = (v_texcoord + vec2(1.0, 1.0)) * 0.5;
   myOutputColor = texture(u_texture, coordinates);
   
   if (border(v_texcoord.x) && inSpace(v_texcoord.y) && u_xBorderColor.a > 0.0) {
      myOutputColor = u_xBorderColor;
   } else if (border(v_texcoord.y) && inSpace(v_texcoord.x) && u_yBorderColor.a > 0.0) {
      myOutputColor = u_yBorderColor;
   }
   else if (!inSpace(v_texcoord.x) || !inSpace(v_texcoord.y)) {
      // discard;
      myOutputColor = vec4(.1, .5, 0.5, .2); // should discard actually
   }
   else if (myOutputColor.a == 0.0) {
      discard;
   }
   myOutputColor.r += 0.1;
   // myOutputColor.a = 0.5;
}
