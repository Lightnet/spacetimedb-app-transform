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

let transform3DFolder;
let transform3DPropsFolder;
let positionBinding;
let rotationBinding;
let scaleBinding;
let entityLogBinding;
let addTransform3DBinding;
let removeTransform3DBinding;
let deleteEntityBinding;
let hierarchyListBinding;
let hierarchyFolder;
let marker;
// let boxHelper;

const PARAMS = {
  entityId:'',
  entities:[],
  transform3d:[],

  t_position:{x:0,y:0,z:0},
  t_rotation:{x:0,y:0,z:0},
  t_scale:{x:1,y:1,z:1},
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
function createBox(){
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const wireframe = new THREE.WireframeGeometry( geometry );
  const edges = new THREE.EdgesGeometry(geometry);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // const cube = new THREE.Mesh(wireframe, material);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  // const cubeLine = new THREE.LineSegments(wireframe, lineMaterial);
  const cubeLine = new THREE.LineSegments(edges, lineMaterial);
  cubeLine.matrixAutoUpdate = false; // disable to use matrix
  const axesHelper = new THREE.AxesHelper( 1 ); // '5' is the line size
  cubeLine.add( axesHelper );
  // console.log(cubeLine);
  return cubeLine;
}

function update_model_transform(mesh, row){
  // mesh.position.set(
  //   row.localPosition.x,
  //   row.localPosition.y,
  //   row.localPosition.z
  // )
  // let quat = new THREE.Quaternion(
  //   row.localQuaternion.x,
  //   row.localQuaternion.y,
  //   row.localQuaternion.z,
  //   row.localQuaternion.w
  // )
  // mesh.rotation.setFromQuaternion(quat);
  // mesh.scale.set(
  //   row.localScale.x,
  //   row.localScale.y,
  //   row.localScale.z
  // )
  if(row.worldMatrix){
    const newMatrix = new THREE.Matrix4();
    newMatrix.fromArray(row.worldMatrix)
    console.log(newMatrix);
    mesh.matrix.copy(newMatrix);
  }
  
}

function insert_model(row){
  let cube = createBox();
  cube.userData.row = row
  update_model_transform(cube, row)
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
      update_model_transform(mesh,row)
    }
  }
}

