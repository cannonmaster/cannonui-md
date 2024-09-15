<script setup lang="ts">
import Editor from './components/Editor.vue'
</script>

<template>
  <Editor style="padding: 10%" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.flex {
  display: flex;
}
</style>
