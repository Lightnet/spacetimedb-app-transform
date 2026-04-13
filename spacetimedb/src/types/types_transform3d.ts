//-----------------------------------------------
// TRANSFORM 3D TYPES
//-----------------------------------------------

export type Vec3 = { x: number; y: number; z: number };        // or keep using your Vect3
export type Quat = { x: number; y: number; z: number; w: number };
// Matrix as flat Float32Array-compatible array (column-major, same as THREE.Matrix4.elements)
export type Mat4 = number[];   // length 16