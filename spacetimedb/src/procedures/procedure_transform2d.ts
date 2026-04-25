//-----------------------------------------------
// procedure - uses withTx for safe read access
// this is return value for client and promise sync 
//-----------------------------------------------
import spacetimedb from '../module';
import { t, SenderError  } from 'spacetimedb/server';
import { 
  computeLocal2DMatrix, 
  extractPositionFromMatrix2D, 
  extractRotationFromMatrix2D, 
  extractScaleFromMatrix2D, 
  getParentWorldMatrix2D, 
  identity2D, 
  multiply2D 
} from '../helpers/helper_transform2d';
import { type Matrix2D, Transform2DResult, Vect2 } from '../types/types_transform2d';
//-----------------------------------------------
// GET TRANSFORM2D PARENT ID
//-----------------------------------------------
export const get_t2_parent = spacetimedb.procedure(
  { id: t.string() },
  t.option( t.string() ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;
      return t2d.parentId ?? undefined;
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 2D LOCAL POSITION, ROTATION, SCALE, MATRIX and PARENT ID
//-----------------------------------------------
export const get_t2_local = spacetimedb.procedure(
  { id: t.string() },
  Transform2DResult,   // reuse the same return type
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) {
        return {
          position: undefined,
          rotation: undefined,
          scale: undefined,
          matrix: undefined,
          parentId: undefined,
        };
      }

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      return {
        position: extractPositionFromMatrix2D(local),
        rotation: extractRotationFromMatrix2D(local),
        scale: extractScaleFromMatrix2D(local),
        matrix: t2d.localMatrix ?? undefined,
        parentId:t2d.parentId ?? undefined,
      };
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 2D LOCAL MATRIX
//-----------------------------------------------
export const get_t2_local_matrix = spacetimedb.procedure(
  { id: t.string() },
  t.option(t.array(t.f64())),   // ← return type
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) {
        return undefined
      }
      return t2d.localMatrix ?? undefined; 
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 2D WORLD POSITION, ROTATION AND SCALE
//-----------------------------------------------
export const get_t2_world = spacetimedb.procedure(
  { id: t.string() },
  Transform2DResult,   // ← return type
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) {
        return {
          position: undefined,
          rotation: undefined,
          scale: undefined,
          matrix: undefined,
          parentId: undefined,
        };
      }

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      const parentWorld = getParentWorldMatrix2D(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return {
        position: extractPositionFromMatrix2D(worldMat),
        rotation: extractRotationFromMatrix2D(worldMat),
        scale: extractScaleFromMatrix2D(worldMat),
        matrix: t2d.worldMatrix ?? undefined,
        parentId: t2d.parentId ?? undefined,
      };
    });
  }
);
//-----------------------------------------------
// GET TRANSFORM 2D WORLD MATRIX
//-----------------------------------------------
export const get_t2_world_matrix = spacetimedb.procedure(
  { id: t.string() },
  t.option(t.array(t.f64())),   // ← return type
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) {
        return undefined
      }
      return t2d.worldMatrix ?? undefined; 
    });
  }
);
//-----------------------------------------------
// GET LOCAL POSITION 2D
//-----------------------------------------------
export const get_t2_local_pos = spacetimedb.procedure(
  { id: t.string() },
  t.option( Vect2 ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      return extractPositionFromMatrix2D(local);
    });
  }
);
//-----------------------------------------------
// GET WORLD POSITION 2D
//-----------------------------------------------
export const get_t2_world_pos = spacetimedb.procedure(
  { id: t.string() },
  t.option( Vect2 ),
  // t.option(t.object({ x: t.f64(), y: t.f64() })),// nope
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      const parentWorld = getParentWorldMatrix2D(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractPositionFromMatrix2D(worldMat);
    });
  }
);
//-----------------------------------------------
// GET LOCAL ROTATION 2D 
//-----------------------------------------------
export const get_t2_local_rot = spacetimedb.procedure(
  { id: t.string() },
  t.option( t.f64() ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      return extractRotationFromMatrix2D(local);
    });
});
//-----------------------------------------------
// GET WORLD ROTATION 2D 
//-----------------------------------------------
export const get_t2_world_rot = spacetimedb.procedure(
  { id: t.string() },
  t.option( t.f64() ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      const parentWorld = getParentWorldMatrix2D(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractRotationFromMatrix2D(worldMat);
    });
});
//-----------------------------------------------
// GET LOCAL SCALE 2D 
//-----------------------------------------------
export const get_t2_local_scale = spacetimedb.procedure(
  { id: t.string() },
  t.option( Vect2 ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;
      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      return extractScaleFromMatrix2D(local);
    });
});
//-----------------------------------------------
// GET WORLD SCALE 2D 
//-----------------------------------------------
export const get_t2_world_scale = spacetimedb.procedure(
  { id: t.string() },
  t.option( Vect2 ),
  (ctx, { id }) => {
    return ctx.withTx((tx) => {
      const t2d = tx.db.transform2d.entityId.find(id);
      if (!t2d) return undefined;

      const local = t2d.isDirty 
        ? computeLocal2DMatrix(t2d) 
        : (t2d.localMatrix as Matrix2D) ?? identity2D;

      const parentWorld = getParentWorldMatrix2D(tx, t2d.parentId);
      const worldMat = multiply2D(parentWorld, local);

      return extractScaleFromMatrix2D(worldMat);
    });
});

