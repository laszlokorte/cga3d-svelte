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

export const e12 = wedge(e1, e2);
export const e13 = wedge(e1, e3);
export const e23 = wedge(e2, e3);
export const e21 = wedge(e2, e1);
export const e31 = wedge(e3, e1);
export const e32 = wedge(e3, e2);
export const e123 = wedge(wedge(e1, e2), e3);

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

export function zeroSphere(x, y, z) {
  const r2 = x * x + y * y + z * z;

  return add(
    add(add(e0, scale(x, e1)), scale(y, e2)),
    add(scale(z, e3), scale(0.5 * r2, einf)),
  );
}
export function point(x, y, z) {
  return add(add(add(e123, scale(x, e23)), scale(y, e31)), scale(z, e12));
}
export function pointReflection(x, y, z) {
  return wedge(
    wedge(plane([1, 0, 0], x), plane([0, 1, 0], y)),
    plane([0, 0, 1], z),
  );
}

// Point pair
export function pointPair(a, b) {
  return wedge(a, b);
}
export function sphere(x, y, z, radius) {
  return sub(zeroSphere(x, y, z), scale(0.5 * radius * radius, einf));
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
    scale(distance, einf),
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
export function undual(a) {
  // I = e1 e2 e3 ep em
  const I = gp(gp(gp(gp(e1, e2), e3), ep), em);

  return gp(a, I);
}

export function circleParameters(C) {
  const center = gp(gp(C, einf), C);
  const p = pointCoords(center);

  const D = dual(C);

  const w = D[17] - D[9];

  if (Math.abs(w) < 1e-12) {
    return {
      center: [p.x, p.y, p.z],
      radius: Infinity,
    };
  }

  const cx = D[1] / w;
  const cy = D[2] / w;
  const cz = D[4] / w;

  const einfCoeff = (D[9] + D[17]) / w;

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
  // Plane has only grade-1 components
  return isGrade(a, 1, eps) && Math.abs(a[16] - a[8]) < eps;
}
export function spinorNorm(a, eps = 1e-10) {
  const n = gp(a, reverse(a));

  // Must be scalar
  for (let i = 1; i < 32; i++) {
    if (Math.abs(n[i]) >= eps) return null;
  }

  return n[0];
}
export function isEuclideanPoint(a, eps = 1e-10) {
  const allowed = new Set([
    /* e12o  */ 11, /* e12∞  */ 19, /* e23o  */ 14, /* e23∞  */ 22,
    /* e31o  */ 13, /* e31∞  */ 21, /* e123  */ 7,
  ]);

  if (Math.abs(a[7]) < eps) return false;

  for (let i = 0; i < a.length; i++) {
    if (!allowed.has(i) && Math.abs(a[i]) >= eps) {
      return false;
    }
  }

  return true;
}
export function isPointPair(a, eps = 1e-10) {
  if (!isGrade(a, 2, eps)) return false;

  const n = spinorNorm(a, eps);

  return n !== null && Math.abs(n) > eps;
}

export function isCircle(a, eps = 1e-10) {
  if (!isGrade(a, 3, eps)) return false;

  const n = spinorNorm(a, eps);

  return n !== null && n < -eps;
}
export function pointPairCoords(b, eps = 1e-10) {
  const result = splitPointPair(b, eps);

  if (result === null) {
    return null;
  }

  if (result.tangent) {
    return [pointCoords(result.point), pointCoords(result.point)];
  }

  return [pointCoords(result.p2), pointCoords(result.p1)];
}
export function pointParameters(P, eps = 1e-10) {
  const w = P[7]; // e123

  if (Math.abs(w) < eps) {
    return null;
  }

  return {
    x: (P[14] + P[22]) / (2 * w), // e23o + e23∞
    y: -(P[13] + P[21]) / (2 * w), // e31o + e31∞
    z: (P[11] + P[19]) / (2 * w), // e12o + e12∞
  };
}
export function splitPointPair(b, eps = 1e-10) {
  let bb = scalarProduct(b, b);

  if (Math.abs(bb) < eps) {
    const w = wedge(b, einf);
    const inv = inverse(w, eps);

    if (inv === null) {
      return null;
    }

    const pos = gp(b, inv);
    const weight = scalarProduct(pos, sub(einf, scalar(1)));

    return {
      tangent: true,
      point: scale(pos, 1 / weight),
    };
  }

  if (bb < 0) {
    b = gp(b, pseudoscalar());
    bb = scalarProduct(b, b);
  }

  const bBar = scale(1 / Math.sqrt(bb), b);

  const p = add(scalar(1), bBar);
  const pTilde = sub(scalar(1), bBar);

  const v = inner(b, em);

  const p1 = gp(p, v);
  const p2 = gp(pTilde, v);

  return { p1, p2 };
}
export function pseudoscalar() {
  const p = new Float64Array(SIZE);
  p[SIZE - 1] = 1; // e123pm
  return p;
}
export function scalarProduct(a, b) {
  return gp(a, b)[0];
}
function inner(a, b) {
  return dot(a, b);
}
export function inverse(a, eps) {
  const r = reverse(a);
  const s = scalarProduct(gp(a, r), scalar(1));

  if (Math.abs(s) < eps) return null;

  return scale(1 / s, r);
}
export function dot(a, b) {
  const result = new Array(32).fill(0);

  for (let i = 0; i < 32; i++) {
    if (a[i] === 0) continue;

    const ga = gradeOf(i);

    for (let j = 0; j < 32; j++) {
      if (b[j] === 0) continue;

      const gb = gradeOf(j);

      if (ga < gb) continue;

      const k = i ^ j;

      if (gradeOf(k) === ga - gb) {
        result[k] += a[i] * b[j] * gpBlade(i, j);
      }
    }
  }

  return result;
}

export function isGrade(a, grade, eps = 1e-10) {
  if (a.every((x) => Math.abs(x) < eps)) return false;
  for (let i = 0; i < 32; i++) {
    if (popcount(i) === grade) {
      continue;
    }

    if (Math.abs(a[i]) >= eps) {
      return false;
    }
  }

  return true;
}
function gpBlade(a, b) {
  let sign = 1;

  for (let i = 0; i < 5; i++) {
    if (a & (1 << i)) {
      for (let j = 0; j < i; j++) {
        if (b & (1 << j)) {
          sign = -sign;
        }
      }
    }
  }

  if (a & b & 16) {
    sign = -sign;
  }

  return sign;
}
function gradeOf(index) {
  let grade = 0;

  while (index !== 0) {
    grade += index & 1;
    index >>= 1;
  }

  return grade;
}
export function planeParameters(p) {
  const nx = p[1];
  const ny = p[2];
  const nz = p[4];

  const len = Math.hypot(nx, ny, nz);

  if (len < 1e-10) return null;

  return {
    normal: [nx / len, ny / len, nz / len],
    distance: (p[8] + p[16]) / (2 * len),
  };
}
export function meet(a, b) {
  return dual(wedge(a, b));
}
export function toString(a, eps = 1e-10) {
  const names = [
    "1", // 00000
    "e1", // 00001
    "e2", // 00010
    "e12", // 00011
    "e3", // 00100
    "e13", // 00101
    "e23", // 00110
    "e123", // 00111
    "eo", // 01000
    "e1o", // 01001
    "e2o", // 01010
    "e12o", // 01011
    "e3o", // 01100
    "e13o", // 01101
    "e23o", // 01110
    "e123o", // 01111
    "e∞", // 10000
    "e1∞", // 10001
    "e2∞", // 10010
    "e12∞", // 10011
    "e3∞", // 10100
    "e13∞", // 10101
    "e23∞", // 10110
    "e123∞", // 10111
    "eo∞", // 11000
    "e1o∞", // 11001
    "e2o∞", // 11010
    "e12o∞", // 11011
    "e3o∞", // 11100
    "e13o∞", // 11101
    "e23o∞", // 11110
    "e123o∞", // 11111
  ];

  const terms = [];

  for (let i = 0; i < a.length; i++) {
    const x = a[i];

    if (Math.abs(x) < eps) continue;

    const name = names[i];

    if (terms.length === 0) {
      terms.push(name === "1" ? `${x}` : `${x}${name}`);
    } else {
      const sign = x < 0 ? " - " : " + ";
      const value = Math.abs(x);

      terms.push(name === "1" ? `${sign}${value}` : `${sign}${value}${name}`);
    }
  }

  return terms.length ? terms.join("") : "0";
}

// Useful exports
export { scalar, add, sub, scale, gp, wedge, reverse, norm2, dual };
