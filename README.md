# spacetimedb-app-transform

# License: MIT

# Status:
-  Work in progress.

# SpaceTimeDB
 - 2.1.0

# Information:
  This is transform 2D and 3D hierarchy to test parent and child matrix for position, rotation and scale. Sample Test.

## Transform 3D:
  This is work in progress. 

## Transform 2D:
- https://github.com/Lightnet/spacetimedb-app-transform2d

  This split a part if just 2D world with three.js build project sample. The help of the Grok A.I agent to refine, check errors and code logics.

  Almost all basic features of transform set and set handers.

# Transform Hierarchy:
  With the help of Grok AI agent. To able to use three js matrix and helper to handle transform hierarchy. To handle position, rotation, scale, matrix and relate to parent and child.

  There are different way to handle transform hierarchy in client but in server side. It need to follow SpaceTimeDB format to able to create, update and delete entity and matrix. There are restriction on reducer api it can support one depth or stacking by child function call and anymore is not possible since to query any more it would not work if to update the table. As it mentioned there fail rollback in case of fail query.

```ts
 ctx.db.transform.entityId.update(transform)
```

- Schedule Tables
- reducer (function for client to access)
- trigger event

## refs:
- https://spacetimedb.com/docs/databases/transactions-atomicity


![Screenshot of browser test](screenshots/transform3d20260410.png)

# Editor:
  Current testing the position, quaternion, scale to update for box transform 3d. Using the Tweakpane for debug sync from the SpaceTimeDB.

## Features:
- [x] entity
  - [x] create entity
  - [x] delete entity and check for transform 3d and 2d to delete match entity id
- [x] transform 3d
  - [x] add 
  - [x] remove 
- [x] transform 2d
  - [x] add 
  - [x] remove 
  - [x] parent
- [x] ui select transform 3d / 2d
  - [x] position
  - [x] rotation
  - [x] scale
  - [x] parent
    - [x] using the reducer to update all transforms base on isDirty propagation.
- [x] select entity display yellow marker if transform 3d or 2d is added.
- [x] demo three js transform 3d hierarchy stand alone test.

# Server features:
- [x] still need to test more
- [x] transform 3D hierarchy
  - [ ] set / get transform3d (wip)
  - [x] set / get position (wip)
  - [x] set / get rotation (wip)
  - [x] set / get scale (wip)
  - [x] parnet to child update. 
- [x] transform 2D hierarchy
  - [x] set / get transform3d
  - [x] set / get position
  - [x] set / get rotation
  - [x] set / get scale
  - [x] parnet to child update.
- [x] reducer
  - update all transforms that has isDirty to update to propagation filter.
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

# SQL to text file:

```
spacetime sql --server local spacetime-app-transform "SELECT * FROM transform3d" > backup_your_table.txt

spacetime sql --server local spacetime-app-transform "SELECT * FROM transform2d" > backup_your_table.txt
```

# Delete
```
spacetime publish --server local spacetime-app-transform --delete-data
```
 In case bug and can't update table error.

# Credits:
- https://spacetimedb.com/docs
- Grok AI agent

# Server:
 - Note due to reducer have limited function call child to one to query. If more child to sub child it will not update the table. As it did say in docs.
 
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
```
```ts
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
```ts
export const transform2d = table(
  { 
    name: 'transform2d', 
    public: true,
  },
  {
    entityId: t.string().primaryKey(),
    parentId: t.string().optional(),
    isDirty:t.bool().default(true),
    position: SVector2,
    rotation: t.f32(),
    scale: SVector2,
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