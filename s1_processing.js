// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Sentinel-1 Processing 
// Three seasons: Kharif, Rabi, Zaid
// ============================================================

Map.setOptions('SATELLITE');
Map.centerObject(geometry, 10);

// ── LOAD S1 — KHARIF SEASON ──────────────────────────────────
var sen1 = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterDate('2023-07-01', '2023-10-31')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .select(['VV', 'VH']);

print('S1 Kharif images found:', sen1.size());
print('First image info:', sen1.first());
// ── COMPUTE RVI (Tutorial-99 method) ────────────────────────
var rvi = sen1.map(function(img) {
  var bands = img.select('VV', 'VH');
  var sigma = ee.Image(10).pow(img.divide(10));
  var index = sigma.expression(
    '(4 * vh) / (vh + vv)', {
      'vh': sigma.select('VH'),
      'vv': sigma.select('VV')
    }).rename('RVI');
  return index
    .copyProperties(img, ['system:time_start', 'system:time_end']);
});

// ── TEMPORAL SPECKLE FILTER (Tutorial-99 method) ─────────────
var day   = 15;
var mills = ee.Number(day).multiply(1000 * 24 * 3600);

var filter = ee.Filter.maxDifference({
  difference:  mills,
  leftField:   'system:time_start',
  rightField:  'system:time_start'
});

var join            = ee.Join.saveAll('image');
var join_collection = ee.ImageCollection(
  join.apply(rvi, rvi, filter)
).map(function(img) {
  var images = ee.ImageCollection
    .fromImages(img.get('image'))
    .mean()
    .rename('corrected');
  return img.addBands(images)
    .copyProperties(img, ['system:time_start', 'system:time_end']);
});

print('Join collection:', join_collection);

// ── VISUALIZE ────────────────────────────────────────────────
// ── VISUALIZE ────────────────────────────────────────────────
// Show first image only (single band = palette works!)
Map.addLayer(
  join_collection.select('RVI').first().clip(geometry),
  {min: 0, max: 1, palette: ['white', 'yellow', 'green']},
  'RVI raw (first image)'
);

Map.addLayer(
  join_collection.select('corrected').first().clip(geometry),
  {min: 0, max: 1, palette: ['white', 'yellow', 'green']},
  'RVI corrected (first image)'
);

// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Sentinel-1 Processing 
// Three seasons: Kharif, Rabi, Zaid
// ============================================================

Map.setOptions('SATELLITE');
Map.centerObject(geometry, 10);
// ── LOAD S1 — RABI SEASON (Nov 2023 - Mar 2024) ──────────────
var sen1 = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterDate('2023-11-01', '2024-03-31')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .select(['VV', 'VH']);

print('S1 Rabi images found:', sen1.size());

// ── COMPUTE RVI ──────────────────────────────────────────────
var rvi = sen1.map(function(img) {
  var sigma = ee.Image(10).pow(img.divide(10));
  var index = sigma.expression(
    '(4 * vh) / (vh + vv)', {
      'vh': sigma.select('VH'),
      'vv': sigma.select('VV')
    }).rename('RVI');
  return index
    .copyProperties(img, ['system:time_start', 'system:time_end']);
});

// ── TEMPORAL SPECKLE FILTER ───────────────────────────────────
var day   = 15;
var mills = ee.Number(day).multiply(1000 * 24 * 3600);
var filter = ee.Filter.maxDifference({
  difference:  mills,
  leftField:   'system:time_start',
  rightField:  'system:time_start'
});
var join = ee.Join.saveAll('image');
var join_collection = ee.ImageCollection(
  join.apply(rvi, rvi, filter)
).map(function(img) {
  var images = ee.ImageCollection
    .fromImages(img.get('image'))
    .mean()
    .rename('corrected');
  return img.addBands(images)
    .copyProperties(img, ['system:time_start', 'system:time_end']);
});

print('Rabi join collection:', join_collection);

// ── VISUALIZE ────────────────────────────────────────────────
Map.addLayer(
  join_collection.select('corrected').first().clip(geometry),
  {min: 0, max: 1, palette: ['white', 'yellow', 'green']},
  'RVI corrected Rabi'
);

// ── EXPORT ───────────────────────────────────────────────────
var rabi_export = join_collection
  .select('corrected')
  .median()
  .clip(geometry);

Export.image.toDrive({
  image: rabi_export,
  description: 'S1_RVI_Rabi_Phalodi',
  folder: 'ISRO_SAR2MS',
  fileNamePrefix: 'S1_RVI_rabi_phalodi',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});

print('Rabi export task created! Go to Tasks tab.');

// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Sentinel-1 Processing — ZAID SEASON
// Apr 2024 - Jun 2024
// ============================================================

// Hardcoded geometry — Phalodi AOI
var geometry = ee.Geometry.Polygon(
  [[[72.28270483244607, 27.054248330744027],
    [72.47908544768045, 27.054248330744027],
    [72.47908544768045, 27.213128169518615],
    [72.28270483244607, 27.213128169518615],
    [72.28270483244607, 27.054248330744027]]]
);

Map.setOptions('SATELLITE');
Map.centerObject(geometry, 10);

// ── LOAD S1 — ZAID SEASON (Apr 2024 - Jun 2024) ──────────────
var sen1 = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterDate('2024-04-01', '2024-06-30')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .select(['VV', 'VH']);

print('S1 Zaid images found:', sen1.size());

// ── COMPUTE RVI ──────────────────────────────────────────────
var rvi = sen1.map(function(img) {
  var sigma = ee.Image(10).pow(img.divide(10));
  var index = sigma.expression(
    '(4 * vh) / (vh + vv)', {
      'vh': sigma.select('VH'),
      'vv': sigma.select('VV')
    }).rename('RVI');
  return index
    .copyProperties(img, ['system:time_start', 'system:time_end']);
});

// ── TEMPORAL SPECKLE FILTER ───────────────────────────────────
var day   = 15;
var mills = ee.Number(day).multiply(1000 * 24 * 3600);
var filter = ee.Filter.maxDifference({
  difference:  mills,
  leftField:   'system:time_start',
  rightField:  'system:time_start'
});
var join = ee.Join.saveAll('image');
var join_collection = ee.ImageCollection(
  join.apply(rvi, rvi, filter)
).map(function(img) {
  var images = ee.ImageCollection
    .fromImages(img.get('image'))
    .mean()
    .rename('corrected');
  return img.addBands(images)
    .copyProperties(img, ['system:time_start', 'system:time_end']);
});

print('Zaid join collection:', join_collection);

// ── VISUALIZE ────────────────────────────────────────────────
Map.addLayer(
  join_collection.select('corrected').first().clip(geometry),
  {min: 0, max: 1, palette: ['white', 'yellow', 'green']},
  'RVI corrected Zaid'
);

// ── EXPORT ───────────────────────────────────────────────────
var zaid_export = join_collection
  .select('corrected')
  .median()
  .clip(geometry);

Export.image.toDrive({
  image: zaid_export,
  description: 'S1_RVI_Zaid_Phalodi',
  folder: 'ISRO_SAR2MS',
  fileNamePrefix: 'S1_RVI_zaid_phalodi',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});

print('Zaid export task created! Go to Tasks tab.');