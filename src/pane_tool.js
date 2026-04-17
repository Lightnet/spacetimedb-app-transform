//-----------------------------------------------
// 
//-----------------------------------------------
import * as THREE from 'three';
import van from "vanjs-core";
import { Pane } from 'tweakpane';
import { 
  connState, 
  dbEntities, 
  dbTransform2Ds, 
  dbTransform3Ds,
  phHolder,
  phPosition, phQuaternion, phRotation, phScale,
  stateEntityId,
  stateParentId,
  t2Position, t2Rotation,t2Scale, 
  t3Position, t3Rotation, t3Scale,
  w2Position, w2Rotation, w2Scale, w3Position, w3Rotation, w3Scale,
  UI,
  phHolderVisible,
} from './context';
import { degreeToRadians } from './helper_transform3d';
import { getRotationFromMatrix2D, getScaleFromMatrix2D, transformPoint2D } from './helper_transform2d';

const { div, input, textarea, button, span, img, label, p, table, tr, td, tbody } = van.tags;

export function setup_Pane(){
  const conn = connState.val;
  // console.log(conn);
  const pane = new Pane();
  // console.log(pane);
  //-----------------------------------------------
  // ENTITY
  //-----------------------------------------------
  const entityFolder = pane.addFolder({
    title: 'Entity',
  });

  //-----------------------------------------------
  // CREATE ENTITY
  //-----------------------------------------------
  entityFolder.addButton({title: 'Create'}).on('click',()=>{
    conn.reducers.createEntity()
  });
  //-----------------------------------------------
  // DELETE ENTITY
  //-----------------------------------------------
  entityFolder.addButton({title: 'Delete'}).on('click',()=>{
    try {
      if(stateEntityId.val !== "" ){
        conn.reducers.deleteEntity({
          id:stateEntityId.val
        });
      }
    } catch (error) {
      console.log("delete entity error!");
    }
  });

  entityFolder.addBinding(stateEntityId, 'val',{
    label:'Select:',
    readonly:true
  })
  //-----------------------------------------------
  // ENTITIES LOGS
  //-----------------------------------------------
  entityFolder.addButton({title: 'Entities Logs'}).on('click',()=>{
    console.log(dbEntities.val);
    console.log(dbTransform3Ds.val);
  });
  entityFolder.addBinding(phHolderVisible, 'val', {
    label:'PH Holder Visible'
  }).on('change', (ev) => {
      const _phHolder = phHolder.val;
      phHolderVisible.val = !phHolderVisible.val
      _phHolder.visible = !phHolderVisible.val;
  });

  // entityFolder.addButton({title: 'Toggle T3'}).on('click',()=>{
  //   console.log(dbEntities.val);
  //   console.log(dbTransform3Ds.val);
  //   if(UI.component3DFolder){
  //     UI.component3DFolder.expanded = !UI.component3DFolder.expanded
  //   }
  // });
  //-----------------------------------------------
  // SELECT ENTITIES
  //-----------------------------------------------
  let selectEntityBinding;
  van.derive(()=>{
    if(selectEntityBinding) selectEntityBinding.dispose();
    const entities = dbEntities.val;
    // console.log(entities);
    // console.log(entities.size);
    // if(!entities) return;
    const entitiesOptions = Array.from(entities.keys()).map(id => ({
        text: id,
        value: id,
    }));
    // console.log(entitiesOptions);
    selectEntityBinding = entityFolder.addBlade({
      view: 'list',
      label: 'Select Entity:',
      options: entitiesOptions,
      value: '',
    }).on('change',(event)=>{
      // selectEntity(event.value)
      // console.log(event.value);
      stateEntityId.val = event.value
    });
  });

  //-----------------------------------------------
  // SELECT ENTITY ID DERIVE
  //-----------------------------------------------
  let oldId = '';
  van.derive(()=>{
    const entityId = stateEntityId.val;
    // 1. Only proceed if the ID is actually different
    if (oldId === entityId) return;
    // 2. Update the tracker immediately
    oldId = entityId;
    // console.log("entityId: ",entityId)
    if (!entityId) return;
    const t3 = dbTransform3Ds.rawVal.get(entityId);
    if(t3){
      if(UI.addTransform3DBinding) UI.addTransform3DBinding.disabled = true;
      if(UI.removeTransform3DBinding) UI.removeTransform3DBinding.disabled = false;

      // console.log("update 3d?");
      // console.log(t3);
      t3Position.val = t3.position;
      // t3Position.val = t3.position;
      let quat = new THREE.Quaternion(
        t3.quaternion.x,
        t3.quaternion.y,
        t3.quaternion.z,
        t3.quaternion.w
      );
      const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
      t3Rotation.val.x = THREE.MathUtils.radToDeg(euler.x);
      t3Rotation.val.y = THREE.MathUtils.radToDeg(euler.y);
      t3Rotation.val.z = THREE.MathUtils.radToDeg(euler.z);
      // set scale
      t3Scale.val = t3.scale;
      // refresh ui
      if(UI.localTransform3DFolder) UI.localTransform3DFolder.refresh();
      if(UI.update_transform3d_parent) UI.update_transform3d_parent();
    }else{
      if(UI.addTransform3DBinding) UI.addTransform3DBinding.disabled = false;
      if(UI.removeTransform3DBinding) UI.removeTransform3DBinding.disabled = true;
    }

    const t2 = dbTransform2Ds.rawVal.get(entityId);
    // console.log(dbTransform2Ds.rawVal);
    if(t2){
      if(UI.addTransform2DBinding) UI.addTransform2DBinding.disabled = true;
      if(UI.removeTransform2DBinding) UI.removeTransform2DBinding.disabled = false;
      if(UI.localTransform2DFolder) UI.localTransform2DFolder.disabled = false;
      if(UI.hierarchy2DFolder) UI.hierarchy2DFolder.disabled = false;
      // console.log("update 2d?");
      t2Position.val = t2.position;
      t2Rotation.val = t2.rotation;
      t2Scale.val = t2.scale;

      w2Position.val = transformPoint2D(t2.worldMatrix, 0, 0);
      w2Rotation.val = getRotationFromMatrix2D(t2.worldMatrix);
      w2Scale.val = getScaleFromMatrix2D(t2.worldMatrix);

      if(UI.update_transform2d_parent) UI.update_transform2d_parent();
      if(UI.localTransform2DFolder) UI.localTransform2DFolder.refresh();
      if(UI.worldTransform2DFolder) UI.worldTransform2DFolder.refresh();
    }else{
      if(UI.addTransform2DBinding) UI.addTransform2DBinding.disabled = false;
      if(UI.removeTransform2DBinding) UI.removeTransform2DBinding.disabled = true;
      if(UI.localTransform2DFolder) UI.localTransform2DFolder.disabled = true;
      if(UI.hierarchy2DFolder) UI.hierarchy2DFolder.disabled = true;
    }
  });

  setup_component3d(pane);
  setup_component2d(pane);

  test_pane();
}

