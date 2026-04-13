//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import { Vect3, Quaternion } from '../types';
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
    position: Vect3,
    quaternion: Quaternion,
    scale: Vect3,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
//-----------------------------------------------
// 
//-----------------------------------------------