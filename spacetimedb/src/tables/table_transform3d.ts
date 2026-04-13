//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import { Coordinates, Quaternion, SVector2 } from '../types';
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
    position: Coordinates,
    quaternion: Quaternion,
    scale: Coordinates,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
//-----------------------------------------------
// 
//-----------------------------------------------