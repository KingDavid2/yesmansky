<template>
    <footer id="footer" class="content has-text-centered">
        <span class="tag is-black">
            👨‍💻 by <a target="_blank" href="https://github.com/Zizaco">Zizaco</a>
        </span>
    </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Footer',
})
</script>

<style>
#footer {
  position: absolute;
  bottom: 0;
}
</style>
