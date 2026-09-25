// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// Backscatter Box Plot — ALL 3 SEASONS
// Phalodi, Rajasthan
// ============================================================

var geometry = ee.Geometry.Polygon(
  [[[72.28270483244607, 27.054248330744027],
    [72.47908544768045, 27.054248330744027],
    [72.47908544768045, 27.213128169518615],
    [72.28270483244607, 27.213128169518615],
    [72.28270483244607, 27.054248330744027]]]
);

Map.setOptions('SATELLITE');
Map.centerObject(geometry, 12);

// ── STEP 1: LOAD ALL 3 SEASONS ───────────────────────────────

// Kharif
var kharif = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterDate('2023-07-01', '2023-10-31')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .select(['VV', 'VH'])
  .median()
  .rename(['VV_kharif', 'VH_kharif']);

// Rabi
var rabi = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterDate('2023-11-01', '2024-03-31')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .select(['VV', 'VH'])
  .median()
  .rename(['VV_rabi', 'VH_rabi']);

// Zaid
var zaid = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterDate('2024-04-01', '2024-06-30')
  .filterBounds(geometry)
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .select(['VV', 'VH'])
  .median()
  .rename(['VV_zaid', 'VH_zaid']);

// Stack all 6 bands
var composite = kharif
  .addBands(rabi)
  .addBands(zaid)
  .clip(geometry);

print('All bands:', composite.bandNames());

// ── STEP 2: LOAD ESA WORLDCOVER ──────────────────────────────
var worldcover = ee.ImageCollection('ESA/WorldCover/v200').first();

var classified = worldcover.remap(
  [10, 20, 30, 40,  50,  60, 70,  80, 90, 95, 100],
  [ 0,  1,  2,  3,   4,   5,  6,   7,  8,  9,  10]
).rename('classification').clip(geometry);

var worldCoverPalette = [
  '006400', 'ffbb22', 'ffff4c', 'f096ff', 'fa0000',
  'b4b4b4', 'f0f0f0', '0064c8', '0096a0', '00cf75', 'fae6a0'
];

Map.addLayer(
  classified,
  {min: 0, max: 10, palette: worldCoverPalette},
  'ESA WorldCover LULC'
);

// ── STEP 3: STRATIFIED SAMPLING ──────────────────────────────
var samples = composite.addBands(classified)
  .stratifiedSample({
    numPoints: 50,
    classBand: 'classification',
    region: geometry,
    scale: 10,
    tileScale: 16,
    geometries: true
  });

print('Samples:', samples.size());
Map.addLayer(samples, {color: 'red'}, 'Sample Points');

// ── STEP 4: CHARTS PER SEASON ────────────────────────────────
// VV Kharif by class
var chartVV_K = ui.Chart.feature.groups({
  features: samples,
  xProperty: 'classification',
  yProperty: 'VV_kharif',
  seriesProperty: 'classification'
}).setChartType('ScatterChart')
  .setOptions({
    title: 'VV Backscatter — KHARIF by Land Cover',
    hAxis: {title: 'Class (0=Tree,1=Shrub,2=Grass,3=Crop,4=Built,5=Bare,7=Water)'},
    vAxis: {title: 'VV (dB)', viewWindow: {min: -30, max: 0}},
    pointSize: 4,
    legend: {position: 'none'}
  });
print(chartVV_K);

// VV Rabi by class
var chartVV_R = ui.Chart.feature.groups({
  features: samples,
  xProperty: 'classification',
  yProperty: 'VV_rabi',
  seriesProperty: 'classification'
}).setChartType('ScatterChart')
  .setOptions({
    title: 'VV Backscatter — RABI by Land Cover',
    hAxis: {title: 'Class (0=Tree,1=Shrub,2=Grass,3=Crop,4=Built,5=Bare,7=Water)'},
    vAxis: {title: 'VV (dB)', viewWindow: {min: -30, max: 0}},
    pointSize: 4,
    legend: {position: 'none'}
  });
print(chartVV_R);

// VV Zaid by class
var chartVV_Z = ui.Chart.feature.groups({
  features: samples,
  xProperty: 'classification',
  yProperty: 'VV_zaid',
  seriesProperty: 'classification'
}).setChartType('ScatterChart')
  .setOptions({
    title: 'VV Backscatter — ZAID by Land Cover',
    hAxis: {title: 'Class (0=Tree,1=Shrub,2=Grass,3=Crop,4=Built,5=Bare,7=Water)'},
    vAxis: {title: 'VV (dB)', viewWindow: {min: -30, max: 0}},
    pointSize: 4,
    legend: {position: 'none'}
  });
print(chartVV_Z);

// ── STEP 5: MEAN BACKSCATTER ALL SEASONS ─────────────────────
var meanByClass = ee.List.sequence(0, 10).map(function(classNum) {
  var s = samples.filter(ee.Filter.eq('classification', classNum));
  return ee.Feature(null, {
    'class':        classNum,
    'VV_kharif':    s.aggregate_mean('VV_kharif'),
    'VV_rabi':      s.aggregate_mean('VV_rabi'),
    'VV_zaid':      s.aggregate_mean('VV_zaid'),
    'VH_kharif':    s.aggregate_mean('VH_kharif'),
    'VH_rabi':      s.aggregate_mean('VH_rabi'),
    'VH_zaid':      s.aggregate_mean('VH_zaid'),
    'count':        s.size()
  });
});

var meanTable = ee.FeatureCollection(meanByClass);

// VV comparison across 3 seasons
var barVV = ui.Chart.feature.byFeature({
  features: meanTable,
  xProperty: 'class',
  yProperties: ['VV_kharif', 'VV_rabi', 'VV_zaid']
}).setChartType('ColumnChart')
  .setOptions({
    title: 'Mean VV Backscatter — 3 Seasons by Land Cover Class',
    hAxis: {title: 'Class (0=Tree,1=Shrub,2=Grass,3=Crop,4=Built,5=Bare,7=Water)'},
    vAxis: {title: 'Mean VV (dB)', viewWindow: {min: -30, max: 0}},
    colors: ['green', 'blue', 'orange'],
    legend: {position: 'top'}
  });
print(barVV);

// VH comparison across 3 seasons
var barVH = ui.Chart.feature.byFeature({
  features: meanTable,
  xProperty: 'class',
  yProperties: ['VH_kharif', 'VH_rabi', 'VH_zaid']
}).setChartType('ColumnChart')
  .setOptions({
    title: 'Mean VH Backscatter — 3 Seasons by Land Cover Class',
    hAxis: {title: 'Class (0=Tree,1=Shrub,2=Grass,3=Crop,4=Built,5=Bare,7=Water)'},
    vAxis: {title: 'Mean VH (dB)', viewWindow: {min: -30, max: 0}},
    colors: ['green', 'blue', 'orange'],
    legend: {position: 'top'}
  });
print(barVH);

print('All charts done! 📊');