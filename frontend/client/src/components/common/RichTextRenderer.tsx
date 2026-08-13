import React from 'react';

interface RichTextRendererProps {
  content: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content }) => {
  if (!content) return null;

  // If content starts with HTML tags or contains rich HTML elements
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        className="ql-snow ql-editor-render"
        dangerouslySetInnerHTML={{ __html: content }}
        style={styles.htmlRender}
      />
    );
  }

  // Plain text fallback with paragraph split
  return (
    <div style={styles.plainRender}>
      {content.split('\n\n').map((paragraph, idx) => (
        <p key={idx} style={{ marginBottom: '1.25rem' }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  htmlRender: {
    fontSize: '0.9375rem',
    lineHeight: 1.65,
    color: '#1e293b',
  },
  plainRender: {
    fontSize: '0.9375rem',
    lineHeight: 1.65,
    color: '#1e293b',
  },
};
