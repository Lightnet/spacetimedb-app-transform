//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import { Coordinates, Quaternion, SVector2 } from '../types';
//-----------------------------------------------
// 
//-----------------------------------------------
export const entity = table(
  { 
    name: 'entity', 
    public: true,
  },
  {
    id: t.string().primaryKey(),
  }
);
//-----------------------------------------------
// 
//-----------------------------------------------
export const transform3d = table(
  { 
    name: 'transform3d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    isDirty:t.bool().default(true),
    localPosition: Coordinates,
    localQuaternion: Quaternion,
    localScale: Coordinates,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
//-----------------------------------------------
// 
//-----------------------------------------------
// work in progress
export const transform2d = table(
  { 
    name: 'transform2d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    isDirty:t.bool().default(true),
    position: SVector2,
    rotation: t.f32(),
    scale: SVector2,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
//-----------------------------------------------
// 
//-----------------------------------------------