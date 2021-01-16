const vertex = `#version 300 es
const vec3 lightDirection1 = normalize(vec3(0.0, 1.0, 1.0)); // x, y, z
const vec3 lightDirection2 = normalize(vec3(1.0, 0.0, 1.0));
const vec3 lightDirection3 = normalize(vec3(-1.0, -1.0, -1.0));
const float ambient = 0.2;
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;
uniform mat4 uMvpMatrix;
uniform mat4 normalMatrix;
out float vBrightness;
out vec2 vTexCoord;
//out vec3 vNormal;
void main() {
    vec3 worldNormal = normalize((uMvpMatrix * vec4(aNormal, 0)).xyz);
    //vNormal = aNormal;
    float diffuse1 = max(0.0, dot(worldNormal, lightDirection1));
    float diffuse2 = max(0.0, dot(worldNormal, lightDirection2));
    float diffuse3 = max(0.0, dot(worldNormal, lightDirection3));
    vTexCoord = aTexCoord;
    vBrightness = ambient + diffuse1 + diffuse2 + diffuse3;
    gl_Position = uMvpMatrix * aPosition;
}`;


const fragment = `#version 300 es
precision mediump float;
uniform mediump sampler2D uTexture;
in vec2 vTexCoord;
//in vec3 vNormal;
in float vBrightness;
out vec4 oColor;
void main() {
    //oColor = vec4(vNormal, 1);
    oColor = texture(uTexture, vTexCoord);
    oColor.xyz *= vBrightness;
}`;

export default {
    simple: { vertex, fragment }
};