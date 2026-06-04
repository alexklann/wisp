<script lang="ts">
    import pushNotification from "$lib/sendNotification";
    import { apiFetch, getServerDomain } from "$lib/stores/api";
    import { uiState } from "$lib/stores/uiState.svelte";
    import { WsStore } from "$lib/stores/ws";
    import type Message from "../models/message";
    import TextInput from "./TextInput.svelte";

    let typingUsers: { userId: string; displayName: string }[] = $state([]);
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    let scrollContainer = $state<HTMLDivElement>();
    let serverDomain = $state<string>("");

    let showFullscreenImage = $state<boolean>(false);
    let fullscreenImageURL = $state<string>("");

    $effect(() => {
        const handleMessage = async (event: Message) => {
            console.log(event);
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
                `/channels/${uiState.selectedChannel}/messages/`,
            );
            if (response.ok && !isAborted) {
                serverDomain = await getServerDomain();
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
    {#if showFullscreenImage}
        <button
            type="button"
            onclick={() => (showFullscreenImage = false)}
            onkeydown={(e) => {
                if (e.key === "Escape") showFullscreenImage = false;
            }}
            class="fullscreen-image-container"
        >
            <img
                class="fullscreen-image"
                src={fullscreenImageURL}
                alt="User sent"
                loading="eager"
            />
        </button>
    {/if}
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
                    {#if message.attachments && message.attachments.length > 0}
                        {#each message.attachments as attachment}
                            {#if attachment.file_type.startsWith("image/")}
                                <div
                                    class="inline-image"
                                    onclick={() => {
                                        fullscreenImageURL = `${serverDomain}${attachment.url}`;
                                        showFullscreenImage = true;
                                    }}
                                    role="none"
                                >
                                    <img
                                        src={`${serverDomain}${attachment.url.split(".webp")[0]}_thumb.webp`}
                                        alt="User sent"
                                        style="width: 128px;"
                                        loading="lazy"
                                    />
                                </div>
                            {/if}
                        {/each}
                    {/if}
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

    .inline-image {
        width: fit-content;
        cursor: pointer;
    }

    .fullscreen-image-container {
        position: absolute;
        inset: 0;

        padding: 64px;

        display: flex;
        justify-content: center;
        align-items: center;

        cursor: default;

        background-color: #0000004b;

        animation: fade-in 0.1s ease-out forwards;
    }

    .fullscreen-image {
        max-height: 100%;
        width: auto;

        animation: expand-in 0.15s ease-out forwards;
    }

    @keyframes expand-in {
        0% {
            scale: 0.9;
        }
        100% {
            scale: 1;
        }
    }

    @keyframes fade-in {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
</style>
