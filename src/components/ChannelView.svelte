<script lang="ts">
    import pushNotification from "$lib/sendNotification";
    import { apiFetch } from "$lib/stores/api";
    import { uiState } from "$lib/stores/uiState.svelte";
    import { WsStore } from "$lib/stores/ws";
    import type Message from "../models/message";
    import TextInput from "./TextInput.svelte";

    let typingUsers: { userId: string; displayName: string }[] = $state([]);
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    let scrollContainer = $state<HTMLDivElement>();

    $effect(() => {
        const handleMessage = async (event: Message) => {
            messages.push(event);

            if (typingTimers.has(event.sender_id)) {
                clearTimeout(typingTimers.get(event.sender_id));
                typingTimers.delete(event.sender_id);
                typingUsers = typingUsers.filter(
                    (user) => user.userId !== event.sender_id,
                );
            }

            await pushNotification(
                event.sender_display_name,
                event.content ?? "No message content",
            );
        };

        const handleTypingEvent = (event: any) => {
            if (event.channel_id != uiState.selectedChannel) return;

            if (typingTimers.has(event.user_id)) {
                clearTimeout(typingTimers.get(event.user_id));
            } else {
                typingUsers = [
                    ...typingUsers,
                    { userId: event.user_id, displayName: event.display_name },
                ];
            }
            typingTimers.set(
                event.user_id,
                setTimeout(() => {
                    typingUsers = typingUsers.filter(
                        (user) => user.userId !== event.user_id,
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
            typingTimers.clear();
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
            {typingUsers.map((u) => u.displayName).join(", ")}
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
