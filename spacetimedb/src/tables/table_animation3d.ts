//-----------------------------------------------
// 
//-----------------------------------------------
import { table, t } from 'spacetimedb/server';
import { update_transformtri_animation } from '../reducers/reducer_transformtri_animation';

// table: transformtri_animations
export const transformtri_animations = table({ 
    name: 'transformtri_animations',//due number 3 can't be use here.
    scheduled: (): any => update_transformtri_animation
},
{
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
    message: t.string().optional(),
  }
);