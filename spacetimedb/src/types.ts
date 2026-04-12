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
// 
//-----------------------------------------------
// Define a nested object type for coordinates
export const SVector2 = t.object('Vector2', {
  x: t.f64(),
  y: t.f64()
});
//-----------------------------------------------
// 
//-----------------------------------------------
// Define a nested object type for coordinates
export const Coordinates = t.object('Coordinates', {
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
// Define a custom type for a 4x4 Matrix
export const Matrix4 = t.object('Matrix4', {
  elements: t.array(t.f32()), // Storing 16 floats
});
//-----------------------------------------------
// 
//-----------------------------------------------