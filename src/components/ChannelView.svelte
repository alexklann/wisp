<script lang="ts">
    import { apiFetch } from "$lib/stores/api";
    import { uiState } from "$lib/stores/uiState.svelte";
    import { WsStore } from "$lib/stores/ws";
    import type Message from "../models/message";
    import TextInput from "./TextInput.svelte";

    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    let typingUsers: string[] = $state([]);

    let scrollContainer = $state<HTMLDivElement>();

    $effect(() => {
        const handleMessage = (event: Message) => {
            messages.push(event);
        };

        const handleTypingEvent = (event: any) => {
            if (!typingUsers.includes(event.display_name)) {
                typingUsers.push(event.display_name);
            }
            clearTimeout(typingTimers.get(event.user_id));
            typingTimers.set(
                event.user_id,
                setTimeout(() => {
                    typingUsers = typingUsers.filter(
                        (u) => u !== event.display_name,
                    );
                    typingTimers.delete(event.user_id);
                }, 3000),
            );
        };

        WsStore.on("message", handleMessage);
        WsStore.on("typingStart", handleTypingEvent);

        return () => {
            WsStore.off("message", handleMessage);
            WsStore.off("typingStart", handleTypingEvent);
            typingTimers.forEach((timer) => clearTimeout(timer));
        };
    });

    $effect(() => {
        if (!uiState.selectedChannel) {
            messages = [];
            return;
        }

        let isAborted = false;

        async function fetchMessages() {
            const response = await apiFetch(
                `/channels/${uiState.selectedChannel}/messages`,
            );
            if (response.ok && !isAborted) {
                messages = await response.json();
            }
        }

        fetchMessages();

        return () => {
            isAborted = true;
        };
    });

    $effect(() => {
        messages.length;

        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    });

    let messages: Message[] = $state([]);
</script>

<div class="content">
    <div class="message-container" bind:this={scrollContainer}>
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
    {#if typingUsers.length > 0}
        <span>
            {typingUsers.join(", ")}
            {typingUsers.length === 1 ? "is" : "are"} typing...
        </span>
    {:else}
        <div style="min-height: 16px;"></div>
    {/if}
    <TextInput />
</div>

<style lang="scss">
    .content {
        flex: 1;

        display: flex;
        flex-direction: column;

        padding: 16px;

        gap: 8px;
    }

    .message-container {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;

        justify-content: flex-end;

        overflow-y: scroll;

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

    .message span {
        white-space: pre-wrap;
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
</style>
