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
      isDirty: true,
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
      _transform3d.localMatrix = mat.elements;
      ctx.db.transform3d.entityId.update(_transform3d)
      // console.log(mat);
      console.log(mat.elements);
    }
});


// Put this near the top of reducer_entity.txt, outside any reducer
function computeLocalMatrix(transform: any): THREE.Matrix4 {
  const mat = new THREE.Matrix4();
  mat.compose(
    new THREE.Vector3(transform.localPosition.x, transform.localPosition.y, transform.localPosition.z),
    new THREE.Quaternion(
      transform.localQuaternion.x,
      transform.localQuaternion.y,
      transform.localQuaternion.z,
      transform.localQuaternion.w
    ),
    new THREE.Vector3(transform.localScale.x, transform.localScale.y, transform.localScale.z)
  );
  return mat;
}

// function markSubtreeDirty(ctx: any, entityId: string) {
//   const transform = ctx.db.transform3d.entityId.find(entityId);
//   if (!transform) return;
//   transform.isDirty = true;
//   ctx.db.transform3d.entityId.update(transform);
//   // Recursively mark all children dirty
//   for (const child of ctx.db.transform3d.iter()) {
//     if (child.parentId === entityId) {
//       markSubtreeDirty(ctx, child.entityId);
//     }
//   }
// }

// Better version - put this outside reducers
function markSubtreeDirty(ctx: any, rootEntityId: string) {
  const toMark = [rootEntityId];        // queue for BFS
  const visited = new Set<string>();

  while (toMark.length > 0) {
    const entityId = toMark.shift()!;
    if (visited.has(entityId)) continue;
    visited.add(entityId);

    const transform = ctx.db.transform3d.entityId.find(entityId);
    if (transform) {
      transform.isDirty = true;
      ctx.db.transform3d.entityId.update(transform);
    }

    // Find children
    for (const child of ctx.db.transform3d.iter()) {
      if (child.parentId === entityId) {
        toMark.push(child.entityId);
      }
    }
  }
}




//-----------------------------------------------
// UPDATE ALL TRANSFORM3D TEST
//-----------------------------------------------
//main transform handle
export const update_all_transform3ds = spacetimedb.reducer((ctx) => {
  console.log("=== Starting dirty transform hierarchy update ===");

  const allTransforms = Array.from(ctx.db.transform3d.iter());

  // Get currently dirty transforms
  let dirtyList = allTransforms.filter(t => t.isDirty === true);

  if (dirtyList.length === 0) {
    console.log("No dirty transforms.");
    return;
  }

  console.log(`Found ${dirtyList.length} directly dirty transforms.`);

  // Build children map for topological sorting
  const childrenMap = new Map<string, string[]>();
  for (const t of allTransforms) {
    if (t.parentId && t.parentId !== "") {
      if (!childrenMap.has(t.parentId)) childrenMap.set(t.parentId, []);
      childrenMap.get(t.parentId)!.push(t.entityId);
    }
  }

  // Sort dirty transforms: parents before children
  const sortedDirty: any[] = [];

  function addWithChildren(transform: any) {
    if (sortedDirty.some(t => t.entityId === transform.entityId)) return;

    sortedDirty.push(transform);

    const childrenIds = childrenMap.get(transform.entityId) || [];
    for (const childId of childrenIds) {
      const child = allTransforms.find(t => t.entityId === childId);
      if (child && child.isDirty) {
        addWithChildren(child);
      }
    }
  }

  // Start from dirty roots
  const dirtyRoots = dirtyList.filter(t => 
    !t.parentId || t.parentId === "" || 
    !dirtyList.some(d => d.entityId === t.parentId)
  );

  for (const root of dirtyRoots) {
    addWithChildren(root);
  }

  // Add any remaining dirty
  for (const d of dirtyList) {
    if (!sortedDirty.some(t => t.entityId === d.entityId)) {
      sortedDirty.push(d);
    }
  }

  console.log(`Processing ${sortedDirty.length} transforms in order.`);

  // Update in sorted order
  let updatedCount = 0;
  for (const transform of sortedDirty) {
    let worldMat = new THREE.Matrix4();

    if (!transform.parentId || transform.parentId === "") {
      worldMat = computeLocalMatrix(transform);
    } else {
      const parent = ctx.db.transform3d.entityId.find(transform.parentId);
      if (parent && parent.worldMatrix) {
        const parentWorld = new THREE.Matrix4().fromArray(parent.worldMatrix);
        const localMat = computeLocalMatrix(transform);
        worldMat = parentWorld.clone().multiply(localMat);
      } else {
        worldMat = computeLocalMatrix(transform);
      }
    }

    transform.worldMatrix = worldMat.elements as any;
    transform.isDirty = false;
    ctx.db.transform3d.entityId.update(transform);
    updatedCount++;
  }

  console.log(`Updated ${updatedCount} transforms.`);
});


//-----------------------------------------------
// SET ALL TRANSFORM3D MATRIX NULL FOR DIRTY TEST
//-----------------------------------------------
export const update_all_transform3ds_null = spacetimedb.reducer((ctx)=>{
  console.log("matrix");
  for(const entity of ctx.db.transform3d.iter()){
    entity.localMatrix = undefined;
    entity.worldMatrix = undefined;
    ctx.db.transform3d.entityId.update(entity);
  }
})

//-----------------------------------------------
// GET TRANSFORM 3D WORLD MATRIX
//-----------------------------------------------
export const get_transform3d_world_matrix = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
  const _transform3d = ctx.db.transform3d.entityId.find(id);

  if(_transform3d){
    if(!_transform3d.parentId){
      //_transform3d.worldMatrix = 
    }else{
      // get parent world
      // local world 
      // world matrix = parent world matrix multiply 
    }
  }
});

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
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    console.log(transform.localPosition)
    ctx.db.transform3d.entityId.update(transform)
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D LOCAL ROTATION DEGREE
//-----------------------------------------------
// option using the ui editor degree to radian.
export const set_entity_local_rotation = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64()}, 
  (ctx, { entityId, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    
    let quat = new Quaternion();
    quat.setFromEuler(
      new Euler(
        degreeToRadians(x),
        degreeToRadians(y),
        degreeToRadians(z)
      )
    )
    // console.log("quat");
    // console.log(quat);

    // console.log("update rotation");
    transform.localQuaternion.x = quat.x;
    transform.localQuaternion.y = quat.y;
    transform.localQuaternion.z = quat.z;
    transform.localQuaternion.w = quat.w;
    // console.log(transform.localPosition)
    transform.isDirty; // need to update if there children
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
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
    transform.isDirty=true;
    markSubtreeDirty(ctx, entityId);   // ← This is the key line
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
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
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