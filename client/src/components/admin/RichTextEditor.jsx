import { useEffect, useRef } from 'react';

const commands = [
  ['formatBlock', 'Paragraph', 'Paragraph', 'p'],
  ['formatBlock', 'Section heading', 'Heading', 'h2'],
  ['formatBlock', 'Subheading', 'Subheading', 'h3'],
  ['bold', 'Bold', 'B'],
  ['italic', 'Italic', 'I'],
  ['insertUnorderedList', 'Bulleted list', '• List'],
  ['insertOrderedList', 'Numbered list', '1. List'],
  ['formatBlock', 'Quote', '“ Quote', 'blockquote'],
];

export default function RichTextEditor({ label = 'Article content', name, value = '', onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const sync = () => onChange(editorRef.current?.innerHTML || '');
  const run = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    sync();
  };
  const addLink = () => {
    const url = window.prompt('Paste the full link, including https://');
    if (url) run('createLink', url);
  };

  return (
    <div className="admin-rich-editor">
      <span className="admin-rich-editor-label">{label}</span>
      <div className="admin-rich-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        {commands.map(([command, title, text, commandValue]) => (
          <button
            type="button"
            title={title}
            aria-label={title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(command, commandValue)}
            key={title}
          >
            {text}
          </button>
        ))}
        <button type="button" onClick={addLink}>
          Link
        </button>
        <button type="button" onClick={() => run('unlink')}>
          Remove link
        </button>
        <button type="button" onClick={() => run('removeFormat')}>
          Clear formatting
        </button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-editor-area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder="Write or paste the article here…"
        onInput={sync}
        onBlur={sync}
        suppressContentEditableWarning
      />
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <small>
        Write normally or paste text, then select text to apply headings, lists, links or emphasis.
      </small>
    </div>
  );
}
