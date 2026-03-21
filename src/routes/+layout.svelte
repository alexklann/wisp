<script>
    import "../global.scss";

    import { onMount } from "svelte";
    import { AuthStore } from "$lib/stores/auth";
    import { WsStore } from "$lib/stores/ws";
    import { ConfigStore } from "$lib/stores/config";
    import { goto } from "$app/navigation";

    let { children } = $props();

    let isReady = $state(false);

    onMount(async () => {
        const configured = await ConfigStore.isConfigured();
        if (!configured) {
            await goto("/settings");
            return;
        }

        await AuthStore.load();
        await WsStore.connect();
        isReady = true;
    });
</script>

{#if isReady}
    {@render children()}
{:else}
    <div class="loading-screen">Authenticating...</div>
{/if}

<style lang="scss">
    .loading-screen {
        width: 100%;
        height: 100%;

        display: flex;

        justify-content: center;
        align-items: center;
    }
</style>
