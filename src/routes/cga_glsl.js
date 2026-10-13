const N = 32;

// e1²=e2²=e3²=ep²=+1, em²=-1
const metric = [1, 1, 1, 1, -1];

function popcount(x) {
  let n = 0;
  for (let i = 0; i < 5; i++)
    if (x & (1 << i)) n++;
  return n;
}

// Maps array index 0..31 to struct fields c1..c32.
const c = i => `c${i + 1}`;
const zero = () => Array.from(
  { length: N },
  (_, i) => `r.${c(i)} = 0.0;`
).join("\n");

function bladeGP(a, b) {
  let sign = 1;

  for (let i = 0; i < 5; i++) {
    if (a & (1 << i)) {
      const lower = b & ((1 << i) - 1);
      if (popcount(lower) & 1) sign = -sign;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (a & b & (1 << i)) sign *= metric[i];
  }

  return { index: a ^ b, sign };
}

export function generateGP() {
  const terms = Array.from({ length: N }, () => []);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const { index, sign } = bladeGP(i, j);
      terms[index].push({ a: i, b: j, sign });
    }
  }

  const gp = Array.from({ length: N }, (_, k) => {
    const expr = terms[k].map(({ a, b, sign }) =>
      `${sign < 0 ? "-" : "+"}a.${c(a)} * b.${c(b)}`
    );

    // The first term does not need a leading plus sign.
    const rhs = expr.join(" ").replace(/^\+/, "");
    return `r.${c(k)} = ${rhs || "0.0"};`;
  }).join("\n");

  const add = Array.from({ length: N }, (_, i) =>
    `r.${c(i)} = a.${c(i)} + b.${c(i)};`
  ).join("\n");

  const sub = Array.from({ length: N }, (_, i) =>
    `r.${c(i)} = a.${c(i)} - b.${c(i)};`
  ).join("\n");

  const scale = Array.from({ length: N }, (_, i) =>
    `r.${c(i)} = s * a.${c(i)};`
  ).join("\n");

  const norm = Array.from({ length: N }, (_, i) =>
    `a.${c(i)} * a.${c(i)}`
  ).join(" + ");

  const distance = Array.from({ length: N }, (_, i) => {
    const x = i === 0
      ? `M.${c(i)} - 1.0`
      : `M.${c(i)}`;
    return `d += ${x} * ${x};`;
  }).join("\n");

  const reverse = Array.from({ length: N }, (_, i) => {
    const grade = popcount(i);
    const parity = (grade * (grade - 1) / 2) & 1;
    return `r.${c(i)} = ${parity ? "-" : ""}a.${c(i)};`;
  }).join("\n");

  const pointInit = [
    `r.${c(0)} = 0.0;`,
    `r.${c(1)} = p.x;`,
    `r.${c(2)} = p.y;`,
    `r.${c(4)} = p.z;`,
    `r.${c(8)} = -0.5;`,
    `r.${c(16)} = 0.5;`,
    `r.${c(8)} += 0.5 * r2;`,
    `r.${c(16)} += 0.5 * r2;`
  ].join("\n");

  const out = `
struct MV {
    ${Array.from({ length: N }, (_, i) =>
      `float ${c(i)};`
    ).join("\n    ")}
};

MV gp(MV a, MV b) {
    MV r;
    ${gp}
    return r;
}

MV plane(vec3 normal, float distance) {
    MV r;
    ${zero()}

    vec3 n = normalize(normal);

    r.${c(1)} = n.x;
    r.${c(2)} = n.y;
    r.${c(4)} = n.z;

    // -distance * einf
    r.${c(8)} = -distance;
    r.${c(16)} = -distance;

    return r;
}

float scalarPart(MV a) {
    return a.${c(0)};
}

MV add(MV a, MV b) {
    MV r;
    ${add}
    return r;
}

MV sub(MV a, MV b) {
    MV r;
    ${sub}
    return r;
}

MV scale(float s, MV a) {
    MV r;
    ${scale}
    return r;
}

MV ZERO() {
    MV r;
    ${zero()}
    return r;
}

MV identity() {
    MV r;
    ${zero()}
    r.${c(31)} = 1.0;
    return r;
}

MV scalar(float s) {
    MV r;
    ${zero()}
    r.${c(31)} = s;
    return r;
}

MV motorSqrt(MV M) {
    MV X = add(M, scale(-1.0, identity()));

    MV result = identity();
    MV term = identity();

    float coefficient = 1.0;

    for (int i = 1; i <= 10; i++) {
        coefficient *= (0.5 - float(i - 1)) / float(i);
        term = gp(term, X);
        result = add(result, scale(coefficient, term));
    }

    return result;
}

MV motorLog(MV M) {
    int k = 0;

    for (int i = 0; i < 8; i++) {
        float d = 0.0;
        ${distance}

        if (d < 0.01)
            break;

        M = motorSqrt(M);
        k++;
    }

    MV X = add(M, scale(-1.0, identity()));

    MV result = ZERO();
    MV power = X;

    for (int i = 1; i <= 16; i++) {
        float s = (i & 1) == 1
            ? 1.0 / float(i)
            : -1.0 / float(i);

        result = add(result, scale(s, power));
        power = gp(power, X);
    }

    result = scale(pow(2.0, float(k)), result);

    return result;
}

MV motorExpSimple(MV B, float t) {
    return add(
        scalar(cos(t)),
        scale(sin(t), B)
    );
}

float mvNorm(MV a) {
    return sqrt(${norm});
}

MV motorExp(MV B) {
    float n = mvNorm(B);

    if (n < 1e-6)
        return add(scalar(1.0), B);

    float s = max(1.0, ceil(log2(n)));
    float invS = exp2(-s);
    MV X = scale(invS, B);

    MV result = scalar(1.0);
    MV term = scalar(1.0);

    for (int k = 1; k <= 12; k++) {
        term = scale(1.0 / float(k), gp(term, X));
        result = add(result, term);
    }

    int squarings = int(s);

    for (int i = 0; i < squarings; i++)
        result = gp(result, result);

    return result;
}

vec3 pointCoords(MV p) {
    float w = p.${c(16)} - p.${c(8)};

    return vec3(
        p.${c(1)} / w,
        p.${c(2)} / w,
        p.${c(4)} / w
    );
}

MV point(vec3 p) {
    MV r;
    ${zero()}

    float r2 = dot(p, p);

    ${pointInit}

    return r;
}

MV reverse(MV a) {
    MV r;
    ${reverse}
    return r;
}

MV sandwich(MV x, MV motor) {
    return gp(gp(motor, x), reverse(motor));
}

MV inv(MV a) {
    MV r = reverse(a);
    MV n = gp(a, r);

    float s = n.${c(0)};

    return scale(1.0 / s, r);
}
`;

  return out;
}
