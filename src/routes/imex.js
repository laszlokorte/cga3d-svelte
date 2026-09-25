const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
  minimumFractionDigits: 6,
  useGrouping: false,
});
const combinators = {
  sum: "sum",
  product: "product",
  wedge: "wedge",
};

export function encodeState({
  elements,
  combination,
  showVectorField,
  finalDual,
}) {
  return [
    `e=${elements
      .map(
        ({ active, color, el, weight }) =>
          `${weight ?? 1}:${active ? 1 : 0}:${color}:${el.map(formatter.format).join(",")}`,
      )
      .join(";")}`,
    `c=${combinators[combination]}`,
    `v=${showVectorField ? 1 : 0}`,
    `d=${finalDual ? 1 : 0}`,
  ].join("&");
}

export function decodeState(hash) {
  try {
    const p = new URLSearchParams(hash.slice(1));

    return {
      elements: p
        .get("e")
        .split(";")
        .map((s) => {
          const [weight, active, color, el] = s.split(":");

          return {
            active: active === "1",
            color,
            weight: parseFloat(weight),
            el: new Float64Array(el.split(",").map((n) => parseFloat(n))),
          };
        }),
      combination: combinators[p.get("c")],
      showVectorField: p.get("v") === "1",
      finalDual: p.get("d") === "1",
    };
  } catch {
    return null;
  }
}
