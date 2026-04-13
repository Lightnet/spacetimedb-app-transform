//-----------------------------------------------
// REDUCER TRANSFORM 3D
//-----------------------------------------------
import { Quaternion, Euler } from 'three';
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { degreeToRadians } from '../helper';
import * as THREE from 'three';
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
      position: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
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
      // children: [],
      isDirty: true,
      // localMatrix: undefined,
      // worldMatrix: undefined
    });
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
// SET TRANSFORM 3D PARENT
//-----------------------------------------------
export const set_transform3d_parent = spacetimedb.reducer(
  {entityId:t.string(), parentId:t.string()},
  (ctx,{entityId, parentId})=>{
  const parent = ctx.db.transform3d.entityId.find(parentId)
  const child = ctx.db.transform3d.entityId.find(entityId)
  if(child){
    if(parent){
      ctx.db.transform3d.entityId.update(parent)
      child.parentId = parentId;
    }else{
      child.parentId = "";
    }
    ctx.db.transform3d.entityId.update(child)
  }
});
//-----------------------------------------------
// TRANSFORM 3D COMPUTE LOCAL MATRIX
//-----------------------------------------------
export const transform3d_compute_local_matrix = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    const _transform3d = ctx.db.transform3d.entityId.find(id);
    if(_transform3d){
      const mat = new THREE.Matrix4();
      mat.compose(
        new THREE.Vector3(_transform3d.position.x, _transform3d.position.y, _transform3d.position.z),
        new THREE.Quaternion(
          _transform3d.quaternion.x,
          _transform3d.quaternion.y,
          _transform3d.quaternion.z,
          _transform3d.quaternion.w
        ),
        // new THREE.Quaternion().setFromEuler(
        //   new THREE.Euler(
        //     _transform3d.localQuaternion.x * Math.PI / 180,
        //     _transform3d.localQuaternion.y * Math.PI / 180,
        //     _transform3d.localQuaternion.z * Math.PI / 180,
        //     'XYZ'
        //   )
        // ),
        new THREE.Vector3(_transform3d.scale.x, _transform3d.scale.y, _transform3d.scale.z)
      );
      _transform3d.localMatrix = mat.elements;
      ctx.db.transform3d.entityId.update(_transform3d)
      // console.log(mat);
      console.log(mat.elements);
    }
});
// Put this near the top of reducer_entity.ts, outside any reducer
function computeLocalMatrix(transform: any): THREE.Matrix4 {
  const mat = new THREE.Matrix4();
  mat.compose(
    new THREE.Vector3(
      transform.position.x,
      transform.position.y,
      transform.position.z
    ),
    new THREE.Quaternion(
      transform.quaternion.x,
      transform.quaternion.y,
      transform.quaternion.z,
      transform.quaternion.w
    ),
    new THREE.Vector3(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z
    )
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

// Efficient BFS version - marks entire subtree dirty when parent changes
function markSubtreeDirty(ctx: any, rootEntityId: string) {
  const toMark: string[] = [rootEntityId];
  const visited = new Set<string>();

  while (toMark.length > 0) {
    const entityId = toMark.shift()!;
    if (visited.has(entityId)) continue;
    visited.add(entityId);

    const transform = ctx.db.transform3d.entityId.find(entityId);
    if (transform) {
      if (!transform.isDirty) {
        transform.isDirty = true;
        ctx.db.transform3d.entityId.update(transform);
      }
    }

    // Find direct children and queue them
    for (const child of ctx.db.transform3d.iter()) {
      if (child.parentId === entityId && !visited.has(child.entityId)) {
        toMark.push(child.entityId);
      }
    }
  }
}
//-----------------------------------------------
// UPDATE ALL TRANSFORM3D TEST
//-----------------------------------------------
//main transforms handle
export const update_all_transform3ds = spacetimedb.reducer((ctx) => {
  console.log("=== Starting transform hierarchy update ===");

  const allTransforms = Array.from(ctx.db.transform3d.iter());
  const dirtyList = allTransforms.filter(t => t.isDirty === true);

  if (dirtyList.length === 0) {
    console.log("No dirty transforms to update.");
    return;
  }

  console.log(`Found ${dirtyList.length} dirty transforms.`);

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
      const child = allTransforms.find((t: any) => t.entityId === childId);
      if (child && child.isDirty) {
        addWithChildren(child);
      }
    }
  }

  // Start from dirty roots (no dirty parent)
  const dirtyRoots = dirtyList.filter(t => 
    !t.parentId || t.parentId === "" || 
    !dirtyList.some(d => d.entityId === t.parentId)
  );

  for (const root of dirtyRoots) {
    addWithChildren(root);
  }

  // Add any remaining dirty transforms
  for (const d of dirtyList) {
    if (!sortedDirty.some(t => t.entityId === d.entityId)) {
      sortedDirty.push(d);
    }
  }

  console.log(`Processing ${sortedDirty.length} transforms in parent→child order.`);

  // Update in correct order
  let updatedCount = 0;
  for (const transform of sortedDirty) {
    let worldMat: THREE.Matrix4;

    if (!transform.parentId || transform.parentId === "") {
      // Root transform
      worldMat = computeLocalMatrix(transform);
    } else {
      // Child transform - use parent's worldMatrix (parent should already be updated)
      const parent = ctx.db.transform3d.entityId.find(transform.parentId);
      if (parent?.worldMatrix) {
        const parentWorld = new THREE.Matrix4().fromArray(parent.worldMatrix);
        const localMat = computeLocalMatrix(transform);
        worldMat = parentWorld.clone().multiply(localMat);
      } else {
        worldMat = computeLocalMatrix(transform);
      }
    }

    // Write back
    transform.worldMatrix = worldMat.elements as any;
    transform.isDirty = false;
    ctx.db.transform3d.entityId.update(transform);
    updatedCount++;
  }

  console.log(`Transform hierarchy update completed. ${updatedCount} transforms updated.`);
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
// SET TRANSFORM 3D LOCAL POSITION
//-----------------------------------------------
export const set_transform3d_position = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { entityId, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update position");
    transform.position.x = x;
    transform.position.y = y;
    transform.position.z = z;
    let mat = computeLocalMatrix(transform)
    transform.localMatrix = mat.elements;
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    console.log(transform.position)
    ctx.db.transform3d.entityId.update(transform)
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D LOCAL ROTATION DEGREE
//-----------------------------------------------
// option using the ui editor degree to radian.
export const set_transform3d_rotation = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64()}, 
  (ctx, { entityId, x, y, z }) => {
  // console.log("ROTATION....");
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
    // console.log("update rotation");
    // console.log(quat);
    // console.log("quat.x: ",quat.x);
    transform.quaternion.x = quat.x;
    transform.quaternion.y = quat.y;
    transform.quaternion.z = quat.z;
    transform.quaternion.w = quat.w;
    let mat = computeLocalMatrix(transform)
    transform.localMatrix = mat.elements;
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    ctx.db.transform3d.entityId.update(transform);
  }
});
//-----------------------------------------------
// SET TRANSFORM QUAT
//-----------------------------------------------
export const set_transform3d_quaternion = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),w:t.f64(),}, 
  (ctx, { entityId, x, y, z, w }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update position");
    transform.quaternion.x = x;
    transform.quaternion.y = y;
    transform.quaternion.z = z;
    transform.quaternion.w = w;
    let mat = computeLocalMatrix(transform)
    transform.localMatrix = mat.elements;
    // console.log(transform.quaternion)
    transform.isDirty=true;
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    ctx.db.transform3d.entityId.update(transform)
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D SCALE
//-----------------------------------------------
export const set_transform3d_scale = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { entityId, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    console.log("update position");
    transform.scale.x = x;
    transform.scale.y = y;
    transform.scale.z = z;
    let mat = computeLocalMatrix(transform)
    transform.localMatrix = mat.elements;
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    // console.log(transform.scale)
    ctx.db.transform3d.entityId.update(transform)
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D LOCAL MATRIX
//-----------------------------------------------
export const set_transform3d_local_matrix = spacetimedb.reducer(
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
export const set_transform3d_world_matrix = spacetimedb.reducer(
  { entityId: t.string(), matrix: t.array(t.f32()) }, 
  (ctx, { entityId, matrix }) => {
  const transform = ctx.db.transform3d.entityId.find(entityId);
  if(transform){
    transform.worldMatrix = matrix;
    ctx.db.transform3d.entityId.update(transform);
  }
});

export const clear_all_transform3ds = spacetimedb.reducer((ctx) => {
  for(const t3d of ctx.db.transform3d.iter()){
    ctx.db.transform3d.entityId.delete(t3d.entityId);
  }
});
