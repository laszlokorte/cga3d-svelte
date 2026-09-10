<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import * as cga from "./cga3";
    let viewport = $state();
    let scene = $state();

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

    let elements = $state([]);
    const combinedMotor = $derived(
        elements
            .filter((e) => e.active)
            .reduce((a, b) => cga.gp(b.el, a), cga.scalar(1)),
    );
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

        <fieldset>
            <legend>Elements</legend>
            <div class="button-row">
                <button
                    onclick={(evt) => {
                        elements.push({
                            color: "red",
                            active: true,
                            el: cga.plane([1, 0, 0], 0),
                        });
                    }}>Add Plane</button
                >
                <button
                    onclick={(evt) => {
                        elements.push({
                            color: "purple",
                            active: true,
                            el: cga.sphere(0.1, 0, 0, 1),
                        });
                    }}>Add Sphere</button
                >
                <button
                    onclick={(evt) => {
                        elements.push({
                            color: "gold",
                            active: true,
                            el: cga.pointPair(
                                cga.point(0.3, -0.7, 0.0),
                                cga.point(0.3, 0.7, 0.0),
                            ),
                        });
                    }}>Add Point Pair</button
                >
            </div>
            <div class="block-list">
                {#each elements as { el, color }, eli}
                    <div class="element" style:--color={color}>
                        <div class="element-head">
                            <button
                                onclick={(evt) => {
                                    elements = elements.filter(
                                        (_, i) => i !== eli,
                                    );
                                }}
                            >
                                &cross;
                            </button>
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
                        {:else}
                            <strong>Unknown</strong>
                        {/if}
                    </div>
                {/each}
            </div>
        </fieldset>
    </div>
</div>

<style>
    .app {
        display: grid;
        grid-template-columns: 0 [menu-start] 1fr [menu-end viewport-start] 2fr 2fr [viewport-end] 0;
        grid-template-rows: 0 [menu-start viewport-start] 1fr 1fr 1fr [menu-end viewport-end] 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        gap: 1em;
    }
    .menu {
        grid-area: menu;
        background-color: #0008;
        color: #fff;
        z-index: 1;
        max-height: 100%;
        overflow: auto;
        padding: 1em;
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
        display: flex;
        flex-direction: column;
        gap: 1ex;
        max-height: 80%;
        overflow: auto;
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
    fieldset {
        border: 1px solid #fff8;
    }
    legend {
        padding: 1ex;
        color: #fff8;
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
</style>
