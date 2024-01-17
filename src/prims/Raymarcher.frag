#version 300 es
precision highp float;
in vec2 uv;
out vec4 out_color;
uniform float u_time;

#define RM_MAX_DISTANCE 3000.
#define RM_MAX_STEPS 100
#define COLL_DISTANCE 0.001

float get_khaos(vec3 pos, float factor) {
    return factor * (sin(u_time * .005) * (sin(pos.x) + 0.5 * sin(pos.y) + 0.2 * sin(pos.z)));

}

float get_khaos_speed(vec3 pos, float factor, float timeFactor) {
    return factor * (sin(u_time * timeFactor) * (sin(pos.x) + 0.5 * sin(pos.y) + 0.2 * sin(pos.z)));

}
float add_khaos(float v, float factor, vec3 pos) {
    float khaos = get_khaos(pos, factor);
    return v + khaos;
}


bool withinMargin(float val, float comparison) {
    return (val >= 0. && val <= comparison) || (val < 0. && val >= - abs(comparison));
}

float off(float v) {
    return 100.;
}

float on(float v) {
    return v;
}

float mmin(float a, float b) {
    return min(a, b);
}
float mmin(float a, float b, float c) {
    return min(a, (min(b, c)));
}

float mmin(float a, float b, float c, float d) {
    return min(mmin(a, b, c), d);
}

float mmin(float a, float b, float c, float d, float e) {
    return min(mmin(a, b, c, d), e);
}

float mmin(float a, float b, float c, float d, float e, float f) {
    return min(mmin(a, b, c, d, e), f);
}

float sdf_sphere(vec3 pos, vec3 center) {
    return distance(pos, center) - 1.;
}

float mmax(float a, float b) {
    return max(a, b);
}
float mmax(float a) {
    return mmax(a, a);
}

float mmax(float a, float b, float c) {
    return mmax(a, mmax(b, c));
}

float sdf_cube(vec3 pos, vec3 center) {
    return mmax(abs(pos.x - center.x) - 1., abs(pos.y - center.y) - 1., abs(pos.z - center.z) - 1.);
}

// donut around Z axis
float sdf_donut(vec3 pos, vec3 center, float fillRatio, float halfHeight) {
    return mmax(
        center.z - pos.z + halfHeight, // donut breadth
        0.
        );
}

const vec3 sphere1Center = vec3(0., 0., -0.);
const vec3 sphere2Center = vec3(0.5, -0.5, -1);
const vec3 donutCenter = vec3(0.51, 1, 0);
const vec3 sceneCenter = vec3(0., 0., -1.);


vec3 rotateVector(vec3 V, vec3 axis, float theta) {
    // Ensure the axis is a unit vector
    axis = normalize(axis);

    // Calculate the rotation matrix
    float c = cos(theta);
    float s = sin(theta);
    float t = 1.0 - c;

    mat3 rotationMatrix = mat3(
        t * axis.x * axis.x + c,     t * axis.x * axis.y - s * axis.z, t * axis.x * axis.z + s * axis.y,
        t * axis.x * axis.y + s * axis.z, t * axis.y * axis.y + c,     t * axis.y * axis.z - s * axis.x,
        t * axis.x * axis.z - s * axis.y, t * axis.y * axis.z + s * axis.x, t * axis.z * axis.z + c
    );

    // Apply the rotation to the vector
    vec3 rotatedVector = rotationMatrix * V;

    return rotatedVector;
}

float scene(vec3 pos) {
    float s1r = 2.2;
    float s2r = 0.3;
//    return sdf_wheel(pos, donutCenter, 3., vec3(0., 1., 0.), 0.5);

    return mmin(
        sdf_cube(rotateVector(pos, normalize(vec3(1, 0, 1)), u_time / 1000.) * 1.5, sceneCenter) / 1.5,
        sdf_donut(pos, sphere1Center, 0.5, 1.)
    );
}

vec3 get_normal(vec3 pos) {
    const vec3 quantum = vec3(0.001, 0, 0);
    float dx = scene(pos + quantum.xyy) - scene(pos -quantum.xyy);
    float dy = scene(pos + quantum.yxy) - scene(pos - quantum.yxy);
    float dz = scene(pos + quantum.yyx) - scene(pos - quantum.yyx);
    vec3 normal = normalize(vec3(dx, dy, dz));
    return normal;
}

vec4 diffuse_lighting(vec3 light_color, vec3 light_position, vec3 pos, vec3 normal) {
    vec3 arrow_to_light = normalize(pos - light_position);
    float diffuse_intensity = max(0., dot(normal, arrow_to_light));
    return vec4(light_color * diffuse_intensity, 1.0);
}

vec4 do_ray_march(vec3 origin, vec3 direction) {
    float totalDistance = 0.;
    float currentDistance = 0.;
    vec3 pos = origin;
    vec3 normal;
    for (int i = 0; i < RM_MAX_STEPS; i++) {
        if (totalDistance > RM_MAX_DISTANCE) {
            break;
        }
        pos = origin + totalDistance * direction;
        currentDistance = scene(pos);
        if (withinMargin(currentDistance, COLL_DISTANCE)) {
            // hit
            // get the normal vector
            normal = get_normal(pos);
            vec4 lght = (diffuse_lighting(vec3(1, 1, 1), sphere1Center, pos, normal) + diffuse_lighting(vec3(1, 0.5, 0.), sphere2Center, pos, normal)) / 2.;
            lght.w = 1.;
            return lght;
        }
        totalDistance += currentDistance;

    }
    return vec4(0.2, 0, 0, 1);
}

void main() {
    const vec3 camera = vec3(0., 0., -5);
    vec3 rayDirection = vec3(uv, 1.);
    out_color = do_ray_march(camera, rayDirection);
}

