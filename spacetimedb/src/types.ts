//-----------------------------------------------
// 
//-----------------------------------------------
import { schema, table, t, SenderError  } from 'spacetimedb/server';
//-----------------------------------------------
// 
//-----------------------------------------------
export const status = t.enum('Status', ['Online', 'Offline','Idle','Busy']);
//-----------------------------------------------
// 
//-----------------------------------------------
// Define a nested object type for Vector2 { x, y}
export const Vect2 = t.object('Vect2', {
  x: t.f64(),
  y: t.f64()
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const Transform2DResult = t.object('Transform2DResult',{
  position: t.option(Vect2),
  rotation: t.option(t.f64()),
  scale: t.option(Vect2),
});
//-----------------------------------------------
// (in Degrees - Euler XYZ)
//-----------------------------------------------
export const EulerDegrees =t.object('EulerDegrees', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
})
//-----------------------------------------------
// 
//-----------------------------------------------
// Define a nested object type for coordinates
export const Vect3 = t.object('Vect3', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const Quaternion = t.object('Quaternion', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
  w: t.f64(),
});
//-----------------------------------------------
// 
//-----------------------------------------------
export const Transform3DRotResult = t.object('Transform3DWorldRotResult', {
  position: t.option(Vect3),
  quaternion: t.option(Quaternion),
  rotation: t.option(EulerDegrees),
  scale: t.option(Vect3),
  matrix: t.option(t.array(t.f64())),
});
