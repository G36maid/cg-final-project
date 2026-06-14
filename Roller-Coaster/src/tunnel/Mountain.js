import { Mesh, Sphere, Vec3 } from '../../ogl/src/index.js';
import { TUNNEL_HEIGHT, TUNNEL_LIGHT_SPACING, COLORS, MAX_LIGHTS, TRACK_DIVISIONS } from '../config.js';

const MOUNTAIN_RADIUS = 30;

export function createMountain(gl, rockProgram, trackPath) {
    const geom = new Sphere(gl, { radius: MOUNTAIN_RADIUS, widthSegments: 64, heightSegments: 32 });
    const mesh = new Mesh(gl, { geometry: geom, program: rockProgram });

    const startFrame = trackPath.tunnelStartFrame;
    const endFrame = trackPath.tunnelEndFrame;
    const midFrame = Math.floor((startFrame + endFrame) / 2);
    const midT = midFrame / TRACK_DIVISIONS;
    const center = trackPath.getPointAt(midT, new Vec3());

    mesh.position.copy(center);
    mesh.position.y -= 5;
    mesh.scale.set(1, 0.8, 1);

    return mesh;
}

export function computeTunnelLights(trackPath) {
    const startFrame = trackPath.tunnelStartFrame;
    const endFrame = trackPath.tunnelEndFrame;
    const positions = [];
    const colors = [];
    const ranges = [];
    const previousPoint = new Vec3();
    const currentPoint = new Vec3();
    let distanceSinceLight = TUNNEL_LIGHT_SPACING;

    trackPath.getPointAt(startFrame / TRACK_DIVISIONS, previousPoint);

    for (let frameIndex = startFrame; frameIndex <= endFrame && ranges.length < MAX_LIGHTS; frameIndex++) {
        const t = frameIndex / TRACK_DIVISIONS;
        trackPath.getPointAt(t, currentPoint);

        if (frameIndex > startFrame) {
            distanceSinceLight += currentPoint.distance(previousPoint);
        }

        if (distanceSinceLight >= TUNNEL_LIGHT_SPACING) {
            const pos = currentPoint.clone();
            const normal = trackPath.frames.normals[frameIndex];

            pos.add(normal.clone().scale(TUNNEL_HEIGHT * 0.8));

            positions.push(pos.x, pos.y, pos.z);
            colors.push(COLORS.TUNNEL_LIGHT[0], COLORS.TUNNEL_LIGHT[1], COLORS.TUNNEL_LIGHT[2]);
            ranges.push(15.0);
            distanceSinceLight = 0;
        }

        previousPoint.copy(currentPoint);
    }

    const count = ranges.length;

    return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        ranges: new Float32Array(ranges),
        count: count,
    };
}

export function populateLightUniforms(program, lights) {
    for (let i = 0; i < lights.positions.length; i++) {
        program.uniforms.uPointLightPos.value[i] = lights.positions[i];
    }
    for (let i = 0; i < lights.colors.length; i++) {
        program.uniforms.uPointLightColor.value[i] = lights.colors[i];
    }
    for (let i = 0; i < lights.ranges.length; i++) {
        program.uniforms.uPointLightRange.value[i] = lights.ranges[i];
    }
    program.uniforms.uNumLights.value = lights.count;
}
