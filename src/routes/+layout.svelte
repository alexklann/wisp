<script>
    import "../global.scss";

    import { popup } from "$lib/stores/popup";
    import { onMount } from "svelte";
    import { AuthStore } from "$lib/stores/auth";
    import { WsStore } from "$lib/stores/ws";
    import { ConfigStore } from "$lib/stores/config";
    import { goto } from "$app/navigation";
    import { stopPropagation } from "svelte/legacy";

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

    let serverIdInput = $state("");
</script>

{#if isReady}
    {#if $popup}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="popup-background" onclick={() => popup.set(null)}>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div class="popup-container" onclick={(e) => e.stopPropagation()}>
                <span class="popup-header">Join Server</span>
                <input bind:value={serverIdInput} />
                <button onclick={() => $popup.onConfirm(serverIdInput)}
                    >Join Server</button
                >
            </div>
        </div>
    {/if}

    {@render children()}
{:else}
    <div class="loading-screen">Authenticating...</div>
{/if}

<style lang="scss">
    @use "$lib/variables" as *;

    .loading-screen {
        width: 100%;
        height: 100%;

        display: flex;

        justify-content: center;
        align-items: center;
    }

    .popup-background {
        position: absolute;
        top: 0;
        left: 0;

        width: 100%;
        height: 100%;

        display: flex;

        justify-content: center;
        align-items: center;

        background: color-mix(in srgb, black, transparent 50%);
    }

    .popup-container {
        border: 1px solid color-mix(in srgb, $surface-color, $text-color 25%);
        border-radius: 8px;

        display: flex;
        flex-direction: column;

        padding: 16px;
        gap: 8px;

        background-color: $surface-color;
    }

    .popup-header {
        font-size: 18px;
        font-weight: bold;
    }

    input {
        padding: 12px;
        width: 256px;

        outline: none;

        color: $text-color;
        background-color: $surface-color;

        border: 1px solid color-mix(in srgb, $surface-color, $text-color 25%);
        border-radius: 8px;

        &:focus {
            outline: 1px solid $text-color;
        }
    }
</style>
