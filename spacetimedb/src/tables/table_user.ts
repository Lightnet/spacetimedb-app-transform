//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t } from 'spacetimedb/server';
//-----------------------------------------------
// need public and private table for only user and account
//-----------------------------------------------
// table: users
export const users = table(
  { name: 'users', public: true },
  {
    id: t.string().primaryKey(), // xxx-xxx-xxx-xxx 
    identity: t.identity().optional(), // in case token change
    name: t.string().optional(),
    online: t.bool(),
  }
);
