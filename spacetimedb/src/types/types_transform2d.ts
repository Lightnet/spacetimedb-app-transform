//-----------------------------------------------
// TRANSFORM 2D TYPES
//-----------------------------------------------
import { t } from 'spacetimedb/server';

// Matrix is now stored as a flat array: [a, b, c, d, e, f, 0, 0, 1]  (row-major, 3x3)
export type Matrix2D = [number, number, number, number, number, number, number, number, number];

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
  matrix: t.option(t.array(t.f64())),
  parentId:t.option(t.string())
});