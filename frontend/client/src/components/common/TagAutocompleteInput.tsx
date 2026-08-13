import React, { useState, useEffect, useRef } from 'react';
import { X, Tag as TagIcon, Plus, Loader2 } from 'lucide-react';
import type { Tag } from '../../types';
import { api } from '../../api/client';

interface TagAutocompleteInputProps {
  selectedTags: string[];
  onAddTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
  maxTags?: number;
  placeholder?: string;
}

export const TagAutocompleteInput: React.FC<TagAutocompleteInputProps> = ({
  selectedTags,
  onAddTag,
  onRemoveTag,
  maxTags = 5,
  placeholder = 'e.g. react, typescript, redis',
}) => {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tag suggestions from DB on typing or focus
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await api.getTags(inputVal.trim());
        // Filter out already selected tags
        const available = results.filter(
          (t) => !selectedTags.some((st) => st.toLowerCase() === t.name.toLowerCase()),
        );
        setSuggestions(available.slice(0, 8));
        setHighlightedIndex(0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [inputVal, isOpen, selectedTags]);

  const handleSelectTag = (tagName: string) => {
    const sanitized = tagName.toLowerCase().trim().replace(/[^a-z0-9-+#.]/g, '');
    if (sanitized && !selectedTags.some((t) => t.toLowerCase() === sanitized) && selectedTags.length < maxTags) {
      onAddTag(sanitized);
    }
    setInputVal('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const totalItems = suggestions.length + (inputVal.trim() && !hasExactMatch ? 1 : 0);
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const totalItems = suggestions.length + (inputVal.trim() && !hasExactMatch ? 1 : 0);
      setHighlightedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (isOpen && suggestions.length > 0 && highlightedIndex < suggestions.length) {
        handleSelectTag(suggestions[highlightedIndex].name);
      } else if (inputVal.trim()) {
        handleSelectTag(inputVal);
      }
    } else if (e.key === 'Backspace' && !inputVal && selectedTags.length > 0) {
      onRemoveTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const hasExactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === inputVal.trim().toLowerCase(),
  );

  return (
    <div ref={containerRef} style={styles.wrapper}>
      <div
        style={{
          ...styles.inputBox,
          borderColor: isOpen ? '#2563eb' : '#cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected Tag Chips */}
        {selectedTags.map((tag) => (
          <span key={tag} style={styles.tagChip}>
            #{tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(tag);
              }}
              style={styles.removeBtn}
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Input */}
        {selectedTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedTags.length === 0 ? placeholder : 'add tag...'}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            style={styles.textInput}
          />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div style={styles.dropdown}>
          {isLoading ? (
            <div style={styles.loadingRow}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
              <span>Searching database tags...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div style={styles.suggestionsList}>
              <div style={styles.listHeader}>Available Tags in Database:</div>
              {suggestions.map((tag, idx) => (
                <div
                  key={tag.id || tag.name}
                  onClick={() => handleSelectTag(tag.name)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    ...styles.suggestionItem,
                    backgroundColor: highlightedIndex === idx ? '#eff6ff' : 'transparent',
                  }}
                >
                  <div style={styles.suggestionLeft}>
                    <TagIcon size={14} color={highlightedIndex === idx ? '#2563eb' : '#64748b'} />
                    <strong style={styles.suggestionName}>#{tag.name}</strong>
                    {tag.description && (
                      <span style={styles.suggestionDesc}>— {tag.description}</span>
                    )}
                  </div>
                  <span style={styles.countBadge}>
                    {tag.questions_count || 0} questions
                  </span>
                </div>
              ))}

              {/* Create new option if query doesn't match */}
              {inputVal.trim() && !hasExactMatch && (
                <div
                  onClick={() => handleSelectTag(inputVal)}
                  onMouseEnter={() => setHighlightedIndex(suggestions.length)}
                  style={{
                    ...styles.createOption,
                    backgroundColor: highlightedIndex === suggestions.length ? '#f0fdf4' : '#fafafa',
                  }}
                >
                  <Plus size={14} color="#16a34a" />
                  <span>Create new tag: <strong>#{inputVal.trim().toLowerCase()}</strong></span>
                </div>
              )}
            </div>
          ) : inputVal.trim() ? (
            <div style={styles.noTagsBox}>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                No exact match found in database.
              </p>
              <button
                type="button"
                onClick={() => handleSelectTag(inputVal)}
                style={styles.createBtn}
              >
                <Plus size={14} />
                <span>Create tag "#{inputVal.trim().toLowerCase()}"</span>
              </button>
            </div>
          ) : (
            <div style={styles.loadingRow}>
              <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                Type keywords to search available tags in database...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  inputBox: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    minHeight: '44px',
    cursor: 'text',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.625rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  textInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    flexGrow: 1,
    minWidth: '120px',
    padding: '0.25rem 0',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 50,
    maxHeight: '260px',
    overflowY: 'auto',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1rem',
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  suggestionsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  listHeader: {
    padding: '0.5rem 0.875rem 0.25rem',
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f1f5f9',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 0.875rem',
    cursor: 'pointer',
    borderBottom: '1px solid #f8fafc',
    transition: 'background-color 0.1s ease',
  },
  suggestionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    overflow: 'hidden',
  },
  suggestionName: {
    color: '#0f172a',
    fontSize: '0.875rem',
  },
  suggestionDesc: {
    color: '#64748b',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '260px',
  },
  countBadge: {
    fontSize: '0.6875rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '0.15rem 0.4rem',
    borderRadius: '10px',
    flexShrink: 0,
    fontWeight: 600,
  },
  createOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 0.875rem',
    fontSize: '0.8125rem',
    color: '#16a34a',
    cursor: 'pointer',
    borderTop: '1px solid #e2e8f0',
  },
  noTagsBox: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
