
import { table, t } from 'spacetimedb/server';
import spacetimedb from '../module';
import { user } from '../tables/table_user';

export const my_user = spacetimedb.view(
  { name: 'my_user', public: true },
  t.option(user.rowType),
  (ctx) => {
    const row = ctx.db.user.identity.find(ctx.sender);
    return row ?? undefined;
  }
);