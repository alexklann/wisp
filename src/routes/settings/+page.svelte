<script lang="ts">
    import { goto } from "$app/navigation";
    import { ConfigStore } from "$lib/stores/config";

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        loading = true;
        error = "";

        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const ipInput = formData.get("ip") as string;
        const isSecureInput = formData.get("isSecure");

        try {
            const response = await fetch(
                `${isSecureInput ? "https" : "http"}://${ipInput}/health`,
                {
                    signal: AbortSignal.timeout(5000),
                },
            );
            if (!response.ok) throw new Error();
        } catch {
            error = "Could not reach server at that address";
            loading = false;
            return;
        }

        await ConfigStore.setApiUrl(
            ipInput,
            isSecureInput === "on" ? true : false,
        );

        window.location.href = "/";
    }

    var loading: boolean = false;
    var error: string = "";
</script>

<main>
    <h1>Settings</h1>
    <form onsubmit={handleSubmit}>
        <label>
            <span>Server IP & Port</span>
            <input
                type="text"
                name="ip"
                placeholder="127.0.0.1:3000 / domain.tld"
                autocapitalize="off"
                autocomplete="off"
                autocorrect="off"
                autofocus
            />
        </label>
        <label style="display: flex; flex-direction: row; align-items: center;">
            <span>HTTPS?</span>
            <input
                style="width: 16px; height: 16px; cursor: pointer;"
                type="checkbox"
                name="isSecure"
            />
        </label>

        <button class="secondary-button" type="submit" disabled={loading}
            >{!loading ? "Save" : "Testing..."}</button
        >
    </form>
    <span class="error-text">{error}</span>
</main>

<style lang="scss">
    @use "$lib/variables" as *;

    main {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;

        padding-top: 8rem;

        align-items: center;
    }

    h1 {
        font-size: 48px;

        margin-bottom: 2rem;
    }

    form {
        width: fit-content;

        display: flex;
        flex-direction: column;
        gap: 16px;

        padding: 24px;
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

    label {
        display: flex;
        flex-direction: column;
        gap: 4px;

        > span {
            font-size: 18px;
        }
    }

    .error-text {
        color: color-mix(in srgb, red, $text-color 50%);
    }

    .or-container {
        width: 100%;

        display: flex;
        flex-direction: row;
        gap: 8px;

        > hr {
            flex: 1;
        }
    }

    .secondary-button {
        background: none;

        color: $accent-color;
        border: 1px solid $accent-color;

        &:hover {
            background-color: color-mix(
                in srgb,
                $accent-color,
                transparent 90%
            );
        }
    }
</style>
