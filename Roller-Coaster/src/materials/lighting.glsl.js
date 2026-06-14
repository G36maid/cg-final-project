export const pointLightUniforms = /* glsl */ `
uniform vec3 uPointLightPos[MAX_LIGHTS];
uniform vec3 uPointLightColor[MAX_LIGHTS];
uniform float uPointLightRange[MAX_LIGHTS];
uniform float uAmbient;
uniform int uNumLights;
`;

export const pointLightFunction = /* glsl */ `
vec3 calcPointLights(vec3 worldPos, vec3 normal, vec3 baseColor, float roughness) {
    vec3 color = vec3(0.0);
    
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNumLights) break;
        
        vec3 toLight = uPointLightPos[i] - worldPos;
        float dist = length(toLight);
        
        float atten = 1.0 - clamp(dist / uPointLightRange[i], 0.0, 1.0);
        atten = atten * atten;
        
        float diff = max(dot(normal, normalize(toLight)), 0.0);
        diff *= (1.0 - roughness * 0.5);
        
        color += baseColor * uPointLightColor[i] * diff * atten;
    }
    
    color += uAmbient * baseColor;
    return color;
}
`;
