<script lang="ts">
    import { resolve } from "$app/paths";

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={resolve("/favicon.svg")} />
</svelte:head>

{@render children()}
