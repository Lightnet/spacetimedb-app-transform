# spacetimedb-app-transform

# License: MIT

# SpaceTimeDB
 - 2.1.0

# Information:
  This is transform 3D hierarchy to test parent and child matrix for position, rotation and scale. Sample Test.

# Transform 3D Hierarchy:
  With the help of Grok AI agent. To able to use three js matrix and helper to handle transform 3D hierarchy. To handle position, rotation, scale, matrix and relate to parent and child.

  There are different way to handle transform hierarchy in client but in server side. It will be tricky as it need to follow SpaceTimeDB format to able to create, update and delete entity and matrix4. The reducer has one depth layer to child to query any more it would not work.

- Schedule Tables
- reducer (function for client to access)
- trigger event

## refs:
- https://spacetimedb.com/docs/databases/transactions-atomicity


# Editor:
  Current testing the position, quaternion, scale to update for box transform 3d. Using the Tweakpane for debug sync from the SpaceTimeDB. Tweakpane required code how to setup and clean up and reuse ui.

## Features:
- [x] create entity
- [x] delete entity and check for transform 3d to delete match id
- [x] add transform 3d
- [x] remove transform 3d
- [x] select transform 3d
  - [x] position
  - [x] rotation
  - [x] scale
- [x] select entity display yellow marker if transform 3d is added.
- [x] parent
  - [x] using the reducer to update all transforms base on isDirty propagation.
- [x] demo three js transform 3d hierarchy stand alone test.

# Server feature:
- [x] transform 3d hierarchy
  - [x] still need to test more
  - [x] reducer
  - [ ] schedule
  
# Config:
  Make sure the application database name match the server and client. Since using the ***spacetime dev*** command line to run development mode to watch and build.

## Client
```js
const DB_NAME = 'spacetime-app-transform';
```
## Server:
spacetime.json
```json
//...
"database": "spacetime-app-transform",
//...
```
spacetime.local.json
```json
//...
"database": "spacetime-app-transform",
//...
```

# Commands:
```
bun install
```
```
spacetime start
```
```
spacetime dev --server local
```
# SQL:
```
spacetime sql --server local spacetime-app-transform "SELECT * FROM entity"

spacetime sql --server local spacetime-app-transform "SELECT * FROM transform3d"

```
 For query table in command line.

# Delete
```
spacetime publish --server local spacetime-app-transform --delete-data
```
 In case bug and can't update table error.

# Credits:
- https://spacetimedb.com/docs
- Grok AI agent

# Server:
 - Note due to reducer have limited child to one to query. If more child to sub child it will not update the table. As it did say in docs.
 
## Tables:
```ts
export const entity = table(
  { 
    name: 'entity', 
    public: true,
  },
  {
    id: t.string().primaryKey(),
  }
);

export const transform3d = table(
  { 
    name: 'transform3d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    isDirty:t.bool().default(true),
    localPosition: Coordinates,
    localQuaternion: Quaternion,
    localScale: Coordinates,
    localMatrix: t.array(t.f32()).optional(),
    worldMatrix: t.array(t.f32()).optional(),
  }
);
```

# Client api:
  Work in progress.
  
## Entity
  Having id tag string for handle. For easy to add on to type of components.

### createEntity:
```js
  conn.reducers.createEntity({})
```
  Create blank entity.

### deleteEntity:
```js
  conn.reducers.deleteEntity({
    entiyId:PARAMS.entityId
  });
```
  Delete Entity base on entityId. Check for any components to be delete as well.

## Transform 3D

### addEntityTransform3D:
```js
conn.reducers.addEntityTransform3D({
  entityId: PARAMS.entityId
});
```
  Entity add transform 3D.

### removeEntityTransform3D:
```js
conn.reducers.removeEntityTransform3D({
  entityId:PARAMS.entityId
})
```
  Entity remove transform 3D.

### setTransform3DPosition
```js
conn.reducers.setTransform3DPosition({
  entityId:PARAMS.entityId,
  x:PARAMS.t_position.x,
  y:PARAMS.t_position.y,
  z:PARAMS.t_position.z
})
```
  Transform 3D set local position.

### setTransform3DRotation:
  Three js has the helper class and functions to make rotate degree (x, y, z) to Quaternion (x, y, z, w).
```js
conn.reducers.setTransform3DRotation({
  entityId:PARAMS.entityId,
  x:PARAMS.t_rotation.x,
  y:PARAMS.t_rotation.y,
  z:PARAMS.t_rotation.z,
});
```
- This use degree to convert on the server side.

### setTransform3DQuaternion:
```js
conn.reducers.setTransform3DQuaternion({
  entityId:PARAMS.entityId,
  x:rotation.x,
  y:rotation.y,
  z:rotation.z,
  w:rotation.w
})
```

### setEntityLocalScale:
```js
conn.reducers.setTransform3DScale({
  entityId:PARAMS.entityId,
  x:PARAMS.t_scale.x,
  y:PARAMS.t_scale.y,
  z:PARAMS.t_scale.z
})
```
### updateAllTransform3Ds:
```js
conn.reducers.updateAllTransform3Ds();
```
  This will handle update for parent to child matrix4.

### updateAllTransform3DsNull:
```js
conn.reducers.updateAllTransform3DsNull();
```
  This is to clear out the matrix for tests.