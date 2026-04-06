//-----------------------------------------------
// index
//-----------------------------------------------
import { connState, networkStatus, userIdentity } from './context';
import { DbConnection, tables } from './module_bindings';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import van from "vanjs-core";
import { Modal, MessageBoard } from "vanjs-ui";
import { windowRegister } from './window_register';
import { windowLogin } from './window_login';

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

function setupDBEntity(){
  conn.subscriptionBuilder()
    .subscribe(tables.entity)
  conn.db.entity.onInsert(onInsert_Entity)
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
  // cubeLine.matrixAutoUpdate = false; // disable to use matrix
  const axesHelper = new THREE.AxesHelper( 1 ); // '5' is the line size
  cubeLine.add( axesHelper );
  return cubeLine;
}

function insert_model(row){
  let cube = createBox();
  cube.userData.row = row
  scene.add(cube)
}

function onInsert_Transfrom3D(_ctx, row){
  console.log("transform");
  console.log(row);
  PARAMS.transform3d.push(row);
  insert_model(row);
}

function update_model(row){
  console.log(row);
  for(const mesh of scene.children ){
    console.log(mesh);
    if(mesh.userData?.row?.entityId == row.entityId){
      mesh.position.set(
        row.localPosition.x,
        row.localPosition.y,
        row.localPosition.z
      )
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

function animate() {
  if(orbitControls){
    orbitControls.update();
  }
  renderer.render(scene, camera);
  gizmo.render();
  requestAnimationFrame(animate);
}

setup_three();




// van.add(document.body, windowLogin())
van.add(document.body, App())
const pane = new Pane();

const entityFolder = pane.addFolder({
  title: 'Entity',
});
entityFolder.addButton({
  title: 'Create',
  // label: 'counter',   // optional
}).on('click',()=>{
  conn.reducers.createEntity({})
});

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
    label: 'Entity ID:',
    options: entitiesOptions,
    value: '',
  }).on('change',(event)=>{
    console.log(event.value);
    PARAMS.entityId = event.value;
  });
}

update_entities_list();

const propsFolder = pane.addFolder({
  title: 'Props',
});

propsFolder.addBinding(PARAMS, 'entityId',{
  label:'Select:',
  readonly:true
})

propsFolder.addButton({
  title: 'Add Transform 3D',
}).on('click',()=>{
  console.log("add Transform 3D")
  conn.reducers.createEntityTransform3D({
    entityId: PARAMS.entityId
  })
})

propsFolder.addButton({
  title: 'Remove Transform 3D',
});

const transform3DFolder = pane.addFolder({
  title: 'Transform 3D',
});
transform3DFolder.addBinding(PARAMS, 't_position',{label:'Position'}).on('change',()=>{
  if(PARAMS.entityId != ""){
    conn.reducers.setEntityLocalPosition({
      entityId:PARAMS.entityId,
      x:PARAMS.t_position.x,
      y:PARAMS.t_position.y,
      z:PARAMS.t_position.z,
    })
  }
})
transform3DFolder.addBinding(PARAMS, 't_rotation',{label:'Rotation'})
transform3DFolder.addBinding(PARAMS, 't_scale',{label:'Scale'})






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

