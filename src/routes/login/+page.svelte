<script lang="ts">
    import { AuthStore } from "$lib/stores/auth";
    import { ConfigStore } from "$lib/stores/config";

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        showError = false;
        errorMessage = "";

        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const usernameInput = formData.get("username");
        const passwordInput = formData.get("password");

        const baseUrl = await ConfigStore.getApiUrl();
        const protocol = await ConfigStore.getApiProtocol("http");

        console.log(`${protocol}://${baseUrl}/login`);

        const response = await fetch(`${protocol}://${baseUrl}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput,
            }),
        });

        if (response.ok) {
            const responseBody = await response.json();
            await AuthStore.save(responseBody.token, responseBody);
            window.location.href = "/";
            return;
        }

        showError = true;
        errorMessage = response.statusText;
    }

    let showError: boolean = false;
    let errorMessage: string = "";
</script>

<main>
    <h1>Login</h1>
    <form onsubmit={handleSubmit}>
        <label>
            <span>Username</span>
            <input type="text" name="username" placeholder="Username" />
        </label>
        <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="Password" />
        </label>
        <button type="submit">Login</button>
        {#if showError}
            <span class="error-text">{errorMessage}</span>
        {/if}

        <div class="or-container">
            <hr />
            <span>or</span>
            <hr />
        </div>

        <button
            class="secondary-button"
            type="button"
            onclick={() => (window.location.href = "/register")}
            >Register</button
        >
    </form>
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
