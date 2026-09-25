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

export const basisIndex = {
  scalar: 0b00000,
  e1: 0b00001,
  e2: 0b00010,
  e12: 0b00011,
  e3: 0b00100,
  e13: 0b00101,
  e23: 0b00110,
  e123: 0b00111,

  ep: 0b01000,
  e1p: 0b01001,
  e2p: 0b01010,
  e12p: 0b01011,
  e3p: 0b01100,
  e13p: 0b01101,
  e23p: 0b01110,
  e123p: 0b01111,

  em: 0b10000,
  e1m: 0b10001,
  e2m: 0b10010,
  e12m: 0b10011,
  e3m: 0b10100,
  e13m: 0b10101,
  e23m: 0b10110,
  e123m: 0b10111,

  epm: 0b11000,
  e1pm: 0b11001,
  e2pm: 0b11010,
  e12pm: 0b11011,
  e3pm: 0b11100,
  e13pm: 0b11101,
  e23pm: 0b11110,
  e123pm: 0b11111,
};

export function setBasis(mv, b, v) {
  const r = new Float64Array(32);

  for (let i = 0; i < 32; i++) {
    r[i] = mv[i];
  }
  r[b] = v;
  return r;
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
export const epm = wedge(ep, em);

export const e12 = wedge(e1, e2);
export const e13 = wedge(e1, e3);
export const e23 = wedge(e2, e3);
export const e21 = wedge(e2, e1);
export const e31 = wedge(e3, e1);
export const e32 = wedge(e3, e2);
export const e123 = wedge(wedge(e1, e2), e3);
export const e123p = wedge(wedge(e1, e2), wedge(e3, ep));
export const e123m = wedge(wedge(e1, e2), wedge(e3, em));

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

export function zeroSphere(x, y, z, sign = 1) {
  const r2 = x * x + y * y + z * z;

  return scale(
    Math.sign(1 * sign),
    add(
      add(add(e0, scale(x, e1)), scale(y, e2)),
      add(scale(z, e3), scale(0.5 * r2, einf)),
    ),
  );
}
export function point(x, y, z) {
  return add(add(add(e123, scale(x, e23)), scale(y, e31)), scale(z, e12));
}
export function pointReflection(x, y, z, sign = 1) {
  return scale(
    sign,
    wedge(wedge(plane([1, 0, 0], x), plane([0, 1, 0], y)), plane([0, 0, 1], z)),
  );
}

// Point pair
export function pointPair(a, b) {
  return normalize(wedge(a, b));
}
export function sphere(x, y, z, radius, sign = 1) {
  return scale(
    sign,
    sub(
      scale(0.5 * Math.sign(radius) * radius * radius, einf),
      zeroSphere(x, y, z, 1),
    ),
  );
}

export function line([x, y, z], [dx, dy, dz]) {
  const P = zeroSphere(x, y, z);

  const D = add(scale(dx, e1), add(scale(dy, e2), scale(dz, e3)));

  return undual(wedge(wedge(P, D), einf));
}

// Plane through three points
export function plane(normal, distance) {
  const [x, y, z] = normal;
  const len = Math.hypot(x, y, z);

  if (len < 1e-5) throw new Error("plane normal must not be zero");

  const nx = x / len;
  const ny = y / len;
  const nz = z / len;

  return add(
    add(add(scale(nx, e1), scale(ny, e2)), scale(nz, e3)),
    scale(distance, einf),
  );
}

// Circle through three points
export function circleFromPoints(a, b, c) {
  return wedge(wedge(a, b), c);
}
// Circle with center, radius, and plane
export function circle(center, radius, normal) {
  const [x, y, z] = center;
  const nl = Math.hypot(...normal);
  const n = normal.map((x) => -x / nl);

  const distance = n[0] * x + n[1] * y + n[2] * z;

  return gp(sphere(x, y, z, radius), plane(n, distance));
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
  const x = p[1] / w;
  const y = p[2] / w;
  const z = p[4] / w;

  return {
    x: x,
    y: y,
    z: z,
    sign: Math.sign(w),
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

export function circleParameters(CC, eps = 1e-5) {
  const C = dual(CC);
  const q = gp(gp(C, einf), C);

  const w = q[16] - q[8];

  if (Math.abs(w) < eps) {
    return null;
  }

  const center = [q[1] / w, q[2] / w, q[4] / w];

  const n2 = norm2(C);
  const radius2 = (-2 * n2) / w;

  if (radius2 < -eps) {
    return null;
  }

  const D = dual(C);

  const normal = [D[17] - D[9], D[18] - D[10], D[20] - D[12]];

  const len = Math.hypot(...normal);

  if (len < eps) {
    return null;
  }

  return {
    center,
    radius: Math.sign(radius2) * Math.sqrt(Math.abs(radius2)),
    normal: normal.map((x) => x / len),
  };
}
export function sphereParameters(s) {
  const w = s[16] - s[8];

  const x = s[1] / w;
  const y = s[2] / w;
  const z = s[4] / w;

  const k = (s[8] + s[16]) / (2 * w);

  const radius2 = x * x + y * y + z * z - 2 * k;

  const radius = Math.sign(radius2) * Math.sqrt(Math.abs(radius2));
  const r = Math.abs(radius) < 1e-5 ? 0 : radius;
  return {
    center: [x, y, z],
    radius: r,
    sign: -Math.sign(w),
  };
}

export function isScaling(a, eps = 1e-5) {
  const t = a[24]; // epm

  if (Math.abs(t) < eps) return false;

  // eip == eim
  return (
    Math.abs(a[9] - a[17]) < eps &&
    Math.abs(a[10] - a[18]) < eps &&
    Math.abs(a[12] - a[20]) < eps
  );
}
export function scalingParameter(a) {
  const c = a[0];
  const t = a[24];

  const scale = (c - t) / (c + t);

  const pivot = [-a[9] / t, -a[10] / t, -a[12] / t];

  return { scale, pivot, sign: a[0] };
}

export function scaling(x, y, z, s, sign = 1) {
  const r = Math.sign(s || 1) * Math.sqrt(Math.abs(s));

  return scale(sign, gp(sphere(x, y, z, r), sphere(x, y, z, 1)));
}
export function isTranslation(m, eps = 1e-8) {
  if (Math.abs(m[0]) < eps) return false;

  const allowed = new Set([9, 10, 12, 17, 18, 20]);

  for (let i = 1; i < 32; i++) {
    if (!allowed.has(i) && Math.abs(m[i]) > eps) return false;
  }

  // ep/em components must occur as e_i p + e_i m,
  // i.e. with equal coefficients
  return (
    Math.abs(m[9] - m[17]) <= eps &&
    Math.abs(m[10] - m[18]) <= eps &&
    Math.abs(m[12] - m[20]) <= eps &&
    Math.hypot(m[9], m[10], m[12]) / m[0] > eps
  );
}
export function translationParams(m) {
  const s = m[0];

  return {
    x: (-2 * m[9]) / s,
    y: (-2 * m[10]) / s,
    z: (-2 * m[12]) / s,
    sign: Math.sign(s),
  };
}
export function translation(x, y, z, sign = 1) {
  return normalize(
    scale(
      -Math.sign(sign),
      gp(
        pointReflection(x / 4, y / 4, z / 4),
        pointReflection(x / -4, y / -4, z / -4),
      ),
    ),
  );
}

export function isSpherical(s, eps = 1e-5) {
  const w = s[16] - s[8];

  return Math.abs(w) > eps;
}
export function isSphere(s, eps = 1e-5) {
  return isSpherical(s, eps) && sphereParameters(s).radius >= 0;
}
export function isAntipodal(s, eps = 1e-5) {
  return isSpherical(s, eps) && sphereParameters(s).radius < 0;
}
function isProportional(a, b, eps = 1e-10) {
  let scale = null;

  for (let i = 0; i < 32; i++) {
    const x = a[i];
    const y = b[i];

    if (Math.abs(y) > eps) {
      const s = x / y;

      if (scale === null) {
        scale = s;
      } else if (Math.abs(x - scale * y) > eps) {
        return false;
      }
    } else if (Math.abs(x) > eps) {
      return false;
    }
  }

  return scale !== null;
}
export function isSphereAtInfinity(a, eps = 1e-10) {
  // Must be grade 1
  if (!isGrade(a, 1, eps)) return false;

  // a = λ (ep + em)
  return !isPlane(a, eps) && isProportional(a, einf, eps);
}
export function isPlane(a, eps = 1e-5) {
  if (!isGrade(a, 1, eps)) return false;

  // Plane must have zero eo component.
  if (Math.abs(a[16] - a[8]) > eps) return false;

  // And must have a nonzero Euclidean normal.
  return Math.abs(a[1]) > eps || Math.abs(a[2]) > eps || Math.abs(a[4]) > eps;
}
export function spinorNorm(a, eps = 1e-5) {
  const n = gp(a, reverse(a));

  // Must be scalar
  for (let i = 1; i < 32; i++) {
    if (Math.abs(n[i]) >= eps) return null;
  }

  return n[0];
}
export function isEuclideanPoint(a, eps = 1e-5) {
  if (!isGrade(a, 3, eps)) return false;

  const scale = Math.max(1, Math.hypot(...a));

  // Euclidean point must have e123 component.
  if (Math.abs(a[7]) <= eps * scale) return false;

  // Only these components are allowed.
  const allowed = [7, 11, 13, 14, 19, 21, 22];

  for (let i = 0; i < 32; i++) {
    if (!allowed.includes(i) && Math.abs(a[i]) > eps * scale) {
      return false;
    }
  }

  // p/m representation must have matching coefficients.
  if (Math.abs(a[11] - a[19]) > eps * scale) return false;
  if (Math.abs(a[13] - a[21]) > eps * scale) return false;
  if (Math.abs(a[14] - a[22]) > eps * scale) return false;

  return true;
}
export function isPointPair(a, eps = 1e-5) {
  if (!isGrade(a, 2, eps)) return false;
  if (isEuclideanPoint(a, eps)) return false;
  if (isEuclideanPoint(dual(a), eps)) return false;

  const points = pointPairCoords(a, eps);

  if (!points || points.length == 3) return false;

  return (
    Math.hypot(
      points[0].x - points[1].x,
      points[0].y - points[1].y,
      points[0].z - points[1].z,
    ) > eps
  );
}

export function isCircle(aa, eps = 1e-5) {
  const a = dual(aa);
  if (!isGrade(a, 3, eps)) return false;

  const n = spinorNorm(a, eps);
  if (n === null || n >= -eps) return false;

  const q = gp(gp(a, einf), a);
  const w = q[16] - q[8];

  return Math.abs(w) >= eps;
}
export function isLine(aa, eps = 1e-5) {
  const a = dual(aa);
  if (!isGrade(a, 3, eps)) return false;

  const n = spinorNorm(a, eps);
  if (n === null || n >= -eps) return false;

  const q = gp(gp(a, einf), a);
  const w = q[16] - q[8];

  return Math.abs(w) < eps;
}
export function lineParameters(LL, eps = 1e-5) {
  if (!isLine(LL, eps)) return null;
  const L = dual(LL);

  const direction = [
    L[25], // e1o∞
    L[26], // e2o∞
    L[28], // e3o∞
  ];

  const len2 = direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2;

  if (len2 < eps * eps) return null;

  const len = Math.sqrt(len2);
  const d = direction;

  // Plücker moment
  const m = [
    -L[14], // e23o
    L[13], // -e13o
    -L[11], // e12o
  ];

  // Point on line closest to origin:
  // p = m × d / |d|²
  const point = [
    (m[1] * d[2] - m[2] * d[1]) / len2,
    (m[2] * d[0] - m[0] * d[2]) / len2,
    (m[0] * d[1] - m[1] * d[0]) / len2,
  ];

  return {
    point,
    direction: d,
  };
}
export function pointPairCoords(b, eps = 1e-5) {
  const result = splitPointPair(b, eps);

  if (result === null) {
    return null;
  }

  if (result.tangent) {
    return [pointCoords(result.point), pointCoords(result.point), true];
  }

  return [pointCoords(result.p2), pointCoords(result.p1)];
}
export function pointParameters(P, eps = 1e-5) {
  const w = P[7]; // e123

  if (Math.abs(w) < eps) {
    return null;
  }

  return {
    x: (P[14] + P[22]) / (2 * w), // e23o + e23∞
    y: -(P[13] + P[21]) / (2 * w), // e31o + e31∞
    z: (P[11] + P[19]) / (2 * w), // e12o + e12∞
    sign: Math.sign(w),
  };
}
export function splitPointPair(b, eps = 1e-5) {
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
export function isZero(a, eps = 1e-5) {
  return a.every((x) => Math.abs(x) < eps);
}

export function isGrade(a, grade, eps = 1e-5) {
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
export function hasGrade(a, grade, eps = 1e-5) {
  if (a.every((x) => Math.abs(x) < eps)) return false;
  for (let i = 0; i < 32; i++) {
    if (popcount(i) === grade && Math.abs(a[i]) >= eps) {
      return true;
    }
  }

  return false;
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

  if (len < 1e-5) return null;

  return {
    normal: [nx / len, ny / len, nz / len],
    distance: (p[8] + p[16]) / (2 * len),
  };
}
export function meet(a, b) {
  return wedge(a, b);
}
const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
  minimumFractionDigits: 5,
  useGrouping: false,
});
export function toString(a, eps = 1e-5) {
  const names = [
    "1", // 00000
    "e1", // 00001
    "e2", // 00010
    "e12", // 00011
    "e3", // 00100
    "e13", // 00101
    "e23", // 00110
    "e123", // 00111

    "ep", // 01000
    "e1p", // 01001
    "e2p", // 01010
    "e12p", // 01011
    "e3p", // 01100
    "e13p", // 01101
    "e23p", // 01110
    "e123p", // 01111

    "em", // 10000
    "e1m", // 10001
    "e2m", // 10010
    "e12m", // 10011
    "e3m", // 10100
    "e13m", // 10101
    "e23m", // 10110
    "e123m", // 10111

    "epm", // 11000
    "e1pm", // 11001
    "e2pm", // 11010
    "e12pm", // 11011
    "e3pm", // 11100
    "e13pm", // 11101
    "e23pm", // 11110
    "e123pm", // 11111
  ];

  const terms = [];

  for (let i = 0; i < a.length; i++) {
    const x = a[i];

    if (Math.abs(x) < eps) continue;

    const name = names[i];

    if (terms.length === 0) {
      terms.push(
        name === "1"
          ? `${formatter.format(x)}`
          : `${formatter.format(x)}${name}`,
      );
    } else {
      const sign = x < 0 ? " - " : " + ";
      const value = Math.abs(x);

      terms.push(
        name === "1"
          ? `${sign}${formatter.format(value)}`
          : `${sign}${formatter.format(value)}${name}`,
      );
    }
  }

  return terms.length ? terms.join("") : "0";
}
export function zero() {
  return new Float32Array(32);
}

export function identity() {
  const r = new Float32Array(32);
  r[0] = 1;
  return r;
}

export function motorSqrt(m) {
  const I = identity();

  // X = M - 1
  const X = add(m, scale(-1, I));

  let result = I;
  let term = I;

  let coefficient = 1;

  // sqrt(1 + X)
  for (let i = 1; i <= 10; i++) {
    coefficient *= (0.5 - (i - 1)) / i;

    term = gp(term, X);

    result = add(result, scale(coefficient, term));
  }

  return result;
}

export function motorLog(M, eps = 1e-5) {
  const I = identity();

  // X = M - 1
  const X = M.slice();
  X[0] -= 1;

  // If X² = 0, then X is a nilpotent generator.
  // This covers BOTH:
  //
  //   M = X
  //   M = 1 + X
  //
  // for the interpolation we want.
  const X2 = gp(X, X);

  let x2 = 0;
  for (let i = 0; i < 32; i++) {
    x2 += Math.abs(X2[i]);
  }

  if (x2 < eps) {
    return X;
  }

  // If M itself is nilpotent, use M directly.
  const M2 = gp(M, M);

  let m2 = 0;
  for (let i = 0; i < 32; i++) {
    m2 += Math.abs(M2[i]);
  }

  if (m2 < eps) {
    return M.slice();
  }

  // ---- ordinary motor logarithm ----

  let m = M.slice();
  let k = 0;

  for (let i = 0; i < 16; i++) {
    let d = 0;

    for (let j = 0; j < 32; j++) {
      const x = m[j] - (j === 0 ? 1 : 0);
      d += x * x;
    }

    if (d < 0.01) break;

    m = motorSqrt(m);
    k++;
  }

  const Y = m.slice();
  Y[0] -= 1;

  let result = zero();
  let power = Y;

  for (let i = 1; i <= 64; i++) {
    const coefficient = i & 1 ? 1 / i : -1 / i;

    result = add(result, scale(coefficient, power));

    power = gp(power, Y);

    let term = 0;

    for (let j = 0; j < 32; j++) term += Math.abs(power[j]);

    if (term < eps) break;
  }

  return scale(2 ** k, result);
}

export function rotorLog(M) {
  const s = M[0];

  // bivector part
  const B = new Float32Array(32);

  for (let i = 0; i < 32; i++) B[i] = M[i];

  B[0] = 0;

  const sinTheta = Math.sqrt(Math.max(0, 1 - s * s));

  if (sinTheta < 1e-5) {
    return B;
  }

  const theta = Math.acos(s);

  return scale(theta / sinTheta, B);
}
export function normalize(a, eps = 1e-5) {
  let n = 0;

  for (let i = 0; i < a.length; i++) {
    n += a[i] * a[i];
  }

  n = Math.sqrt(n);

  if (n < eps) {
    return a;
  }

  return scale(1 / n, a);
}

export function isVersor(V, eps = 1e-5) {
  const Vinv = inverse(V, eps);
  if (!Vinv) return false;

  for (const e of [e1, e2, e3, ep, em]) {
    const x = gp(gp(V, e), Vinv);

    if (!isGrade(x, 1, eps)) return false;
  }

  return true;
}

// Useful exports
export { scalar, add, sub, scale, gp, wedge, reverse, norm2, dual };
