



import { ScheduleAt } from "spacetimedb";
import spacetimedb from "../module";
import { transformtri_animations } from "../tables/table_animation3d";

// reducer: update_transformtri_animation
export const update_transformtri_animation = spacetimedb.reducer({ arg: transformtri_animations.rowType }, (ctx, { arg }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id

  console.log("Transform3d count: ", ctx.db.transform3d.count());


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