//-----------------------------------------------
// TRANSFORM 3D TYPES
//-----------------------------------------------
import { t } from 'spacetimedb/server';
export type Vec3 = { x: number; y: number; z: number };        // or keep using your Vect3
export type Quat = { x: number; y: number; z: number; w: number };
// Matrix as flat Float32Array-compatible array (column-major, same as THREE.Matrix4.elements)
export type Mat4 = number[];   // length 16

// Define a nested object type for coordinates
export const Vect3 = t.object('Vect3', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
});

export const Quat = t.object('Quat', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
  w: t.f64(),
});
//-----------------------------------------------
// (in Degrees - Euler XYZ)
//-----------------------------------------------
export const EulerDegrees = t.object('EulerDegrees', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
})
//-----------------------------------------------
// TRANSFORM 3D POSITION, QUATERNION, SCALE, MATRIX, PARENTID
//-----------------------------------------------
export const Transform3DResult = t.object('Transform3DResult',{
  position: t.option(Vect3),
  quaternion: t.option(Quat),
  rotation:t.option(EulerDegrees),
  scale: t.option(Vect3),
  matrix:t.option(t.array(t.f64())),
  parentId: t.option(t.string()),
});


