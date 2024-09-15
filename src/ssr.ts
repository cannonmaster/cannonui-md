import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import markdownItHighlightjs from "markdown-it-highlightjs";
import markdownItTaskLists from "markdown-it-task-lists";
import { full as markdownItEmoji } from "markdown-it-emoji";
import markdownItAttrs from "markdown-it-attrs";
import menubar from "./menu";
export function renderMarkdownEditor(value = "") {
  const md = new MarkdownIt({
    html: true,
    highlight: function (str, lang): string {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(str, { language: lang }).value
          }</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  md.use(markdownItHighlightjs);
  md.use(markdownItTaskLists);
  md.use(markdownItEmoji);
  md.use(markdownItAttrs);

  const html = md.render(value);

  const escapedValue = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return (
    menubar() +
    `<div class="markdown-editor flex gap-6">
        <div class="editor-pane w-1/2 flex flex-col">

            <textarea class="markdown-input h-screen">${escapedValue}</textarea>
        </div>
        <div class="preview-pane w-1/2  overflow-auto">
            <div class="markdown-preview h-screen  prose">${html}</div>
        </div>
      </div>`
  );
}
