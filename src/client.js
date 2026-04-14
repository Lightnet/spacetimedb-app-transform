//-----------------------------------------------
// index
//-----------------------------------------------
import { connState, networkStatus, userIdentity } from './context';
import { DbConnection, tables } from './module_bindings';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import van from "vanjs-core";
import { Modal, MessageBoard } from "vanjs-ui";
// import { windowRegister } from './window_register';
// import { windowLogin } from './window_login';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";

const { div, input, textarea, button, span, img, label, p, table, tr, td, tbody } = van.tags;
const HOST = 'ws://localhost:3000';
const DB_NAME = 'spacetime-app-transform';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;
const board = new MessageBoard({top: "20px"})
//-----------------------------------------------
//
//-----------------------------------------------
function degreeToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function radiansToDegree(radians) {
  return radians * (180 / Math.PI);
}
// Matrix is now stored as a flat array: [a, b, c, d, e, f, 0, 0, 1]  (row-major, 3x3)
// type Matrix2D = [number, number, number, number, number, number, number, number, number];
const Matrix2D = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function translate2D(x, y) {
  return [1, 0, x, 0, 1, y, 0, 0, 1];
}
function rotate2D(angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
function scale2D(sx, sy) {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}
// Matrix multiplication: C = A * B  (row-major)
function multiply2D(a, b){
  const r = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        r[i*3 + j] += a[i*3 + k] * b[k*3 + j];
      }
    }
  }
  return r;
}
function transformPoint2D(m, x, y) {
  return {
    x: m[0]*x + m[1]*y + m[2],
    y: m[3]*x + m[4]*y + m[5]
  };
}
/**
 * Extracts rotation angle in degrees from a 2D affine matrix (flattened 3x3).
 * Works even with scaling and translation present.
 */
function getRotationFromMatrix2D(m) {
  // Linear part: [ m[0]  m[1] ]
  //               [ m[3]  m[4] ]
  // Use atan2 on the Y-axis vector after transform (more stable)
  const angleRad = Math.atan2(m[3], m[0]);   // sin / cos from first column
  return angleRad * (180 / Math.PI);
}
/**
 * Extract average scale from the 2D world matrix
 */
function getScaleFromMatrix2D(m) {
  const scaleX = Math.hypot(m[0], m[3]);   // length of transformed X axis
  const scaleY = Math.hypot(m[1], m[4]);   // length of transformed Y axis
  return { x: scaleX, y: scaleY };
}

let transform3DFolder;
let localTransform3DFolder;
let worldTransform3DFolder;
let entityLogBinding;
let addTransform3DBinding;
let removeTransform3DBinding;
let deleteEntityBinding;
let hierarchy3DParentBinding;
let hierarchyFolder;
let marker;
let ph_holder;

let addTransform2DBinding;
let removeTransform2DBinding;

let position2DBinding;
let rotation2DBinding;
let scale2DBinding;
let hierarchyParentBinding;
let localTransform2DFolder;
let worldTransform2DFolder;


const PARAMS = {
  entityId:'',
  entities:[],
  transform3d:[],
  transform2d:[],

  ph_position:{x:0,y:1,z:0},
  ph_quaternion:{x:0,y:0,z:0,w:0},
  ph_rotation:{x:0,y:0,z:0},
  ph_scale:{x:1,y:1,z:1},

  t3_position:{x:0,y:0,z:0},
  t3_rotation:{x:0,y:0,z:0},
  t3_scale:{x:1,y:1,z:1},


  w3_position:{x:0,y:0,z:0},
  w3_rotation:{x:0,y:0,z:0},
  w3_scale:{x:1,y:1,z:1},


  t2_position:{x:0,y:0},
  t2_rotation:0,
  t2_scale:{x:1,y:1},


  w2_position:{x:0,y:0,z:0},
  w2_rotation:{x:0,y:0,z:0},
  w2_scale:{x:1,y:1,z:1},
}

//-----------------------------------------------
//
//-----------------------------------------------
const conn = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
  .onConnect((conn, identity, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('connnect');
    networkStatus.val = 'Connected';
    connState.val = conn;
    // console.log("identity: ", identity);
    console.log("identity: ", identity.toHexString());
    // console.log("conn: ", conn);
    userIdentity.val = identity;
    initDB();
  })
  .onDisconnect(() => {
    console.log('Disconnected from SpacetimeDB');
    networkStatus.val = 'Disconnected';
  })
  .onConnectError((_ctx, error) => {
    console.error('Connection error:', error);
    networkStatus.val = 'Connection error';
    // statusEl.textContent = 'Error: ' + error.message;
    // statusEl.style.color = 'red';
  })
  .build();

