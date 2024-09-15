import React, { useEffect, useRef } from 'react';
import { initMarkdownEditor, renderMarkdownEditor } from '@cannonui/md-edit';

const MarkdownEditorComponent = ({ value = '' }) => {
  const editorContainer = useRef(null);

  const html = renderMarkdownEditor(value);
  useEffect(() => {
    if (editorContainer.current) {
      editorContainer.current.innerHTML = html;
      initMarkdownEditor(editorContainer.current);
    }
  }, [value]); // Re-run this effect if 'value' changes

  return (
    <div ref={editorContainer}></div>
  );
};

export default MarkdownEditorComponent;