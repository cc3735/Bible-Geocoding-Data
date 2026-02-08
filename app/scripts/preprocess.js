import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
const outDir = join(__dirname, '..', 'public', 'data');
const geoSrcDir = join(__dirname, '..', '..', 'geometry');

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'geometry'), { recursive: true });

function readJsonl(file) {
  return readFileSync(join(dataDir, file), 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(JSON.parse);
}

// 1. Process modern locations -> markers with coordinates
const modern = readJsonl('modern.jsonl');
const modernMap = {};
const markers = [];

for (const m of modern) {
  modernMap[m.id] = m;
  const [lon, lat] = m.lonlat.split(',').map(Number);
  markers.push({
    id: m.id,
    name: m.friendly_id,
    type: m.type,
    lat,
    lon,
    geometry: m.geometry,
    thumbnail: m.media?.thumbnail?.file || null,
    thumbnailDesc: m.media?.thumbnail?.description?.replace(/<[^>]+>/g, '') || '',
    thumbnailCredit: m.media?.thumbnail?.credit || '',
    ancientAssoc: m.ancient_associations || {},
    names: m.names?.map(n => n.name) || [],
    geojsonFile: m.geojson_file || null,
    hasPolygon: m.geometry === 'polygon' || m.geometry === 'path',
  });
}

// 2. Process ancient places -> place details with verse references
const ancient = readJsonl('ancient.jsonl');
const places = [];
const verseIndex = {}; // book -> places

for (const a of ancient) {
  // Get best resolution coordinates
  let lat = null, lon = null, modernName = null, modernId = null;
  let bestScore = -Infinity;

  if (a.modern_associations) {
    for (const [mid, assoc] of Object.entries(a.modern_associations)) {
      if (assoc.score > bestScore && modernMap[mid]) {
        bestScore = assoc.score;
        modernId = mid;
        modernName = assoc.name;
        const [mlon, mlat] = modernMap[mid].lonlat.split(',').map(Number);
        lat = mlat;
        lon = mlon;
      }
    }
  }

  const verses = (a.verses || []).map(v => ({
    ref: v.readable,
    osis: v.osis,
  }));

  // Build verse index by book
  for (const v of a.verses || []) {
    const book = v.osis.split('.')[0];
    if (!verseIndex[book]) verseIndex[book] = new Set();
    verseIndex[book].add(a.id);
  }

  // Confidence score from identifications
  let confidence = 0;
  if (a.identifications?.length > 0) {
    const scores = a.identifications
      .filter(id => id.score?.total != null)
      .map(id => id.score.total);
    if (scores.length) confidence = Math.max(...scores);
  }

  // Get translation names
  const translationNames = a.translation_name_counts || {};

  // Linked data
  const links = {};
  if (Array.isArray(a.linked_data)) {
    for (const ld of a.linked_data) {
      if (ld.url) links[ld.type] = ld.url;
    }
  } else if (a.linked_data && typeof a.linked_data === 'object') {
    for (const [type, ld] of Object.entries(a.linked_data)) {
      if (ld.url) links[type] = ld.url;
    }
  }

  places.push({
    id: a.id,
    name: a.friendly_id,
    type: a.type,
    lat,
    lon,
    modernName,
    modernId,
    verses,
    confidence,
    translationNames,
    links,
    thumbnail: modernId && modernMap[modernId]?.media?.thumbnail?.file || null,
    thumbnailCredit: modernId && modernMap[modernId]?.media?.thumbnail?.credit || '',
    geojsonFile: a.geojson_file || null,
  });
}

// Convert verse index sets to arrays
const verseIndexOut = {};
for (const [book, ids] of Object.entries(verseIndex)) {
  verseIndexOut[book] = [...ids];
}

// 3. Copy relevant GeoJSON files
let copiedGeo = 0;
try {
  const geoFiles = readdirSync(geoSrcDir).filter(f => f.endsWith('.geojson'));
  for (const f of geoFiles) {
    const src = readFileSync(join(geoSrcDir, f), 'utf-8');
    writeFileSync(join(outDir, 'geometry', f), src);
    copiedGeo++;
  }
} catch (e) {
  console.log('Warning: could not copy geometry files:', e.message);
}

// 4. Write output files
writeFileSync(join(outDir, 'markers.json'), JSON.stringify(markers));
writeFileSync(join(outDir, 'places.json'), JSON.stringify(places));
writeFileSync(join(outDir, 'verse-index.json'), JSON.stringify(verseIndexOut));

// 5. Build a combined lightweight markers file for initial map load
const lightMarkers = markers.map(m => ({
  id: m.id,
  n: m.name,
  t: m.type,
  la: m.lat,
  lo: m.lon,
  g: m.hasPolygon ? 1 : 0,
}));
writeFileSync(join(outDir, 'markers-light.json'), JSON.stringify(lightMarkers));

// 6. Build place lookup by id
const placeLookup = {};
for (const p of places) {
  placeLookup[p.id] = p;
}
writeFileSync(join(outDir, 'place-lookup.json'), JSON.stringify(placeLookup));

// Also index modern -> ancient mapping
const modernToAncient = {};
for (const p of places) {
  if (p.modernId) {
    if (!modernToAncient[p.modernId]) modernToAncient[p.modernId] = [];
    modernToAncient[p.modernId].push(p.id);
  }
}
writeFileSync(join(outDir, 'modern-to-ancient.json'), JSON.stringify(modernToAncient));

console.log(`Processed ${markers.length} modern locations`);
console.log(`Processed ${places.length} ancient places`);
console.log(`Copied ${copiedGeo} GeoJSON files`);
console.log(`Verse index covers ${Object.keys(verseIndexOut).length} books`);
