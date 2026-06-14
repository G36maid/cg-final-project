export const MAX_LIGHTS = 8;

export const phongVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    uniform mat4 shadowProjectionMatrix;
    uniform mat4 shadowViewMatrix;

    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    varying vec4 vLightNDC;

    const mat4 depthScaleMatrix = mat4(
        0.5, 0, 0, 0,
        0, 0.5, 0, 0,
        0, 0, 0.5, 0,
        0.5, 0.5, 0.5, 1
    );

    void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vUv = uv;
        vLightNDC = depthScaleMatrix * shadowProjectionMatrix * shadowViewMatrix * modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const phongFragment = /* glsl */ `
    precision highp float;

    uniform vec3 uAmbient;
    uniform vec3 uDiffuse;
    uniform vec3 uSpecular;
    uniform float uShininess;

    uniform vec3 uLightPos[${MAX_LIGHTS}];
    uniform vec3 uLightColor[${MAX_LIGHTS}];
    uniform float uLightIntensity[${MAX_LIGHTS}];
    uniform int uNumLights;

    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform float uSunIntensity;

    uniform vec3 cameraPosition;

    uniform sampler2D uMap;
    uniform int uUseMap;

    uniform sampler2D tShadow;

    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;
    varying vec2 vUv;
    varying vec4 vLightNDC;

    float unpackRGBA(vec4 v) {
        return dot(v, 1.0 / vec4(1.0, 255.0, 65025.0, 16581375.0));
    }

    void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);

        vec3 baseColor = uDiffuse;
        if (uUseMap == 1) {
            baseColor *= texture2D(uMap, vUv).rgb;
        }

        vec3 color = uAmbient * baseColor;

        // Shadow calculation
        float shadow = 1.0;
        vec3 lightPos = vLightNDC.xyz / vLightNDC.w;
        float inBounds = step(0.0, lightPos.x) * step(lightPos.x, 1.0)
                       * step(0.0, lightPos.y) * step(lightPos.y, 1.0);
        if (inBounds > 0.5) {
            float bias = 0.002;
            float depth = lightPos.z - bias;
            float occluder = unpackRGBA(texture2D(tShadow, lightPos.xy));
            shadow = mix(0.35, 1.0, step(depth, occluder));
        }

        // Directional sun with shadow
        vec3 sunL = normalize(-uSunDir);
        float sunDiff = max(dot(N, sunL), 0.0);
        color += sunDiff * uSunColor * uSunIntensity * baseColor * shadow;

        // Point lights (not shadowed)
        for (int i = 0; i < ${MAX_LIGHTS}; i++) {
            if (i >= uNumLights) break;

            vec3 toLight = uLightPos[i] - vWorldPos;
            float dist = length(toLight);
            vec3 L = toLight / max(dist, 0.001);

            float attenuation = 1.0 / (1.0 + 0.05 * dist + 0.005 * dist * dist);

            float NdotL = max(dot(N, L), 0.0);
            vec3 diffuse = NdotL * uLightColor[i] * uLightIntensity[i] * baseColor;

            vec3 R = reflect(-L, N);
            float specAngle = max(dot(R, V), 0.0);
            float spec = pow(specAngle, uShininess);
            vec3 specular = spec * uLightColor[i] * uLightIntensity[i] * uSpecular;

            color += (diffuse + specular) * attenuation;
        }

        gl_FragColor = vec4(color, 1.0);
    }
`;