function setup_component3d(pane){
  //-----------------------------------------------
  // COMPONENT TRANSFORM 3D
  //-----------------------------------------------
  const component3DFolder = pane.addFolder({
    title: 'Component 3D',
  }).on('fold', (ev) => {
    // console.log(ev.expanded); // true if expanded, false if collapsed
    localStorage.setItem('component3DFolder',ev.expanded)
  });
  UI.component3DFolder=component3DFolder;
  if(UI.component3DFolder){
    const toggle = localStorage.getItem('component3DFolder')
    // console.log(typeof toggle)
    // console.log(toggle)
    if(toggle=='true'){
      // console.log("expand")
      UI.component3DFolder.expanded=true;
    }else{
      // console.log("not expand")
      UI.component3DFolder.expanded=false;
    }
  }

  const transform3dFolder = component3DFolder.addFolder({
    title: 'Transform 3D',
  });
  
  transform3dFolder.addBinding(phPosition, 'val',{label:'Position'}).on('change',update_place_holder)
  transform3dFolder.addBinding(phRotation, 'val',{label:'Rotation'}).on('change',update_place_holder)
  transform3dFolder.addBinding(phScale, 'val',{label:'Scale'}).on('change',update_place_holder)

  function update_place_holder(){
    console.log(phPosition.val);
    const ph_holder = phHolder.val;
    ph_holder.matrixAutoUpdate = true;
    ph_holder.position.set(
      phPosition.val.x,
      phPosition.val.y,
      phPosition.val.z
    );

    const radX = THREE.MathUtils.degToRad(phRotation.val.x);
    const radY = THREE.MathUtils.degToRad(phRotation.val.y);
    const radZ = THREE.MathUtils.degToRad(phRotation.val.z);
    // 2. Create Euler angles (default order is 'XYZ')
    const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);
    phQuaternion.val.x = quat.x;
    phQuaternion.val.y = quat.y;
    phQuaternion.val.z = quat.z;
    phQuaternion.val.w = quat.w;
    ph_holder.quaternion.setFromEuler(euler);
    ph_holder.scale.set(
      phScale.val.x,
      phScale.val.y,
      phScale.val.z
    )
  }

  UI.addTransform3DBinding = transform3dFolder.addButton({
  title: 'Add Transform 3D',
  }).on('click',()=>{
    console.log("add Transform 3D")
    // conn.reducers.addEntityTransform3D({
    //   id: PARAMS.entityId
    // });
    const conn = connState.val;
    conn.reducers.addEntityTransform3D({
      id: stateEntityId.val,
      position:phPosition.val,
      quaternion:phQuaternion.val,
      scale:phScale.val,
    });
  });

  UI.removeTransform3DBinding = transform3dFolder.addButton({
    title: 'Remove Transform 3D',
  }).on('click',()=>{
    const conn = connState.val;
    conn.reducers.removeEntityTransform3D({
      id:stateEntityId.val
    });
    stateEntityId.val=null;
  })
