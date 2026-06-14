import { Mat3, Quat, Vec3 } from '../../ogl/src/index.js';

const MAX_BANKING_ANGLE = 75 * Math.PI / 180;
const frameMatrix = new Mat3();
const normalProjection = new Vec3();

export function tnbToQuat(tangent, normal, binormal, outQuat = new Quat()) {
    frameMatrix.fromBasis(binormal, normal, tangent);
    return outQuat.fromMatrix3(frameMatrix);
}

export function renormalizeFrame(tangent, normal, binormal) {
    tangent.normalize();

    normalProjection.copy(tangent).scale(normal.dot(tangent));
    normal.sub(normalProjection).normalize();

    binormal.cross(tangent, normal).normalize();

    return { tangent, normal, binormal };
}

export function bankingAngleFromCurvature(curvature, speed, g = 9.8) {
    const angle = Math.atan(curvature * speed * speed / g);
    return Math.max(-MAX_BANKING_ANGLE, Math.min(MAX_BANKING_ANGLE, angle));
}
