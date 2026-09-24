import * as THREE from "three";
export function CapsuleGeometry(
  radius,
  length,
  radialSegments = 8,
  heightSegments = 32,
) {
  const positions = [];
  const normals = [];
  const indices = [];

  const rings = heightSegments + 1;

  for (let i = 0; i < rings; i++) {
    const t = i / heightSegments;
    const y = (t - 0.5) * length;

    // Map the ends into hemispheres
    let r, cy;

    if (y < -length / 2) {
      const a = (y + length / 2) / radius;
      const angle = -Math.PI / 2 + (a * Math.PI) / 2;
      r = radius * Math.cos(angle);
      cy = -length / 2 + radius * Math.sin(angle);
    } else if (y > length / 2) {
      const a = (y - length / 2) / radius;
      const angle = (a * Math.PI) / 2;
      r = radius * Math.cos(angle);
      cy = length / 2 + radius * Math.sin(angle);
    } else {
      r = radius;
      cy = y;
    }

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;

      positions.push(r * Math.cos(theta), cy, r * Math.sin(theta));

      // approximate normal
      if (y < -length / 2) {
        const nx = Math.cos(theta) * r;
        const ny = cy + length / 2;
        const nz = Math.sin(theta) * r;
        const n = Math.hypot(nx, ny, nz);

        normals.push(nx / n, ny / n, nz / n);
      } else if (y > length / 2) {
        const nx = Math.cos(theta) * r;
        const ny = cy - length / 2;
        const nz = Math.sin(theta) * r;
        const n = Math.hypot(nx, ny, nz);

        normals.push(nx / n, ny / n, nz / n);
      } else {
        normals.push(Math.cos(theta), 0, Math.sin(theta));
      }
    }
  }

  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + 1;
      const c = a + radialSegments + 1;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));

  geometry.setIndex(indices);

  return geometry;
}
