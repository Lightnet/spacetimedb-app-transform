//-----------------------------------------------
//
//-----------------------------------------------
// https://spacetimedb.com/docs/functions/procedures
import { table, t } from 'spacetimedb/server';
import spacetimedb from "../module";
//-----------------------------------------------
// GET TRANSFORM 3D WORLD MATRIX
//-----------------------------------------------
export const get_transform3d_world_matrix = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
  const _transform3d = ctx.db.transform3d.entityId.find(id);

  if(_transform3d){
    if(!_transform3d.parentId){
      //_transform3d.worldMatrix = 
    }else{
      // get parent world
      // local world 
      // world matrix = parent world matrix multiply 
    }
  }
});

//-----------------------------------------------
// 
//-----------------------------------------------
// const test_unit = spacetimedb.procedure(t.unit(), ctx => {
//   // 
//   return {};
// });
// //-----------------------------------------------
// // 
// //-----------------------------------------------
// // Define a reducer and save the reference
// export const processItem = spacetimedb.reducer({ itemId: t.u64() }, (ctx, { itemId }) => {
//   // ... reducer logic
// });
// export const fetch_and_process = spacetimedb.procedure({ url: t.string() }, t.unit(), (ctx, { url }) => {
//   // Fetch external data
//   const response = ctx.http.fetch(url);
//   const data = response.json();
//   // Call the reducer within a transaction
//   ctx.withTx(txCtx => {
//     // processItem(txCtx, { itemId: data.id });
//   });
//   return {};
// });