function initDB(){
  // setUpDBUser();
  setupDBEntity();
  setupDBTransform3D();
  setupDBTransform2D();
}

function onInsert_Entity(_ctx, row){
  console.log(row);
  PARAMS.entities.push(row);
  update_entities_list();
}

function onDelete_Entity(_ctx, row){
  PARAMS.entities=PARAMS.entities.filter(r=>r.id!=row.id)
  update_entities_list();
}

function setupDBEntity(){
  conn.subscriptionBuilder()
    .subscribe(tables.entity)
  conn.db.entity.onInsert(onInsert_Entity)
  conn.db.entity.onDelete(onDelete_Entity)
}
//-----------------------------------------------
// TRANSFORM 3D
//-----------------------------------------------
function createBox(color=0xffffff){
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const wireframe = new THREE.WireframeGeometry( geometry );
  const edges = new THREE.EdgesGeometry(geometry);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // const cube = new THREE.Mesh(wireframe, material);
  const lineMaterial = new THREE.LineBasicMaterial({ color: color });
  // const cubeLine = new THREE.LineSegments(wireframe, lineMaterial);
  const cubeLine = new THREE.LineSegments(edges, lineMaterial);
  cubeLine.matrixAutoUpdate = false; // disable to use matrix
  const axesHelper = new THREE.AxesHelper( 1 ); // '5' is the line size
  cubeLine.add( axesHelper );
  // console.log(cubeLine);
  return cubeLine;
}


function update_model_transform3d(mesh, row){
  // mesh.position.set(
  //   row.position.x,
  //   row.position.y,
  //   row.position.z
  // )
  // let quat = new THREE.Quaternion(
  //   row.quaternion.x,
  //   row.quaternion.y,
  //   row.quaternion.z,
  //   row.quaternion.w
  // )
  // mesh.rotation.setFromQuaternion(quat);
  // mesh.scale.set(
  //   row.scale.x,
  //   row.scale.y,
  //   row.scale.z
  // )
  if(row.worldMatrix){
    const newMatrix = new THREE.Matrix4();
    newMatrix.fromArray(row.worldMatrix)
    // console.log(newMatrix);
    mesh.matrix.copy(newMatrix);
  }
  
}

function insert_model(row){
  let cube = createBox();
  cube.userData.row = row
  update_model_transform3d(cube, row)
  scene.add(cube)
}

function delete_model(ctx, row){
  for(const mesh of scene.children){
    if(mesh.userData?.row?.entityId == row.entityId){
      scene.remove(mesh);
    }
  }
  PARAMS.transform3d=PARAMS.transform3d.filter(r=>r.entityId!=row.entityId);
}

function onInsert_Transfrom3D(_ctx, row){
  // console.log("transform");
  // console.log(row);
  PARAMS.transform3d.push(row);
  insert_model(row);
}

function update_model(row){
  // console.log(row);
  for(const mesh of scene.children ){
    // console.log(mesh);
    if(mesh.userData?.row?.entityId == row.entityId){
      update_model_transform3d(mesh,row)
    }
  }
}

function onUpdate_Transfrom3D(_ctx, oldRow, newRow){
  // console.log("transform");
  // console.log(newRow);
  PARAMS.transform3d = PARAMS.transform3d.filter(r=>r.entityId != newRow.entityId);
  PARAMS.transform3d.push(newRow);
  update_model(newRow);
}

function setupDBTransform3D(){
  conn.subscriptionBuilder()
    .subscribe(tables.transform3d)
  conn.db.transform3d.onInsert(onInsert_Transfrom3D)
  conn.db.transform3d.onUpdate(onUpdate_Transfrom3D)
  conn.db.transform3d.onDelete(delete_model)
}

//-----------------------------------------------
// TRANSFORM 2D
//-----------------------------------------------

function create_2d(){
  let size = 1
  const geometry = new THREE.PlaneGeometry(size, size);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.LineSegments(edges, lineMaterial);
  // mesh.matrixAutoUpdate = false; // disable to use matrix
  return mesh;
}

