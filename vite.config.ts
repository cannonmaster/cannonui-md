import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "CannonmasterMarkdownEditor",
      fileName: (format) => `cannonmaster-markdown-editor.${format}.js`,
    },
    rollupOptions: {
      external: [
        "markdown-it",
        "highlight.js",
        "markdown-it-highlightjs",
        "markdown-it-task-lists",
        "markdown-it-emoji",
        "markdown-it-attrs",
        "dompurify",
        "axios",
      ], // List all peer dependencies
      output: {
        globals: {
          "markdown-it": "MarkdownIt",
          "highlight.js": "hljs",
          "markdown-it-highlightjs": "markdownItHighlightjs",
          "markdown-it-task-lists": "markdownItTaskLists",
          "markdown-it-emoji": "markdownItEmoji",
          "markdown-it-attrs": "markdownItAttrs",
          dompurify: "DOMPurify",
          axios: "axios",
        },
      },
      plugins: [typescript()],
    },
  },
});
