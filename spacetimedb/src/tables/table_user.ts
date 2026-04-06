// 

import { schema, table, t } from 'spacetimedb/server';

// need public and private table for only user and account

export const user = table(
  { name: 'user', public: true },
  {
    id: t.uuid().primaryKey(), // xxx-xxx-xxx-xxx 
    identity: t.identity().optional(), // in case token change
    name: t.string().optional(),
    online: t.bool(),
  }
);

export const userAuth = table(
  { name: 'user_auth', public: false },
  {
    userId: t.uuid().primaryKey(),
    identity: t.identity().optional(),  // in case token change
    isValid:t.bool().default(false),
    alias: t.string().unique(),
    pass: t.string(),
  }
);

export const userConfig = table(
  { name: 'user_config', public: false },
  {
    userId: t.uuid().primaryKey(),
    identity: t.identity().optional(),  // in case token change
    isDisconnectLogout:t.bool().default(false), // ondisconnect

  }
);

