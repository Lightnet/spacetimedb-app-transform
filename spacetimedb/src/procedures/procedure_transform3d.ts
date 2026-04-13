//-----------------------------------------------
//
//-----------------------------------------------
// https://spacetimedb.com/docs/functions/procedures
import { table, t } from 'spacetimedb/server';
import spacetimedb from "../module";
import { Vect3, EulerDegrees, Quaternion, Transform3DRotResult } from '../types';
import { 
  type Quat, 
  type Vec3 
} from '../types/types_transform3d';
import { radToDeg } from '../helpers/helper_transform3d';


// Quaternion from Euler XYZ (radians) → same as THREE 'XYZ' order
function quaternionFromEuler(xRad: number, yRad: number, zRad: number): Quat {
  const hx = xRad * 0.5;
  const hy = yRad * 0.5;
  const hz = zRad * 0.5;

  const cx = Math.cos(hx);
  const sx = Math.sin(hx);
  const cy = Math.cos(hy);
  const sy = Math.sin(hy);
  const cz = Math.cos(hz);
  const sz = Math.sin(hz);

  return {
    x: sx * cy * cz + cx * sy * sz,
    y: cx * sy * cz - sx * cy * sz,
    z: cx * cy * sz + sx * sy * cz,
    w: cx * cy * cz - sx * sy * sz
  };
}

// Euler XYZ (radians) from Quaternion (same as THREE 'XYZ')
function eulerFromQuaternion(q: Quat): { x: number; y: number; z: number } {
  const { x, y, z, w } = q;

  // Roll (x)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y)
  const sinp = 2 * (w * y - z * x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2; // use 90 degrees if out of range
  } else {
    pitch = Math.asin(sinp);
  }

  // Yaw (z)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { x: roll, y: pitch, z: yaw };
}

// Simple Matrix4 decompose (position + rotation quaternion + scale)
function decomposeMatrix(matrix: number[]): {
  position: Vec3;
  quaternion: Quat;
  scale: Vec3;
} {
  if (matrix.length < 16) {
    throw new Error("Matrix must have 16 elements");
  }

  // Position is the last column (elements 12,13,14)
  const position: Vec3 = {
    x: matrix[12],
    y: matrix[13],
    z: matrix[14]
  };

  // Extract scale and rotation matrix
  const m00 = matrix[0], m01 = matrix[1], m02 = matrix[2];
  const m10 = matrix[4], m11 = matrix[5], m12 = matrix[6];
  const m20 = matrix[8], m21 = matrix[9], m22 = matrix[10];

  const sx = Math.hypot(m00, m10, m20);
  const sy = Math.hypot(m01, m11, m21);
  const sz = Math.hypot(m02, m12, m22);

  const scale: Vec3 = { x: sx, y: sy, z: sz };

  // Rotation matrix (normalize by scale)
  const invSx = sx === 0 ? 0 : 1 / sx;
  const invSy = sy === 0 ? 0 : 1 / sy;
  const invSz = sz === 0 ? 0 : 1 / sz;

  const rotMat = [
    m00 * invSx, m01 * invSy, m02 * invSz,
    m10 * invSx, m11 * invSy, m12 * invSz,
    m20 * invSx, m21 * invSy, m22 * invSz
  ];

  // Quaternion from rotation matrix
  const trace = rotMat[0] + rotMat[4] + rotMat[8];
  let qw = 1, qx = 0, qy = 0, qz = 0;

  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0);
    qw = 0.25 / s;
    qx = (rotMat[5] - rotMat[7]) * s;
    qy = (rotMat[6] - rotMat[2]) * s;
    qz = (rotMat[1] - rotMat[3]) * s;
  } else if (rotMat[0] > rotMat[4] && rotMat[0] > rotMat[8]) {
    const s = 2.0 * Math.sqrt(1.0 + rotMat[0] - rotMat[4] - rotMat[8]);
    qw = (rotMat[5] - rotMat[7]) / s;
    qx = 0.25 * s;
    qy = (rotMat[1] + rotMat[3]) / s;
    qz = (rotMat[2] + rotMat[6]) / s;
  } else if (rotMat[4] > rotMat[8]) {
    const s = 2.0 * Math.sqrt(1.0 + rotMat[4] - rotMat[0] - rotMat[8]);
    qw = (rotMat[6] - rotMat[2]) / s;
    qx = (rotMat[1] + rotMat[3]) / s;
    qy = 0.25 * s;
    qz = (rotMat[5] + rotMat[7]) / s;
  } else {
    const s = 2.0 * Math.sqrt(1.0 + rotMat[8] - rotMat[0] - rotMat[4]);
    qw = (rotMat[1] - rotMat[3]) / s;
    qx = (rotMat[2] + rotMat[6]) / s;
    qy = (rotMat[5] + rotMat[7]) / s;
    qz = 0.25 * s;
  }

  const quaternion: Quat = { x: qx, y: qy, z: qz, w: qw };

  return { position, quaternion, scale };
}



