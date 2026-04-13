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
import { decomposeMatrix, eulerFromQuaternion, radToDeg } from '../helpers/helper_transform3d';

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
