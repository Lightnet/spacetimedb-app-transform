//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t } from 'spacetimedb/server';
// table: userAuth
export const userAuth = table(
  { name: 'user_auth', public: false },
  {
    userId: t.string().primaryKey(),
    identity: t.identity().optional(),  // in case token change
    isValid:t.bool().default(false),
    alias: t.string().unique(),
    pass: t.string(),
  }
);
