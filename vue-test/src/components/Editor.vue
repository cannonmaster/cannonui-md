<!-- MarkdownEditorComponent.vue -->

<template>
  <div ref="editorContainer"></div>
</template>

<script setup>
// import { initMarkdownEditor, renderMarkdownEditor } from 'md-edit';
import { initMarkdownEditor, renderMarkdownEditor } from '@cannonui/md-edit';

import { ref, onMounted } from 'vue';
const props = defineProps({
  value: {
    type: String,
    default: '',
  },
});
const editorContainer = ref(null);
const html = renderMarkdownEditor(props.value);
onMounted(() => {
  editorContainer.value.innerHTML = html;
  initMarkdownEditor(editorContainer.value);
});
</script>
