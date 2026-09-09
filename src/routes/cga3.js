// Basis:
//   e1 e2 e3 ep em
//
// metric:
//   +  +  +  +  -
//
// null basis:
//   e0   = (em - ep) / 2
//   einf = em + ep

const N = 5;
const SIZE = 1 << N;
const metric = [1, 1, 1, 1, -1];

const ZERO = () => new Float64Array(SIZE);

function scalar(x) {
  const a = ZERO();
  a[0] = x;
  return a;
}

function basis(i) {
  const a = ZERO();
  a[1 << i] = 1;
  return a;
}

export const e1 = basis(0);
export const e2 = basis(1);
export const e3 = basis(2);
export const ep = basis(3);
export const em = basis(4);

export const e0 = sub(scale(0.5, em), scale(0.5, ep));
export const einf = add(em, ep);

function add(a, b) {
  const r = new Float64Array(32);

  for (let i = 0; i < 32; i++) {
    r[i] = a[i] + b[i];
  }

  return r;
}

function sub(a, b) {
  const r = ZERO();
  for (let i = 0; i < SIZE; i++) r[i] = a[i] - b[i];
  return r;
}

function scale(s, a) {
  const r = new Float64Array(32);

  for (let i = 0; i < 32; i++) {
    r[i] = a[i] * s;
  }

  return r;
}

// geometric product of basis blades
function bladeGP(a, b) {
  let sign = 1;

  // swaps required to move bits of a past bits of b
  for (let i = 0; i < N; i++) {
    if (a & (1 << i)) {
      const lower = b & ((1 << i) - 1);
      if (popcount(lower) & 1) sign = -sign;
    }
  }

  // repeated basis vectors
  const common = a & b;

  for (let i = 0; i < N; i++) {
    if (common & (1 << i)) sign *= metric[i];
  }

  return [a ^ b, sign];
}

