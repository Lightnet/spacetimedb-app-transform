//-----------------------------------------------
// 
//-----------------------------------------------
import * as THREE from 'three';
import { DbConnection, tables } from './module_bindings';
import { connState, dbTransform3Ds, stateScene } from "./context";
import { createBox } from './render_scene';
var scene;
function update_transform3d_matrix(mesh, row){
  if(row.worldMatrix){
    const newMatrix = new THREE.Matrix4();
    newMatrix.fromArray(row.worldMatrix)
    // console.log(newMatrix);
    mesh.matrix.copy(newMatrix);
  }
}
function create_transform3d(row){
  let cube = createBox();
  cube.userData.row = row
  update_transform3d_matrix(cube, row)
  // const scene = stateScene.val;
  scene.add(cube)
}
function update_transform3d(row){
  for(const mesh of scene.children ){
    // console.log(mesh);
    if(mesh.userData?.row?.entityId == row.entityId){
      update_transform3d_matrix(mesh,row)
    }
  }
}

function addOrUpdateTransfrom3D(row){
  if (!row || !row.entityId) return;
  const currentMap = dbTransform3Ds.val;        // get current
  const newMap = new Map(currentMap);     // create copy
  newMap.set(row.entityId, row);
  dbTransform3Ds.val = newMap;                  // assign new Map → triggers update
}
function deleteTransfrom3D(id) {
  if (!id) return;
  // Create new Map without the item
  const newMap = new Map(dbTransform3Ds.val);
  newMap.delete(id);
  // Update the state (this is what makes VanJS detect the change)
  dbTransform3Ds.val = newMap;
}

function onInsert_Transfrom3D(_ctx, row){
  console.log("transform3d:", row);
  create_transform3d(row)
  addOrUpdateTransfrom3D(row);
}

function onUpdate_Transfrom3D(_ctx, oldRow, newRow){
  // console.log("transform3d:", newRow);
  addOrUpdateTransfrom3D(newRow)
  update_transform3d(newRow);
}

function onDelete_Transform3D(ctx, row){
  const scene = stateScene.val;
  for(const mesh of scene.children){
    if(mesh.userData?.row?.entityId == row.entityId){
      scene.remove(mesh);
    }
  }
  deleteTransfrom3D(row.entityId);
}

export function setupDBTransform3D(){
  scene = stateScene.val;
  const conn = connState.val;
  conn.subscriptionBuilder()
    .subscribe(tables.transform3d)
  conn.db.transform3d.onInsert(onInsert_Transfrom3D)
  conn.db.transform3d.onUpdate(onUpdate_Transfrom3D)
  conn.db.transform3d.onDelete(onDelete_Transform3D)
}