//-----------------------------------------------
// TRANSFORM 3D HIERARCHY
//-----------------------------------------------
  const hierarchy3DFolder = component3DFolder.addFolder({
    title: 'Transform 3D Hierarchy',
  });
  UI.hierarchy3DFolder = hierarchy3DFolder

  // van.derive(()=>{
  function update_transform3d_parent(){
    // console.log("parent 2d???")
    let parentId = "";
    if(UI.hierarchy3DParentBinding) UI.hierarchy3DParentBinding.dispose();
    // console.log(dbTransform3Ds.val)
    let transform3DsOptions = Array.from(dbTransform3Ds.val.keys()).map(id =>{
      // console.log(id);
      return {
        text: id,
        value: id,
      }
    });
    transform3DsOptions = [{ text: "None", value: "" },...transform3DsOptions];
    transform3DsOptions=transform3DsOptions.filter(r=>r.value != stateEntityId.val);

    const t3 = dbTransform3Ds.val.get( stateEntityId.val);
    if(t3){
      console.log(t3)
      if(t3.parentId && t3.parentId != ""){
        parentId=t3.parentId;
      }
    }

    UI.hierarchy3DParentBinding = hierarchy3DFolder.addBlade({
      view: 'list',
      label: 'Parent:',
      options: transform3DsOptions,
      value: parentId,
    }).on('change',(event)=>{
      // selectEntity(event.value)
      // console.log(event.value);
      stateParentId.val = event.value;

      const conn = connState.val;
      conn.reducers.setT3Parent({
        id:stateEntityId.val,
        parentId:event.value
      })
    });
  }
  update_transform3d_parent();
  UI.update_transform3d_parent = update_transform3d_parent;
  // });
//-----------------------------------------------
// LOCAL TRANSFORM 3D FOLDER
//-----------------------------------------------
  let localTransform3DFolder = component3DFolder.addFolder({
    title: 'Local Transform 3D',
  });
  UI.localTransform3DFolder=localTransform3DFolder;
//-----------------------------------------------
// LOCAL TRANSFORM 3D POSITION
//-----------------------------------------------
  localTransform3DFolder.addBinding(t3Position, 'val',{label:'Position'}).on('change', async()=>{
    if(stateEntityId.val && stateEntityId.val != ""){
      const conn = connState.val;
      conn.reducers.setT3Pos({
        id:stateEntityId.val,
        x:t3Position.val.x,
        y:t3Position.val.y,
        z:t3Position.val.z,
      });
      // conn.reducers.updateAllTransform3Ds();
      const pos = await conn.procedures.getT3WorldPos({
        id:stateEntityId.val,
      });
      console.log(pos);
      if(pos){
        w3Position.val = pos;
        worldTransform3DFolder.refresh();
      }
    }
  });
