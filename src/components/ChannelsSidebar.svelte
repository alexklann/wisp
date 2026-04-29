<script lang="ts">
    import { writeText } from "@tauri-apps/plugin-clipboard-manager";
    import { apiFetch } from "$lib/stores/api";
    import { uiState } from "$lib/stores/uiState.svelte";
    import { WsStore } from "$lib/stores/ws";
    import type Channel from "../models/channel";
    import pushNotification from "$lib/sendNotification";

    let channels: Channel[] = $state([]);

    $effect(() => {
        if (!uiState.selectedServer) {
            channels = [];
            return;
        }

        let isAborted = false;

        async function fetchChannels() {
            const response = await apiFetch(
                `/servers/${uiState.selectedServer}/channels/`,
            );
            if (response.ok && !isAborted) {
                channels = await response.json();
            }
        }

        fetchChannels();

        return () => {
            isAborted = true;
        };
    });
</script>

<div class="channel-bar">
    <span>Channels</span>
    {#each channels as channel}
        <button
            onclick={() => {
                if (uiState.selectedChannel === channel.id) return;
                uiState.selectedChannel = channel.id;
                WsStore.joinChannel(channel.id);
            }}
            class={`channel ${uiState.selectedChannel === channel.id ? "selected" : ""}`}
            >{channel.name}</button
        >
    {/each}
    <button
        onclick={async () => await writeText(uiState.selectedServer ?? "")}
        style="margin-top: auto;">Copy Server ID</button
    >
</div>

<style lang="scss">
    .channel {
        width: 100%;

        background: none;

        text-align: left;

        padding: 8px !important;

        color: $text-color;

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

    .channel-bar {
        width: 12rem;

        display: flex;
        flex-direction: column;

        gap: 8px;

        background: $surface-color;

        border-right: 1px solid color-mix(in srgb, $text-color, transparent 90%);

        padding: 16px;

        > span {
            font-weight: bold;
            margin-bottom: 4px;
        }
    }

    .selected {
        background-color: color-mix(in srgb, $surface-color, $text-color 10%);
    }
</style>
