// transform 3d hierarchy matrix4

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';

function degreeToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// let entitiesFolder;
let entitiesBinding;
let entitySelectFolder;

var select_position;
var select_rotation;
var select_scale;
let parentBinding;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;
const gizmo = new ViewportGizmo(camera, renderer,{
  placement: 'bottom-left',
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
const axesHelper = new THREE.AxesHelper( 1 ); // '5' is the line size
scene.add( axesHelper );
function createBox(){
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const cubeLine = new THREE.LineSegments(edges, lineMaterial);
  cubeLine.matrixAutoUpdate = false; // disable to use matrix
  const axesHelper = new THREE.AxesHelper( 1 );
  cubeLine.add( axesHelper );
  return cubeLine;
}
//-----------------------------------------------
// 
//-----------------------------------------------
// Better entity structure
function createEntity(x = 0, y = 0, z = 0, parentId = "") {
  const cube = createBox();
  scene.add(cube);
  cube.matrixAutoUpdate = false; //manual for server side emulator
  const id = crypto.randomUUID();
  const entity = {
    id: id,
    mesh: cube,
    parentId: parentId,
    localPosition: new THREE.Vector3(x, y, z),
    localQuaternion: new THREE.Quaternion(),
    localScale: new THREE.Vector3(1, 1, 1),
    localMatrix: new THREE.Matrix4(),
    worldMatrix: new THREE.Matrix4(),
    children: []
  };
  updateLocalMatrix(entity);
  PARAMS.entities.push(entity);
  if (parentId) {
    const parent = PARAMS.entities.find(e => e.id === parentId);
    if (parent) parent.children.push(id);
  }
  // Important: Update world transform immediately
  updateWorldMatrix(entity, true);
  // Select the new entity
  selectEntity(id);
  // Refresh UI lists
  update_list_entities();
  update_entity_parent_list();
  return entity;
}
function updateLocalMatrix(entity) {
  entity.localMatrix.compose(
    entity.localPosition,
    entity.localQuaternion,
    entity.localScale
  );
}
function updateWorldMatrix(entity, recursive = true) {
  if (!entity) return;

  const parentEntity = PARAMS.entities.find(e => e.id === entity.parentId);

  if (parentEntity) {
    entity.worldMatrix.copy(parentEntity.worldMatrix).multiply(entity.localMatrix);
  } else {
    entity.worldMatrix.copy(entity.localMatrix);
  }

  // Apply to mesh
  entity.mesh.matrix.copy(entity.worldMatrix);

  // Recursively update children
  if (recursive) {
    for (const childId of entity.children) {
      const child = PARAMS.entities.find(e => e.id === childId);
      if (child) updateWorldMatrix(child, true);
    }
  }
}
// Call this after changing local transform or parent
function updateTransformHierarchy(startEntity = null) {
  if (!startEntity) {
    // Update all root entities
    PARAMS.entities
      .filter(e => !e.parentId)
      .forEach(root => updateWorldMatrix(root, true));
  } else {
    updateWorldMatrix(startEntity, true);
  }
}

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
    selectEntity(ev.value);
    update_entity_parent_list();
  });
  
}
//-----------------------------------------------
// TWEAKPANE
//-----------------------------------------------
const pane = new Pane();
const hierarchyFolder = pane.addFolder({ title: 'Hierarchy' });
hierarchyFolder.addBinding(PARAMS, 'selectEntityId', { readonly: true, label: 'Current' });
function update_entity_parent_list(){
  if(parentBinding) parentBinding.dispose()

  const parentOptions = { 'None (Root)': '' };
  PARAMS.entities.forEach(ent => {
    if (ent.id !== PARAMS.selectEntityId) {  // prevent self-parent
      parentOptions[`Entity ${ent.id.slice(0,8)}...`] = ent.id;
    }
  });

  parentBinding = hierarchyFolder.addBinding({ parentId: '' }, 'parentId', {
    options: parentOptions,
    label: 'Parent'
  }).on('change', (ev) => {
    reparentEntity(PARAMS.selectEntityId, ev.value);
  });
}
update_entity_parent_list();
function reparentEntity(childId, newParentId) {
  const child = PARAMS.entities.find(e => e.id === childId);
  if (!child) return;

  // Remove from old parent
  if (child.parentId) {
    const oldParent = PARAMS.entities.find(e => e.id === child.parentId);
    if (oldParent) {
      oldParent.children = oldParent.children.filter(id => id !== childId);
    }
  }

  // Set new parent
  child.parentId = newParentId || "";

  // Add to new parent's children
  if (newParentId) {
    const newParent = PARAMS.entities.find(e => e.id === newParentId);
    if (newParent && !newParent.children.includes(childId)) {
      newParent.children.push(childId);
    }
  }

  updateWorldMatrix(child, true);           // update this branch
  update_list_entities();
  // update_entity_parent_list();              // refresh parent UI
}
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
select_position = transformFolder.addBinding(PARAMS, 'position');
select_position.on('change', updateMatrix)
select_rotation =transformFolder.addBinding(PARAMS, 'rotate');
select_rotation.on('change', updateMatrix)
select_scale = transformFolder.addBinding(PARAMS, 'scale');
select_scale.on('change', updateMatrix)
function updateMatrix() {
  console.log(PARAMS.object3d);
  if (!PARAMS.object3d) return;
  const selectedEntity = PARAMS.entities.find(e => e.mesh === PARAMS.object3d);
  if (!selectedEntity) return;
  // Update local values from UI (degrees → radians)
  selectedEntity.localPosition.set(
    PARAMS.position.x,
    PARAMS.position.y,
    PARAMS.position.z
  );
  selectedEntity.localQuaternion.setFromEuler(
    new THREE.Euler(
      degreeToRadians(PARAMS.rotate.x),
      degreeToRadians(PARAMS.rotate.y),
      degreeToRadians(PARAMS.rotate.z)
    )
  );
  selectedEntity.localScale.set(
    PARAMS.scale.x,
    PARAMS.scale.y,
    PARAMS.scale.z
  );
  updateLocalMatrix(selectedEntity);
  // updateWorldMatrix(selectedEntity, true);//?? not work while update the scene?
  updateTransformHierarchy(selectedEntity);   // propagate to children
}
function selectEntity(id) {
  const entity = PARAMS.entities.find(e => e.id === id);
  if (!entity) return;
  console.log(entity.mesh);
  PARAMS.object3d = entity.mesh;
  PARAMS.selectEntityId = id;

  // Copy local values to UI
  PARAMS.position.x = entity.localPosition.x;
  PARAMS.position.y = entity.localPosition.y;
  PARAMS.position.z = entity.localPosition.z;

  const euler = new THREE.Euler().setFromQuaternion(entity.localQuaternion, 'XYZ');
  PARAMS.rotate.x = THREE.MathUtils.radToDeg(euler.x);
  PARAMS.rotate.y = THREE.MathUtils.radToDeg(euler.y);
  PARAMS.rotate.z = THREE.MathUtils.radToDeg(euler.z);

  PARAMS.scale.x = entity.localScale.x;
  PARAMS.scale.y = entity.localScale.y;
  PARAMS.scale.z = entity.localScale.z;

  if (select_position) select_position.refresh();
  if (select_rotation) select_rotation.refresh();
  if (select_scale) select_scale.refresh();

  // Very important: update parent dropdown to show current parent
  update_entity_parent_list();

  // Optional: highlight selected mesh (e.g. change color or add outline)
}
// create entity
createEntity(0,0,0);