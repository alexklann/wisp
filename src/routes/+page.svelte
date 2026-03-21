<script lang="ts">
    import { uiState } from "$lib/stores/uiState.svelte";
    import ServersSidebar from "../components/ServersSidebar.svelte";
    import ChannelsSidebar from "../components/ChannelsSidebar.svelte";
    import ChannelView from "../components/ChannelView.svelte";
</script>

<main class="container">
    <ServersSidebar />
    {#if uiState.selectedServer}
        <ChannelsSidebar />
    {/if}
    {#if uiState.selectedChannel}
        <ChannelView />
    {/if}
</main>

<style lang="scss">
    @use "$lib/variables" as *;

    main {
        height: 100%;
        width: 100%;

        display: flex;
        flex-direction: row;
    }
</style>
