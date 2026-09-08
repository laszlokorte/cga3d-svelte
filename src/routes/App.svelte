<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
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

    let planes = $state([
        { x: 1, y: 0, z: 0, d: -0.1, color: "teal" },
        { x: 0, y: 1, z: 0, d: 0.1, color: "tomato" },
    ]);
</script>

<svelte:head>
    <title>3d CGA</title>
</svelte:head>

<div class="app">
    <div class="screen">
        <Canvas dpr={Math.max(window ? window.devicePixelRatio : 1, 2)}>
            <Scene {planes} bind:this={scene} />
        </Canvas>
    </div>
    <div bind:this={viewport} class="viewport"></div>
    <div class="menu">
        <h1>3D Conformal Transformations</h1>
        <fieldset>
            <legend
                >Planes
                <button
                    disabled={planes.length >= 5}
                    onclick={(evt) => {
                        planes.push({
                            x: planes.length % 3 == 0 ? 1 : 0,
                            y: planes.length % 3 == 1 ? 1 : 0,
                            z: planes.length % 3 == 2 ? 1 : 0,
                            d: planes.length >= 3 ? 0.3 : 0.1,
                            color: `hsl(${-planes.length * 80 + 380}, 100%, 50%)`,
                        });
                    }}>Add</button
                >
            </legend>

            {#each planes as p, pi}
                <div style:accent-color={p.color}>
                    <button
                        onclick={(evt) => {
                            planes = planes.filter((_, i) => i != pi);
                        }}>Remove</button
                    >
                    <label class="form-row">
                        Color:
                        <input
                            type="color"
                            bind:value={p.color}
                            min="-4"
                            max="4"
                            step="0.01"
                        />
                    </label>
                    <label class="form-row">
                        X:
                        <input
                            type="range"
                            bind:value={p.x}
                            min="-4"
                            max="4"
                            step="0.01"
                        />
                    </label>
                    <label class="form-row">
                        Y:
                        <input
                            type="range"
                            bind:value={p.y}
                            min="-4"
                            max="4"
                            step="0.01"
                        />
                    </label>
                    <label class="form-row">
                        Z:
                        <input
                            type="range"
                            bind:value={p.z}
                            min="-4"
                            max="4"
                            step="0.01"
                        />
                    </label>
                    <label class="form-row">
                        D:
                        <input
                            type="range"
                            bind:value={p.d}
                            min="-1"
                            max="1"
                            step="0.01"
                        />
                    </label>
                </div>
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
