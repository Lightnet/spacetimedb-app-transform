//-----------------------------------------------
// 
//-----------------------------------------------
// import { t, SenderError } from 'spacetimedb/server';
// import spacetimedb from './module';
import { 
  type Mat4, 
  type Quat, 
  type Vec3 
} from '../types/types_transform3d';

// Helper to create identity matrix
export const mat4Identity = (): Mat4 => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

export function computeLocalMatrix(transform: { 
  position: Vec3; 
  quaternion: Quat; 
  scale: Vec3 
}): Mat4 {
  const { x: px, y: py, z: pz } = transform.position;
  const { x: qx, y: qy, z: qz, w: qw } = transform.quaternion;
  const { x: sx, y: sy, z: sz } = transform.scale;

  // Precompute common terms (same math as THREE.Matrix4.compose)
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;

  const mat: Mat4 = [
    (1 - (yy + zz)) * sx,  (xy + wz) * sy,      (xz - wy) * sz,     0,
    (xy - wz) * sx,       (1 - (xx + zz)) * sy, (yz + wx) * sz,     0,
    (xz + wy) * sx,       (yz - wx) * sy,      (1 - (xx + yy)) * sz, 0,
    px,                   py,                   pz,                  1
  ];

  return mat;
}

export function multiplyMatrices(a: Mat4, b: Mat4): Mat4 {
  const out: Mat4 = new Array(16);

  const a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
  const a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
  const a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8]  = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9]  = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  return out;
}

// Pure math: Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

// Pure math: Create Quaternion from Euler XYZ (in degrees) — same as THREE.js default order
export function quaternionFromEulerXYZ(degreesX: number, degreesY: number, degreesZ: number): Quat {
  const x = degToRad(degreesX);
  const y = degToRad(degreesY);
  const z = degToRad(degreesZ);

  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);

  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,   // qx
    y: c1 * s2 * c3 - s1 * c2 * s3,   // qy
    z: c1 * c2 * s3 + s1 * s2 * c3,   // qz
    w: c1 * c2 * c3 - s1 * s2 * s3    // qw
  };
}