function update_model2d(mesh, row){
  const worldPos = transformPoint2D(row.worldMatrix, 0, 0);
  let worldScale = getScaleFromMatrix2D(row.worldMatrix)
  // worldRotation = row.rotation;
  mesh.position.set(worldPos.x, worldPos.y, 0);
  const worldRot = getRotationFromMatrix2D(row.worldMatrix);
  mesh.rotation.z = worldRot * (Math.PI / 180);
  mesh.scale.set(worldScale.x, worldScale.y, 1);
}

function insert_model2d(row){
  let cmesh = create_2d();
  cmesh.userData.row = row;
  if(row.worldMatrix){
    // console.log(row.worldMatrix)
    // m3.fromArray(row.worldMatrix);
    update_model2d(cmesh, row);
  }
  scene.add(cmesh)
}

function onInsert_Transfrom2D(_ctx, row){
  // console.log("transform");
  // console.log(row);
  PARAMS.transform2d.push(row);
  insert_model2d(row);
}

function onUpdate_Transfrom2D(_ctx, oldRow, newRow){
  // console.log("transform");
  // console.log(row);
  PARAMS.transform2d = PARAMS.transform2d.filter(r=>r.entityId != newRow.entityId);
  PARAMS.transform2d.push(newRow);

  const cmesh = scene.children.find(r=>r.userData?.row?.entityId == newRow.entityId);
  if(cmesh){
    if(newRow.worldMatrix){
      // console.log(newRow.worldMatrix)
      update_model2d(cmesh, newRow);
    }
  }
}

function delete_model2D(ctx, row){
  for(const mesh of scene.children){
    if(mesh.userData?.row?.entityId == row.entityId){
      scene.remove(mesh);
      break;
    }
  }
  PARAMS.transform2d=PARAMS.transform2d.filter(r=>r.entityId!=row.entityId)

}

function setupDBTransform2D(){
  conn.subscriptionBuilder()
    .subscribe(tables.transform2d)
  conn.db.transform2d.onInsert(onInsert_Transfrom2D)
  conn.db.transform2d.onUpdate(onUpdate_Transfrom2D)
  conn.db.transform2d.onDelete(delete_model2D)
}
//-----------------------------------------------
// 
//-----------------------------------------------
function App(){
  return div(
    div(
      label(() => `Status: ${networkStatus.val}`),
    ),
    div(
      // button({onclick:()=>showLoginWindow()},'Login')
    )
  )
}

let scene;
let camera;
let renderer;
let gizmo;
let orbitControls;

function setup_three(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera.position.z = 5;
  gizmo = new ViewportGizmo(camera, renderer,{
    placement: 'bottom-left',
    // offset: { left: 10, bottom: 10 } // fine-tune distance from edges
  });
  orbitControls = new OrbitControls( camera, renderer.domElement );
  gizmo.attachControls(orbitControls);
  const size = 10;
  const divisions = 10;
  const gridHelper = new THREE.GridHelper( size, divisions );
  scene.add( gridHelper );

  const geometry = new THREE.OctahedronGeometry(0.4);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
  marker = new THREE.LineSegments(edges, lineMaterial);
  scene.add(marker)

  window.addEventListener('resize',onResize);

  // Start the loop
  renderer.setAnimationLoop(animate);

  ph_holder = createBox(0xebe534)
  scene.add(ph_holder)
}

function onResize(){
  // 1. Update sizes based on the new window dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 2. Update camera aspect ratio to prevent stretching
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // 3. Update renderer size
  renderer.setSize(width, height);
  
  // 4. Update pixel ratio for high-DPI screens (optional but recommended)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  gizmo.update();
}

