// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Sentinel-2 Processing — KHARIF SEASON
// Jul 2023 - Oct 2023
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

// ── CLOUD MASKING FUNCTION ────────────────────────────────────
// This removes cloudy pixels from each S2 image
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)
    .divide(10000)
    .copyProperties(image, ['system:time_start']);
}

// ── LOAD SENTINEL-2 — KHARIF SEASON ──────────────────────────
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate('2023-07-01', '2023-10-31')
  .filterBounds(geometry)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds);

print('S2 Kharif images found:', s2.size());

// ── CREATE MEDIAN COMPOSITE ───────────────────────────────────
// Median of all cloud-free images = clean composite
var s2_composite = s2
  .select(['B2', 'B3', 'B4', 'B8'])  // Blue, Green, Red, NIR
  .median()
  .clip(geometry);

print('S2 composite bands:', s2_composite.bandNames());

// ── VISUALIZE ────────────────────────────────────────────────
// True color RGB (R=B4, G=B3, B=B2)
Map.addLayer(
  s2_composite,
  {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3},
  'S2 True Color Kharif'
);

// False color (R=B8/NIR, G=B4, B=B3) — crops show bright red
Map.addLayer(
  s2_composite,
  {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.4},
  'S2 False Color Kharif'
);

// ── EXPORT ───────────────────────────────────────────────────
Export.image.toDrive({
  image: s2_composite,
  description: 'S2_Kharif_Phalodi',
  folder: 'ISRO_SAR2MS',
  fileNamePrefix: 'S2_kharif_phalodi',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});

print('S2 Kharif export task created! Go to Tasks tab.');

// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Sentinel-2 Processing — RABI SEASON
// Nov 2023 - Mar 2024
// ============================================================

var geometry = ee.Geometry.Polygon(
  [[[72.28270483244607, 27.054248330744027],
    [72.47908544768045, 27.054248330744027],
    [72.47908544768045, 27.213128169518615],
    [72.28270483244607, 27.213128169518615],
    [72.28270483244607, 27.054248330744027]]]
);

Map.setOptions('SATELLITE');
Map.centerObject(geometry, 10);

// ── CLOUD MASKING FUNCTION ────────────────────────────────────
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)
    .divide(10000)
    .copyProperties(image, ['system:time_start']);
}

// ── LOAD SENTINEL-2 — RABI SEASON ────────────────────────────
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate('2023-11-01', '2024-03-31')
  .filterBounds(geometry)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds);

print('S2 Rabi images found:', s2.size());

// ── CREATE MEDIAN COMPOSITE ───────────────────────────────────
var s2_composite = s2
  .select(['B2', 'B3', 'B4', 'B8'])
  .median()
  .clip(geometry);

print('S2 composite bands:', s2_composite.bandNames());

// ── VISUALIZE ────────────────────────────────────────────────
Map.addLayer(
  s2_composite,
  {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3},
  'S2 True Color Rabi'
);

Map.addLayer(
  s2_composite,
  {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.4},
  'S2 False Color Rabi'
);

// ── EXPORT ───────────────────────────────────────────────────
Export.image.toDrive({
  image: s2_composite,
  description: 'S2_Rabi_Phalodi',
  folder: 'ISRO_SAR2MS',
  fileNamePrefix: 'S2_rabi_phalodi',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});

print('S2 Rabi export task created! Go to Tasks tab.');

// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Sentinel-2 Processing — ZAID SEASON
// Apr 2024 - Jun 2024
// ============================================================

var geometry = ee.Geometry.Polygon(
  [[[72.28270483244607, 27.054248330744027],
    [72.47908544768045, 27.054248330744027],
    [72.47908544768045, 27.213128169518615],
    [72.28270483244607, 27.213128169518615],
    [72.28270483244607, 27.054248330744027]]]
);

Map.setOptions('SATELLITE');
Map.centerObject(geometry, 10);

// ── CLOUD MASKING FUNCTION ────────────────────────────────────
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask)
    .divide(10000)
    .copyProperties(image, ['system:time_start']);
}

// ── LOAD SENTINEL-2 — ZAID SEASON ────────────────────────────
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate('2024-04-01', '2024-06-30')
  .filterBounds(geometry)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds);

print('S2 Zaid images found:', s2.size());

// ── CREATE MEDIAN COMPOSITE ───────────────────────────────────
var s2_composite = s2
  .select(['B2', 'B3', 'B4', 'B8'])
  .median()
  .clip(geometry);

print('S2 composite bands:', s2_composite.bandNames());

// ── VISUALIZE ────────────────────────────────────────────────
Map.addLayer(
  s2_composite,
  {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3},
  'S2 True Color Zaid'
);

Map.addLayer(
  s2_composite,
  {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.4},
  'S2 False Color Zaid'
);

// ── EXPORT ───────────────────────────────────────────────────
Export.image.toDrive({
  image: s2_composite,
  description: 'S2_Zaid_Phalodi',
  folder: 'ISRO_SAR2MS',
  fileNamePrefix: 'S2_zaid_phalodi',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});

print('S2 Zaid export task created! Go to Tasks tab.');