//-----------------------------------------------
// index
//-----------------------------------------------
import { connState, networkStatus, stateScene, userIdentity } from './context';
import { DbConnection, tables } from './module_bindings';
// import * as moduleBindings  from './module_bindings';
// import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import { Pane } from 'tweakpane';
import van from "vanjs-core";
import { Modal, MessageBoard } from "vanjs-ui";
// import { windowRegister } from './window_register';
// import { windowLogin } from './window_login';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ViewportGizmo } from "three-viewport-gizmo";
import { setupDBEntity } from './db_entity';
import { setup_Pane } from './pane_tool';
import { setup_three } from './render_scene';
import { setupDBTransform3D } from './db_transform3d';
import { setupDBTransform2D } from './db_transform2d';

const { div, input, textarea, button, span, img, label, p, table, tr, td, tbody } = van.tags;

const HOST = 'ws://localhost:3000';
const DB_NAME = 'spacetime-app-transform';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

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
    setup_three();
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
  setup_Pane();
  // setUpDBUser();
  setupDBEntity();
  setupDBTransform3D();
  setupDBTransform2D();
}
