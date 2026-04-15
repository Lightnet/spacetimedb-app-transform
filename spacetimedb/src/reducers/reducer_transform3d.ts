//-----------------------------------------------
// REDUCER TRANSFORM 3D
//-----------------------------------------------
import { t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { 
  computeLocalMatrix3D, 
  multiplyMatrices,
  quaternionFromEulerXYZ, 
} from '../helpers/helper_transform3d';
import { 
  Quat,
  Vect3,
  type Mat4,
} from '../types/types_transform3d';

//-----------------------------------------------
// ADD TRANSFORM 3D
//-----------------------------------------------
export const add_entity_transform3d = spacetimedb.reducer(
  {
    id: t.string(),
    position: t.option(Vect3),      // ← option
    quaternion: t.option(Quat), // ← option
    scale: t.option(Vect3),         // ← option
    parentId: t.option(t.string()), // ← extra useful field
  },
  (ctx, { id, position, quaternion, scale, parentId }) => {
    
    // Prevent duplicate
    if (ctx.db.transform3d.entityId.find(id)) {
      console.log(`Transform3D for entity ${id} already exists. Skipping.`);
      return;
    }

    console.log(`Adding new Transform3D for entity: ${id}`);

    // Safe defaults with fallback
    const safePosition = position ?? { x: 0, y: 0, z: 0 };
    const safeQuaternion = quaternion ?? { x: 0, y: 0, z: 0, w: 1 };
    const safeScale = scale ?? { x: 1, y: 1, z: 1 };
    const safeParentId = parentId ?? "";

    // Compute local matrix from the (possibly provided) values
    const localMat = computeLocalMatrix3D({
      position: safePosition,
      quaternion: safeQuaternion,
      scale: safeScale,
    });

    ctx.db.transform3d.insert({
      entityId:id,
      parentId: safeParentId,
      position: safePosition,
      quaternion: safeQuaternion,
      scale: safeScale,
      localMatrix: localMat as any,
      worldMatrix: localMat as any,   // roots start with local = world
      isDirty: true,
    });

    console.log(`Transform3D added successfully for ${id}`);
  }
);
//-----------------------------------------------
// REMOVE TRANSFORM 3D
//-----------------------------------------------
export const remove_entity_transform3d = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
  ctx.db.transform3d.entityId.delete(id);
});
//-----------------------------------------------
// SET TRANSFORM 3D PARENT
//-----------------------------------------------
export const set_t3_parent = spacetimedb.reducer(
  {id:t.string(), parentId:t.string()},
  (ctx,{id, parentId})=>{
  const parent = ctx.db.transform3d.entityId.find(parentId)
  const child = ctx.db.transform3d.entityId.find(id)
  if(child){
    if(parent){
      ctx.db.transform3d.entityId.update(parent)
      child.parentId = parentId;
    }else{
      child.parentId = undefined;
    }
    ctx.db.transform3d.entityId.update(child)
  }
});
//-----------------------------------------------
// TRANSFORM 3D COMPUTE LOCAL MATRIX
//-----------------------------------------------
export const t3_compute_local_matrix = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    const _transform3d = ctx.db.transform3d.entityId.find(id);
    if(_transform3d){
      let mat = computeLocalMatrix3D(_transform3d)
      // console.log(mat);
      _transform3d.localMatrix = mat;
      ctx.db.transform3d.entityId.update(_transform3d)
    }
});

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
    let worldMat: Mat4;

    if (!transform.parentId || transform.parentId === "") {
      // Root transform
      worldMat = computeLocalMatrix3D(transform);
    } else {
      // Child transform - use parent's worldMatrix (parent should already be updated)
      const parent = ctx.db.transform3d.entityId.find(transform.parentId);
      if (parent?.worldMatrix) {
        // const parentWorld = new THREE.Matrix4().fromArray(parent.worldMatrix);
        // const localMat = computeLocalMatrix3D(transform);
        // worldMat = parentWorld.clone().multiply(localMat);
        const parentWorld = parent.worldMatrix as Mat4;
        const localMat = computeLocalMatrix3D(transform);
        worldMat = multiplyMatrices(parentWorld, localMat);

      } else {
        worldMat = computeLocalMatrix3D(transform);
      }
    }

    // Write back
    transform.worldMatrix = worldMat as Mat4;
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
export const set_t3_pos = spacetimedb.reducer(
  { id: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { id, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(id);
  if(transform){
    console.log("update position");
    transform.position.x = x;
    transform.position.y = y;
    transform.position.z = z;
    let mat = computeLocalMatrix3D(transform)
    transform.localMatrix = mat;
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, id);   // ← link transforms to update
    console.log(transform.position)
    ctx.db.transform3d.entityId.update(transform)
  }
});

