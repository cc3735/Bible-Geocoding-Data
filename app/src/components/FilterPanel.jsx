import { useState } from 'react';

export default function FilterPanel({ types, filters, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const toggleType = (type) => {
    const current = filters.types;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({ ...filters, types: next });
  };

  const clearFilters = () => onChange({ types: [] });

  return (
    <div className="filter-panel">
      <div className="filter-header" onClick={() => setExpanded(!expanded)}>
        <span>Filter by Type</span>
        {filters.types.length > 0 && (
          <span className="filter-badge">{filters.types.length}</span>
        )}
        <span className="expand-icon">{expanded ? '▾' : '▸'}</span>
      </div>

      {expanded && (
        <div className="filter-body">
          {filters.types.length > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear all
            </button>
          )}
          <div className="type-list">
            {types.map(type => (
              <label key={type} className="type-item">
                <input
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
