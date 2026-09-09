const N = 32;

// e1²=e2²=e3²=ep²=+1, em²=-1
const metric = [1, 1, 1, 1, -1];

function popcount(x) {
  let n = 0;
  for (let i = 0; i < 5; i++) if (x & (1 << i)) n++;
  return n;
}

function bladeGP(a, b) {
  let sign = 1;

  for (let i = 0; i < 5; i++) {
    if (a & (1 << i)) {
      const lower = b & ((1 << i) - 1);
      if (popcount(lower) & 1) sign = -sign;
    }
  }

  // Metric contribution for common basis vectors.
  for (let i = 0; i < 5; i++) {
    if (a & b & (1 << i)) sign *= metric[i];
  }

  return {
    index: a ^ b,
    sign,
  };
}

export function generateGP() {
  const terms = Array.from({ length: N }, () => []);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const { index, sign } = bladeGP(i, j);

      terms[index].push({
        a: i,
        b: j,
        sign,
      });
    }
  }

  let out = `MV gp(MV a, MV b) {\n    MV r;\n`;

  for (let k = 0; k < N; k++) {
    out += `    r.c[${k}] = `;

    if (terms[k].length === 0) {
      out += `0.0;\n`;
      continue;
    }

    terms[k].forEach((term, n) => {
      const { a, b, sign } = term;

      if (n > 0) out += sign > 0 ? ` + ` : ` - `;
      else if (sign < 0) out += `-`;

      out += `a.c[${a}] * b.c[${b}]`;
    });

    out += `;\n`;
  }

  out += `    return r;\n}\n`;

  return out;
}
