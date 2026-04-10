import { table, t } from 'spacetimedb/server';
import { Coordinates, Quaternion } from '../types';
// import { status } from '../types';

export const entity = table(
  { 
    name: 'entity', 
    public: true,
  },
  {
    id: t.string().primaryKey(),
  }
);

export const transform3d = table(
  { 
    name: 'transform3d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    // isDirty:t.bool().default(false), // test
    localPosition: Coordinates,
    localQuaternion: Quaternion,
    localScale: Coordinates,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
    // children: t.array(t.string()), // test
  }
);