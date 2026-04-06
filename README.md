# spacetimedb-app-transform

# License: MIT

# SpaceTimeDB
 - 2.1.0

# Information:
  This is transform 3d hierarchy to test parent and child matrix for position, rotation and scale.

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
```

# Delete
```
spacetime publish --server local spacetime-app-transform --delete-data
```