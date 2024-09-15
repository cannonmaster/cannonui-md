import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import markdownItHighlightjs from "markdown-it-highlightjs";
import markdownItTaskLists from "markdown-it-task-lists";
import { full as markdownItEmoji } from "markdown-it-emoji";
import DOMPurify from "dompurify";
import axios from "axios";
// import "highlight.js/styles/github.css";
import markdownItAttrs from "markdown-it-attrs";

function toggleCodeBlock(selectedText: string, language = "") {
  // Updated regular expression to detect an existing code block correctly
  const codeBlockRegex = /^```([a-zA-Z]*?)\n([\s\S]+?)\n```$/;

  // Execute the regex test and extraction
  const match = selectedText.match(codeBlockRegex);

  if (match) {
    // If the selection is already a formatted code block
    // Return the content only, stripping the code block formatting
    return match[2];
  } else {
    // If it's not a code block, apply formatting with optional language
    // Trim the selected text to prevent unwanted empty lines
    selectedText = selectedText.trim();
    return `\`\`\`${language}\n${selectedText}\n\`\`\``; // Ensure newlines are correctly added
  }
}
function handleNewLineIndentation(
  this: HTMLTextAreaElement,
  event: KeyboardEvent
) {
  const cursorPos = this.selectionStart;
  const textUpToCursor = this.value.substring(0, cursorPos);
  const lastNewLinePos = textUpToCursor.lastIndexOf("\n") + 1; // Position after the last newline character

  // Find the indentation of the current line
  const currentLine = textUpToCursor.substring(lastNewLinePos);
  const indentationMatch = currentLine.match(/^\s*/); // Regex to capture leading whitespace
  const indentation = indentationMatch ? indentationMatch[0] : "";

  // Prevent the default newline insertion
  event.preventDefault();

  // Insert newline and the found indentation
  const before = this.value.substring(0, cursorPos);
  const after = this.value.substring(cursorPos);
  const newValue = before + "\n" + indentation + after;
  this.value = newValue;

  // Set ursor position right after the inserted indentation
  const newCursorPos = cursorPos + 1 + indentation.length;
  this.setSelectionRange(newCursorPos, newCursorPos);
}

function insertTable() {
  const rows = parseInt(
    prompt("Enter the number of rows (including header):") || "",
    10
  );
  const cols = parseInt(prompt("Enter the number of columns:") || "", 10);

  if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
    alert("Please enter valid numbers for rows and columns.");
    return ""; // Return an empty string if inputs are invalid
  }

  let table = "| " + Array(cols).fill("Header").join(" | ") + " |\n"; // Header
  table += "| " + Array(cols).fill("---").join(" | ") + " |\n"; // Alignment

  for (let i = 1; i < rows; i++) {
    // Start at 1 to account for the header row
    table += "| " + Array(cols).fill("Cell").join(" | ") + " |\n"; // Data rows
  }

  return table;
}

function alignText(text: string, alignment: string) {
  // Remove leading and trailing whitespace to prevent unwanted formatting
  text = text.trim();

  // Remove any existing paragraph tags to prevent nesting issues
  text = text.replace(/^<p>|<\/p>$/g, "");

  // Wrap the text in a div with the alignment style
  return `<div style="text-align: ${alignment};">${text}</div>`;
}

function toggleTaskList(selectedText: string) {
  const lines = selectedText.split("\n");
  const taskListRegex = /^\s*[-*+]\s+\[([ xX])\]\s*(.*)$/; // Matches task list items
  const listMarkerRegex = /^\s*[-*+]\s+(.*)$/; // Matches lines with list markers

  // Determine if all lines are task list items
  const allTasks = lines.every((line) => taskListRegex.test(line));

  return lines
    .map((line) => {
      const taskMatch = line.match(taskListRegex);
      const listMatch = line.match(listMarkerRegex);

      if (taskMatch && allTasks) {
        // If it's a task list item and all are tasks, remove the task formatting
        return taskMatch[2]; // Return content without the checkbox
      } else if (!taskMatch && !allTasks) {
        // If not a task list and not all are tasks, format as a task list
        // Remove existing list markers if present before adding task format
        const content = listMatch ? listMatch[1] : line;
        return `- [ ] ${content}`;
      }
      return line; // Return the line unchanged if it does not match conditions
    })
    .join("\n");
}

