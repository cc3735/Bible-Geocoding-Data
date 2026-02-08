import { useRef } from 'react';

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search places... (e.g. Jerusalem, Babylon, Jordan)"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button className="clear-btn" onClick={() => { onChange(''); inputRef.current?.focus(); }}>
          &times;
        </button>
      )}
    </div>
  );
}
