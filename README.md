# spacetimedb-app-transform

# License: MIT

# SpaceTimeDB
 - 2.1.0

# Information:
  This is transform 3d hierarchy to test parent and child matrix for position, rotation and scale.

# Transform 3D Hierarchy:
  With the help of Grok AI agent. It help reduce testing the transform 3D hierarchy. To handle position, rotation, sacle, matrix and relate to parent and child. Work in progress test.

  There are different way to handle transform hierarchy in client but in server side. Since all math matrix and code logics. Current testing three and later if move to math only logics.

- Schedule Tables
- reducer
- trigger event

# Editor:
  Current testing the position, quaternion, scale to update for box transform 3d. Using the Tweakpane for debug sync from the SpaceTimeDB. Tweakpane required code how to setup and clean up and reuse ui.

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
spacetime sql --server local spacetime-app-transform "SELECT * FROM user_auth"

spacetime sql --server local spacetime-app-transform "SELECT * FROM transform3d"

```

# Delete
```
spacetime publish --server local spacetime-app-transform --delete-data
```

# Credits:
- https://spacetimedb.com/docs
- Grok AI agent