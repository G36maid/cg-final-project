import { Vec3 } from '../../ogl/src/index.js';

const WORLD_UP = new Vec3(0, 1, 0);
const MIN_UP_PROJECTION_LENGTH = 0.1;
const TRANSITION_FRAMES = 10;
const INVERTING_SEGMENTS = new Set(['loop', 'helix']);

const tangentProjection = new Vec3();
const candidateNormal = new Vec3();

function getFrameSegmentName(frameIndex, divisions, controlPointCount, segments) {
    const cpIndex = (frameIndex / divisions) * controlPointCount;
    const segment = segments.find(({ startIndex, endIndex }) => cpIndex >= startIndex && cpIndex < endIndex);

    if (segment) return segment.name;

    return cpIndex >= controlPointCount ? segments[0].name : segments[segments.length - 1].name;
}

function reprojectNormalToWorldUp(tangent, normal, binormal) {
    candidateNormal.copy(WORLD_UP);
    tangentProjection.copy(tangent).scale(tangent.dot(WORLD_UP));
    candidateNormal.sub(tangentProjection);

    if (candidateNormal.len() < MIN_UP_PROJECTION_LENGTH) return false;

    normal.copy(candidateNormal).normalize();
    binormal.cross(tangent, normal).normalize();

    return true;
}

function blendToOriginalNormal(frames, frameIndex, originalNormal, originalBinormal, alpha) {
    const tangent = frames.tangents[frameIndex];
    const normal = frames.normals[frameIndex];
    const binormal = frames.binormals[frameIndex];

    normal.copy(originalNormal).lerp(normal, alpha);

    tangentProjection.copy(tangent).scale(normal.dot(tangent));
    normal.sub(tangentProjection).normalize();

    if (normal.len() < MIN_UP_PROJECTION_LENGTH) {
        normal.copy(originalNormal);
        binormal.copy(originalBinormal);
        return;
    }

    binormal.cross(tangent, normal).normalize();
}

function smoothInvertingBoundaries(frames, originalNormals, originalBinormals, segmentNames) {
    for (let i = 1; i < segmentNames.length; i++) {
        const previousInverts = INVERTING_SEGMENTS.has(segmentNames[i - 1]);
        const currentInverts = INVERTING_SEGMENTS.has(segmentNames[i]);

        if (previousInverts === currentInverts) continue;

        const direction = currentInverts ? -1 : 1;

        for (let step = 0; step < TRANSITION_FRAMES; step++) {
            const frameIndex = i + step * direction;

            if (frameIndex < 0 || frameIndex >= segmentNames.length) break;
            if (INVERTING_SEGMENTS.has(segmentNames[frameIndex])) continue;

            blendToOriginalNormal(
                frames,
                frameIndex,
                originalNormals[frameIndex],
                originalBinormals[frameIndex],
                (step + 1) / TRANSITION_FRAMES
            );
        }
    }
}

export function alignNonInvertingFramesToWorldUp(frames, divisions, controlPointCount, segments) {
    const segmentNames = [];
    const originalNormals = frames.normals.map((normal) => normal.clone());
    const originalBinormals = frames.binormals.map((binormal) => binormal.clone());

    for (let i = 0; i <= divisions; i++) {
        const segmentName = getFrameSegmentName(i, divisions, controlPointCount, segments);
        segmentNames[i] = segmentName;

        if (INVERTING_SEGMENTS.has(segmentName)) continue;

        reprojectNormalToWorldUp(frames.tangents[i], frames.normals[i], frames.binormals[i]);
    }

    smoothInvertingBoundaries(frames, originalNormals, originalBinormals, segmentNames);

    return frames;
}