//-----------------------------------------------
// SET TRANSFORM 3D LOCAL ROTATION (Euler XYZ in Degrees)
//-----------------------------------------------
export const set_t3_rot = spacetimedb.reducer(
  { id: t.string(), x: t.f64(), y: t.f64(), z: t.f64() },
  (ctx, { id, x, y, z }) => {
    const transform = ctx.db.transform3d.entityId.find(id);
    if (!transform) return;

    console.log(`Updating rotation (Euler XYZ degrees) for entity: ${id}`);

    // Pure math quaternion from Euler XYZ degrees
    const quat = quaternionFromEulerXYZ(x, y, z);

    // Apply to stored quaternion
    transform.quaternion.x = quat.x;
    transform.quaternion.y = quat.y;
    transform.quaternion.z = quat.z;
    transform.quaternion.w = quat.w;

    // Recompute local matrix
    const localMat = computeLocalMatrix3D(transform);
    transform.localMatrix = localMat as any;   // or localMat (if you change type to number[])

    // Mark dirty for hierarchy update
    transform.isDirty = true;
    markSubtreeDirty(ctx, id);

    ctx.db.transform3d.entityId.update(transform);

    console.log(`Rotation updated successfully for ${id}`);
  }
);
//-----------------------------------------------
// SET TRANSFORM QUAT
//-----------------------------------------------
export const set_t3_quat = spacetimedb.reducer(
  { id: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),w:t.f64(),}, 
  (ctx, { id, x, y, z, w }) => {
  const transform = ctx.db.transform3d.entityId.find(id);
  if(transform){
    console.log("update position");
    transform.quaternion.x = x;
    transform.quaternion.y = y;
    transform.quaternion.z = z;
    transform.quaternion.w = w;
    let mat = computeLocalMatrix3D(transform)
    transform.localMatrix = mat;
    // console.log(transform.quaternion)
    transform.isDirty=true;
    markSubtreeDirty(ctx, id);   // ← link transforms to update
    ctx.db.transform3d.entityId.update(transform)
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D SCALE
//-----------------------------------------------
export const set_t3_scale = spacetimedb.reducer(
  { id: t.string(),x:t.f64(), y:t.f64(),z:t.f64(),}, 
  (ctx, { id, x, y, z }) => {
  const transform = ctx.db.transform3d.entityId.find(id);
  if(transform){
    console.log("update position");
    transform.scale.x = x;
    transform.scale.y = y;
    transform.scale.z = z;
    let mat = computeLocalMatrix3D(transform)
    transform.localMatrix = mat;
    transform.isDirty = true; // need to update if there children
    markSubtreeDirty(ctx, id);   // ← link transforms to update
    // console.log(transform.scale)
    ctx.db.transform3d.entityId.update(transform)
  }
});
//-----------------------------------------------
// SET TRANSFORM 3D LOCAL MATRIX
// need to convert to position, quat and scale in case of override.
//-----------------------------------------------
export const set_t3_local_matrix = spacetimedb.reducer(
  { id: t.string(), matrix: t.array(t.f32()) }, 
  (ctx, { id, matrix }) => {
  const transform = ctx.db.transform3d.entityId.find(id);
  if(transform){
    transform.localMatrix = matrix;
    ctx.db.transform3d.entityId.update(transform);
  }
});
//-----------------------------------------------
// SET TRANSFORM WORLD MATRIX
// need to convert to position, quat and scale in case of override.
//-----------------------------------------------
export const set_t3_world_matrix = spacetimedb.reducer(
  { id: t.string(), matrix: t.array(t.f32()) }, 
  (ctx, { id, matrix }) => {
  const transform = ctx.db.transform3d.entityId.find(id);
  if(transform){
    transform.worldMatrix = matrix;
    ctx.db.transform3d.entityId.update(transform);
  }
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const clear_all_transform3ds = spacetimedb.reducer((ctx) => {
  for(const t3d of ctx.db.transform3d.iter()){
    ctx.db.transform3d.entityId.delete(t3d.entityId);
  }
});