function toggleList(text: string, prefix: string, isOrdered = false) {
  if (!text.trim()) {
    // If no text is selected or the text is just whitespace, insert a sample list item
    return `${prefix}List item`;
  }

  const lines = text.split("\n");
  let isAlreadyList = true; // Assume initially that all lines are part of a list

  // Check if all lines already start with the list prefix
  lines.forEach((line) => {
    if (!line.startsWith(prefix)) {
      isAlreadyList = false;
    }
  });

  if (isAlreadyList) {
    // If all lines are already lists, remove the list formatting
    return lines.map((line) => line.substring(prefix.length)).join("\n");
  } else {
    // Otherwise, add the list formatting
    return lines
      .map((line, index) => {
        if (isOrdered) {
          // For ordered lists, add numbering dynamically
          return `${index + 1}. ${line}`;
        } else {
          // For unordered lists, add the specified prefix
          return `${prefix}${line}`;
        }
      })
      .join("\n");
  }
}
function toggleStrikethrough(text: string) {
  if (text.startsWith("~~") && text.endsWith("~~")) {
    // Remove strikethrough
    return text.slice(2, -2);
  } else {
    // Add strikethrough
    return `~~${text}~~`;
  }
}

function getScrollRatio(element: HTMLElement) {
  return element.scrollTop / (element.scrollHeight - element.clientHeight);
}

function setScrollRatio(element: HTMLElement, ratio: number) {
  element.scrollTop = ratio * (element.scrollHeight - element.clientHeight);
}

