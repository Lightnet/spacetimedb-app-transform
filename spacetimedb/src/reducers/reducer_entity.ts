//-----------------------------------------------
// REDUCER ENTITY
//-----------------------------------------------
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
//-----------------------------------------------
// CREATE ENTITY
//-----------------------------------------------
export const create_entity = spacetimedb.reducer({}, 
  (ctx,{}) => {
    ctx.db.entity.insert({
      id: ctx.newUuidV7().toString()
    });
});
//-----------------------------------------------
// DELETE ENTITY
//-----------------------------------------------
export const delete_entity = spacetimedb.reducer({id:t.string()}, 
  (ctx,{id}) => {
    // need to check transform
    ctx.db.entity.id.delete(id);
    ctx.db.transform2d.entityId.delete(id);
    ctx.db.transform3d.entityId.delete(id);
});

