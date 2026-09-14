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

  let out = `

    const int MV_SIZE = 32;
    struct MV {
                          float c[MV_SIZE];
                      };

    int popcount(int x) {
        int n = 0;

        for (int i = 0; i < 5; i++) {
            if ((x & (1 << i)) != 0)
                n++;
        }

        return n;
    }


    MV gp(MV a, MV b) {\n    MV r;\n`;

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

  out += `
  MV plane(vec3 normal, float distance) {
        MV r;

        for (int i = 0; i < 32; i++)
            r.c[i] = 0.0;

        vec3 n = normalize(normal);

        r.c[1] = n.x;
        r.c[2] = n.y;
        r.c[4] = n.z;

        // -distance * einf
        // einf = ep + em
        r.c[8]  = -distance;
        r.c[16] = -distance;

        return r;
    }

    vec3 pointCoords(MV p) {
        // e0 coefficient
        float w = p.c[16] - p.c[8];

        return vec3(
            p.c[1] / w,
            p.c[2] / w,
            p.c[4] / w
        );
    }
    MV point(vec3 p) {
        MV r;

        for (int i = 0; i < 32; i++)
            r.c[i] = 0.0;

        float r2 = dot(p, p);

        // e0 = (em - ep) / 2
        r.c[8]  = -0.5;
        r.c[16] =  0.5;

        // Euclidean coordinates
        r.c[1] = p.x;
        r.c[2] = p.y;
        r.c[4] = p.z;

        // 1/2 |p|² einf
        r.c[8]  += 0.5 * r2;
        r.c[16] += 0.5 * r2;

        return r;
    }


    MV reverse(MV a) {
        MV r;

        for (int i = 0; i < MV_SIZE; i++) {
            int grade = popcount(i);

            // (-1)^(grade * (grade - 1) / 2)
            int parity = (grade * (grade - 1) / 2) & 1;

            r.c[i] = parity != 0
                ? -a.c[i]
                : a.c[i];
        }

        return r;
    }


    MV sandwich(MV x, MV motor) {
        return gp(gp(motor, x), reverse(motor));
    }
  `;

  return out;
}
