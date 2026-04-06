
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";
import van from "vanjs-core";
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import { label } from 'three/tsl';

function degreeToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// let entitiesFolder;
let entitiesBinding;
let entitySelectFolder;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
const gizmo = new ViewportGizmo(camera, renderer,{
  placement: 'bottom-left',
  // offset: { left: 10, bottom: 10 } // fine-tune distance from edges
});
const orbitControls = new OrbitControls( camera, renderer.domElement );
gizmo.attachControls(orbitControls);
const size = 10;
const divisions = 10;
const gridHelper = new THREE.GridHelper( size, divisions );
scene.add( gridHelper );
const PARAMS = {
  entityId:'',
  selectEntityId:'',
  ph_position:{x:0,y:0,z:0},
  ph_rotate:{x:0,y:0,z:0},
  ph_scale:{x:1,y:1,z:1},

  position:{x:0,y:0,z:0},
  rotate:{x:0,y:0,z:0},
  scale:{x:1,y:1,z:1},
  object3d:null,
  entities:[],
  entityFolder:[]
}
// does not work
// const control = new TransformControls(camera, renderer.domElement);
// control.addEventListener('dragging-changed', (event) => {
//   // console.log("dragging-changed: ",event.value);
//   orbitControls.enabled = !event.value;
// });
// scene.add(control.getHelper());
const axesHelper = new THREE.AxesHelper( 1 ); // '5' is the line size
scene.add( axesHelper );
var cube;
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
  return cubeLine;
}
//-----------------------------------------------
// 
//-----------------------------------------------
function createEntity(x,y,z){
  console.log("x:",x," y:",y," z:",z)
  const cube = createBox();
  scene.add(cube);
  // cube.position.set(x,y,z); //disable must use martix4
  const position = new THREE.Vector3(x,y,z);
  const rotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      degreeToRadians(PARAMS.ph_rotate.x),
      degreeToRadians(PARAMS.ph_rotate.y),
      degreeToRadians(PARAMS.ph_rotate.z)
    )
  );
  const scale = new THREE.Vector3(
    PARAMS.ph_scale.x,
    PARAMS.ph_scale.y,
    PARAMS.ph_scale.z
  );
  cube.matrix.compose(position, rotation, scale);
  PARAMS.object3d = cube;
  let id = crypto.randomUUID();
  // console.log(id);
  // console.log(new THREE.Matrix4());
  // const helper = new THREE.BoxHelper(cube, 0x00ff00);
  // scene.add(helper);
  cube.userData.id = id;
  PARAMS.entities.push({
    id:id,
    mesh:cube,
    parent:"",
    position: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    scale: new THREE.Vector3(),
    localMaxtrix: new THREE.Matrix4(),
    globalMaxtrix: new THREE.Matrix4(),
  });
  update_list_entities();
}
createEntity(0,0,0);
window.addEventListener('resize', () => {
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
});

// 3. Animation Loop
function animate() {
  
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  if(orbitControls){
    orbitControls.update();
  }
  
  renderer.render(scene, camera);
  gizmo.render();

  requestAnimationFrame(animate);
}
animate();
function update_list_entities(){
  if(!entitySelectFolder) return;
  if (entitiesBinding) entitiesBinding.dispose();

  const options = PARAMS.entities.reduce((obj, ent, i) => {
    obj[`Entity ${ent.id}`] = ent.id;
    return obj;
  }, {});

  entitiesBinding = entitySelectFolder.addBinding(PARAMS, 'selectEntityId', {
    options: options,
    label: 'Select'
  }).on('change', (ev) => {
    // console.log(ev.value);
    // selectedIndex = ev.value;
    for( const mesh of scene.children ){
      // console.log(ph.userData)
      if(mesh.userData?.id == ev.value ){
        PARAMS.object3d = mesh;

        const position = new THREE.Vector3();
        // ph.matrix.setFromMatrixPosition(position);
        position.setFromMatrixPosition(mesh.matrix);

        PARAMS.position.x = position.x;
        PARAMS.position.y = position.y;
        PARAMS.position.z = position.z;
        if(select_position) select_position.refresh();
        if(select_rotation) select_rotation.refresh();
        if(select_scale) select_scale.refresh();
        break;
      }
    }
  });

}
//-----------------------------------------------
// 
//-----------------------------------------------
const pane = new Pane();
const entityFolder = pane.addFolder({
  title: 'Entity',
});
entityFolder.addBinding(PARAMS, 'ph_position',{label:'Position:'}).on('change',()=>{
  axesHelper.position.set(
    PARAMS.ph_position.x,
    PARAMS.ph_position.y,
    PARAMS.ph_position.z
  )
})
entityFolder.addBinding(PARAMS, 'ph_rotate',{label:'rotate:'});
entityFolder.addBinding(PARAMS, 'ph_scale',{label:'scale:'});
entityFolder.addButton({title:'create'}).on('click',()=>{
  createEntity(
    PARAMS.ph_position.x,
    PARAMS.ph_position.y,
    PARAMS.ph_position.z
  );
});
entitySelectFolder = pane.addFolder({
  title: 'Select',
});
update_list_entities()
entitySelectFolder.addBinding(PARAMS, 'selectEntityId',{
  readonly: true,
  label:'Entity ID'
});
const transformFolder = pane.addFolder({
  title: 'Tranform',
});
const select_position = transformFolder.addBinding(PARAMS, 'position');
select_position.on('change', updateMatrix)
const select_rotation =transformFolder.addBinding(PARAMS, 'rotate');
select_rotation.on('change', updateMatrix)
const select_scale = transformFolder.addBinding(PARAMS, 'scale');
select_scale.on('change', updateMatrix)
function updateMatrix(){
  console.log(PARAMS.position);
  // cube.position.set(PARAMS.position.x,PARAMS.position.y,PARAMS.position.z);
  const position = new THREE.Vector3(PARAMS.position.x,PARAMS.position.y, PARAMS.position.z);
  const rotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      degreeToRadians(PARAMS.rotate.x),
      degreeToRadians(PARAMS.rotate.y),
      degreeToRadians(PARAMS.rotate.z)
    )
  );
  const scale = new THREE.Vector3(
    PARAMS.scale.x,
    PARAMS.scale.y,
    PARAMS.scale.z
  );
  if(PARAMS.object3d){
    console.log(PARAMS.object3d);
    PARAMS.object3d.matrix.compose(position, rotation, scale);
  }
}
// entitiesFolder = pane.addFolder({
//   title: 'Entities',
// });

