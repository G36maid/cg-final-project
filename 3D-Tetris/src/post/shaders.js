export const postVertex = /* glsl */ `
attribute vec2 uv;
attribute vec3 position;
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const brightPassFragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uThreshold;
varying vec2 vUv;

void main() {
    vec4 tex = texture2D(tMap, vUv);
    float luma = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
    float soft = clamp((luma - uThreshold + 0.15) / 0.3, 0.0, 1.0);
    soft = soft * soft * (3.0 - 2.0 * soft);
    gl_FragColor = vec4(tex.rgb * soft, 1.0);
}
`;

export const blurFragment = /* glsl */ `
precision highp float;

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.3333333333333333) * direction;
    color += texture2D(image, uv) * 0.29411764705882354;
    color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
    color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
    return color;
}

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.3846153846) * direction;
    vec2 off2 = vec2(3.2307692308) * direction;
    color += texture2D(image, uv) * 0.2270270270;
    color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
    color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
    color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
    color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
    return color;
}

uniform sampler2D tMap;
uniform vec2 uDirection;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
    gl_FragColor = blur9(tMap, vUv, uResolution, uDirection);
}
`;

export const compositeFragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform sampler2D tBloom;
uniform float uBloomStrength;
varying vec2 vUv;

void main() {
    vec4 scene = texture2D(tMap, vUv);
    vec4 bloom = texture2D(tBloom, vUv);
    gl_FragColor = scene + bloom * uBloomStrength;
}
`;

export const grayscaleFragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uAmount;
varying vec2 vUv;

void main() {
    vec4 color = texture2D(tMap, vUv);
    float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(mix(color.rgb, vec3(luma), uAmount), color.a);
}
`;
