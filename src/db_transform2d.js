//-----------------------------------------------
// 
//-----------------------------------------------
import * as THREE from 'three';
import { DbConnection, tables } from './module_bindings';
import { connState, dbTransform2Ds, stateScene } from "./context";
import { create_2d } from './render_scene';
import { getRotationFromMatrix2D, getScaleFromMatrix2D, transformPoint2D } from './helper_transform2d';
var scene;

function update_transform2d_matrix(mesh, row){
  const worldPos = transformPoint2D(row.worldMatrix, 0, 0);
  let worldScale = getScaleFromMatrix2D(row.worldMatrix)
  // worldRotation = row.rotation;
  mesh.position.set(worldPos.x, worldPos.y, 0);
  const worldRot = getRotationFromMatrix2D(row.worldMatrix);
  mesh.rotation.z = worldRot * (Math.PI / 180);
  mesh.scale.set(worldScale.x, worldScale.y, 1);
}

function create_transform2d(row){
  let plane = create_2d();
  plane.userData.row = row
  update_transform2d_matrix(plane, row)
  // const scene = stateScene.val;
  scene.add(plane);
}
function addOrUpdateTransfrom2D(row){
  // console.log(row);
  if (!row || !row.entityId) return;
  // console.log("add test:", row);
  const currentMap = dbTransform2Ds.val;        // get current
  const newMap = new Map(currentMap);     // create copy
  newMap.set(row.entityId, row);
  dbTransform2Ds.val = newMap;                  // assign new Map → triggers update
}
function deleteTransfrom2D(id) {
  if (!id) return;
  // Create new Map without the item
  const newMap = new Map(dbTransform2Ds.val);
  newMap.delete(id);
  // Update the state (this is what makes VanJS detect the change)
  dbTransform2Ds.val = newMap;
}

function onInsert_Transfrom2D(_ctx, row){
  // console.log("transform2d:", row);
  create_transform2d(row);
  addOrUpdateTransfrom2D(row);
}

function onUpdate_Transfrom2D(_ctx, oldRow, newRow){
  // console.log("transform3d:", newRow);
  addOrUpdateTransfrom2D(newRow);
  for(const mesh of scene.children){
    if(mesh.userData?.row?.entityId == newRow.entityId){
      update_transform2d_matrix(mesh, newRow)
    }
  }
}

function onDelete_Transform2D(ctx, row){
  const scene = stateScene.val;
  for(const mesh of scene.children){
    if(mesh.userData?.row?.entityId == row.entityId){
      scene.remove(mesh);
    }
  }
  deleteTransfrom2D(row.entityId);
}

export function setupDBTransform2D(){
  scene = stateScene.val;
  const conn = connState.val;
  conn.subscriptionBuilder()
    .subscribe(tables.transform2d)
  conn.db.transform2d.onInsert(onInsert_Transfrom2D)
  conn.db.transform2d.onUpdate(onUpdate_Transfrom2D)
  conn.db.transform2d.onDelete(onDelete_Transform2D)
}