function debounce<T extends (...args: []) => void>(
  this: ThisParameterType<T>,
  func: T,
  wait: number,
  immediate?: boolean
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (this: ThisParameterType<T>) {
    let context = this,
      args = arguments as unknown as Parameters<T>;
    let later = function () {
      timeout = undefined;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
export function initMarkdownEditor(
  element: HTMLElement,
  uploadUrl: string = "/article/image/upload"
) {
  const md = new MarkdownIt({
    html: true,
    highlight: function (str: string, lang?: string): string {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(str, {
              language: lang,
              ignoreIllegals: true,
            }).value
          }</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  md.use(markdownItHighlightjs);
  md.use(markdownItTaskLists, {
    enabled: true,
    label: true,
    labelAfter: true,
  });
  md.use(markdownItEmoji);
  md.use(markdownItAttrs);

  let isEditorScrolling = false;
  let isPreviewScrolling = false;

  const textarea: HTMLTextAreaElement | null =
    element.querySelector(".markdown-input");
  const preview: HTMLElement | null =
    element.querySelector(".markdown-preview");
  const toolbar = element.querySelector(".markdown-toolbar");
  const imageInput: HTMLInputElement | null = element.querySelector(
    ".image-upload-input"
  );
  const save = element.querySelector(".save");

  if (!textarea || !preview || !toolbar || !imageInput || !save) {
    return;
  }

  console.log(save);

  const debouncedSyncPreview = debounce(() => {
    const scrollRatio = getScrollRatio(textarea);
    setScrollRatio(preview, scrollRatio);
  }, 50);

  const debouncedSyncTextarea = debounce(() => {
    const scrollRatio = getScrollRatio(preview);
    setScrollRatio(textarea, scrollRatio);
  }, 50);

  textarea.addEventListener("scroll", () => {
    if (isPreviewScrolling) {
      isPreviewScrolling = false;
      return;
    }
    isEditorScrolling = true;

    debouncedSyncPreview();

    setTimeout(() => {
      isEditorScrolling = false;
    }, 100);
  });

  preview.addEventListener("scroll", () => {
    if (isEditorScrolling) {
      isEditorScrolling = false;
      return;
    }
    isPreviewScrolling = true;

    debouncedSyncTextarea();

    setTimeout(() => {
      isPreviewScrolling = false;
    }, 100);
  });

  // Emoji picker elements
  const emojiDropdownToggle = toolbar.querySelector(
    'button[data-action="emoji-dropdown"]'
  );
  const emojiDropdown = toolbar.querySelector(".emoji-dropdown");

  if (!emojiDropdownToggle || !emojiDropdown) {
    return;
  }

  // Toggle the emoji dropdown
  emojiDropdownToggle.addEventListener("click", (event: Event) => {
    event.stopPropagation();
    emojiDropdown.classList.toggle("visible");
  });

  // Close the emoji dropdown when clicking outside
  document.addEventListener("click", (event: Event) => {
    if (!toolbar.contains(event.target as Element)) {
      emojiDropdown.classList.remove("visible");
    }
  });

  // Insert emoji shortcode into textarea
  emojiDropdown.addEventListener("click", (event: Event) => {
    if ((event.target as Element).matches("button[data-shortcode]")) {
      const shortcode = (event.target as Element).getAttribute(
        "data-shortcode"
      );
      if (!shortcode) return;
      insertAtCursor(textarea, shortcode);
      updatePreview();
      textarea.focus();
      emojiDropdown.classList.remove("visible");
    }
  });

  function insertAtCursor(textarea: HTMLTextAreaElement, text: string) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  textarea.addEventListener(
    "keydown",
    function (this: HTMLTextAreaElement, event: Event) {
      if ((event as KeyboardEvent).key === "Enter") {
        console.log(123);

        handleNewLineIndentation.call(this, event as KeyboardEvent);
      }
    }
  );

  const dropdownToggle = toolbar.querySelector('button[data-action="heading"]');
  const dropdownMenu = toolbar.querySelector(".heading-dropdown");

  if (!dropdownToggle || !dropdownMenu) {
    return;
  }

  dropdownToggle.addEventListener("click", (event: Event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  });

  dropdownMenu.addEventListener("click", (event: Event) => {
    const target = event.target as Element;
    if (target.matches("button[data-level]")) {
      const level = parseInt(target.getAttribute("data-level") || "0", 10);
      applyFormatting("heading", level);
      dropdownMenu.classList.add("hidden");
    }
  });

  document.addEventListener("click", (event) => {
    if (!toolbar.contains(event.target as Element)) {
      dropdownMenu.classList.add("hidden");
    }
  });

  const updatePreview = () => {
    const markdownText = textarea.value;
    // const safeHTML = md.render(markdownText);
    const safeHTML = DOMPurify.sanitize(md.render(markdownText));

    // Split the text into lines
    const lines = markdownText.split("\n");

    preview.innerHTML = safeHTML;
    document.querySelectorAll("pre code").forEach((block) => {
      if (block instanceof HTMLElement) hljs.highlightElement(block);
    });
  };

  let saveTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  const saveInterval = 2600;

  const autosave = () => {
    clearTimeout(saveTimeout);
    save.innerHTML = "保存中...";
    saveTimeout = setTimeout(() => {
      save.innerHTML = "保存成功";
      localStorage.setItem("markdown-editor-content", textarea.value);
    }, saveInterval);
  };

  const savedContent = localStorage.getItem("markdown-editor-content");
  if (savedContent) {
    textarea.value = savedContent;
    updatePreview();
  }

  textarea.addEventListener("input", () => {
    updatePreview();
    autosave();
  });

  const applyFormatting = (action: string, option?: any) => {
    let { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    let formattedText = selectedText;

    switch (action) {
      case "bold":
        if (/^\*\*(.*?)\*\*$/.test(selectedText)) {
          formattedText = selectedText.replace(/^\*\*(.*?)\*\*$/, "$1");
        } else {
          formattedText = `**${selectedText}**`;
        }
        break;
      case "italic":
        if (/^\*(.*?)\*$/.test(selectedText)) {
          formattedText = selectedText.replace(/^\*(.*?)\*$/, "$1");
        } else {
          formattedText = `*${selectedText}*`;
        }
        break;
      case "heading": {
        const level = option || 1; // Default to H1 if no level is specified
        const headingSyntax = "#".repeat(level) + " ";
        let start = selectionStart;
        while (start > 0 && value[start - 1] !== "\n") start--; // Extend start to the beginning of the line
        let end = selectionEnd;
        while (end < value.length && value[end] !== "\n") end++; // Extend end to the end of the line

        const lineText = value.substring(start, end);
        const headingRegex = /^(#+\s)/; // Regex to find existing heading
        const existingHeadingMatch = lineText.match(headingRegex);

        if (existingHeadingMatch) {
          // Remove existing heading
          const existingHeadingLength = existingHeadingMatch[0].length;
          formattedText = lineText.substring(existingHeadingLength).trim();
        } else {
          // No heading found, use the whole line
          formattedText = lineText.trim();
        }

        // Apply new heading
        formattedText = headingSyntax + formattedText;

        // Replace the text in the textarea
        textarea.setRangeText(formattedText, start, end, "select");
        selectionStart = start;
        selectionEnd = start + formattedText.length;
        break;
      }
      case "link":
        if (/^\[(.*?)\]\((.*?)\)$/.test(selectedText)) {
          // 移除链接格式
          formattedText = selectedText.replace(/^\[(.*?)\]\((.*?)\)$/, "$1");
        } else {
          // 应用链接格式
          formattedText = `[${selectedText}](url)`;
        }
        break;
      // 根据需要添加更多的格式
      case "quote":
        const lines = selectedText.split("\n");
        formattedText = lines
          .map((line: string) => {
            return line.startsWith("> ") ? line.substring(2) : `> ${line}`;
          })
          .join("\n");
        break;
      case "code":
        if (selectedText.includes("\n")) {
          // Multi-line code (Block Code)
          formattedText =
            selectedText.startsWith("```") && selectedText.endsWith("```")
              ? selectedText.slice(3, -3)
              : `\`\`\`\n${selectedText}\n\`\`\``;
        } else {
          // Single-line code (Inline Code)
          formattedText =
            selectedText.startsWith("`") && selectedText.endsWith("`")
              ? selectedText.slice(1, -1)
              : `\`${selectedText}\``;
        }
        break;
      case "unordered-list":
        formattedText = toggleList(selectedText, "* ");
        break;
      case "ordered-list":
        formattedText = toggleList(selectedText, "1. ", true);
        break;
      case "code-block":
        let language = option || ""; // Default to no language
        formattedText = toggleCodeBlock(selectedText, language);
        // textarea.setRangeText(
        //     formattedText,
        //     selectionStart,
        //     selectionEnd,
        //     "select"
        // );

        break;
      case "strikethrough":
        formattedText = toggleStrikethrough(selectedText);
        break;
      case "task-list":
        formattedText = toggleTaskList(selectedText);
        break;
      case "table":
        formattedText = insertTable();
        break;
      case "align-left":
        formattedText = alignText(selectedText, "left");
        break;
      case "align-center":
        formattedText = alignText(selectedText, "center");
        break;
      case "align-right":
        formattedText = alignText(selectedText, "right");
        break;
    }

    textarea.setRangeText(formattedText, selectionStart, selectionEnd, "end");
    updatePreview();
    textarea.focus();
  };

  toolbar.addEventListener("click", (event: Event) => {
    const button = (event.target as Element).closest("button");
    if (button) {
      const action = button.getAttribute("data-action");
      if (!action) return;
      if (action === "image") {
        imageInput.click();
      } else {
        applyFormatting(action);
      }
    }
  });

  imageInput.addEventListener("change", () => {
    if (!imageInput.files) return;
    const file = imageInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    // uploadImage
    if (file) {
      // 上传图片
      axios
        .post(uploadUrl, formData)
        .then((res) => {
          const imageUrl = res.data.url;
          const markdownImage = `![Alt text](${imageUrl})`;
          const { selectionStart, selectionEnd } = textarea;
          textarea.setRangeText(
            markdownImage,
            selectionStart,
            selectionEnd,
            "end"
          );
          updatePreview();
          textarea.focus();
        })
        .catch((err) => {
          console.error(err);
        });
    }
  });
}
