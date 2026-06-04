<script lang="ts">
    import { uiState } from "$lib/stores/uiState.svelte";
    import { WsStore } from "$lib/stores/ws";
    import { flushSync } from "svelte";
    import AttachmentIcon from "../icons/AttachmentIcon.svelte";
    import { apiFetch } from "$lib/stores/api";

    let messageInput: string = $state("");
    let textareaObject: HTMLTextAreaElement | null = null;

    let typingInterval: ReturnType<typeof setInterval> | undefined;
    let typingTimeout: ReturnType<typeof setTimeout> | undefined;

    let imageFileInput: HTMLInputElement | null = null;
    let uploadedAttachments: string[] = $state([]);

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

    function attachmentButtonClicked() {
        if (imageFileInput) {
            imageFileInput.click();
        }
    }

    async function attachmentInputChanged(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            for (const file of Array.from(input.files)) {
                const formData = new FormData();
                formData.append("file", file);
                try {
                    const response = await apiFetch("/upload/", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        console.error("Upload failed status:", response.status);
                        continue;
                    }

                    const responseBody = await response.json();

                    uploadedAttachments = [
                        ...uploadedAttachments,
                        responseBody.id,
                    ];
                    console.log("Uploaded file ID:", responseBody.id);
                } catch (err) {
                    console.error(
                        "Network or parsing error during upload:",
                        err,
                    );
                }
            }
        }
    }

    function sendMessage() {
        if (!uiState.selectedChannel) return;
        if (messageInput.trim().length === 0) return;
        console.log(
            `Sending message: ${messageInput} with ${uploadedAttachments.length} attachments to ${uiState.selectedChannel}`,
        );
        WsStore.sendMessage(
            uiState.selectedChannel,
            messageInput,
            uploadedAttachments,
        );
        flushSync(() => {
            messageInput = "";
            uploadedAttachments = [];
        });
        autoResize();
    }
</script>

<div class="textinput">
    <input
        onchange={attachmentInputChanged}
        class="hidden"
        bind:this={imageFileInput}
        type="file"
        multiple={false}
    />
    <button
        onclick={attachmentButtonClicked}
        class="attachment-button"
        title="Add Image"
    >
        <AttachmentIcon height={16} width={16} />
    </button>
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
</div>

<style lang="scss">
    .textinput {
        display: flex;
        flex-direction: row;

        align-items: start;

        gap: 8px;

        width: 100%;

        background-color: $surface-color;

        border: 1px solid color-mix(in srgb, $surface-color, $text-color 10%);
        border-radius: 6px;

        padding: 8px;
    }

    .textarea-container {
        flex: 1;

        &:focus-within {
            outline: 2px solid
                color-mix(in srgb, $surface-color, $accent-color 95%);
        }
    }

    textarea {
        height: 100%;
        width: 100%;
        min-height: 36px;

        color: $text-color;
        background: none;

        border: none;
        outline: none;

        font-size: 14px;

        resize: none;
    }

    .attachment-button {
        display: flex;

        align-items: center;
        justify-content: center;

        height: 100%;
        aspect-ratio: 1/1;

        border: 1px solid #484848;

        padding: 0;

        background-color: #282828;
        color: white;

        &:hover {
            background-color: #323232;
        }
    }

    .hidden {
        display: none;
    }
</style>
