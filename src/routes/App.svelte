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
        { el: cga.sphere(0.5, 0.2, 0.3, 0.5), color: "teal" },
        { el: cga.sphere(-0.5, -0.5, 0.3, 0.3), color: "tomato" },
        { el: cga.plane([0, 1, 1], 0.5), color: "rebeccapurple" },
        { el: cga.plane([0, 1, 0], -0.5), color: "limegreen" },
    ]);
</script>

<svelte:head>
    <title>3d CGA</title>
</svelte:head>

<div class="app">
    <div class="screen">
        <Canvas dpr={Math.max(window ? window.devicePixelRatio : 1, 2)}>
            <Scene {elements} bind:this={scene} />
        </Canvas>
    </div>
    <div bind:this={viewport} class="viewport"></div>
    <div class="menu">
        <h1>3D Conformal Transformations</h1>

        <fieldset>
            <legend>Elements</legend>
            {#each elements as { el, color }, eli}
                <label class="form-row">
                    Color:
                    <input type="color" bind:value={elements[eli].color} />
                </label>
                {#if cga.isSphere(el)}
                    <strong style:color>Sphere</strong>
                    {@const sphCoords = cga.sphereParameters(el)}
                    <form
                        style:accent-color={color}
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
                                min="-4"
                                max="4"
                                step="0.01"
                            />
                        </label>
                        <label class="form-row">
                            Y:
                            <input
                                type="range"
                                name="y"
                                value={sphCoords.center[1]}
                                min="-4"
                                max="4"
                                step="0.01"
                            />
                        </label>
                        <label class="form-row">
                            Z:
                            <input
                                type="range"
                                name="z"
                                value={sphCoords.center[2]}
                                min="-4"
                                max="4"
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
                    <strong style:color>Plane</strong>
                    {@const plnParams = cga.planeParameters(el)}
                    <form
                        style:accent-color={color}
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
                    <strong style:color>Uknown</strong>
                    <div>unknown</div>
                {/if}
            {/each}
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
