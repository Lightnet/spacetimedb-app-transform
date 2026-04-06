import { table, t } from 'spacetimedb/server';
import { Coordinates } from '../types';
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
    isDirty:t.bool().default(false),
    localPosition: Coordinates,
    localQuaternion: Coordinates,
    localScale: Coordinates,
    localMatrix: t.array(t.f32()),
    worldMatrix: t.array(t.f32()),
    children: t.array(t.string()),
  }
);