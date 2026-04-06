//-----------------------------------------------
// REDUCER ENTITY
//-----------------------------------------------
import { table, t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
//-----------------------------------------------
// 
//-----------------------------------------------
export const create_entity = spacetimedb.reducer({}, 
  (ctx,{}) => {
    ctx.db.entity.insert({
      id: ctx.newUuidV7().toString()
    });
})
//-----------------------------------------------
// 
//-----------------------------------------------
export const create_entity_transform3d = spacetimedb.reducer(
  { entityId: t.string() }, 
  (ctx, { entityId }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  console.log("transform: ", transform)
  if(!transform){
    console.log("add transform 3d");
    ctx.db.transform3d.insert({
      localPosition: { x: 0, y: 0, z: 0 },
      localQuaternion: { x: 0, y: 0, z: 0, w:1 },
      localScale: { x: 1, y: 1, z: 1 },
      entityId: entityId,
      parentId: "",
      localMatrix: [
        1, 0, 0, 0, // Row 1: X-axis + X-translation
        0, 1, 0, 0, // Row 2: Y-axis + Y-translation
        0, 0, 1, 0, // Row 3: Z-axis + Z-translation
        0, 0, 0, 1 // Row 4: Perspective
      ],
      worldMatrix: [
        1, 0, 0, 0, // Row 1: X-axis + X-translation
        0, 1, 0, 0, // Row 2: Y-axis + Y-translation
        0, 0, 1, 0, // Row 3: Z-axis + Z-translation
        0, 0, 0, 1 // Row 4: Perspective
      ],
      children: [],
      isDirty: false
    });
  }
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const set_entity_local_position = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { entityId, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update position");
    transform.localPosition.x = x;
    transform.localPosition.y = y;
    transform.localPosition.z = z;
    console.log(transform.localPosition)
    ctx.db.transform3d.entityId.update(transform)
  }
});
// test
export const set_entity_local_rotation = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { entityId, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update rotation");
    transform.localQuaternion.x = x;
    transform.localQuaternion.y = y;
    transform.localQuaternion.z = z;
    console.log(transform.localPosition)
    ctx.db.transform3d.entityId.update(transform)
  }
});

export const set_entity_local_quaternion = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),w:t.f64(),}, 
  (ctx, { entityId, x, y, z, w }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update position");
    transform.localQuaternion.x = x;
    transform.localQuaternion.y = y;
    transform.localQuaternion.z = z;
    transform.localQuaternion.w = w;
    console.log(transform.localPosition)
    ctx.db.transform3d.entityId.update(transform)
  }
});

export const set_entity_local_scale = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { entityId, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update position");
    transform.localScale.x = x;
    transform.localScale.y = y;
    transform.localScale.z = z;
    console.log(transform.localPosition)
    ctx.db.transform3d.entityId.update(transform)
  }
});


//-----------------------------------------------
// 
//-----------------------------------------------
export const set_entity_local_matrix = spacetimedb.reducer(
  { entityId: t.string(), matrix: t.array(t.f32()) }, 
  (ctx, { entityId, matrix }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    transform.localMatrix = matrix;
    ctx.db.transform3d.entityId.update(transform);
  }
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const set_entity_world_matrix = spacetimedb.reducer(
  { entityId: t.string(), matrix: t.array(t.f32()) }, 
  (ctx, { entityId, matrix }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    transform.worldMatrix = matrix;
    ctx.db.transform3d.entityId.update(transform);
  }
});
//-----------------------------------------------
// 
//-----------------------------------------------