//-----------------------------------------------
// LOCAL TRANSFORM 3D ROTATION
//-----------------------------------------------
  localTransform3DFolder.addBinding(t3Rotation, 'val',{label:'Rotation'}).on('change', async()=>{
    if(stateEntityId.val && stateEntityId.val != ""){
      let rotation = new THREE.Euler(
        degreeToRadians(t3Rotation.val.x),
        degreeToRadians(t3Rotation.val.y),
        degreeToRadians(t3Rotation.val.z)
      );
      let quat = new THREE.Quaternion();
      quat.setFromEuler(rotation);
      const conn = connState.val;
      conn.reducers.setT3Quat({
        id:stateEntityId.val,
        x:quat.x,
        y:quat.y,
        z:quat.z,
        w:quat.w,
      });
      // conn.reducers.updateAllTransform3Ds();
      let rot = await conn.procedures.getT3WorldRot({
        id:stateEntityId.val
      });
      if(rot){
        w3Rotation.val = rot;
        worldTransform3DFolder.refresh();
      }
    }
  });
//-----------------------------------------------
// LOCAL TRANSFORM 3D SCALE
//-----------------------------------------------
  localTransform3DFolder.addBinding(t3Scale, 'val',{label:'Scale'}).on('change', async()=>{
    if(stateEntityId.val && stateEntityId.val != ""){
      const conn = connState.val;
      conn.reducers.setT3Scale({
        id:stateEntityId.val,
        x:t3Scale.val.x,
        y:t3Scale.val.y,
        z:t3Scale.val.z,
      });
      // conn.reducers.updateAllTransform3Ds();
      let scale = await conn.procedures.getT3WorldScale({
        id:stateEntityId.val,
      });
      if(scale){
        w3Scale.val = scale;
        worldTransform3DFolder.refresh();
      }
    }
  });
  let worldTransform3DFolder = component3DFolder.addFolder({
    title: 'World Transform 3D',
  });

  worldTransform3DFolder.addBinding(w3Position, 'val',{label:'Position',disabled:true})
  worldTransform3DFolder.addBinding(w3Rotation, 'val',{label:'Rotation',disabled:true})
  worldTransform3DFolder.addBinding(w3Scale, 'val',{label:'Scale',disabled:true})

}

