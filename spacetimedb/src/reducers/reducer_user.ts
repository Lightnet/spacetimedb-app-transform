

import { table, t, SenderError } from 'spacetimedb/server';
import spacetimedb from '../module';
import { validateName } from '../helper';

export const set_name = spacetimedb.reducer({ name: t.string() }, (ctx, { name }) => {
  validateName(name);
  const user = ctx.db.user.identity.find(ctx.sender);
  if (!user) {
    throw new SenderError('Cannot set name for unknown user');
  }
  ctx.db.user.id.update({ ...user, name });
});