function onUpdate_Transfrom3D(_ctx, oldRow, newRow){
  console.log("transform");
  console.log(newRow);
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
    const transform = PARAMS.transform3d.find(e => e.entityId === PARAMS.entityId);
    if(transform){
      // marker.position.set(
      //   transform.localPosition.x,
      //   transform.localPosition.y,
      //   transform.localPosition.z
      // )
      const matrix = new THREE.Matrix4();
      if(transform.worldMatrix){
        matrix.fromArray(transform.worldMatrix);
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(matrix);
        marker.position.set(
          position.x,
          position.y,
          position.z
        )
      }
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
entityFolder.addButton({
  title: 'Create',
  // label: 'counter',   // optional
}).on('click',()=>{
  conn.reducers.createEntity({})
});
deleteEntityBinding = entityFolder.addButton({
  title: 'Delete Entity',
}).on('click',()=>{
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
  transform3DPropsFolder.disabled = true;
  const transform = PARAMS.transform3d.find(e => e.entityId === id);
  if(!transform) return;
  // console.log(transform);
  PARAMS.t_position.x = transform.localPosition.x;
  PARAMS.t_position.y = transform.localPosition.y;
  PARAMS.t_position.z = transform.localPosition.z;
  if(positionBinding) positionBinding.refresh();

  // console.log(transform?.localQuaternion);
  let quat = new THREE.Quaternion(transform.localQuaternion.x,transform.localQuaternion.y,transform.localQuaternion.z,transform.localQuaternion.w);
  const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
  // console.log(euler);
  PARAMS.t_rotation.x = THREE.MathUtils.radToDeg(euler.x);
  PARAMS.t_rotation.y = THREE.MathUtils.radToDeg(euler.y);
  PARAMS.t_rotation.z = THREE.MathUtils.radToDeg(euler.z);
  // console.log(PARAMS.t_rotation);
  if(rotationBinding) rotationBinding.refresh();
  PARAMS.t_scale.x = transform.localScale.x;
  PARAMS.t_scale.y = transform.localScale.y;
  PARAMS.t_scale.z = transform.localScale.z;
  if(scaleBinding) scaleBinding.refresh();
  transform3DPropsFolder.disabled = false;
  removeTransform3DBinding.disabled = false;
  addTransform3DBinding.disabled = true;
  if(typeof update_transform3d_parent == 'function') update_transform3d_parent();
}

update_entities_list();
//-----------------------------------------------
// ENTITY TRANSFORM 3D HIERARCHY
// hierarchy 
//-----------------------------------------------
hierarchyFolder = pane.addFolder({
  title: 'Transform 3D Hierarchy',
});

hierarchyListBinding = hierarchyFolder.addBlade({
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

console.log("typeof hierarchyListBinding")
console.log(typeof hierarchyListBinding)

const update_transform3d_parent = function (){
  // console.log(hierarchyListBinding);
  // if(!hierarchyListBinding) return;
  if(hierarchyListBinding) hierarchyListBinding.dispose();

  let parentEntities = []
  parentEntities.push({text:"None", value:""})
  for(const entity of PARAMS.entities){
    if(PARAMS.entityId != entity.id){
      parentEntities.push({
        text:entity.id, value:entity.id
      })
    }
  }

  hierarchyListBinding = hierarchyFolder.addBlade({
    view: 'list',
    label: 'Parent:',
    options: parentEntities,
    value: '',
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
// ENTITY TRANSFORM 3D
//-----------------------------------------------
const transform3dFolder = pane.addFolder({
  title: 'Entity Transform 3D',
});
transform3dFolder.addBinding(PARAMS, 'entityId',{
  label:'Select:',
  readonly:true
})
addTransform3DBinding = transform3dFolder.addButton({
  title: 'Add Transform 3D',
}).on('click',()=>{
  console.log("add Transform 3D")
  conn.reducers.addEntityTransform3D({
    entityId: PARAMS.entityId
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
// ENTITY TRANSFORM 3D PROPS
//-----------------------------------------------
transform3DPropsFolder = pane.addFolder({
  title: 'Transform 3D Props',
});
transform3DPropsFolder.disabled=true;

positionBinding = transform3DPropsFolder.addBinding(PARAMS, 't_position',{label:'Position'}).on('change',()=>{
  if(PARAMS.entityId != ""){
    conn.reducers.setEntityLocalPosition({
      entityId:PARAMS.entityId,
      x:PARAMS.t_position.x,
      y:PARAMS.t_position.y,
      z:PARAMS.t_position.z,
    })
  }
  conn.reducers.updateAllTransform3Ds();
});

rotationBinding = transform3DPropsFolder.addBinding(PARAMS, 't_rotation',{label:'Rotation'}).on('change',()=>{

  let rotation = new THREE.Euler(
    degreeToRadians(PARAMS.t_rotation.x),
    degreeToRadians(PARAMS.t_rotation.y),
    degreeToRadians(PARAMS.t_rotation.z)
  );

  let quat = new THREE.Quaternion();
  quat.setFromEuler(rotation)
  // console.log(rotation);
  if(PARAMS.entityId != ""){
    // console.log(quat);
    conn.reducers.setEntityLocalQuaternion({
      entityId:PARAMS.entityId,
      x:quat.x,
      y:quat.y,
      z:quat.z,
      w:quat.w,
    })
    // conn.reducers.setEntityLocalRotation({
    //   entityId:PARAMS.entityId,
    //   x:PARAMS.t_rotation.x,
    //   y:PARAMS.t_rotation.y,
    //   z:PARAMS.t_rotation.z,
    // })
    // conn.reducers.setEntityLocalRotation({
    //   entityId:PARAMS.entityId,
    //   x:rotation.x,
    //   y:rotation.y,
    //   z:rotation.z,
    // })

    // conn.reducers.setEntityLocalRotation({
    //   entityId:PARAMS.entityId,
    //   x:degreeToRadians(PARAMS.t_rotation.x),
    //   y:degreeToRadians(PARAMS.t_rotation.y),
    //   z:degreeToRadians(PARAMS.t_rotation.z),
    //   w:1,
    //   // w:degreeToRadians(PARAMS.t_rotation.w),
    // })

    conn.reducers.transform3DComputeLocalMatrix({
      id:PARAMS.entityId,
    })

    conn.reducers.updateAllTransform3Ds();
  }
});

scaleBinding = transform3DPropsFolder.addBinding(PARAMS, 't_scale',{label:'Scale'}).on('change',()=>{
  if(PARAMS.entityId != ""){
    conn.reducers.setEntityLocalScale({
      entityId:PARAMS.entityId,
      x:PARAMS.t_scale.x,
      y:PARAMS.t_scale.y,
      z:PARAMS.t_scale.z,
    })

    conn.reducers.updateAllTransform3Ds();
  }
});

const testFolder = pane.addFolder({
  title: 'Test',
});

testFolder.addButton({title:'transform list'}).on('click',()=>{
  console.log(PARAMS.transform3d);
})

testFolder.addButton({title:'update all transform test'}).on('click',()=>{
  conn.reducers.updateAllTransform3Ds();
})

testFolder.addButton({title:'set all transform null test'}).on('click',()=>{
  conn.reducers.updateAllTransform3DsNull();
})

// pane.addButton({title:'Login'}).on('click',()=>{
//   van.add(document.body, windowLogin())
// });
// pane.addButton({title:'Register'}).on('click',()=>{
//   van.add(document.body, windowRegister())
// });
// pane.addButton({title:'test foo'}).on('click',()=>{
//   try {
//     console.log(conn)
//     // conn.reducers.authLogin({
//       // alias:alias.val,
//       // pass:pass.val,
//     // });
//     conn.reducers.testFoo({});
//   } catch (error) {
//     console.log("login error!")
//   }
// });
// pane.addButton({title:'test'}).on('click',()=>{
//   try {
//     console.log("ts")
//     conn.reducers.testAuth()
//   } catch (error) {
//     console.log("login error!")
//   }
// });


// const accessEL = div({style:`
//   // width:200px;
//   display: flex;
//   justify-content: center; /* horizontal */
//   align-items: center;     /* vertical */
//   height: 100vh;           /* needed for vertical centering */
//   `});
// const container = div({style:`
//   width: 128px;
//   height: 100px; 
// `})
// accessEL.appendChild(container);
// van.add(document.body, accessEL);
// const accessPane = new Pane({container:container});
// accessPane.addButton({title:'Login'}).on('click',()=>{
//   van.add(document.body, windowLogin())
// });
// accessPane.addButton({title:'Register'}).on('click',()=>{
//   van.add(document.body, windowRegister())
// });
// accessPane.addButton({title:'Recovery'}).on('click',()=>{
//   board.show({message: "Not Build!", durationSec: 1})
// });

