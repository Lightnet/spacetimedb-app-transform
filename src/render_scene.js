import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";
import { dbTransform2Ds, dbTransform3Ds, phHolder, phMarker, stateEntityId, stateScene } from './context';
import { getRotationFromMatrix2D, transformPoint2D } from './helper_transform2d';

let scene, camera, renderer, gizmo, orbitControls, marker, ph_holder;

export function createBox(color=0xffffff){
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

export function create_2d(){
  let size = 1
  const geometry = new THREE.PlaneGeometry(size, size);
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.LineSegments(edges, lineMaterial);
  // mesh.matrixAutoUpdate = false; // disable to use matrix
  return mesh;
}

export function setup_three(){
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
  marker.visible = false;
  phMarker.val = marker;
  scene.add(marker)

  ph_holder = createBox(0xebe534);
  phHolder.val = ph_holder;
  scene.add(ph_holder)
  stateScene.val = scene;

  window.addEventListener('resize',onResize);

  // Start the loop
  renderer.setAnimationLoop(animate);
}

function update_select_marker(){
  if(!stateEntityId.val) return;
  const marker = phMarker.val;

  if(marker){
    // const transform3d = PARAMS.transform3d.find(e => e.entityId === PARAMS.entityId);
    // const transform2d = PARAMS.transform2d.find(e => e.entityId === PARAMS.entityId);
    const transform3d = dbTransform3Ds.val.get(stateEntityId.val)
    const transform2d = dbTransform2Ds.val.get(stateEntityId.val)
    
    
    if(transform3d){
      // console.log("found transform3d for marker...");
      const matrix = new THREE.Matrix4();
      if(transform3d.worldMatrix){
        // console.log("transform3d worldMatrix:", transform3d.worldMatrix);
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
      let worldRotation = getRotationFromMatrix2D(transform2d.worldMatrix);
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
  update_select_marker();
  // const scene = stateScene.val;
  // renderer.render(scene, camera);
  renderer.render(scene, camera);
  gizmo.render();
  requestAnimationFrame(animate);
}

