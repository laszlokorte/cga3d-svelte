<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import * as cga from "./cga3";
    let viewport = $state();
    let scene = $state();
    let freeColors = $state([
        "gold",
        "tomato",
        "teal",
        "limegreen",
        "royalblue",
    ]);

    function updateCamera() {
        const rect = viewport.getBoundingClientRect();

        if (scene) {
            scene.updateViewport(rect);
        }
    }

    onMount(() => {
        updateCamera();

        const observer = new ResizeObserver(updateCamera);
        observer.observe(viewport);

        return () => observer.disconnect();
    });
    let dragging = $state(null);
    let over = $state(null);
    let elements = $state([]);
    const combinedMotor = $derived(
        elements
            .filter((e) => e.active)
            .reduce((a, b) => cga.gp(b.el, a), cga.scalar(1)),
    );

    const C = cga.circle([1, 2, 3], 4, [0, 0, 1]);
    const q = cga.gp(cga.gp(C, cga.einf), C);
    console.log(cga.circleParameters(C));

    console.log({
        q1: q[1],
        q2: q[2],
        q4: q[4],
        q8: q[8],
        q16: q[16],
        w: q[16] - q[8],
    });
</script>

<svelte:head>
    <title>3d CGA</title>
</svelte:head>

<div class="app">
    <div class="screen">
        <Canvas dpr={Math.max(window ? window.devicePixelRatio : 1, 2)}>
            <Scene bind:elements motor={combinedMotor} bind:this={scene} />
        </Canvas>
    </div>
    <div bind:this={viewport} class="viewport"></div>
    <div class="menu">
        <header>
            <h1>3D Conformal Transformations (WIP)</h1>
            <p>
                inspired by<br />
                <a
                    href="https://www.youtube.com/watch?v=q3as9SGmDdw"
                    target="_blank">Hamish Todd's Funhouse Mirror</a
                >
            </p>
            <p>
                <a href="https://tools.laszlokorte.de/" target="_blank"
                    >More Educational Tool</a
                >
            </p>
        </header>
        <div class="button-row">
            <fieldset class="fieldset-mini">
                <legend>Add Plane</legend>
                <div class="button-row">
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.pop(),
                                active: true,
                                el: cga.plane([1, 0, 0], 0),
                            });
                        }}>e1</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.pop(),
                                active: true,
                                el: cga.plane([0, 1, 0], 0),
                            });
                        }}>e2</button
                    >
                    <button
                        disabled={freeColors.length < 1}
                        onclick={(evt) => {
                            elements.push({
                                color: freeColors.pop(),
                                active: true,
                                el: cga.plane([0, 0, 1], 0),
                            });
                        }}>e3</button
                    >
                </div>
            </fieldset>
            <button
                disabled={freeColors.length < 1}
                onclick={(evt) => {
                    elements.push({
                        color: freeColors.pop(),
                        active: true,
                        el: cga.pointReflection(0, 0.5, 0.5),
                    });
                }}>Add Point</button
            >
            <button
                disabled={freeColors.length < 1}
                onclick={(evt) => {
                    elements.push({
                        color: freeColors.pop(),
                        active: true,
                        el: cga.sphere(0, 0, 0, 1),
                    });
                }}>Add Sphere</button
            >
            <button
                disabled={freeColors.length < 1}
                onclick={(evt) => {
                    elements.push({
                        color: freeColors.pop(),
                        active: true,
                        el: cga.pointPair(
                            cga.zeroSphere(0.3, -0.7, 0.0),
                            cga.zeroSphere(0.3, 0.7, 0.0),
                        ),
                    });
                }}>Add Point Pair</button
            >
            <button
                disabled={freeColors.length < 1}
                onclick={(evt) => {
                    elements.push({
                        color: freeColors.pop(),
                        active: true,
                        el: cga.circle([0, 0, 0], 1, [0, 1, 0]),
                    });
                }}>Add Circle</button
            >
        </div>
        <div class="block-list">
            {#each elements as { el, color }, eli}
                <div
                    class={{
                        element: true,
                        dragging: dragging == eli,
                        hover: over == eli,
                    }}
                    role="button"
                    tabindex="-1"
                    ondrop={(evt) => {
                        const from = JSON.parse(
                            evt.dataTransfer.getData("text/plain"),
                        );
                        const to = eli;
                        const fromIndex = Number(from.index);

                        if (fromIndex === to) return;
                        if (from.type == "cga-reorder") {
                            const item = elements[fromIndex];
                            const rest = [
                                ...elements.slice(0, fromIndex),
                                ...elements.slice(fromIndex + 1),
                            ];

                            elements = [
                                ...rest.slice(0, to),
                                item,
                                ...rest.slice(to),
                            ];
                        } else if (
                            from.type == "cga-sum" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.add(
                                    elements[to].el,
                                    elements[fromIndex].el,
                                ),
                                color: freeColors.pop(),
                                active: false,
                            });
                        } else if (
                            from.type == "cga-sub" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.sub(
                                    elements[to].el,
                                    elements[fromIndex].el,
                                ),
                                color: freeColors.pop(),
                                active: false,
                            });
                        } else if (
                            from.type == "cga-wedge" &&
                            freeColors.length
                        ) {
                            elements.push({
                                el: cga.meet(
                                    elements[to].el,
                                    elements[fromIndex].el,
                                ),
                                color: freeColors.pop(),
                                active: true,
                            });
                        }

                        dragging = null;
                        over = null;
                    }}
                    ondragover={(evt) => {
                        const from = JSON.parse(
                            evt.dataTransfer.getData("text/plain"),
                        );
                        const to = eli;
                        if (to !== Number(from.index)) {
                            evt.preventDefault();

                            over = eli;
                        }
                    }}
                    style:--color={color}
                >
                    <div class="element-head">
                        <div
                            role="button"
                            tabindex="-1"
                            draggable="true"
                            ondragstart={(evt) => {
                                evt.dataTransfer.setData(
                                    "text/plain",
                                    JSON.stringify({
                                        type: "cga-reorder",
                                        index: eli,
                                    }),
                                );
                                dragging = eli;
                            }}
                            ondragend={(evt) => {
                                dragging = null;
                                over = null;
                            }}
                        >
                            ☰
                        </div>
                        <div
                            role="button"
                            tabindex="-1"
                            draggable="true"
                            ondragstart={(evt) => {
                                evt.dataTransfer.setData(
                                    "text/plain",
                                    JSON.stringify({
                                        type: "cga-sum",
                                        index: eli,
                                    }),
                                );
                                dragging = eli;
                            }}
                            ondragend={(evt) => {
                                dragging = null;
                                over = null;
                            }}
                        >
                            +
                        </div>
                        <div
                            role="button"
                            tabindex="-1"
                            draggable="true"
                            ondragstart={(evt) => {
                                evt.dataTransfer.setData(
                                    "text/plain",
                                    JSON.stringify({
                                        type: "cga-sub",
                                        index: eli,
                                    }),
                                );
                                dragging = eli;
                            }}
                            ondragend={(evt) => {
                                dragging = null;
                                over = null;
                            }}
                        >
                            -
                        </div>
                        <div
                            role="button"
                            tabindex="-1"
                            draggable="true"
                            ondragstart={(evt) => {
                                evt.dataTransfer.setData(
                                    "text/plain",
                                    JSON.stringify({
                                        type: "cga-wedge",
                                        index: eli,
                                    }),
                                );
                                dragging = eli;
                            }}
                            ondragend={(evt) => {
                                dragging = null;
                                over = null;
                            }}
                        >
                            &wedge;
                        </div>
                        <button
                            onclick={(evt) => {
                                freeColors.push(color);
                                elements = elements.filter((_, i) => i !== eli);
                            }}
                        >
                            &cross;
                        </button>
                    </div>
                    <div class="element-head">
                        <label class="form-row">
                            <input
                                type="color"
                                bind:value={elements[eli].color}
                            />
                            <input
                                style:width="8em"
                                type="text"
                                bind:value={elements[eli].color}
                            />
                        </label>
                        <label class="form-checkbox">
                            <input
                                type="checkbox"
                                bind:checked={elements[eli].active}
                            />
                            Active
                        </label>
                    </div>
                    {#if cga.isSphere(el)}
                        <strong>Sphere</strong>
                        {@const sphCoords = cga.sphereParameters(el)}
                        <form
                            oninput={(evt) => {
                                const fd = Object.fromEntries(
                                    new FormData(evt.currentTarget),
                                );

                                elements[eli].el = cga.sphere(
                                    1 * fd.x,
                                    1 * fd.y,
                                    1 * fd.z,
                                    1 * fd.radius,
                                );
                            }}
                        >
                            <label class="form-row">
                                X:
                                <input
                                    type="range"
                                    name="x"
                                    value={sphCoords.center[0]}
                                    min="-2"
                                    max="2"
                                    step="0.01"
                                />
                            </label>
                            <label class="form-row">
                                Y:
                                <input
                                    type="range"
                                    name="y"
                                    value={sphCoords.center[1]}
                                    min="-2"
                                    max="2"
                                    step="0.01"
                                />
                            </label>
                            <label class="form-row">
                                Z:
                                <input
                                    type="range"
                                    name="z"
                                    value={sphCoords.center[2]}
                                    min="-2"
                                    max="2"
                                    step="0.01"
                                />
                            </label>

                            <label class="form-row">
                                Radius:
                                <input
                                    type="range"
                                    name="radius"
                                    value={sphCoords.radius}
                                    min="0"
                                    max="4"
                                    step="0.01"
                                />
                            </label>
                        </form>
                    {:else if cga.isPlane(el)}
                        <strong>Plane</strong>
                        {@const plnParams = cga.planeParameters(el)}
                        <form
                            oninput={(evt) => {
                                const fd = Object.fromEntries(
                                    new FormData(evt.currentTarget),
                                );

                                elements[eli].el = cga.plane(
                                    [1 * fd.x, 1 * fd.y, 1 * fd.z],
                                    1 * fd.distance,
                                );
                            }}
                        >
                            <label class="form-row">
                                X:
                                <input
                                    type="range"
                                    name="x"
                                    value={plnParams.normal[0]}
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                />
                            </label>
                            <label class="form-row">
                                Y:
                                <input
                                    type="range"
                                    name="y"
                                    value={plnParams.normal[1]}
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                />
                            </label>
                            <label class="form-row">
                                Z:
                                <input
                                    type="range"
                                    name="z"
                                    value={plnParams.normal[2]}
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                />
                            </label>

                            <label class="form-row">
                                Distance:
                                <input
                                    type="range"
                                    name="distance"
                                    value={plnParams.distance}
                                    min="-2"
                                    max="2"
                                    step="0.01"
                                />
                            </label>
                        </form>
                    {:else if cga.isPointPair(el)}
                        <strong>Point Pair</strong>
                        {@const [a, b] = cga.pointPairCoords(el)}
                        <div
                            style="display: grid; grid-template-columns: 1fr 1fr"
                        >
                            <form
                                oninput={(evt) => {
                                    const fd = Object.fromEntries(
                                        new FormData(evt.currentTarget),
                                    );

                                    const npp = cga.pointPair(
                                        cga.point(fd.x, fd.y, fd.z),
                                        cga.point(b.x, b.y, b.z),
                                    );
                                    if (cga.isPointPair(npp))
                                        elements[eli].el = npp;
                                }}
                            >
                                <label class="form-row">
                                    X:
                                    <input
                                        type="range"
                                        name="x"
                                        value={a.x}
                                        min="-1"
                                        max="1"
                                        step="0.01"
                                    />
                                </label>
                                <label class="form-row">
                                    Y:
                                    <input
                                        type="range"
                                        name="y"
                                        value={a.y}
                                        min="-1"
                                        max="1"
                                        step="0.01"
                                    />
                                </label>
                                <label class="form-row">
                                    Z:
                                    <input
                                        type="range"
                                        name="z"
                                        value={a.z}
                                        min="-1"
                                        max="1"
                                        step="0.01"
                                    />
                                </label>
                            </form>
                            <form
                                oninput={(evt) => {
                                    const fd = Object.fromEntries(
                                        new FormData(evt.currentTarget),
                                    );

                                    const npp = cga.pointPair(
                                        cga.point(a.x, a.y, a.z),
                                        cga.point(fd.x, fd.y, fd.z),
                                    );
                                    if (cga.isPointPair(npp))
                                        elements[eli].el = npp;
                                }}
                            >
                                <label class="form-row">
                                    X:
                                    <input
                                        type="range"
                                        name="x"
                                        value={b.x}
                                        min="-1"
                                        max="1"
                                        step="0.01"
                                    />
                                </label>
                                <label class="form-row">
                                    Y:
                                    <input
                                        type="range"
                                        name="y"
                                        value={b.y}
                                        min="-1"
                                        max="1"
                                        step="0.01"
                                    />
                                </label>
                                <label class="form-row">
                                    Z:
                                    <input
                                        type="range"
                                        name="z"
                                        value={b.z}
                                        min="-1"
                                        max="1"
                                        step="0.01"
                                    />
                                </label>
                            </form>
                        </div>
                    {:else if cga.isCircle(el)}
                        <strong>Circle</strong>
                        {@const cirParams = cga.circleParameters(el)}
                        <form
                            oninput={(evt) => {
                                const fd = Object.fromEntries(
                                    new FormData(evt.currentTarget),
                                );
                                if (
                                    Math.hypot(fd.nx, fd.ny, fd.nz) > 0 &&
                                    fd.radius > 0
                                ) {
                                    const nc = cga.circle(
                                        [1 * fd.x, 1 * fd.y, 1 * fd.z],
                                        1 * fd.radius,
                                        [1 * fd.nx, 1 * fd.ny, 1 * fd.nz],
                                    );

                                    if (cga.isCircle(nc)) {
                                        elements[eli].el = nc;
                                    }
                                }
                            }}
                        >
                            <div
                                style="display: grid; gap: 1ex; grid-template-columns: 1fr 1fr;"
                            >
                                <label
                                    class="form-row"
                                    style:grid-column="1 / -1"
                                >
                                    Radius:
                                    <input
                                        type="range"
                                        name="radius"
                                        value={cirParams.radius}
                                        min="0.0001"
                                        max="1"
                                        step="0.001"
                                    />
                                </label>
                                <div>
                                    <label class="form-row">
                                        X:
                                        <input
                                            type="range"
                                            name="x"
                                            value={cirParams.center[0]}
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                        />
                                    </label>
                                    <label class="form-row">
                                        Y:
                                        <input
                                            type="range"
                                            name="y"
                                            value={cirParams.center[1]}
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                        />
                                    </label>
                                    <label class="form-row">
                                        Z:
                                        <input
                                            type="range"
                                            name="z"
                                            value={cirParams.center[2]}
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label class="form-row">
                                        NX:
                                        <input
                                            type="range"
                                            name="nx"
                                            value={cirParams.normal[0]}
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                        />
                                    </label>
                                    <label class="form-row">
                                        NY:
                                        <input
                                            type="range"
                                            name="ny"
                                            value={cirParams.normal[1]}
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                        />
                                    </label>
                                    <label class="form-row">
                                        NZ:
                                        <input
                                            type="range"
                                            name="nz"
                                            value={cirParams.normal[2]}
                                            min="-1"
                                            max="1"
                                            step="0.01"
                                        />
                                    </label>
                                </div>
                            </div>
                        </form>
                    {:else if cga.isEuclideanPoint(el)}
                        {@const p = cga.pointParameters(el)}
                        <strong>Point</strong>
                        <form
                            oninput={(evt) => {
                                const fd = Object.fromEntries(
                                    new FormData(evt.currentTarget),
                                );
                                elements[eli].el = cga.pointReflection(
                                    fd.x,
                                    fd.y,
                                    fd.z,
                                );
                            }}
                        >
                            <label class="form-row">
                                X:
                                <input
                                    type="range"
                                    name="x"
                                    value={p.x}
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                />
                            </label>
                            <label class="form-row">
                                Y:
                                <input
                                    type="range"
                                    name="y"
                                    value={p.y}
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                />
                            </label>
                            <label class="form-row">
                                Z:
                                <input
                                    type="range"
                                    name="z"
                                    value={p.z}
                                    min="-1"
                                    max="1"
                                    step="0.01"
                                />
                            </label>
                        </form>
                    {:else}
                        <strong>Unknown</strong>
                    {/if}
                    <textarea
                        style:resize="none"
                        readonly
                        style:user-select="all">{cga.toString(el)}</textarea
                    >
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .app {
        display: grid;
        grid-template-columns: 0 [menu-start] 1.5fr [menu-end viewport-start] 2fr 2fr [viewport-end] 0;
        grid-template-rows: 0 [menu-start viewport-start] 1fr 1fr 1fr [menu-end viewport-end] 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        gap: 1em;
    }
    .menu {
        user-select: none;
        grid-area: menu;
        background-color: #0008;
        color: #fff;
        z-index: 1;
        max-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto auto;
        grid-auto-rows: 1fr;
    }
    header {
        padding: 1ex;
    }
    input[type="range"] {
        width: 100%;
        flex-grow: 1;
    }
    h1 {
        margin: 0;
        font-size: 1.2em;
    }
    .block-list {
        align-self: start;
        display: flex;
        flex-direction: column;
        gap: 1ex;
        max-height: 100%;
        overflow: auto;
        box-sizing: border-box;
        padding: 1ex;
        margin-bottom: 1ex;
    }
    .block-list::after {
        content: " ";
        display: block;
        height: 2em;
    }
    .element {
        user-select: none;
        display: flex;
        flex-direction: column;
        accent-color: var(--color);
        border: 1px solid var(--color);
        background: rgb(from var(--color) r g b / 10%);
        padding: 1ex;
    }

    .element-head {
        user-select: none;
        display: flex;
        gap: 1ex;
    }
    .form-checkbox {
        display: flex;
        align-items: center;
        font-size: smaller;
    }
    input[type="color"] {
        padding: 0;
        width: 3.5ex;
        height: 3.5ex;
        margin: 0;
        border: none;
    }
    input {
        font-family: monospace, monospace;
    }
    .viewport {
        background-color: #a000;
        grid-area: viewport;
        z-index: 100;
        pointer-events: none;
    }
    .screen {
        grid-area: 1 / 1 / -1 / -1;
        z-index: 0;
    }

    :global(html) {
        height: 100%;
    }
    :global(body) {
        margin: 0;
        font-family: monospace, monospace;
        height: 100%;
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: 100%;
    }
    label {
        display: flex;
    }

    .form-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1ex;
    }
    input[type="range"] {
        flex-grow: 1;
    }
    .button-row {
        display: flex;
        gap: 1ex;
        padding: 1ex;
    }

    button {
        border: none;
        background-color: #222;
        border-radius: 0;
        color: #fff;
        padding: 0.5ex 1ex;
        display: block;
        cursor: pointer;
        font: inherit;
    }
    .menu a {
        color: inherit;
    }
    [draggable] {
        cursor: hand;
        background-color: #222;
        color: #fff;
        align-items: center;
        padding: 1ex;
        display: flex;
    }
    .dragging {
        opacity: 0.2;
    }
    .hover {
        outline: 3px solid gold;
    }
    button:disabled {
        cursor: default;
        opacity: 0.3;
    }
    .fieldset-mini {
        padding: 0;
    }
</style>
