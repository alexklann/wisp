<script lang="ts">
    import { uiState } from "$lib/stores/uiState.svelte";
    import { apiFetch } from "$lib/stores/api";
    import { onMount } from "svelte";
    import type Server from "../models/server";
    import { ConfigStore } from "$lib/stores/config";
    import { popup } from "$lib/stores/popup";
    import { AuthStore } from "$lib/stores/auth";

    onMount(async () => {
        const response = await apiFetch("/servers/");
        if (response.ok) {
            servers = await response.json();
        }
    });

    let servers: Server[] = $state([]);
</script>

<div class="server-bar">
    {#if servers.length > 0}
        {#each servers as server}
            {#if server.icon_url}
                <img src={server.icon_url} alt="server icon" />
            {:else}
                <button
                    onclick={() => {
                        uiState.selectedServer = server.id;
                        uiState.selectedChannel = null;
                    }}
                    class={`icon-placeholder ${uiState.selectedServer === server.id ? "selected" : ""}`}
                    title={server.name}
                >
                    {server.name.slice(0, 2)}
                </button>
            {/if}
        {/each}
    {/if}
    <button
        class="icon-placeholder"
        title="Join Server"
        onclick={() => {
            popup.set({
                type: "joinServer",
                onConfirm: async (serverId: string) => {
                    await apiFetch(`/servers/${serverId}/join/`);
                    window.location.reload();
                },
            });
        }}
    >
        +
    </button>
    <button
        class="icon-placeholder"
        style="position: absolute; bottom: 0; margin-bottom: 8px;"
        type="button"
        onclick={async () => {
            await ConfigStore.setApiUrl(null, false);
            await AuthStore.clear();
            window.location.href = "/settings";
        }}>DC</button
    >
</div>

<style lang="scss">
    .server-bar {
        min-width: 48px;

        display: flex;
        flex-direction: column;
        gap: 8px;

        background: $surface-color;

        border-right: 1px solid color-mix(in srgb, $text-color, transparent 90%);

        padding: 8px;
    }

    .icon-placeholder {
        width: 48px;
        height: 48px;

        display: flex;

        justify-content: center;
        align-items: center;

        background-color: $surface-color;
        border: 1px solid color-mix(in srgb, $text-color, transparent 90%);
        border-radius: 16px;

        color: $text-color;

        font-size: 24px;
        font-weight: bold;

        padding: 16px;

        cursor: pointer;

        transition-property: background-color;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 100ms;

        &:hover {
            background-color: color-mix(
                in srgb,
                $surface-color,
                $text-color 10%
            );
        }
    }

    .selected {
        background-color: color-mix(in srgb, $surface-color, $text-color 10%);
    }
</style>
