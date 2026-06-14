export const roundedCubeVertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;

void main() {
    vLocalPosition = position;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
}
`;

export const roundedCubeFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uEmissiveStrength; // default: 0.15
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

void main() {
    float d = sdRoundBox(vLocalPosition, vec3(0.45), 0.08);
    float bodyFill = smoothstep(0.02, -0.02, d);
    float edgeGlow = exp(-18.0 * max(d, 0.0)) * (1.0 - bodyFill);

    if (bodyFill < 0.01 && edgeGlow < 0.01) discard;

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(vec3(0.45, 0.8, 0.35));

    float lambert = max(dot(normal, lightDir), 0.0);
    float ambient = 0.28;
    float diffuse = ambient + lambert * 0.72;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
    float emissive = 1.0 + 0.04 * sin(uTime * 2.5);

    vec3 color = diffuse * uColor
        + emissive * uColor * uEmissiveStrength
        + fresnel * uColor * 0.3
        + edgeGlow * uColor;

    gl_FragColor = vec4(color, bodyFill);
}
`;

export const ghostVertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;

void main() {
    vLocalPosition = position;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
}
`;

export const ghostFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

void main() {
    float d = sdRoundBox(vLocalPosition, vec3(0.45), 0.08);
    float bodyFill = smoothstep(0.02, -0.02, d);
    float edgeGlow = exp(-18.0 * max(d, 0.0)) * (1.0 - bodyFill);

    if (bodyFill < 0.01 && edgeGlow < 0.01) discard;

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
    float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
    float alpha = (0.15 + 0.1 * sin(uTime * 2.0)) * bodyFill;
    vec3 color = uColor * (0.3 + 0.3 * pulse + fresnel * 0.45 + edgeGlow);

    gl_FragColor = vec4(color, alpha);
}
`;

export const lineVertex = /* glsl */ `
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const lineFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
void main() {
    gl_FragColor = vec4(uColor, 1.0);
}
`;

export const particleVertex = /* glsl */ `
attribute vec3 position;
attribute vec3 velocity;
attribute vec4 random;
attribute float life;

uniform float uTime;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying float vLife;
varying vec4 vRandom;

void main() {
    vLife = life;
    vRandom = random;

    float speedFactor = mix(0.5, 1.5, random.x);
    vec3 pos = position + velocity * uTime * speedFactor;
    pos.y -= 0.5 * 9.8 * uTime * uTime * mix(0.05, 0.14, random.y);

    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    vec4 mvPos = viewMatrix * mPos;
    gl_PointSize = 200.0 / length(mvPos.xyz) * life;
    gl_Position = projectionMatrix * mvPos;
}
`;

export const particleFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;

varying float vLife;
varying vec4 vRandom;

void main() {
    float circle = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    vec3 color = uColor * mix(0.85, 1.25, vRandom.x);
    float alpha = circle * vLife;
    gl_FragColor = vec4(color, alpha);
}
`;

export const ringVertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ringFragment = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uProgress;
uniform float uOpacity;

varying vec2 vUv;

void main() {
    vec2 centeredUv = vUv - 0.5;
    float dist = length(centeredUv);
    float radius = mix(0.08, 0.48, uProgress);
    float width = mix(0.08, 0.015, uProgress);
    float outer = smoothstep(radius + width, radius, dist);
    float inner = smoothstep(radius - width, radius, dist);
    float ring = outer * inner;
    float fade = 1.0 - smoothstep(0.65, 1.0, uProgress);
    float intensity = ring * fade;

    gl_FragColor = vec4(uColor * intensity, intensity * uOpacity);
}
`;
