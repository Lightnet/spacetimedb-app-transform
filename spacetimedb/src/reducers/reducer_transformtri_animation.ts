



import { ScheduleAt } from "spacetimedb";
import spacetimedb from "../module";
import { transformtri_animations } from "../tables/table_animation3d";
import { computeLocalMatrix3D } from "../helpers/helper_transform3d";
import { update_all_transform3ds } from "./reducer_transform3d";

// reducer: update_transformtri_animation
export const update_transformtri_animation = spacetimedb.reducer({ arg: transformtri_animations.rowType }, (ctx, { arg }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id

  console.log("Transform3d count: ", ctx.db.transform3d.count());

  for(const t3 of ctx.db.transform3d.iter()){
    t3.position.x += 0.1;
    let mat = computeLocalMatrix3D(t3);
    t3.localMatrix = mat;
    t3.isDirty = true;
    // @ts-ignore
    markSubtreeDirty(ctx, t3.entityId);   // ← link transforms to update
    ctx.db.transform3d.entityId.update(t3);
  }
  update_all_transform3ds(ctx,{});


  console.log("tick animation test");
});

// test 
export const start_transformtri_animation = spacetimedb.reducer((ctx)=>{
  console.log("start animation");
  const animation_counts = ctx.db.transformtri_animations.count();
  if(animation_counts > 0n){
    for(const anim of ctx.db.transformtri_animations.iter()){
      ctx.db.transformtri_animations.scheduled_id.delete(anim.scheduled_id);
    }
  }

  ctx.db.transformtri_animations.insert({
    scheduled_id: 0n,
    scheduled_at: ScheduleAt.interval(1000000n),
    message: undefined
  });

});

// test
export const stop_transformtri_animation = spacetimedb.reducer((ctx)=>{
  console.log("stop animation");
  const animation_counts = ctx.db.transformtri_animations.count();
  if(animation_counts > 0n){
    for(const anim of ctx.db.transformtri_animations.iter()){
      ctx.db.transformtri_animations.scheduled_id.delete(anim.scheduled_id);
    }
  }
});