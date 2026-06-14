// ============================================================================
// 3D Pinball — GLSL Shaders
// All shader programs: ball PBR, lit, neon emissive, glass, particles, bloom.
// ============================================================================

// ── Ball: Custom PBR Shader (metalness 0.95 + cubemap envMap) ──────────────
export const ballVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform vec3 cameraPosition;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const ballFragment = /* glsl */ `
    precision highp float;

    uniform samplerCube tEnvMap;
    uniform vec3 uColor;
    uniform float uMetallic;
    uniform float uRoughness;
    uniform vec3 uLightDir;
    uniform vec3 uLightColor;
    uniform vec3 uLight2Dir;
    uniform vec3 uLight2Color;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    const float PI = 3.14159265359;

    void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uLightDir);
        vec3 H = normalize(L + V);
        vec3 R = reflect(-V, N);

        // Fresnel (Schlick approximation)
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);

        // Environment reflection from cubemap
        vec3 envColor = textureCube(tEnvMap, R).rgb;

        // Specular (simplified GGX-ish)
        float specPower = mix(8.0, 128.0, 1.0 - uRoughness);
        float spec = pow(max(dot(N, H), 0.0), specPower);
        vec3 specColor = mix(vec3(0.04), uColor, uMetallic) * spec * uLightColor;

        // Second light (fill light)
        vec3 L2 = normalize(uLight2Dir);
        vec3 H2 = normalize(L2 + V);
        float spec2 = pow(max(dot(N, H2), 0.0), specPower * 0.5);
        specColor += mix(vec3(0.04), uColor, uMetallic) * spec2 * uLight2Color * 0.5;

        // Diffuse
        float NdotL = max(dot(N, L), 0.0);
        float NdotL2 = max(dot(N, L2), 0.0);
        vec3 diffuse = uColor * (1.0 - uMetallic) * (NdotL * uLightColor + NdotL2 * uLight2Color * 0.3) / PI;

        // Combine
        vec3 color = diffuse + specColor;
        // Metallic reflection from environment
        float reflStrength = uMetallic * (0.6 + 0.4 * fresnel);
        color = mix(color, envColor * (uColor * 0.5 + 0.5), reflStrength);

        // Edge fresnel glow
        color += envColor * fresnel * 0.3 * uMetallic;

        // Tone mapping (Reinhard)
        color = color / (color + vec3(1.0));
        // Gamma
        color = pow(color, vec3(1.0 / 2.2));

        gl_FragColor = vec4(color, 1.0);
    }
`;

// ── Lit Shader (table base, walls, flippers, plunger — basic Phong) ────────
export const litVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform vec3 cameraPosition;

    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vWorldPos;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const litFragment = /* glsl */ `
    precision highp float;

    uniform vec3 uColor;
    uniform vec3 uLightDir;
    uniform vec3 uLightColor;
    uniform float uEmissive;

    varying vec3 vNormal;
    varying vec3 vViewDir;
    varying vec3 vWorldPos;

    void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uLightDir);
        vec3 H = normalize(L + V);

        float NdotL = max(dot(N, L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), 32.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        vec3 color = uColor * (0.2 + 0.8 * NdotL) * uLightColor;
        color += vec3(1.0) * spec * 0.3;
        color += uColor * fresnel * 0.5;
        color += uColor * uEmissive;

        gl_FragColor = vec4(color, 1.0);
    }
`;

// ── Neon Emissive Shader (bumpers, slingshots, tri-bumpers, light strips) ──
export const neonVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform vec3 cameraPosition;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const neonFragment = /* glsl */ `
    precision highp float;

    uniform vec3 uColor;
    uniform float uTime;
    uniform float uPulse;     // 0=normal, 1=hit pulse
    uniform float uBreath;    // 0=normal, breathing animation

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);

        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5);

        // Base emissive intensity
        float intensity = 1.5 + uPulse * 3.0;
        // Breathing animation
        intensity += sin(uTime * 2.0) * 0.3 * uBreath;

        vec3 color = uColor * intensity;
        // Fresnel rim glow — extra bright for bloom
        color += uColor * fresnel * 2.0;

        gl_FragColor = vec4(color, 1.0);
    }
`;

// ── Glass Shader (transparent cover with fresnel) ──────────────────────────
export const glassVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    uniform vec3 cameraPosition;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const glassFragment = /* glsl */ `
    precision highp float;

    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);

        float fresnel = pow(1.0 - abs(dot(N, V)), 3.0);
        // Subtle shimmer
        float shimmer = sin(uTime * 1.5 + N.x * 5.0 + N.z * 3.0) * 0.05;

        vec3 color = uColor * (fresnel * 1.5 + 0.1 + shimmer);
        float alpha = uOpacity + fresnel * 0.4;

        gl_FragColor = vec4(color, alpha);
    }
`;

// ── Particle Shader (gl.POINTS with circular fade) ─────────────────────────
export const particleVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec4 aColor;
    attribute float aSize;
    attribute float aLife;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float uTime;

    varying vec4 vColor;
    varying float vLife;

    void main() {
        vColor = aColor;
        vLife = aLife;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * 200.0 / length(mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
    }
`;

export const particleFragment = /* glsl */ `
    precision highp float;

    varying vec4 vColor;
    varying float vLife;

    void main() {
        vec2 uv = gl_PointCoord.xy - 0.5;
        float dist = length(uv);
        float circle = smoothstep(0.5, 0.2, dist);
        float alpha = circle * vLife * vColor.a;

        gl_FragColor = vec4(vColor.rgb, alpha);
    }
`;

// ── Bloom Post-Processing Shaders ──────────────────────────────────────────
export const bloomVertex = /* glsl */ `
    attribute vec2 uv;
    attribute vec2 position;

    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`;

export const brightPassFragment = /* glsl */ `
    precision highp float;

    uniform sampler2D tMap;
    uniform float uThreshold;

    varying vec2 vUv;

    void main() {
        vec4 tex = texture2D(tMap, vUv);
        float luminance = length(tex.rgb) / 1.73205;
        vec4 bright = tex * step(uThreshold, luminance);
        gl_FragColor = bright;
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
    uniform vec2 uResolution;
    uniform float uBloomStrength;

    varying vec2 vUv;

    void main() {
        vec4 scene = texture2D(tMap, vUv);
        vec4 bloom = texture2D(tBloom, vUv);
        gl_FragColor = scene + bloom * uBloomStrength;
    }
`;
