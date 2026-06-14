import { Vec3 } from '../../ogl/src/index.js';

const WORLD_UP = new Vec3(0, 1, 0);
const MIN_UP_PROJECTION_LENGTH = 0.1;
const STEEP_TANGENT_Y = 0.85;
const TRANSITION_FRAMES = 10;
const LOOP_SEGMENT = 'loop';
const LOOP_CENTER_START_INDEX = 10;
const LOOP_CENTER_END_INDEX = 18;
const INVERTING_SEGMENTS = new Set(['loop', 'helix']);

const tangentProjection = new Vec3();
const candidateNormal = new Vec3();
const loopCenter = new Vec3();
const loopPoint = new Vec3();

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

function reprojectNormalFromReference(tangent, referenceNormal, normal, binormal) {
    candidateNormal.copy(referenceNormal);
    tangentProjection.copy(tangent).scale(candidateNormal.dot(tangent));
    candidateNormal.sub(tangentProjection);

    if (candidateNormal.len() < MIN_UP_PROJECTION_LENGTH) return false;

    normal.copy(candidateNormal).normalize();
    binormal.cross(tangent, normal).normalize();

    return true;
}

function getSegmentControlPointCenter(controlPoints, segment) {
    const center = new Vec3();
    let count = 0;
    const startIndex = segment.name === LOOP_SEGMENT ? LOOP_CENTER_START_INDEX : segment.startIndex + 1;
    const endIndex = segment.name === LOOP_SEGMENT ? LOOP_CENTER_END_INDEX : segment.endIndex;

    for (let i = startIndex; i <= endIndex; i++) {
        const point = controlPoints[i];
        if (!point) continue;

        center.add(point);
        count++;
    }

    if (count > 0) center.scale(1 / count);

    return center;
}

function alignLoopFrameToCenter(path, frameIndex, divisions, center, tangent, normal, binormal) {
    path.getPointAt(frameIndex / divisions, loopPoint);

    candidateNormal.copy(center).sub(loopPoint);
    tangentProjection.copy(tangent).scale(candidateNormal.dot(tangent));
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
        if (currentInverts) continue;

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

export function alignNonInvertingFramesToWorldUp(frames, divisions, controlPoints, segments, path) {
    const segmentNames = [];
    const controlPointCount = controlPoints.length;
    const loopSegment = segments.find((segment) => segment.name === LOOP_SEGMENT);
    const loopFrameCenter = loopSegment ? getSegmentControlPointCenter(controlPoints, loopSegment) : loopCenter;
    const originalNormals = frames.normals.map((normal) => normal.clone());
    const originalBinormals = frames.binormals.map((binormal) => binormal.clone());

    for (let i = 0; i <= divisions; i++) {
        const segmentName = getFrameSegmentName(i, divisions, controlPointCount, segments);
        segmentNames[i] = segmentName;

        if (segmentName === LOOP_SEGMENT && loopSegment) {
            alignLoopFrameToCenter(
                path,
                i,
                divisions,
                loopFrameCenter,
                frames.tangents[i],
                frames.normals[i],
                frames.binormals[i]
            );
            continue;
        }

        if (INVERTING_SEGMENTS.has(segmentName)) continue;

        if (Math.abs(frames.tangents[i].y) > STEEP_TANGENT_Y && i > 0) {
            reprojectNormalFromReference(
                frames.tangents[i],
                frames.normals[i - 1],
                frames.normals[i],
                frames.binormals[i]
            );
            continue;
        }

        if (!reprojectNormalToWorldUp(frames.tangents[i], frames.normals[i], frames.binormals[i]) && i > 0) {
            reprojectNormalFromReference(
                frames.tangents[i],
                frames.normals[i - 1],
                frames.normals[i],
                frames.binormals[i]
            );
        }
    }

    smoothInvertingBoundaries(frames, originalNormals, originalBinormals, segmentNames);

    return frames;
}
