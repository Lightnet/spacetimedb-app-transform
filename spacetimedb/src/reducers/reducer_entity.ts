//-----------------------------------------------
// REDUCER ENTITY
//-----------------------------------------------
import { Quaternion, Euler } from 'three';
import { t, SenderError } from 'spacetimedb/server';
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
// Put this near the top of reducer_entity.ts, outside any reducer
function computeLocalMatrix(transform: any): THREE.Matrix4 {
  const mat = new THREE.Matrix4();
  mat.compose(
    new THREE.Vector3(
      transform.localPosition.x,
      transform.localPosition.y,
      transform.localPosition.z
    ),
    new THREE.Quaternion(
      transform.localQuaternion.x,
      transform.localQuaternion.y,
      transform.localQuaternion.z,
      transform.localQuaternion.w
    ),
    new THREE.Vector3(
      transform.localScale.x,
      transform.localScale.y,
      transform.localScale.z
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
export const set_transform3d_position = spacetimedb.reducer(
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
    transform.localQuaternion.x = quat.x;
    transform.localQuaternion.y = quat.y;
    transform.localQuaternion.z = quat.z;
    transform.localQuaternion.w = quat.w;
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
    transform.localQuaternion.x = x;
    transform.localQuaternion.y = y;
    transform.localQuaternion.z = z;
    transform.localQuaternion.w = w;
    // console.log(transform.localPosition)
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


//-----------------------------------------------
//  TRANSFORM 2D
//-----------------------------------------------

//-----------------------------------------------
// ADD ENTITY TRANSFORM 2D
//-----------------------------------------------
export const add_entity_transform2d = spacetimedb.reducer(
  { entityId: t.string() }, 
  (ctx, { entityId }) => {
  const _transform2d = ctx.db.transform2d.entityId.find(entityId);
  console.log("transform: ", _transform2d)
  if(!_transform2d){
    console.log("add transform 2d");
    ctx.db.transform2d.insert({
      position: { x: 0, y: 0},
      rotation: 0,
      scale: { x: 1, y: 1 },
      entityId: entityId,
      parentId: "",
      isDirty: true,
      localMatrix: [
        1, 0, 0, // Column 1 (X-axis)
        0, 1, 0, // Column 2 (Y-axis)
        0, 0, 1  // Column 3 (Translation/Homogeneous)
      ],
      worldMatrix: [
        1, 0, 0, // Column 1 (X-axis)
        0, 1, 0, // Column 2 (Y-axis)
        0, 0, 1  // Column 3 (Translation/Homogeneous)
      ],
    });
  }
});


// Matrix is now stored as a flat array: [a, b, c, d, e, f, 0, 0, 1]  (row-major, 3x3)
type Matrix2D = [number, number, number, number, number, number, number, number, number];

const identity: Matrix2D = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function translate2D(x: number, y: number): Matrix2D {
  return [1, 0, x, 0, 1, y, 0, 0, 1];
}

function rotate2D(angleDeg: number): Matrix2D {
  const rad = angleDeg * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function scale2D(sx: number, sy: number): Matrix2D {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

// Matrix multiplication: C = A * B  (row-major)
function multiply2D(a: Matrix2D, b: Matrix2D): Matrix2D {
  const r: Matrix2D = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        r[i*3 + j] += a[i*3 + k] * b[k*3 + j];
      }
    }
  }
  return r;
}

//-----------------------------------------------
// ADD TRANSFORM 2D POSITION
//-----------------------------------------------
export const set_transform2d_position = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64()}, 
  (ctx, { entityId, x, y}) => {
  const _transform2d = ctx.db.transform2d.entityId.find(entityId);
  if(_transform2d){
    console.log("update position2d");
    _transform2d.position.x = x;
    _transform2d.position.y = y;


    let localMatrix:Matrix2D = multiply2D(
      translate2D(_transform2d.position.x, _transform2d.position.y),
      multiply2D(rotate2D(_transform2d.rotation), scale2D(_transform2d.scale.x, _transform2d.scale.y))
    );
    console.log(localMatrix)

    _transform2d.localMatrix = localMatrix;
    _transform2d.worldMatrix = localMatrix;


    // let matrix = new THREE.Matrix3();

    // let mScale = new THREE.Matrix3().makeScale(_transform2d.scale.x, _transform2d.scale.y);
    // let mRot = new THREE.Matrix3().makeRotation(_transform2d.rotation);
    // let mTrans = new THREE.Matrix3().makeTranslation(_transform2d.position.x, _transform2d.position.y);

    // // Order: Translate * Rotate * Scale
    // matrix.multiplyMatrices(mTrans, mRot);
    // matrix.multiply(mScale);

    // _transform2d.localMatrix = matrix.elements;
    // _transform2d.worldMatrix = matrix.elements;
    // console.log(matrix.elements);

    // transform.isDirty = true; // need to update if there children
    // markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    console.log(_transform2d.position)
    ctx.db.transform2d.entityId.update(_transform2d)
  }
});
//-----------------------------------------------
// ADD TRANSFORM 2D ROTATION
//-----------------------------------------------
export const set_transform2d_rotation = spacetimedb.reducer(
  { entityId: t.string(), rotation:t.f64()}, 
  (ctx, { entityId, rotation}) => {
  const _transform2d = ctx.db.transform2d.entityId.find(entityId);
  if(_transform2d){
    console.log("update position2d");
    _transform2d.rotation = rotation;

    // entity.localMatrix = multiply2D(
    //   translate2D(entity.position.x, entity.position.y),
    //   multiply2D(rotate2D(entity.rotation), scale2D(entity.scale.x, entity.scale.y))
    // );

    let localMatrix:Matrix2D = multiply2D(
      translate2D(_transform2d.position.x, _transform2d.position.y),
      multiply2D(rotate2D(_transform2d.rotation), scale2D(_transform2d.scale.x, _transform2d.scale.y))
    );

    // let matrix = new THREE.Matrix3();

    // let mScale = new THREE.Matrix3().makeScale(_transform2d.scale.x, _transform2d.scale.y);
    // let mRot = new THREE.Matrix3().makeRotation(_transform2d.rotation);
    // let mTrans = new THREE.Matrix3().makeTranslation(_transform2d.position.x, _transform2d.position.y);

    // // Order: Translate * Rotate * Scale
    // matrix.multiplyMatrices(mTrans, mRot);
    // matrix.multiply(mScale);

    // _transform2d.localMatrix = matrix.elements;
    // _transform2d.worldMatrix = matrix.elements;
    _transform2d.localMatrix = localMatrix;
    _transform2d.worldMatrix = localMatrix;

    // transform.isDirty = true; // need to update if there children
    // markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    // console.log(transform.localPosition)
    ctx.db.transform2d.entityId.update(_transform2d)
  }
});
//-----------------------------------------------
// ADD TRANSFORM 2D SCALE
//-----------------------------------------------
export const set_transform2d_scale = spacetimedb.reducer(
  { entityId: t.string(),x:t.f64(), y:t.f64()}, 
  (ctx, { entityId, x, y}) => {
  const _transform2d = ctx.db.transform2d.entityId.find(entityId);
  if(_transform2d){
    console.log("update position2d");
    _transform2d.scale.x = x;
    _transform2d.scale.y = y;

    let localMatrix:Matrix2D = multiply2D(
      translate2D(_transform2d.position.x, _transform2d.position.y),
      multiply2D(rotate2D(_transform2d.rotation), scale2D(_transform2d.scale.x, _transform2d.scale.y))
    );
    _transform2d.localMatrix = localMatrix;
    _transform2d.worldMatrix = localMatrix;

    // transform.isDirty = true; // need to update if there children
    // markSubtreeDirty(ctx, entityId);   // ← link transforms to update
    // console.log(transform.localPosition)
    ctx.db.transform2d.entityId.update(_transform2d)
  }
});