function update_select_marker(){
  if(marker){
    const transform3d = PARAMS.transform3d.find(e => e.entityId === PARAMS.entityId);
    const transform2d = PARAMS.transform2d.find(e => e.entityId === PARAMS.entityId);
    if(transform3d){
      // marker.position.set(
      //   transform.position.x,
      //   transform.position.y,
      //   transform.position.z
      // )
      const matrix = new THREE.Matrix4();
      if(transform3d.worldMatrix){
        matrix.fromArray(transform3d.worldMatrix);
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(matrix);
        marker.position.set(
          position.x,
          position.y,
          position.z
        )
      }
      marker.visible = true;
    } else if(transform2d){
      const worldPos = transformPoint2D(transform2d.worldMatrix, 0, 0);
      let worldRotation = getRotationFromMatrix2D(transform2d.worldMatrix)
      // let worldScale = getScaleFromMatrix2D(transform2d.worldMatrix)

      // worldRotation = row.rotation;
      marker.position.set(worldPos.x, worldPos.y, 0);
      marker.rotation.z = worldRotation;
      // marker.scale.set(worldScale.x, worldScale.y, 1);
      marker.visible = true;
    }else{
      marker.visible = false;
    }
  }
}

function animate() {
  if(orbitControls){
    orbitControls.update();
  }
  update_select_marker();
  renderer.render(scene, camera);
  gizmo.render();
  requestAnimationFrame(animate);
}

setup_three();

// van.add(document.body, windowLogin())
van.add(document.body, App())
//-----------------------------------------------
// TWEAKPANE
//-----------------------------------------------
const pane = new Pane();
//-----------------------------------------------
// ENTITY
//-----------------------------------------------
const entityFolder = pane.addFolder({
  title: 'Entity',
});
entityFolder.addButton({title: 'Create'}).on('click',()=>{
  conn.reducers.createEntity({})
});
deleteEntityBinding = entityFolder.addButton({title: 'Delete Entity'}).on('click',()=>{
  try {
    if(PARAMS.entityId !== "" ){
      conn.reducers.deleteEntity({
        entiyId:PARAMS.entityId
      });
    }
  } catch (error) {
    console.log("delete entity error!");
  }
})
entityFolder.addButton({title: 'Entities Logs'}).on('click',()=>{
  console.log(PARAMS.entities);
  console.log(PARAMS.transform3d);
});

deleteEntityBinding.disabled = true;

let entitiesBinding;

function update_entities_list(){
  let entitiesOptions = [];
  if(entitiesBinding) entitiesBinding.dispose();
  for(const ent of PARAMS.entities){
    entitiesOptions.push({
      text:ent.id,
      value:ent.id,
    })
  }
  entitiesBinding = entityFolder.addBlade({
    view: 'list',
    label: 'Select Entity:',
    options: entitiesOptions,
    value: '',
  }).on('change',(event)=>{
    selectEntity(event.value)
    // console.log(event.value);
    // PARAMS.entityId = event.value;
  });
}

function selectEntity(id){
  const entity = PARAMS.entities.find(e => e.id === id);
  if(!entity) return;
  PARAMS.entityId = id;
  entityLogBinding.disabled = false;
  addTransform3DBinding.disabled = false;
  removeTransform3DBinding.disabled = true;
  deleteEntityBinding.disabled = false;

  // console.log(entity);
  const transform3d = PARAMS.transform3d.find(e => e.entityId === id);
  if(transform3d){
    // console.log(transform);
    PARAMS.t3_position.x = transform3d.position.x;
    PARAMS.t3_position.y = transform3d.position.y;
    PARAMS.t3_position.z = transform3d.position.z;

    let quat = new THREE.Quaternion(transform3d.quaternion.x,transform3d.quaternion.y,transform3d.quaternion.z,transform3d.quaternion.w);
    const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    // console.log(euler);
    PARAMS.t3_rotation.x = THREE.MathUtils.radToDeg(euler.x);
    PARAMS.t3_rotation.y = THREE.MathUtils.radToDeg(euler.y);
    PARAMS.t3_rotation.z = THREE.MathUtils.radToDeg(euler.z);
    // console.log(PARAMS.t3_rotation);
    PARAMS.t3_scale.x = transform3d.scale.x;
    PARAMS.t3_scale.y = transform3d.scale.y;
    PARAMS.t3_scale.z = transform3d.scale.z;
    localTransform3DFolder.disabled = false;
    localTransform3DFolder.refresh();// refresh sub ui children.

    removeTransform3DBinding.disabled = false;
    addTransform3DBinding.disabled = true;
    if(typeof update_transform3d_parent == 'function') update_transform3d_parent();
  }else{
    localTransform3DFolder.disabled = true;
  }

  const _transform2d = PARAMS.transform2d.find(e => e.entityId === id);
  if(_transform2d){

    PARAMS.t2_position = _transform2d.position
    PARAMS.t2_rotation = _transform2d.rotation
    PARAMS.t2_scale = _transform2d.scale

    if(position2DBinding) position2DBinding.refresh()
    if(rotation2DBinding) rotation2DBinding.refresh()
    if(scale2DBinding) scale2DBinding.refresh()
    if(addTransform2DBinding)addTransform2DBinding.disabled = true;
    if(removeTransform2DBinding)removeTransform2DBinding.disabled = false;

    if(update_hierarchy_parent)update_hierarchy_parent();

  }else{
    if(addTransform2DBinding)addTransform2DBinding.disabled = false;
    if(removeTransform2DBinding)removeTransform2DBinding.disabled = true;
  }
}