//-----------------------------------------------
// GET TRANSFORM 3D LOCAL MATRIX
//-----------------------------------------------
export const get_transform3d_local_matrix = spacetimedb.procedure(
  { id: t.string() },
  t.option( t.array(t.f64()) ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      console.log(t3d?.localMatrix);
      if(t3d){
        return t3d.localMatrix ?? undefined;
      }
      return undefined;
  });
});
//-----------------------------------------------
// GET TRANSFORM 3D WORLD MATRIX
//-----------------------------------------------
export const get_transform3d_world_matrix = spacetimedb.procedure(
  { id: t.string() },
  t.option( t.array(t.f64()) ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if(t3d){
        return t3d.worldMatrix ?? undefined;
      }
      return undefined;
  });
});
//-----------------------------------------------
// 
//-----------------------------------------------
const Transform3DResult = t.object('Transform3DResult',{
  position: t.option(Vect3),
  quaternion: t.option(Quaternion),
  scale: t.option(Vect3),
  matrix:t.option(t.array(t.f64()))
});
//-----------------------------------------------
// GET TRANSFORM 3D LOCAL
//-----------------------------------------------
export const get_transform3d_local = spacetimedb.procedure(
  { id: t.string() },
  t.option( Transform3DResult ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d) {
        return {
          position: undefined,
          quaternion: undefined,
          scale: undefined,
          matrix: undefined,
        };
      }

      return {
        position: t3d.position ?? undefined,
        quaternion: t3d.quaternion ?? undefined,
        scale: t3d.scale ?? undefined,
        // You can also return localMatrix if you want the full matrix
        matrix: t3d.localMatrix ?? undefined,
      };
  });
});
//-----------------------------------------------
// GET TRANSFORM 3D LOCAL POSITION
//-----------------------------------------------
export const get_transform3d_local_position = spacetimedb.procedure(
  { id: t.string() },
  t.option( Vect3 ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if(t3d){
        return t3d.position ?? undefined;
      }
      return undefined;
  });
});
//-----------------------------------------------
// GET TRANSFORM 3D LOCAL QUATERNION
//-----------------------------------------------
export const get_transform3d_local_quaternion = spacetimedb.procedure(
  { id: t.string() },
  t.option( Quaternion ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if(t3d){
        return t3d.quaternion ?? undefined;
      }
      return undefined;
  });
});
//-----------------------------------------------
// GET TRANSFORM 3D LOCAL ROTATION (in Degrees - Euler XYZ)
//-----------------------------------------------
//-----------------------------------------------
// GET TRANSFORM 3D LOCAL ROTATION (in Degrees - Euler XYZ)
//-----------------------------------------------
export const get_transform3d_local_rotation = spacetimedb.procedure(
  { id: t.string() },
  t.option(EulerDegrees),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d?.quaternion) return undefined;

      const eulerRad = eulerFromQuaternion(t3d.quaternion);
      return {
        x: radToDeg(eulerRad.x),
        y: radToDeg(eulerRad.y),
        z: radToDeg(eulerRad.z),
      };
    });
  }
);


//-----------------------------------------------
// GET TRANSFORM 3D LOCAL SCALE
//-----------------------------------------------
export const get_transform3d_local_scale = spacetimedb.procedure(
  { id: t.string() },
  t.option( Vect3 ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if(t3d){
        return t3d.scale ?? undefined;
      }
      return undefined;
  });
});
//-----------------------------------------------
// GET TRANSFORM 3D WORLD (decomposed)
//-----------------------------------------------
export const get_transform3d_world = spacetimedb.procedure(
  { id: t.string() },
  t.option(Transform3DResult),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d?.worldMatrix || t3d.worldMatrix.length < 16) return undefined;

      const { position, quaternion, scale } = decomposeMatrix(t3d.worldMatrix);

      return {
        position,
        quaternion,
        scale,
        matrix: t3d.worldMatrix,
      };
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 3D WORLD POSITION
//-----------------------------------------------
export const get_transform3d_world_position = spacetimedb.procedure(
  { id: t.string() },
  t.option(Vect3),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
    const transform = tx.db.transform3d.entityId.find(id);
    if (!transform || !transform.worldMatrix || transform.worldMatrix.length < 16) {
      return undefined;
    }

    // World position is stored in the last column of the matrix (elements 12, 13, 14)
    return {
      x: transform.worldMatrix[12],
      y: transform.worldMatrix[13],
      z: transform.worldMatrix[14],
    };
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 3D WORLD QUATERNION
//-----------------------------------------------
export const get_transform3d_world_quaternion = spacetimedb.procedure(
  { id: t.string() },
  t.option(Quaternion),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d?.worldMatrix || t3d.worldMatrix.length < 16) return undefined;

      return decomposeMatrix(t3d.worldMatrix).quaternion;
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 3D WORLD ROTATION (in Degrees - Euler XYZ)
//-----------------------------------------------
export const get_transform3d_world_rotation = spacetimedb.procedure(
  { id: t.string() },
  t.option(EulerDegrees),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d?.worldMatrix || t3d.worldMatrix.length < 16) return undefined;

      const { quaternion } = decomposeMatrix(t3d.worldMatrix);
      const eulerRad = eulerFromQuaternion(quaternion);

      return {
        x: radToDeg(eulerRad.x),
        y: radToDeg(eulerRad.y),
        z: radToDeg(eulerRad.z),
      };
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 3D WORLD SCALE
//-----------------------------------------------
export const get_transform3d_world_scale = spacetimedb.procedure(
  { id: t.string() },
  t.option(Vect3),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d?.worldMatrix || t3d.worldMatrix.length < 16) return undefined;

      return decomposeMatrix(t3d.worldMatrix).scale;
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 3D WORLD (full: pos + quat + rotation degrees + scale + matrix)
//-----------------------------------------------
export const get_transform3d_world_rot = spacetimedb.procedure(
  { id: t.string() },
  t.option(Transform3DRotResult),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t3d = tx.db.transform3d.entityId.find(id);
      if (!t3d?.worldMatrix || t3d.worldMatrix.length < 16) return undefined;

      const { position, quaternion, scale } = decomposeMatrix(t3d.worldMatrix);
      const eulerRad = eulerFromQuaternion(quaternion);

      return {
        position,
        quaternion,
        rotation: {
          x: radToDeg(eulerRad.x),
          y: radToDeg(eulerRad.y),
          z: radToDeg(eulerRad.z),
        },
        scale,
        matrix: t3d.worldMatrix,
      };
    });
  }
);
