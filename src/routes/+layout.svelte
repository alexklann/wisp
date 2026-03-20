<script>
    import "../global.scss";

    import { onMount } from "svelte";
    import { AuthStore } from "$lib/stores/auth";
    import { WsStore } from "$lib/stores/ws";
    import { ConfigStore } from "$lib/stores/config";
    import { goto } from "$app/navigation";

    onMount(async () => {
        const configured = await ConfigStore.isConfigured();
        if (!configured) {
            await goto("/settings");
            return;
        }

        await AuthStore.load();
        await WsStore.connect();
    });
</script>

<slot />
