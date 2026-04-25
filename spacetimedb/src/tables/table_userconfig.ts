//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t } from 'spacetimedb/server';
//-----------------------------------------------
// 
//-----------------------------------------------
// table: userConfig
export const userConfig = table(
  { name: 'user_config', public: false },
  {
    userId: t.string().primaryKey(),
    identity: t.identity().optional(),  // in case token change
    isDisconnectLogout:t.bool().default(false), // ondisconnect
  }
);
