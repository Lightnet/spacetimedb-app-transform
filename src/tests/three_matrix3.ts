// transform hierarchy - flattened Matrix2D
console.log("matrix3 2d")
import * as THREE from 'three';
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, timer: THREE.Timer;
let meshes = new Map<string, THREE.Mesh>();

// ====================== 2D MATRIX MATH (FLATTENED) ======================

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

function transformPoint(m: Matrix2D, x: number, y: number) {
  return {
    x: m[0]*x + m[1]*y + m[2],
    y: m[3]*x + m[4]*y + m[5]
  };
}

/**
 * Extracts rotation angle in degrees from a 2D affine matrix (flattened 3x3).
 * Works even with scaling and translation present.
 */
function extractRotationFromMatrix(m: Matrix2D): number {
  // Linear part: [ m[0]  m[1] ]
  //               [ m[3]  m[4] ]

  // Use atan2 on the Y-axis vector after transform (more stable)
  const angleRad = Math.atan2(m[3], m[0]);   // sin / cos from first column

  return angleRad * (180 / Math.PI);
}

/**
 * Extract average scale from the 2D world matrix (keeps it simple)
 */
function extractScaleFromMatrix(m: Matrix2D): number {
  // Length of first column (X axis after transform)
  const scaleX = Math.hypot(m[0], m[3]);
  // Length of second column (Y axis after transform)
  const scaleY = Math.hypot(m[1], m[4]);

  // Return average scale - simple and matches your current "worldScale" logic
  return (scaleX + scaleY) / 2;
}

// ====================== ENTITY with CACHING ======================

interface Entity {
  id: string;
  parentId: string | null;
  position: { x: number; y: number };
  rotation: number;        // degrees
  scale: { x: number; y: number };

  // Cached matrices (flattened format)
  localMatrix?: Matrix2D;
  worldMatrix?: Matrix2D;
}

const entities: Entity[] = [
  { id: "parent1",     parentId: null,   position: { x: 0, y: 0 }, rotation: 0,   scale: { x: 1.2, y: 1.2 } },
  { id: "child1",      parentId: "parent1", position: { x: 2.0, y: 0 }, rotation: 0,   scale: { x: 0.7, y: 0.7 } },
  { id: "child2",      parentId: "parent1", position: { x: -2.0, y: 1.0 }, rotation: 30, scale: { x: 0.6, y: 0.6 } },
  { id: "grandchild1", parentId: "child1",  position: { x: 1.5, y: 0.5 }, rotation: 45, scale: { x: 0.5, y: 0.5 } }
];

// Mark all entities as "dirty" initially
entities.forEach(e => { 
  e.localMatrix = undefined; 
  e.worldMatrix = undefined; 
});

// ====================== THREE.JS SETUP ======================

init();

function init() {
  timer = new THREE.Timer();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 12;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const colors: Record<string, number> = {
    "parent1": 0x367ec2,
    "child1": 0xff4444,
    "child2": 0xffaa44,
    "grandchild1": 0xffee44
  };

  entities.forEach(entity => {
    const size = entity.id === "parent1" ? 2.2 : entity.id.includes("child") ? 1.4 : 1.0;
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({ color: colors[entity.id] || 0xffffff, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshes.set(entity.id, mesh);
  });

  renderer.setAnimationLoop(animate);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  timer.update();
  updateAllWorldTransforms();
  renderer.render(scene, camera);
}

// ====================== CACHED HIERARCHY UPDATE ======================

function computeLocalMatrix(entity: Entity): Matrix2D {
  if (!entity.localMatrix) {
    // Order: Translate * Rotate * Scale
    entity.localMatrix = multiply2D(
      translate2D(entity.position.x, entity.position.y),
      multiply2D(rotate2D(entity.rotation), scale2D(entity.scale.x, entity.scale.y))
    );
  }
  return entity.localMatrix;
}

function getWorldMatrix(entityId: string): Matrix2D {
  const entity = entities.find(e => e.id === entityId);
  if (!entity) return identity;

  if (entity.worldMatrix) return entity.worldMatrix;

  if (!entity.parentId) {
    entity.worldMatrix = computeLocalMatrix(entity);
  } else {
    const parentWorld = getWorldMatrix(entity.parentId);
    const local = computeLocalMatrix(entity);
    entity.worldMatrix = multiply2D(parentWorld, local);
  }

  return entity.worldMatrix!;
}

// Invalidate cache when any transform changes
function markDirty(entityId: string) {
  const entity = entities.find(e => e.id === entityId);
  if (!entity) return;

  entity.localMatrix = undefined;
  entity.worldMatrix = undefined;

  // Invalidate all descendants
  entities.forEach(e => {
    if (isDescendant(e.id, entityId)) {
      e.worldMatrix = undefined;
    }
  });
}

function isDescendant(childId: string, ancestorId: string): boolean {
  let current: string | null = childId;
  while (current) {
    if (current === ancestorId) return true;
    const ent = entities.find(e => e.id === current);
    current = ent ? ent.parentId : null;
  }
  return false;
}

function updateAllWorldTransforms() {
  entities.forEach(entity => {
    const mesh = meshes.get(entity.id);
    if (!mesh) return;

    const worldMatrix = getWorldMatrix(entity.id);
    const worldPos = transformPoint(worldMatrix, 0, 0);

    // Accumulate rotation (additive)
    let worldRotation = 0;
    let current: string | null = entity.id;
    while (current) {
      const e = entities.find(en => en.id === current);
      if (!e) break;
      worldRotation += e.rotation;
      current = e.parentId;
    }

    // Simple average scale propagation
    let worldScale = 1;
    let curr: string | null = entity.id;
    while (curr) {
      const e = entities.find(en => en.id === curr);
      if (!e) break;
      worldScale *= (e.scale.x + e.scale.y) / 2;
      curr = e.parentId;
    }

    mesh.position.set(worldPos.x, worldPos.y, 0);
    mesh.rotation.z = (worldRotation * Math.PI) / 180;
    mesh.scale.set(worldScale, worldScale, 1);
  });
}

// ====================== TWEAKPANE UI ======================

const pane = new Pane({ title: "Hierarchy with Caching (Flattened Matrix)" });

entities.forEach(entity => {
  const folder = pane.addFolder({ 
    title: entity.id + (entity.parentId ? ` ← ${entity.parentId}` : ' (Root)')
  });

  const bindings = [
    folder.addBinding(entity.position, 'x', { min: -8, max: 8, step: 0.01 }),
    folder.addBinding(entity.position, 'y', { min: -8, max: 8, step: 0.01 }),
    folder.addBinding(entity, 'rotation', { min: -180, max: 180, step: 1 }),
    folder.addBinding(entity.scale, 'x', { min: 0.2, max: 3, step: 0.01 }),
    folder.addBinding(entity.scale, 'y', { min: 0.2, max: 3, step: 0.01 })
  ];

  bindings.forEach(binding => {
    binding.on('change', () => markDirty(entity.id));
  });
});