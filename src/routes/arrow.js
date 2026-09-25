import * as THREE from "three";
export function ArrowGeometry(
  radius,
  length,
  radialSegments = 8,
  heightSegments = 32,
  tipLength = radius * 4,
  tipRadius = radius * 3,
) {
  const positions = [];
  const normals = [];
  const tipOffsets = [];
  const indices = [];

  const shaftStart = -length / 2;
  const shaftEnd = length / 2;

  const tailSegments = Math.max(2, Math.floor(heightSegments * 0.2));

  const shaftSegments = Math.max(2, heightSegments - tailSegments);

  const tipSegments = Math.max(2, Math.floor(heightSegments * 0.3));

  const rings = [];

  // Rounded tail
  for (let i = 0; i <= tailSegments; i++) {
    const t = i / tailSegments;
    const angle = -Math.PI / 2 + (t * Math.PI) / 2;

    const r = radius * Math.cos(angle);
    const y = shaftStart + radius * Math.sin(angle);

    rings.push({
      y,
      r,
      nr: Math.cos(angle),
      ny: Math.sin(angle),
      tipOffset: 0,
    });
  }

  // Shaft
  for (let i = 1; i <= shaftSegments; i++) {
    const t = i / shaftSegments;

    rings.push({
      y: shaftStart + t * length,
      r: radius,
      nr: 1,
      ny: 0,
      tipOffset: 0,
    });
  }

  const shoulderLength = tipLength * 0.35;
  const coneLength = tipLength - shoulderLength;

  const shoulderSegments = Math.max(1, Math.floor(tipSegments * 0.4));

  // Arrowhead shoulder
  for (let i = 1; i <= shoulderSegments; i++) {
    const t = i / shoulderSegments;

    const s = t * t * (3 - 2 * t);

    const r = radius + (tipRadius - radius) * s;

    const y = shaftEnd + shoulderLength * t;

    const drdt = (tipRadius - radius) * 6 * t * (1 - t);

    const dydt = shoulderLength;

    const n = Math.hypot(drdt, dydt);

    rings.push({
      y,
      r,
      nr: dydt / n,
      ny: -drdt / n,

      // Physical distance from the start of the tip.
      tipOffset: shoulderLength * t,
    });
  }

  // Arrowhead cone
  const coneSegments = Math.max(2, tipSegments - shoulderSegments);

  for (let i = 1; i <= coneSegments; i++) {
    const t = i / coneSegments;

    const r = tipRadius * (1 - t);

    const y = shaftEnd + shoulderLength + coneLength * t;

    const drdt = -tipRadius;
    const dydt = coneLength;

    const n = Math.hypot(drdt, dydt);

    rings.push({
      y,
      r,
      nr: dydt / n,
      ny: -drdt / n,

      tipOffset: shoulderLength + coneLength * t,
    });
  }

  const stride = radialSegments + 1;

  for (const ring of rings) {
    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;

      const c = Math.cos(theta);
      const s = Math.sin(theta);

      positions.push(ring.r * c, ring.y, ring.r * s);

      normals.push(ring.nr * c, ring.ny, ring.nr * s);

      tipOffsets.push(ring.tipOffset);
    }
  }

  // Connect rings
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // Tail cap
  const tailCenter = positions.length / 3;

  positions.push(0, shaftStart - radius, 0);

  normals.push(0, -1, 0);

  tipOffsets.push(0);

  for (let j = 0; j < radialSegments; j++) {
    indices.push(tailCenter, j + 1, j);
  }

  // Tip point
  const tipCenter = positions.length / 3;

  positions.push(0, shaftEnd + tipLength, 0);

  normals.push(0, 1, 0);

  tipOffsets.push(tipLength);

  const lastRing = (rings.length - 1) * stride;

  for (let j = 0; j < radialSegments; j++) {
    indices.push(lastRing + j, lastRing + j + 1, tipCenter);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));

  geometry.setAttribute(
    "aTipOffset",
    new THREE.Float32BufferAttribute(tipOffsets, 1),
  );

  geometry.setIndex(indices);

  geometry.computeBoundingSphere();

  return geometry;
}
