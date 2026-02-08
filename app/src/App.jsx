import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import PlaceDetail from './components/PlaceDetail';
import './App.css';

function App() {
  const [markers, setMarkers] = useState([]);
  const [modernToAncient, setModernToAncient] = useState({});
  const [placeLookup, setPlaceLookup] = useState({});
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ types: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/data/markers.json').then(r => r.json()),
      fetch('/data/modern-to-ancient.json').then(r => r.json()),
      fetch('/data/place-lookup.json').then(r => r.json()),
    ]).then(([m, mta, pl]) => {
      setMarkers(m);
      setModernToAncient(mta);
      setPlaceLookup(pl);
      setLoading(false);
    });
  }, []);

  const filteredMarkers = markers.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = m.name.toLowerCase().includes(q) ||
        m.names?.some(n => n.toLowerCase().includes(q));
      const ancientMatch = Object.values(m.ancientAssoc || {}).some(
        a => a.name.toLowerCase().includes(q)
      );
      if (!nameMatch && !ancientMatch) return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(m.type)) return false;
    return true;
  });

  const handleMarkerClick = useCallback((marker) => {
    const ancientIds = modernToAncient[marker.id] || [];
    const ancientPlaces = ancientIds.map(id => placeLookup[id]).filter(Boolean);
    setSelectedPlace({ modern: marker, ancient: ancientPlaces });
  }, [modernToAncient, placeLookup]);

  const placeTypes = [...new Set(markers.map(m => m.type))].sort();

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading Bible Atlas...</h2>
        <p>Preparing 1,596 locations across 61 books</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Bible Atlas</h1>
          <span className="subtitle">Interactive Map of Biblical Places</span>
        </div>
        <div className="header-right">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <FilterPanel
            types={placeTypes}
            filters={filters}
            onChange={setFilters}
          />
          <div className="result-count">
            Showing {filteredMarkers.length} of {markers.length} places
          </div>
        </aside>

        <main className="map-area">
          <MapView
            markers={filteredMarkers}
            onMarkerClick={handleMarkerClick}
            selectedPlace={selectedPlace}
          />
        </main>

        {selectedPlace && (
          <aside className="detail-panel">
            <PlaceDetail
              data={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
