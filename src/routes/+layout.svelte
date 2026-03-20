<script>
    import "../global.scss";

    import { onMount } from "svelte";
    import { AuthStore } from "$lib/stores/auth";
    import { WsStore } from "$lib/stores/ws";

    onMount(async () => {
        await AuthStore.load();
        WsStore.connect();
    });
</script>

<slot />
