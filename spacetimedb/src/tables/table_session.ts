// Model tables

import { table, t } from 'spacetimedb/server';
// import { status } from '../types';

export const sessions = table(
  { 
    name: 'sessions', 
    public: true,
  },
  {
    identity: t.identity().primaryKey(),
    connection_id: t.connectionId().unique(),
    connected_at: t.timestamp(),
    userId:t.uuid().optional(),
  }
);