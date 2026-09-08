<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
</script>

<svelte:head>
    <title>3d CGA</title>
</svelte:head>

<Canvas>
    <Scene />
</Canvas>

<style>
    :global(body) {
        margin: 0;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
    }
</style>
