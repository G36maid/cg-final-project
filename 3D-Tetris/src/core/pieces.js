import { COLORS } from './constants.js';

function cell(x, y, z) {
  return { x, y, z };
}

export const PIECES = {
  I: { name: 'I', color: COLORS.I, cells: [cell(0, 0, 0), cell(1, 0, 0), cell(2, 0, 0), cell(3, 0, 0)] },
  O: { name: 'O', color: COLORS.O, cells: [cell(0, 0, 0), cell(1, 0, 0), cell(0, 0, 1), cell(1, 0, 1)] },
  T: { name: 'T', color: COLORS.T, cells: [cell(0, 0, 0), cell(1, 0, 0), cell(2, 0, 0), cell(1, 0, 1)] },
  S: { name: 'S', color: COLORS.S, cells: [cell(1, 0, 0), cell(2, 0, 0), cell(0, 0, 1), cell(1, 0, 1)] },
  Z: { name: 'Z', color: COLORS.Z, cells: [cell(0, 0, 0), cell(1, 0, 0), cell(1, 0, 1), cell(2, 0, 1)] },
  J: { name: 'J', color: COLORS.J, cells: [cell(0, 0, 0), cell(0, 0, 1), cell(1, 0, 1), cell(2, 0, 1)] },
  L: { name: 'L', color: COLORS.L, cells: [cell(2, 0, 0), cell(0, 0, 1), cell(1, 0, 1), cell(2, 0, 1)] },
};

export function rotateCells(cells, axis, dir) {
  return cells.map(({ x, y, z }) => {
    if (axis === 'y') return dir === 1 ? { x: z, y, z: -x } : { x: -z, y, z: x };
    if (axis === 'x') return dir === 1 ? { x, y: -z, z: y } : { x, y: z, z: -y };
    if (axis === 'z') return dir === 1 ? { x: -y, y: x, z } : { x: y, y: -x, z };
    throw new Error(`Invalid rotation axis: ${axis}`);
  });
}