function setup_component2d(pane){
  //-----------------------------------------------
  // COMPONENT TRANSFORM 2D
  //-----------------------------------------------
  const component2DFolder = pane.addFolder({
    title: 'Component 2D',
  }).on('fold', (ev) => {
    // console.log(ev.expanded); // true if expanded, false if collapsed
    localStorage.setItem('component2DFolder',ev.expanded)
  });
  UI.component2DFolder=component2DFolder;
  if(UI.component2DFolder){
    const toggle = localStorage.getItem('component2DFolder')
    // console.log(typeof toggle)
    // console.log(toggle)
    if(toggle=='true'){
      // console.log("expand")
      UI.component2DFolder.expanded=true;
    }else{
      // console.log("not expand")
      UI.component2DFolder.expanded=false;
    }
  }
  let transform2DFolder = component2DFolder.addFolder({
    title: 'Transform 2D',
  });

  let addTransform2DBinding = transform2DFolder.addButton({title:'Add Transform 2D'}).on('click',()=>{
    const conn = connState.val;
    conn.reducers.addEntityTransform2D({
      id:stateEntityId.val,
    });
  })
  UI.addTransform2DBinding = addTransform2DBinding;
  let removeTransform2DBinding = transform2DFolder.addButton({title:'Remove Transform 2D'}).on('click',()=>{
    const conn = connState.val;
    conn.reducers.removeEntityTransform2D({
      id:stateEntityId.val,
    });
  })
  UI.removeTransform2DBinding = removeTransform2DBinding;
  transform2DFolder.addButton({title:'Transform 2D Log'}).on('click',()=>{
    console.log(dbTransform2Ds.val)
  });

  let hierarchy2DFolder = component2DFolder.addFolder({
    title: 'Transform 2D Hierarchy',
  });
  UI.hierarchy2DFolder=hierarchy2DFolder;

  hierarchy2DFolder.addButton({title:'Refresh'}).on('click',()=>{
    // update_hierarchy_parent2d();
  });

  van.derive(()=>{
    if(UI.hierarchy2DParentBinding) UI.hierarchy2DParentBinding.dispose();
    let parentId = null;

    // console.log(dbTransform3Ds.val);
    let transform2DsOptions = Array.from(dbTransform2Ds.val.keys()).map(id =>{
      // console.log(id);
      return {
        text: id,
        value: id,
      }
    });
    transform2DsOptions = [{ text: "None", value: "" },...transform2DsOptions];
    transform2DsOptions=transform2DsOptions.filter(r=>r.value != stateEntityId.val);
    // console.log(transform2DsOptions);

    const t2 = dbTransform2Ds.rawVal.get(stateEntityId.val);
    if(t2 && t2?.parentId && t2?.parentId != ""){// parentId = undefined
      console.log("ASSIGN ME PARENT???")
      parentId = t2.parentId;
    }else{
      parentId = "";
    }
    console.log("PARENT ID:", parentId);

    UI.hierarchy2DParentBinding = hierarchy2DFolder.addBlade({
      view: 'list',
      label: 'Parent:',
      options: transform2DsOptions,
      value: parentId,
    }).on('change',(event)=>{
      // selectEntity(event.value)
      // console.log(event.value);
      stateParentId.val = event.value;
      const conn = connState.val;
      conn.reducers.setT2Parent({
        id:stateEntityId.val,
        parentId:event.value
      })
    });
    // UI.hierarchy2DParentBinding.refresh();
    // hierarchy2DFolder.refresh();
  })
//-----------------------------------------------
// LOCAL TRANSFORM 2D
//-----------------------------------------------
  let localTransform2DFolder = component2DFolder.addFolder({
    title: 'Local Transform 2D',
  });
  UI.localTransform2DFolder=localTransform2DFolder;

  localTransform2DFolder.addBinding(t2Position, 'val',{label:'Position'}).on('change', async()=>{
    const conn = connState.val;
    conn.reducers.setT2Pos({
      id:stateEntityId.val,
      x:t2Position.val.x,
      y:t2Position.val.y,
    });

    const pos = await conn.procedures.getT2WorldPos({
      id:stateEntityId.val,
    });
    console.log("pos:", pos)
    if(pos){
      console.log("update pos...")
      w2Position.val = pos;
    }
    if (worldTransform2DFolder) worldTransform2DFolder.refresh();
  });

  localTransform2DFolder.addBinding(t2Rotation, 'val',{label:'Rotation'}).on('change', async()=>{
    const conn = connState.val;
    conn.reducers.setT2Rot({
      id:stateEntityId.val,
      rotation: t2Rotation.val
    });
    const rot = await conn.procedures.getT2WorldRot({
      id:stateEntityId.val,
    });
    console.log("rot:", rot);
    if(rot){
      w2Rotation.val = rot;
    }
    if(worldTransform2DFolder) worldTransform2DFolder.refresh();
  });

  localTransform2DFolder.addBinding(t2Scale, 'val',{label:'Scale'}).on('change', async()=>{
    const conn = connState.val;
    conn.reducers.setT2Scale({
      id:stateEntityId.val,
      x:t2Scale.val.x,
      y:t2Scale.val.y
    });
    const scale = await conn.procedures.getT2WorldScale({
      id:stateEntityId.val
    });
    console.log("scale:", scale);
    if(scale){
      console.log("update scale...")
      w2Scale.val = scale;
    }
    if(worldTransform2DFolder) worldTransform2DFolder.refresh();
  })

  let worldTransform2DFolder = component2DFolder.addFolder({
    title: 'World Transform 2D',
  });

  UI.worldTransform2DFolder=worldTransform2DFolder;
  worldTransform2DFolder.addBinding(w2Position, 'val',{label:'Position', disabled:true});
  worldTransform2DFolder.addBinding(w2Rotation, 'val',{label:'Rotation', disabled:true});
  worldTransform2DFolder.addBinding(w2Scale, 'val',{label:'Scale', disabled:true});

}

