//-----------------------------------------------
// REDUCER ENTITY
//-----------------------------------------------
import { Quaternion, Euler } from 'three';
import { table, t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { degreeToRadians } from '../helper';
import * as THREE from 'three';

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
    ctx.db.transform3d.entityId.delete(entiyId);
    ctx.db.entity.id.delete(entiyId);
    // need to check transform
});
//-----------------------------------------------
// ADD TRANSFORM 3D
//-----------------------------------------------
export const add_entity_transform3d = spacetimedb.reducer(
  { entityId: t.string() }, 
  (ctx, { entityId }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  console.log("transform: ", transform)
  if(!transform){
    console.log("add transform 3d");
    ctx.db.transform3d.insert({
      localPosition: { x: 0, y: 0, z: 0 },
      localQuaternion: { x: 0, y: 0, z: 0, w: 1 },
      localScale: { x: 1, y: 1, z: 1 },
      entityId: entityId,
      parentId: "",
      // localMatrix: [
      //   1, 0, 0, 0, // Row 1: X-axis + X-translation
      //   0, 1, 0, 0, // Row 2: Y-axis + Y-translation
      //   0, 0, 1, 0, // Row 3: Z-axis + Z-translation
      //   0, 0, 0, 1 // Row 4: Perspective
      // ],
      // worldMatrix: [
      //   1, 0, 0, 0, // Row 1: X-axis + X-translation
      //   0, 1, 0, 0, // Row 2: Y-axis + Y-translation
      //   0, 0, 1, 0, // Row 3: Z-axis + Z-translation
      //   0, 0, 0, 1 // Row 4: Perspective
      // ],
      // children: [],
      // isDirty: false,
      localMatrix: undefined,
      worldMatrix: undefined
    });
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D PARENT
//-----------------------------------------------
export const set_transform3d_parent = spacetimedb.reducer(
  {entityId:t.string(), parentId:t.string()},
  (ctx,{entityId, parentId})=>{
  const parent = ctx.db.transform3d.entityId.find(parentId)
  const child = ctx.db.transform3d.entityId.find(entityId)
  if(child){
    // if(child.parentId){
    //   const parented = ctx.db.transform3d.entityId.find(entityId);
    //   if(parented){
    //     parented.children=parented.children.filter(r=>r!=child.entityId)
    //     ctx.db.transform3d.entityId.update(parented)
    //   }
    // }
    // parent.children.push(child.entityId);
    if(parent){
      ctx.db.transform3d.entityId.update(parent)
      child.parentId = parentId;
    }else{
      child.parentId = "";
    }
    ctx.db.transform3d.entityId.update(child)
  }
})

export const transform3d_compute_local_matrix = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    const _transform3d = ctx.db.transform3d.entityId.find(id);
    if(_transform3d){
      const mat = new THREE.Matrix4();
      mat.compose(
        new THREE.Vector3(_transform3d.localPosition.x, _transform3d.localPosition.y, _transform3d.localPosition.z),
        new THREE.Quaternion(
          _transform3d.localQuaternion.x,
          _transform3d.localQuaternion.y,
          _transform3d.localQuaternion.z,
          _transform3d.localQuaternion.w
        ),
        // new THREE.Quaternion().setFromEuler(
        //   new THREE.Euler(
        //     _transform3d.localQuaternion.x * Math.PI / 180,
        //     _transform3d.localQuaternion.y * Math.PI / 180,
        //     _transform3d.localQuaternion.z * Math.PI / 180,
        //     'XYZ'
        //   )
        // ),
        new THREE.Vector3(_transform3d.localScale.x, _transform3d.localScale.y, _transform3d.localScale.z)
      );

      // console.log(mat);
      console.log(mat.elements);


    }
});

// function getChildren(ctx: any, parentId: string | null): any[] {
//   return ctx.db.transform3d
//     .filter(e => e.parentId === parentId)
//     .collect();
// }

//-----------------------------------------------
// REMOVE TRANSFORM 3D
//-----------------------------------------------
export const remove_entity_transform3d = spacetimedb.reducer(
  { entityId: t.string() },
  (ctx, { entityId }) => {
  ctx.db.transform3d.entityId.delete(entityId);
});
//-----------------------------------------------
// SET TRANSFORM 3D LOCAL POSITION
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
//-----------------------------------------------
// SET TRANSFORM 3D LOCAL ROTATION DEGREE
//-----------------------------------------------
// option using the ui editor degree to radian.
export const set_entity_local_rotation = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),w:t.f64()}, 
  (ctx, { entityId, x, y, z, w }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){

    transform.localQuaternion.x = x;
    transform.localQuaternion.y = y;
    transform.localQuaternion.z = z;
    transform.localQuaternion.w = w;

    // let quat = new Quaternion();
    // quat.setFromEuler(
    //   new Euler(
    //     degreeToRadians(x),
    //     degreeToRadians(y),
    //     degreeToRadians(z)
    //   )
    // )
    // console.log("quat");
    // console.log(quat);

    // console.log("update rotation");
    // transform.localQuaternion.x = quat.x;
    // transform.localQuaternion.y = quat.y;
    // transform.localQuaternion.z = quat.z;
    // transform.localQuaternion.w = quat.w;
    // console.log(transform.localPosition)
    ctx.db.transform3d.entityId.update(transform);
  }
});
//-----------------------------------------------
// SET TRANSFORM QAUT
//-----------------------------------------------
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
//-----------------------------------------------
// SET TRANSFORM SCALE
//-----------------------------------------------
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
// SET TRANSFORM LOCAL MATRIX
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
// SET TRANSFORM WORLD MATRIX
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