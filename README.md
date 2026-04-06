# spacetimedb-app-transform

# License: MIT

# SpaceTimeDB
 - 2.1.0

# Information:
  Work in progress.

  This is transform 3d hierarchy to test parent and child matrix for position, rotation and scale. Not added yet.

# Transform 3D Hierarchy:
  With the help of Grok AI agent. It help reduce testing the transform 3D hierarchy. To handle position, rotation, sacle, matrix and relate to parent and child. Work in progress test.

  There are different way to handle transform hierarchy in client but in server side. Since all math matrix and code logics. Current testing three and later if move to math only logics.

- Schedule Tables
- reducer
- trigger event

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
- [x] select yellow marker to which transform 3d
- [ ] parent (not yet build)
- [x] demo three js transform 3d hierarchy stand alone test.

# Server feature:
- [ ] transform 3d hierarchy
- [ ] work in progress.


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

# Delete
```
spacetime publish --server local spacetime-app-transform --delete-data
```
 In case bug and can't update table error.

# Credits:
- https://spacetimedb.com/docs
- Grok AI agent