update_entities_list();
//-----------------------------------------------
// COMPONENT TRANSFORM 3D
//-----------------------------------------------
const component3DFolder = pane.addFolder({
  title: 'Component 3D',
});
const transform3dFolder = component3DFolder.addFolder({
  title: 'Transform 3D',
});
transform3dFolder.addBinding(PARAMS, 'entityId',{
  label:'Select:',
  readonly:true
})
transform3dFolder.addBinding(PARAMS, 'ph_position',{label:'Position'}).on('change',update_place_holder)
transform3dFolder.addBinding(PARAMS, 'ph_rotation',{label:'Rotation'}).on('change',update_place_holder)
transform3dFolder.addBinding(PARAMS, 'ph_scale',{label:'Scale'}).on('change',update_place_holder)

function update_place_holder(){
  ph_holder.matrixAutoUpdate = true;
  ph_holder.position.set(
    PARAMS.ph_position.x,
    PARAMS.ph_position.y,
    PARAMS.ph_position.z
  )
  const radX = THREE.MathUtils.degToRad(PARAMS.ph_rotation.x);
  const radY = THREE.MathUtils.degToRad(PARAMS.ph_rotation.y);
  const radZ = THREE.MathUtils.degToRad(PARAMS.ph_rotation.z);
  // 2. Create Euler angles (default order is 'XYZ')
  const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
  const quat = new THREE.Quaternion().setFromEuler(euler);
  PARAMS.ph_quaternion.x = quat.x;
  PARAMS.ph_quaternion.y = quat.y;
  PARAMS.ph_quaternion.z = quat.z;
  PARAMS.ph_quaternion.w = quat.w;
  ph_holder.quaternion.setFromEuler(euler);
  ph_holder.scale.set(
    PARAMS.ph_scale.x,
    PARAMS.ph_scale.y,
    PARAMS.ph_scale.z
  )
}
addTransform3DBinding = transform3dFolder.addButton({
  title: 'Add Transform 3D',
}).on('click',()=>{
  console.log("add Transform 3D")
  // conn.reducers.addEntityTransform3D({
  //   entityId: PARAMS.entityId
  // });
  conn.reducers.addEntityTransform3D({
    entityId: PARAMS.entityId,
    position:PARAMS.ph_position,
    quaternion:PARAMS.ph_quaternion,
    scale:PARAMS.ph_scale,
  });

  setTimeout(()=>{
    selectEntity(PARAMS.entityId)
  },50)
});
addTransform3DBinding.disabled = true;
removeTransform3DBinding = transform3dFolder.addButton({
  title: 'Remove Transform 3D',
}).on('click',()=>{
  conn.reducers.removeEntityTransform3D({
    entityId:PARAMS.entityId
  })
  setTimeout(()=>{
    selectEntity(PARAMS.entityId)
  },50)
})
removeTransform3DBinding.disabled = true;
entityLogBinding = transform3dFolder.addButton({
  title: 'Entity Log',
}).on('click',()=>{
  const entity = PARAMS.entities.find(e => e.id === PARAMS.entityId);
  console.log(entity)
  const transform = PARAMS.transform3d.find(e => e.entityId === PARAMS.entityId);
  if(transform){
    console.log("transform")
    console.log(transform)
  }
})
entityLogBinding.disabled = true;
//-----------------------------------------------
// TRANSFORM 3D HIERARCHY
//-----------------------------------------------
hierarchyFolder = component3DFolder.addFolder({
  title: 'Transform 3D Hierarchy',
});
hierarchy3DParentBinding = hierarchyFolder.addBlade({
  view: 'list',
  label: 'Parent:',
  options: [
    {text:"None", value:""}
  ],
  value: '',
}).on('change',(event)=>{
  selectEntity(event.value)
  // console.log(event.value);
  // PARAMS.entityId = event.value;
});
const update_transform3d_parent = function (){
  if(hierarchy3DParentBinding) hierarchy3DParentBinding.dispose();
  let parentEntities = []
  parentEntities.push({text:"None", value:""})
  for(const entity of PARAMS.entities){
    if(PARAMS.entityId != entity.id){
      parentEntities.push({
        text:entity.id, value:entity.id
      })
    }
  }
  let parentId = "";
  const transform = PARAMS.transform3d.find(r=>r.entityId==PARAMS.entityId);
  if(transform){
    parentId = transform.parentId;
  }
  hierarchy3DParentBinding = hierarchyFolder.addBlade({
    view: 'list',
    label: 'Parent:',
    options: parentEntities,
    value: parentId,
  }).on('change',(event)=>{
    // selectEntity(event.value)
    // console.log(event.value);
    conn.reducers.setTransform3DParent({
      entityId:PARAMS.entityId,
      parentId:event.value
    })
  });
}
//-----------------------------------------------
// LOCAL TRANSFORM 3D
//-----------------------------------------------
localTransform3DFolder = component3DFolder.addFolder({
  title: 'Local Transform 3D',
});
localTransform3DFolder.disabled=true;
localTransform3DFolder.addBinding(PARAMS, 't3_position',{label:'Position'}).on('change', async()=>{
  if(PARAMS.entityId != ""){
    conn.reducers.setTransform3DPosition({
      entityId:PARAMS.entityId,
      x:PARAMS.t3_position.x,
      y:PARAMS.t3_position.y,
      z:PARAMS.t3_position.z,
    })
    conn.reducers.updateAllTransform3Ds();
    const pos = await conn.procedures.getTransform3DWorldPosition({
      id:PARAMS.entityId,
    });
    console.log(pos);
    if(pos){
      PARAMS.w3_position = pos;
      worldTransform3DFolder.refresh();
    }
  }
});
localTransform3DFolder.addBinding(PARAMS, 't3_rotation',{label:'Rotation'}).on('change', async()=>{
  if(PARAMS.entityId != ""){
    let rotation = new THREE.Euler(
      degreeToRadians(PARAMS.t3_rotation.x),
      degreeToRadians(PARAMS.t3_rotation.y),
      degreeToRadians(PARAMS.t3_rotation.z)
    );
    // console.log(rotation);
    let quat = new THREE.Quaternion();
    quat.setFromEuler(rotation)
    // console.log(quat);
    // conn.reducers.setTransform3DQuaternion({
    //   entityId:PARAMS.entityId,
    //   x:quat.x,
    //   y:quat.y,
    //   z:quat.z,
    //   w:quat.w,
    // });
    conn.reducers.setTransform3DRotation({
      entityId:PARAMS.entityId,
      x:PARAMS.t3_rotation.x,
      y:PARAMS.t3_rotation.y,
      z:PARAMS.t3_rotation.z,
    });
    // conn.reducers.transform3DComputeLocalMatrix({
    //   id:PARAMS.entityId,
    // })
    conn.reducers.updateAllTransform3Ds();
    let rot = await conn.procedures.getTransform3DWorldRotation({
      id:PARAMS.entityId
    });
    if(rot){
      PARAMS.w3_rotation = rot;
      worldTransform3DFolder.refresh();
    }
  }
});
localTransform3DFolder.addBinding(PARAMS, 't3_scale',{label:'Scale'}).on('change', async()=>{
  if(PARAMS.entityId != ""){
    conn.reducers.setTransform3DScale({
      entityId:PARAMS.entityId,
      x:PARAMS.t3_scale.x,
      y:PARAMS.t3_scale.y,
      z:PARAMS.t3_scale.z,
    })
    conn.reducers.updateAllTransform3Ds();
    let scale = await conn.procedures.getTransform3DWorldScale({
      id:PARAMS.entityId
    });
    if(scale){
      PARAMS.w3_scale = scale;
      worldTransform3DFolder.refresh();
    }
  }
});
worldTransform3DFolder = component3DFolder.addFolder({
  title: 'World Transform 3D',
});
worldTransform3DFolder.addBinding(PARAMS, 'w3_position',{label:'Position',disabled:true})
worldTransform3DFolder.addBinding(PARAMS, 'w3_rotation',{label:'Rotation',disabled:true})
worldTransform3DFolder.addBinding(PARAMS, 'w3_scale',{label:'Scale',disabled:true})
//-----------------------------------------------
// COMPONENT TRANSFORM 2D
//-----------------------------------------------
const component2DFolder = pane.addFolder({
  title: 'Component 2D ',
});

