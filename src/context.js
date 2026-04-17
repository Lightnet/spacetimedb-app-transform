// context

import van from "vanjs-core";

export const userIdentity = van.state(null);
export const networkStatus = van.state('Not Connected!');
export const connState = van.state(null);

export const stateScene = van.state(null);
export const dbEntities = van.state(new Map());
export const dbTransform3Ds = van.state(new Map());
export const dbTransform2Ds = van.state(new Map());

export const dbMeshes = van.state(new Map());
export const dbMeshVertices= van.state(new Map());
export const dbMeshIndices= van.state(new Map());

// need ray cast later?
export const sceneMeshes = van.state(new Map());

//-----------------------------------------------
// 
//-----------------------------------------------
export const stateEntityId = van.state('');
export const stateParentId = van.state('');
export const phPosition = van.state({x:0,y:0,z:0});
export const phRotation = van.state({x:0,y:0,z:0});
export const phQuaternion = van.state({x:0,y:0,z:0,w:1});
export const phScale = van.state({x:1,y:1,z:1});

export const t3Position = van.state({x:0,y:0,z:0});
export const t3Rotation = van.state({x:0,y:0,z:0});
export const t3Scale = van.state({x:0,y:0,z:0});

export const w3Position = van.state({x:0,y:0,z:0});
export const w3Rotation = van.state({x:0,y:0,z:0});
export const w3Scale = van.state({x:1,y:1,z:1});


export const t2Position = van.state({x:0,y:0});
export const t2Rotation = van.state(0);
export const t2Scale = van.state({x:1,y:1});

export const w2Position = van.state({x:0,y:0});
export const w2Rotation = van.state(0);
export const w2Scale = van.state({x:1,y:1});

export const phHolderVisible = van.state(true);
export const phHolder = van.state(null);
export const phMarker = van.state(null);

//-----------------------------------------------
// pane binding
//-----------------------------------------------
export const UI= {
  addTransform3DBinding:null,
  removeTransform3DBinding:null,
  component3DFolder:null,
  hierarchy3DFolder:null,
  update_transform3d_parent:null,
  localTransform3DFolder:null,
  //transform2d
  component2DFolder:null,
  addTransform2DBinding:null,
  removeTransform2DBinding:null,
  hierarchy2DFolder:null,
  update_transform2d_parent:null,
  localTransform2DFolder:null,
  worldTransform2DFolder:null,
};

