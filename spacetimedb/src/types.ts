import { schema, table, t, SenderError  } from 'spacetimedb/server';

export const status = t.enum('Status', ['Online', 'Offline','Idle','Busy']);

// Define a nested object type for coordinates
export const Coordinates = t.object('Coordinates', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
});

// Define a custom type for a 4x4 Matrix
export const Matrix4 = t.object('Matrix4', {
  elements: t.array(t.f32()), // Storing 16 floats
});