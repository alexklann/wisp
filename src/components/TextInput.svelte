<script lang="ts">
    import { uiState } from "$lib/stores/uiState.svelte";
    import { WsStore } from "$lib/stores/ws";
    import { flushSync } from "svelte";

    let messageInput: string = $state("");
    let textareaObject: HTMLTextAreaElement | null = null;

    let typingInterval: ReturnType<typeof setInterval> | undefined;
    let typingTimeout: ReturnType<typeof setTimeout> | undefined;

    function autoResize() {
        if (!textareaObject) return;
        textareaObject.style.height = "0px";
        textareaObject.style.height =
            Math.min(textareaObject.scrollHeight - 4, 110) + "px";
    }

    function handleTyping() {
        if (!uiState.selectedChannel) return;

        if (!typingInterval) {
            WsStore.sendTyping(uiState.selectedChannel);
            typingInterval = setInterval(() => {
                WsStore.sendTyping(uiState.selectedChannel!);
            }, 2500);
        }

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            clearInterval(typingInterval);
            typingInterval = undefined;
            typingTimeout = undefined;
        }, 3000);
    }

    function sendMessage() {
        if (!uiState.selectedChannel) return;
        if (messageInput.trim().length === 0) return;
        WsStore.sendMessage(uiState.selectedChannel, messageInput);
        flushSync(() => {
            messageInput = "";
        });
        autoResize();
    }
</script>

<div class="textarea-container">
    <textarea
        placeholder="Enter message..."
        autocapitalize="off"
        autocomplete="off"
        rows="1"
        bind:value={messageInput}
        bind:this={textareaObject}
        oninput={() => {
            handleTyping();
            autoResize();
        }}
        onkeydown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }}
    ></textarea>
</div>

<style lang="scss">
    .textarea-container {
        background-color: $surface-color;

        border: 1px solid color-mix(in srgb, $surface-color, $text-color 10%);
        border-radius: 6px;

        padding: 8px;

        &:focus-within {
            outline: 2px solid
                color-mix(in srgb, $surface-color, $accent-color 95%);
        }
    }

    textarea {
        width: 100%;

        color: $text-color;
        background: none;

        border: none;
        outline: none;

        font-size: 14px;

        resize: none;
    }
</style>