let transform2DFolder = component2DFolder.addFolder({
  title: 'Transform 2D',
});
addTransform2DBinding = transform2DFolder.addButton({title:'Add Transform 2D'}).on('click',()=>{
  conn.reducers.addEntityTransform2D({
    entityId:PARAMS.entityId
  });
})
removeTransform2DBinding = transform2DFolder.addButton({title:'Remove Transform 2D'}).on('click',()=>{
  conn.reducers.removeEntityTransform2D({
    entityId:PARAMS.entityId
  });
})
transform2DFolder.addButton({title:'Transform 2D Log'})

let t2dhierarchyFolder = component2DFolder.addFolder({
  title: 'Transform 2D Hierarchy',
});
t2dhierarchyFolder.addButton({title:'Refresh'}).on('click',()=>{
  update_hierarchy_parent();
})

hierarchyParentBinding = t2dhierarchyFolder.addBlade({
  view: 'list',
  label: 'Parent:',
  options: [
    {text:"None", value:""}
  ],
  value: '',
}).on('change',(event)=>{
  // selectEntity2D(event.value)
  console.log(event.value);
  // PARAMS.entityId = event.value;
});

function update_hierarchy_parent(){
  if(hierarchyParentBinding) hierarchyParentBinding.dispose();
  console.log(PARAMS.transform2d);
  let parentOptions = [];
  let parentId = "";
  parentOptions.push({
    text:"None", value:""
  });
  const t2d = PARAMS.transform2d.find(r=>r.entityId == PARAMS.entityId);
  if(t2d){
    console.log(t2d);
    if(t2d.parentId != ""){
      parentId = t2d.parentId;
    }
  }
  for(const entity of PARAMS.entities){
    if(entity.id != PARAMS.entityId){
      parentOptions.push({
        text:entity.id, value:entity.id
      });
    }
  }
  hierarchyParentBinding = t2dhierarchyFolder.addBlade({
    view: 'list',
    label: 'Parent:',
    options:parentOptions,
    value: parentId,
  }).on('change',(event)=>{
    // selectEntity2D(event.value)
    console.log(event.value);
    // PARAMS.entityId = event.value;
    conn.reducers.setTransform2DParent({
      entityId:PARAMS.entityId,
      parentId:event.value
    })
  });
}
//-----------------------------------------------
// LOCAL TRANSFORM 2D
//-----------------------------------------------
localTransform2DFolder = component2DFolder.addFolder({
  title: 'Local Transform 2D',
});
position2DBinding = localTransform2DFolder.addBinding(PARAMS, 't2_position',{label:'Position'}).on('change',()=>{
  // console.log("change position")
  conn.reducers.setTransform2DPosition({
    entityId:PARAMS.entityId,
    x:PARAMS.t2_position.x,
    y:PARAMS.t2_position.y
  });
})
rotation2DBinding = localTransform2DFolder.addBinding(PARAMS, 't2_rotation',{label:'Rotation'}).on('change',()=>{
  conn.reducers.setTransform2DRotation({
    entityId:PARAMS.entityId,
    // rotation: degreeToRadians(PARAMS.t2_rotation)
    rotation: PARAMS.t2_rotation
  })
})
scale2DBinding = localTransform2DFolder.addBinding(PARAMS, 't2_scale',{label:'Scale'}).on('change',()=>{
  conn.reducers.setTransform2DScale({
    entityId:PARAMS.entityId,
    x:PARAMS.t2_scale.x,
    y:PARAMS.t2_scale.y
  })
})
//-----------------------------------------------
// WORLD TRANSFORM 2D
//-----------------------------------------------
worldTransform2DFolder = component2DFolder.addFolder({
  title: 'World Transform 2D',
});
worldTransform2DFolder.addBinding(PARAMS, 'w2_position',{label:'Position', disabled:true});
worldTransform2DFolder.addBinding(PARAMS, 'w2_rotation',{label:'Rotation', disabled:true});
worldTransform2DFolder.addBinding(PARAMS, 'w2_scale',{label:'Scale', disabled:true});