function popcount(x) {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

function gp(a, b) {
  const r = ZERO();

  for (let i = 0; i < SIZE; i++) {
    if (!a[i]) continue;

    for (let j = 0; j < SIZE; j++) {
      if (!b[j]) continue;

      const [k, s] = bladeGP(i, j);
      r[k] += s * a[i] * b[j];
    }
  }

  return r;
}

// exterior product
function wedge(a, b) {
  const r = ZERO();

  for (let i = 0; i < SIZE; i++) {
    if (!a[i]) continue;

    for (let j = 0; j < SIZE; j++) {
      if (!b[j]) continue;

      if (i & j) continue;

      let sign = 1;

      for (let k = 0; k < N; k++) {
        if (i & (1 << k)) {
          const lower = j & ((1 << k) - 1);
          if (popcount(lower) & 1) sign = -sign;
        }
      }

      r[i ^ j] += sign * a[i] * b[j];
    }
  }

  return r;
}

// reverse
function reverse(a) {
  const r = ZERO();

  for (let i = 0; i < SIZE; i++) {
    const g = popcount(i);
    r[i] = ((g * (g - 1)) / 2) & 1 ? -a[i] : a[i];
  }

  return r;
}

function norm2(a) {
  return gp(a, reverse(a))[0];
}

// ------------------------------------------------------------
// CGA geometry
// ------------------------------------------------------------

export function point(x, y, z) {
  const r2 = x * x + y * y + z * z;

  return add(
    add(add(e0, scale(x, e1)), scale(y, e2)),
    add(scale(z, e3), scale(0.5 * r2, einf)),
  );
}

// Point pair
export function pointPair(a, b) {
  return wedge(a, b);
}
export function sphere(x, y, z, radius) {
  return sub(point(x, y, z), scale(0.5 * radius * radius, einf));
}

// Line through two points
export function line(a, b) {
  // OPNS line = A ^ B ^ einf
  return wedge(wedge(a, b), einf);
}

// Plane through three points
export function plane(normal, distance) {
  const [x, y, z] = normal;
  const len = Math.hypot(x, y, z);

  if (len < 1e-10) throw new Error("plane normal must not be zero");

  const nx = x / len;
  const ny = y / len;
  const nz = z / len;

  return add(
    add(add(scale(nx, e1), scale(ny, e2)), scale(nz, e3)),
    scale(-distance, einf),
  );
}

// Circle through three points
export function circle(a, b, c) {
  return wedge(wedge(a, b), c);
}

// ------------------------------------------------------------
// Motors / transformations
// ------------------------------------------------------------

// X' = M X reverse(M)
//
// For a normalized rotor/motor.
export function transform(x, motor) {
  return gp(gp(motor, x), reverse(motor));
}

// ------------------------------------------------------------
// Point extraction
// ------------------------------------------------------------

export function pointCoords(p) {
  // p = w(e0 + x e1 + y e2 + z e3 + ...)
  //
  // e0 has ep coefficient -1/2
  // and em coefficient +1/2.
  //
  // e1/e2/e3 coefficients are w*x etc.

  const w = p[16] - p[8]; // em - ep = w

  return {
    x: p[1] / w,
    y: p[2] / w,
    z: p[4] / w,
  };
}

// ------------------------------------------------------------
// Line parameters
// ------------------------------------------------------------
//
// A line has Plücker parameters
//
//   direction d
//   moment    m
//
// The representation returned here is scale-dependent.
// Normalize d if you need an actual unit direction.
//
// CGA line:
//
//   L = d ^ e0 + m ^ einf
//
// up to signs depending on basis convention.

export function lineParameters(L) {
  // With our basis, extract by converting the CGA line
  // into its six useful components.

  //
  // The easiest robust route is to use the dual line:
  //
  // But for lines constructed with line(A,B), the
  // e_i ^ e0 coefficients give the direction.
  //

  // e0 = (em - ep)/2
  //
  // coefficient(ei ^ em) - coefficient(ei ^ ep)
  // gives the e_i ^ e0 component.

  const d = [L[1 | 16] - L[1 | 8], L[2 | 16] - L[2 | 8], L[4 | 16] - L[4 | 8]];

  // e_i ^ einf = e_i ^ ep + e_i ^ em
  //
  // These are the moment coordinates.
  const m = [L[1 | 8] + L[1 | 16], L[2 | 8] + L[2 | 16], L[4 | 8] + L[4 | 16]];

  return { direction: d, moment: m };
}

// ------------------------------------------------------------
// Circle parameters
// ------------------------------------------------------------
//
// A CGA circle C is a trivector.
//
// Rather than attempting to identify the three defining points,
// use the standard CGA circle components.
//
// We obtain the center through:
//
//     center = C einf C
//
// and radius from the standard CGA relation.
//
// For convenience we first normalize C.
// ------------------------------------------------------------

function dual(a) {
  // I = e1 e2 e3 ep em
  //
  // Since I^2 = -1 in Cl(4,1),
  // I^-1 = -I.
  const I = gp(gp(gp(gp(e1, e2), e3), ep), em);

  return gp(a, scale(-1, I));
}

export function circleParameters(C) {
  // Center formula is particularly convenient in CGA:
  //
  // center = C einf C
  //
  // followed by normalization as a point.

  const center = gp(gp(C, einf), C);
  const p = pointCoords(center);

  // C's squared radius can be obtained from the
  // normalized circle and its center.
  //
  // We use a point on the circle recovered from the
  // circle algebraically below.
  //
  // For the common case of circles constructed as
  // P ^ Q ^ R, the following invariant works after
  // normalization.

  const n = Math.sqrt(Math.abs(norm2(C)));

  // A more useful implementation for visualization is
  // to obtain the radius from the dual circle.

  const D = dual(C);

  // D = alpha * (center - 1/2 r² einf)
  //
  // Normalize so the e0 coefficient is 1.
  const w = D[16] - D[8];

  if (Math.abs(w) < 1e-12) {
    return {
      center: [p.x, p.y, p.z],
      radius: Infinity,
    };
  }

  // In the point convention used here, the Euclidean
  // vector part of D gives the center.
  const cx = D[1] / w;
  const cy = D[2] / w;
  const cz = D[4] / w;

  // einf coefficient:
  //
  // D / w = center + .5(center²-r²)einf + e0
  //
  // therefore
  //
  // r² = center² - 2 * einfCoeff

  const einfCoeff = (D[8] + D[16]) / w;

  const r2 = cx * cx + cy * cy + cz * cz - 2 * einfCoeff;

  return {
    center: [cx, cy, cz],
    radius: Math.sqrt(Math.abs(r2)),
  };
}
export function sphereParameters(s) {
  const w = s[16] - s[8];

  const x = s[1] / w;
  const y = s[2] / w;
  const z = s[4] / w;

  const k = (s[8] + s[16]) / (2 * w);

  const radius2 = x * x + y * y + z * z - 2 * k;

  return {
    center: [x, y, z],
    radius: Math.sqrt(Math.max(0, radius2)),
  };
}
export function spinorNorm2(a) {
  return gp(a, reverse(a))[0];
}
export function isSphere(s, eps = 1e-10) {
  const w = s[16] - s[8];

  return Math.abs(w) > eps;
}
export function isPlane(a, eps = 1e-10) {
  return Math.abs(a[16] - a[8]) < eps;
}
export function planeParameters(p) {
  const nx = p[1];
  const ny = p[2];
  const nz = p[4];

  const len = Math.hypot(nx, ny, nz);

  if (len < 1e-10) return null;

  return {
    normal: [nx / len, ny / len, nz / len],
    distance: -(p[8] + p[16]) / (2 * len),
  };
}

// Useful exports
export { scalar, add, sub, scale, gp, wedge, reverse, norm2, dual };