function test_pane(){
  const testEl = div({style:`position:fixed; top:30px; left:2px;`});
  console.log(testEl);
  van.add(document.body, testEl);
  const testPane = new Pane({container:testEl});

  // testPane.expanded = false;
  const testFolder = testPane.addFolder({
    title: 'Test',
  }).on('fold', (ev) => {
    // console.log(ev.expanded); // true if expanded, false if collapsed
    localStorage.setItem('testFolder',ev.expanded)
  });

  if(testFolder){
    let currentTheme = localStorage.getItem('testFolder');
    console.log(currentTheme);
    if(currentTheme=='true'){
      testFolder.expanded = true;
    }else{
      testFolder.expanded = false;
    }
  }

  debug_transform(testPane);
}

function debug_transform(pane){
  const t3Folder = pane.addFolder({
    title: 'Transform3D',
  }).on('fold', (ev) => {
    // console.log(ev.expanded); // true if expanded, false if collapsed
    localStorage.setItem('t3Folder',ev.expanded)
  });
  if(t3Folder){
    const toggle = localStorage.getItem('t3Folder')
    // console.log(typeof toggle)
    // console.log(toggle)
    if(toggle=='true'){
      // console.log("expand")
      t3Folder.expanded=true;
    }else{
      // console.log("not expand")
      t3Folder.expanded=false;
    }
  }

  const localt3Folder = t3Folder.addFolder({
  title: 'local Transform3D',
});
const worldt3Folder = t3Folder.addFolder({
  title: 'world Transform3D',
});
localt3Folder.addButton({title:'get local'}).on('click', async ()=>{
  const conn = connState.val;
  const transform2d = await conn.procedures.getT3Local({
    id:stateEntityId.val,
  })
  console.log("local transform3d: ", transform2d)
});
localt3Folder.addButton({title:'get local matrix'}).on('click', async ()=>{
  const conn = connState.val;
  const mat = await conn.procedures.getT3LocalMatrix({
    id:stateEntityId.val,
  })
  console.log("local mattix: ", mat)
});
localt3Folder.addButton({title:'get position'}).on('click', async ()=>{
  const conn = connState.val;
  const pos = await conn.procedures.getT3LocalPos({
    id:stateEntityId.val,
  })
  console.log("local postion: ", pos)
});
localt3Folder.addButton({title:'get quaternion'}).on('click', async ()=>{
  const conn = connState.val;
  const quat = await conn.procedures.getT3LocalQuat({
    id:stateEntityId.val,
  })
  console.log("local quat: ", quat)
});
localt3Folder.addButton({title:'get scale'}).on('click', async ()=>{
  const conn = connState.val;
  const scale = await conn.procedures.getT3LocalScale({
    id:stateEntityId.val,
  })
  console.log("local scale: ", scale)
});
localt3Folder.addButton({title:'get rotation'}).on('click', async ()=>{
  const conn = connState.val;
  const rotate = await conn.procedures.getT3LocalRot({
    id:stateEntityId.val,
  })
  console.log("local rotate: ", rotate)
});
worldt3Folder.addButton({title:'get world'}).on('click', async ()=>{
  const conn = connState.val;
  const t3d = await conn.procedures.getT3World({
    id:stateEntityId.val,
  })
  console.log("world transform3d: ", t3d)
});
worldt3Folder.addButton({title:'get world matrix'}).on('click', async ()=>{
  const conn = connState.val;
  const mat = await conn.procedures.getT3WorldMatrix({
    id:stateEntityId.val,
  })
  console.log("world mattix: ", mat)
});
worldt3Folder.addButton({title:'get position'}).on('click', async ()=>{
  const conn = connState.val;
  const pos = await conn.procedures.getT3WorldPos({
    id:stateEntityId.val,
  })
  console.log("local pos: ", pos)
});
worldt3Folder.addButton({title:'get quaternion'}).on('click', async ()=>{
  const conn = connState.val;
  const quat = await conn.procedures.getT3WorldQuat({
    id:stateEntityId.val,
  })
  console.log("local quat: ", quat)
});
worldt3Folder.addButton({title:'get rotation'}).on('click', async ()=>{
  const conn = connState.val;
  const rotation = await conn.procedures.getT3WorldRot({
    id:stateEntityId.val,
  })
  console.log("local rotation: ", rotation)
});
worldt3Folder.addButton({title:'get scale'}).on('click', async ()=>{
  const conn = connState.val;
  const scale = await conn.procedures.getT3WorldScale({
    id:stateEntityId.val,
  })
  console.log("local scale: ", scale)
});
t3Folder.addButton({title:'transform3d list'}).on('click',()=>{
  console.log(dbTransform3Ds.val);
});
t3Folder.addButton({title:'update all transforms'}).on('click',()=>{
  const conn = connState.val;
  conn.reducers.updateAllTransform3Ds();
});
t3Folder.addButton({title:'set all transforms null'}).on('click',()=>{
  const conn = connState.val;
  conn.reducers.updateAllTransform3DsNull();
});
pane.addButton({title:'clear transforms'}).on('click',()=>{
  const conn = connState.val;
  conn.reducers.clearAllTransform2Ds();
  conn.reducers.clearAllTransform3Ds();
});

//-----------------------------------------------
// Transform 2D
//-----------------------------------------------

  const t2Folder = pane.addFolder({
    title: 'Transform2D',
  }).on('fold', (ev) => {
    // console.log(ev.expanded); // true if expanded, false if collapsed
    localStorage.setItem('t2Folder',ev.expanded)
  });
  if(t2Folder){
    const toggle = localStorage.getItem('t2Folder')
    // console.log(typeof toggle)
    // console.log(toggle)
    if(toggle=='true'){
      // console.log("expand")
      t2Folder.expanded=true;
    }else{
      // console.log("not expand")
      t2Folder.expanded=false;
    }
  }

  
  t2Folder.addButton({title:'get parent'}).on('click',async()=>{
    const conn = connState.val;
    const t2dParent = await conn.procedures.getT2Parent({
      id:stateEntityId.val,
    })
    console.log("t2dParent: ", t2dParent);
  });
  const localt2Folder = t2Folder.addFolder({
    title: 'Local Transform 2D',
  });
  localt2Folder.addButton({title:'get transform'}).on('click',async()=>{
    const conn = connState.val;
    const t2d = await conn.procedures.getT2Local({
      id:stateEntityId.val,
    })
    console.log("local t2d: ", t2d)
  });
  localt2Folder.addButton({title:'get matrix'}).on('click',async()=>{
    const conn = connState.val;
    const matrix = await conn.procedures.getT2LocalMatrix({
      id:stateEntityId.val,
    })
    console.log("local matrix: ", matrix)
  });
  localt2Folder.addButton({title:'get position'}).on('click',async()=>{
    const conn = connState.val;
    const pos = await conn.procedures.getT2LocalPos({
      id:stateEntityId.val,
    })
    console.log("local pos: ", pos)
  });
  localt2Folder.addButton({title:'get rotation'}).on('click',async()=>{
    const conn = connState.val;
    const rot = await conn.procedures.getT2LocalRot({
      id:stateEntityId.val,
    })
    console.log("local rot: ", rot)
  });
  localt2Folder.addButton({title:'get scale'}).on('click',async()=>{
    const conn = connState.val;
    const scale = await conn.procedures.getT2LocalScale({
      id:stateEntityId.val,
    })
    console.log("local scale: ", scale)
  });
  const worldt2Folder = t2Folder.addFolder({
    title: 'World Transform 2D',
  });
  worldt2Folder.addButton({title:'get transform'}).on('click',async()=>{
    const conn = connState.val;
    const t2d = await conn.procedures.getT2World({
      id:stateEntityId.val,
    })
    console.log("world t2d: ", t2d)
  });
  worldt2Folder.addButton({title:'get matrix'}).on('click',async()=>{
    const conn = connState.val;
    const matrix = await conn.procedures.getT2WorldMatrix({
      id:stateEntityId.val,
    })
    console.log("world matrix: ", matrix)
  });
  worldt2Folder.addButton({title:'get position'}).on('click',async()=>{
    const conn = connState.val;
    const pos = await conn.procedures.getT2WorldPos({
      id:stateEntityId.val,
    })
    console.log("world pos: ", pos)
  });
  worldt2Folder.addButton({title:'get rotation'}).on('click',async()=>{
    const conn = connState.val;
    const rotation = await conn.procedures.getT2WorldRot({
      id:stateEntityId.val,
    })
    console.log("world rotation: ", rotation)
  });
  worldt2Folder.addButton({title:'get scale'}).on('click',async()=>{
    const conn = connState.val;
    const scale = await conn.procedures.getT2WorldScale({
      id:stateEntityId.val,
    })
    console.log("world scale: ", scale)
  });

}