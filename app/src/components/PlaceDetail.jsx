export default function PlaceDetail({ data, onClose }) {
  const { modern, ancient } = data;

  return (
    <div className="place-detail">
      <div className="detail-header">
        <h2>{modern.name}</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="detail-meta">
        <span className="detail-type">{modern.type}</span>
        <span className="detail-coords">
          {modern.lat?.toFixed(4)}, {modern.lon?.toFixed(4)}
        </span>
      </div>

      {modern.thumbnail && (
        <div className="detail-image">
          <img
            src={`https://a.openbible.info/geo/thumbnails/${modern.thumbnail}`}
            alt={modern.name}
            loading="lazy"
          />
          {modern.thumbnailDesc && (
            <p className="image-desc">{modern.thumbnailDesc}</p>
          )}
          {modern.thumbnailCredit && (
            <p className="image-credit">Photo: {modern.thumbnailCredit}</p>
          )}
        </div>
      )}

      {modern.names?.length > 1 && (
        <div className="detail-section">
          <h3>Also known as</h3>
          <p>{modern.names.join(', ')}</p>
        </div>
      )}

      {ancient.length > 0 && (
        <div className="detail-section">
          <h3>Biblical References</h3>
          {ancient.map(place => (
            <div key={place.id} className="ancient-place">
              <h4>{place.name}</h4>
              {place.type && <span className="ancient-type">{place.type}</span>}

              {place.translationNames && Object.keys(place.translationNames).length > 1 && (
                <div className="translations">
                  <strong>Spellings: </strong>
                  {Object.entries(place.translationNames).map(([name, count]) => (
                    <span key={name} className="translation-name">
                      {name} ({count})
                    </span>
                  ))}
                </div>
              )}

              {place.verses?.length > 0 && (
                <div className="verses">
                  <strong>Verses: </strong>
                  {place.verses.map((v, i) => (
                    <span key={i} className="verse-ref">
                      {v.ref}{i < place.verses.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}

              {place.links && Object.keys(place.links).length > 0 && (
                <div className="external-links">
                  {Object.entries(place.links).map(([type, url]) => (
                    <a key={type} href={url} target="_blank" rel="noopener noreferrer" className="ext-link">
                      {type}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="detail-section">
        <h3>View on</h3>
        <div className="external-links">
          <a
            href={`https://www.google.com/maps/@${modern.lat},${modern.lon},14z`}
            target="_blank"
            rel="noopener noreferrer"
            className="ext-link"
          >
            Google Maps
          </a>
          <a
            href={`https://www.openbible.info/geo/${modern.ancientAssoc ? Object.values(modern.ancientAssoc)[0]?.url_slug || '' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ext-link"
          >
            OpenBible.info
          </a>
        </div>
      </div>
    </div>
  );
}
