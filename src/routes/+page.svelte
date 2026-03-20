<script lang="ts">
    import { apiFetch } from "$lib/stores/api";
    import { AuthStore } from "$lib/stores/auth";
    import { ConfigStore } from "$lib/stores/config";
    import { WsStore } from "$lib/stores/ws";
    import { onMount } from "svelte";

    interface Server {
        id: string;
        name: string;
        icon_url: string | null;
        role: string;
        joined_at: string;
    }

    interface Channel {
        id: string;
        name: string;
        server_id: string;
        created_at: string;
    }

    interface Message {
        id: number;
        channel_id: string;
        sender_id: string;
        sender_username: string;
        sender_display_name: string;
        sender_avatar_url: string | null;
        content: string | null;
        message_type: string;
        edited_at: string | null;
        reply_to_id: string | null;
        is_deleted: number;
        created_at: string;
    }

    onMount(async () => {
        await AuthStore.load();
        const response = await apiFetch("/servers");
        if (response.ok) {
            servers = await response.json();
        }
    });

    WsStore.on("message", (event) => {
        messages = [...messages, event];
    });

    async function loadChannels() {
        const response = await apiFetch(`/servers/${selectedServer}/channels`);

        if (response.ok) {
            channels = await response.json();
        }
    }

    async function loadMessages() {
        const response = await apiFetch(
            `/channels/${selectedChannel}/messages`,
        );

        if (response.ok) {
            messages = await response.json();
        }
    }

    function sendMessage() {
        if (!selectedChannel) return;
        WsStore.sendMessage(selectedChannel, messageInput);
    }

    let servers: Server[] = [];
    let channels: Channel[] = [];
    let messages: Message[] = [];

    let selectedServer: string | null = null;
    let selectedChannel: string | null = null;

    let messageInput: string = "";
</script>

<main class="container">
    <div class="server-bar">
        {#if servers.length > 0}
            {#each servers as server}
                <div>
                    {#if server.icon_url}
                        <img src={server.icon_url} alt="server icon" />
                    {:else}
                        <button
                            onclick={() => {
                                selectedServer = server.id;
                                loadChannels();
                            }}
                            class={`icon-placeholder ${selectedServer === server.id ? "selected" : ""}`}
                            title={server.name}
                        >
                            {server.name.slice(0, 2)}
                        </button>
                    {/if}
                </div>
            {/each}
        {/if}
        <button
            class="icon-placeholder"
            style="font-size: 8px; position: absolute; bottom: 0; margin-bottom: 8px;"
            type="button"
            onclick={async () => {
                await ConfigStore.setApiUrl(null, false);
                window.location.href = "/settings";
            }}>disconnect</button
        >
    </div>
    {#if channels.length > 0}
        <div class="channel-bar">
            <span>Channels</span>
            {#each channels as channel}
                <button
                    onclick={() => {
                        if (selectedChannel === channel.id) return;
                        selectedChannel = channel.id;
                        loadMessages();
                        WsStore.joinChannel(channel.id);
                    }}
                    class={`channel ${selectedChannel === channel.id ? "selected" : ""}`}
                    >{channel.name}</button
                >
            {/each}
        </div>
    {/if}
    <div class="content">
        <div class="message-container">
            {#if messages.length > 0}
                {#each messages as message}
                    <div class="message">
                        <div class="message-header">
                            <span class="message-sender"
                                >{message.sender_display_name}</span
                            >
                            <span
                                >{new Date(message.created_at).toLocaleString(
                                    "de-DE",
                                )}</span
                            >
                        </div>
                        <span>{message.content}</span>
                    </div>
                {/each}
            {/if}
        </div>
        {#if selectedChannel}
            <input
                type="text"
                placeholder="Enter message..."
                bind:value={messageInput}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        sendMessage();
                        messageInput = "";
                    }
                }}
            />
        {/if}
    </div>
</main>

<style lang="scss">
    @use "$lib/variables" as *;

    main {
        height: 100%;
        width: 100%;

        display: flex;
        flex-direction: row;
    }

    .content {
        flex: 1;

        display: flex;
        flex-direction: column;

        padding: 16px;

        gap: 8px;
    }

    input {
        width: 100%;

        color: $text-color;
        background-color: $surface-color;

        border: 1px solid color-mix(in srgb, $surface-color, $text-color 10%);
        border-radius: 6px;

        padding: 12px;

        box-sizing: border-box;

        &:focus {
            outline: 1px solid
                color-mix(in srgb, $surface-color, $text-color 25%);
        }
    }

    .icon-placeholder {
        width: 64px;
        height: 64px;

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

    .server-bar {
        min-width: 64px;

        background: $surface-color;

        border-right: 1px solid color-mix(in srgb, $text-color, transparent 90%);

        padding: 8px;
    }

    .channel {
        width: 100%;

        background: none;

        text-align: left;

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
        width: 16rem;

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

    .message-container {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;

        justify-content: flex-end;

        gap: 4px;
    }

    .message {
        display: flex;
        flex-direction: column;
        gap: 4px;

        padding: 8px;

        border-radius: 8px;

        &:hover {
            background-color: $surface-color;
        }
    }

    .message-header {
        display: flex;
        flex-direction: row;

        align-items: baseline;

        gap: 12px;
    }

    .message-sender {
        font-weight: bold;
        font-size: 16px;
    }

    .selected {
        background-color: color-mix(in srgb, $surface-color, $text-color 10%);
    }
</style>