//-----------------------------------------------
// 
//-----------------------------------------------
const testEl = div({style:`position:fixed; top:2px; left:2px;`})
van.add(document.body, testEl);
const testPane = new Pane({container:testEl});
// testPane.expanded = false;
const testFolder = testPane.addFolder({
  title: 'Test',
});
testFolder.expanded = false;

const t3Folder = testFolder.addFolder({
  title: 'Transform3D',
});

const localt3Folder = t3Folder.addFolder({
  title: 'local Transform3D',
});

const worldt3Folder = t3Folder.addFolder({
  title: 'world Transform3D',
});

localt3Folder.addButton({title:'get local'}).on('click', async ()=>{
  const transform2d = await conn.procedures.getTransform3DLocal({
    id:PARAMS.entityId
  })
  console.log("local transform2d: ", transform2d)
});
localt3Folder.addButton({title:'get position'}).on('click', async ()=>{
  const pos = await conn.procedures.getTransform3DLocalPosition({
    id:PARAMS.entityId
  })
  console.log("local postion: ", pos)
});
localt3Folder.addButton({title:'get quaternion'}).on('click', async ()=>{
  const quat = await conn.procedures.getTransform3DLocalQuaternion({
    id:PARAMS.entityId
  })
  console.log("local quat: ", quat)
});
localt3Folder.addButton({title:'get scale'}).on('click', async ()=>{
  const scale = await conn.procedures.getTransform3DLocalScale({
    id:PARAMS.entityId
  })
  console.log("local scale: ", scale)
});
localt3Folder.addButton({title:'get rotation'}).on('click', async ()=>{
  const rotate = await conn.procedures.getTransform3DLocalRotation({
    id:PARAMS.entityId
  })
  console.log("local rotate: ", rotate)
});
worldt3Folder.addButton({title:'get world'}).on('click', async ()=>{
  const t3d = await conn.procedures.getTransform3DWorld({
    id:PARAMS.entityId
  })
  console.log("world transform3d: ", t3d)
});
worldt3Folder.addButton({title:'get position'}).on('click', async ()=>{
  const pos = await conn.procedures.getTransform3DWorldPosition({
    id:PARAMS.entityId
  })
  console.log("local pos: ", pos)
});
worldt3Folder.addButton({title:'get quaternio'}).on('click', async ()=>{
  const quat = await conn.procedures.getTransform3DWorldQuaternion({
    id:PARAMS.entityId
  })
  console.log("local quat: ", quat)
});
worldt3Folder.addButton({title:'get rotation'}).on('click', async ()=>{
  const rotation = await conn.procedures.getTransform3DWorldRotation({
    id:PARAMS.entityId
  })
  console.log("local rotation: ", rotation)
});
worldt3Folder.addButton({title:'get scale'}).on('click', async ()=>{
  const scale = await conn.procedures.getTransform3DWorldScale({
    id:PARAMS.entityId
  })
  console.log("local scale: ", scale)
});

t3Folder.addButton({title:'transform3d list'}).on('click',()=>{
  console.log(PARAMS.transform3d);
});

t3Folder.addButton({title:'update all transforms'}).on('click',()=>{
  conn.reducers.updateAllTransform3Ds();
});

t3Folder.addButton({title:'set all transforms null'}).on('click',()=>{
  conn.reducers.updateAllTransform3DsNull();
});

testFolder.addButton({title:'clear transforms'}).on('click',()=>{
  conn.reducers.clearAllTransform2Ds();
  conn.reducers.clearAllTransform3Ds();
});

const t2Folder = testFolder.addFolder({
  title: 'Transform2D',
});
t2Folder.addButton({title:'get transform3d local matrix'}).on('click', async ()=>{
  const mat = await conn.procedures.getTransform3DLocalMatrix({
    id:PARAMS.entityId
  })
  console.log("mattix: ", mat)
});
t2Folder.addButton({title:'get transform3d world matrix'}).on('click', async ()=>{
  const mat = await conn.procedures.getTransform3DWorldMatrix({
    id:PARAMS.entityId
  })
  console.log("mattix: ", mat)
});
