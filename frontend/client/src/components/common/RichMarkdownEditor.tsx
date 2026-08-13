import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['code', 'code-block'],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'code-block',
  'blockquote',
  'list',
  'link',
];

export const RichMarkdownEditor: React.FC<RichMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Describe your technical problem, include code snippets, expected outcomes, and error logs...',
  minHeight = '240px',
}) => {
  return (
    <div style={{ ...styles.wrapper, minHeight }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ height: minHeight }}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '3rem', // gives room for Quill editor height
  },
};
