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
export const delete_entity = spacetimedb.reducer({entiyId:t.string()}, 
  (ctx,{entiyId}) => {
    // need to check transform
    ctx.db.entity.id.delete(entiyId);
    ctx.db.transform2d.entityId.delete(entiyId);
    ctx.db.transform3d.entityId.delete(entiyId);
});

