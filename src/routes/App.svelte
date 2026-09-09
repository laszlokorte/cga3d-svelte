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

    let elements = $state([
        { active: false, el: cga.sphere(0.5, 0.2, 0.3, 0.5), color: "teal" },
        {
            active: false,
            el: cga.sphere(-0.5, -0.5, 0.3, 0.3),
            color: "tomato",
        },
        {
            active: false,
            el: cga.plane([0, 1, 1], 0.5),
            color: "rebeccapurple",
        },
        { active: false, el: cga.plane([0, 1, 0], -0.5), color: "limegreen" },
    ]);
    const combinedMotor = $derived(
        elements
            .filter((e) => e.active)
            .reduce((a, b) => cga.gp(a, b.el), cga.scalar(1)),
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
        <h1>3D Conformal Transformations</h1>

        <fieldset>
            <legend>Elements</legend>
            <button
                onclick={(evt) => {
                    elements.push({
                        color: "red",
                        active: false,
                        el: cga.plane([1, 0, 0], 0),
                    });
                }}>Add</button
            >
            <div class="block-list">
                {#each elements as { el, color }, eli}
                    <div class="element" style:--color={color}>
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
                        {:else}
                            <strong>Uknown</strong>
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
</style>
