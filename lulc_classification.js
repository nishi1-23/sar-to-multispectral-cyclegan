// ============================================================
// SAR2MS — ISRO RRSC-W Jodhpur
// LULC Classification using Random Forest
// Sentinel-1 SAR — ALL 3 SEASONS (Kharif + Rabi + Zaid)
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

// Kharif (Jul - Oct 2023)
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

// Rabi (Nov 2023 - Mar 2024)
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

// Zaid (Apr - Jun 2024)
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

// Stack all 3 seasons = 6 bands total
var img = kharif
  .addBands(rabi)
  .addBands(zaid)
  .clip(geometry);

print('Multi-temporal stack bands:', img.bandNames());

// Visualize Kharif VV
Map.addLayer(
  img.select('VV_kharif'),
  {min: -25, max: 0, palette: ['black', 'white']},
  'S1 VV Kharif'
);

// RGB composite: R=VV_kharif, G=VV_rabi, B=VV_zaid
// Colors show seasonal differences!
Map.addLayer(
  img.select(['VV_kharif', 'VV_rabi', 'VV_zaid']),
  {min: -25, max: 0},
  'RGB Seasonal Composite'
);

// ── STEP 2: LOAD ESA WORLDCOVER AS REFERENCE ─────────────────
var worldcover = ee.ImageCollection('ESA/WorldCover/v200').first();

var classified_ref = worldcover.remap(
  [10, 20, 30, 40,  50,  60, 70,  80, 90, 95, 100],
  [ 0,  1,  2,  3,   4,   5,  6,   7,  8,  9,  10]
).rename('Class').clip(geometry);

var palette = [
  '006400', 'ffbb22', 'ffff4c', 'f096ff', 'fa0000',
  'b4b4b4', 'f0f0f0', '0064c8', '0096a0', '00cf75', 'fae6a0'
];

Map.addLayer(
  classified_ref,
  {min: 0, max: 10, palette: palette},
  'WorldCover Reference'
);

// ── STEP 3: SAMPLE TRAINING DATA ─────────────────────────────
var training_data = img.addBands(classified_ref)
  .stratifiedSample({
    numPoints: 80,
    classBand: 'Class',
    region: geometry,
    scale: 10,
    tileScale: 16,
    geometries: true
  });

print('Training samples:', training_data.size());

// ── STEP 4: SPLIT TRAIN / TEST (80/20) ───────────────────────
var dataset   = training_data.randomColumn();
var train_set = dataset.filter(ee.Filter.gt('random', 0.2));
var test_set  = dataset.filter(ee.Filter.lte('random', 0.2));

print('Train size:', train_set.size());
print('Test size:',  test_set.size());

// ── STEP 5: TRAIN RANDOM FOREST ──────────────────────────────
// Now using all 6 bands from 3 seasons!
var model = ee.Classifier.smileRandomForest(80).train({
  features: train_set,
  classProperty: 'Class',
  inputProperties: [
    'VV_kharif', 'VH_kharif',
    'VV_rabi',   'VH_rabi',
    'VV_zaid',   'VH_zaid'
  ]
});

print('Model trained!');
print('Model info:', model.explain());

// ── STEP 6: CLASSIFY THE IMAGE ───────────────────────────────
var classified_map = img.classify(model).rename('classified_map');

Map.addLayer(
  classified_map.clip(geometry),
  {min: 0, max: 10, palette: palette},
  'LULC Classification (3 seasons)'
);

print('Classification done!');

// ── STEP 7: ACCURACY ASSESSMENT ──────────────────────────────
var confusionMatrix = ee.ConfusionMatrix(
  test_set.classify(model)
    .errorMatrix('Class', 'classification')
);

print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa Coefficient:', confusionMatrix.kappa());

// ── STEP 8: FEATURE IMPORTANCE ───────────────────────────────
// Which band/season is most important for classification?
var importance = ee.Dictionary(model.explain()
  .get('importance'));
print('Feature Importance:', importance);

var impChart = ui.Chart.feature.byFeature({
  features: ee.FeatureCollection([
    ee.Feature(null, importance)
  ]),
  xProperty: 'system:index',
  yProperties: [
    'VV_kharif', 'VH_kharif',
    'VV_rabi',   'VH_rabi',
    'VV_zaid',   'VH_zaid'
  ]
}).setChartType('ColumnChart')
  .setOptions({
    title: 'Feature Importance — Which band helps most?',
    hAxis: {title: 'Season/Band'},
    vAxis: {title: 'Importance Score'},
    colors: ['red','orange','blue','cyan','green','lime']
  });
print(impChart);

// ── STEP 9: EXPORT CLASSIFICATION MAP ────────────────────────
Export.image.toDrive({
  image: classified_map.toInt8(),
  description: 'LULC_3seasons_Phalodi',
  folder: 'ISRO_SAR2MS',
  fileNamePrefix: 'LULC_3seasons_phalodi',
  region: geometry,
  scale: 10,
  crs: 'EPSG:4326',
  maxPixels: 1e9
});

print('LULC 3-season export task created! Go to Tasks tab.');