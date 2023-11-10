/*
Topik: Penutupan Lahan
*/

// Fase Pra-Pemrosesan
// 1. Data Citra Sentinel Level 2A
var dataset = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterDate('2023-01-30', '2023-06-30')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .median()
    .clip(AOI);

// 2. Masking Awan
function maskS2clouds(image) {
    var qa = image.select('QA60');
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    return image.updateMask(mask).divide(10000);
}

// 3. Visualisasi Citra
var visualization = { min: 0.0, max: 0.3, bands: ['B4', 'B3', 'B2'], };
Map.centerObject(AOI, 11);
Map.addLayer(dataset.clip(AOI), visualization, 'RGB');

// Fase Pemrosesan
// 2 Menggabungkan Titik Sampel Pada Masing-Masing Kelas Klasifikasi
var titikSampel = badanAir.merge(lahanKosong).merge(lahanPertanian).merge(permukiman).merge(mangrove).merge(tambak);

// Ekstraksi nilai piksel ke Dalam Titik Sampel
var bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];
var training = dataset.select(bands).sampleRegions({ collection: titikSampel, properties: ['landcover'], scale: 10 });

// Penerapan Metode Klasifikasi
var classifier = ee.Classifier.smileCart().train({
    features: training,
    classProperty: 'landcover',
    inputProperties: bands
});
var classified = dataset.select(bands).classify(classifier);

// Fase Pasca-Pemrosesan
//Tutupan Lahan 2023
Map.addLayer(classified, { min: 0, max: 5, palette: ['#0078d6', '#42bd1c', '#f6ff00', '#f54e2c', '#038f1a', '#f570ff'] }, 'Tutupan Lahan');

// Membuat skala legenda
var legend = ui.Panel({
    style: {
        position: 'bottom-right',
        padding: '8px 15px'
    }
});

// Membuat judul legenda
var legendTitle = ui.Label({
    value: 'Legenda Tutupan Lahan 2023',
    style: {
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '0 0 4px 0',
        padding: '0'
    }
});

// Menambahkan judul legenda ke dalam panel legenda
legend.add(legendTitle);

// Membuat ikon dan label untuk setiap kelas tutupan lahan
var palette = ['#0078d6', '#42bd1c', '#f6ff00', '#f54e2c', '#038f1a', '#f570ff'];
var names = ['Badan Air', 'Lahan Kosong', 'Lahan Pertanian', 'Permukiman', 'Mangrove', 'Tambak'];

for (var i = 0; i < names.length; i++) {
    var colorBox = ui.Label({
        style: {
            backgroundColor: palette[i],
            padding: '8px',
            margin: '0 0 4px 0'
        }
    });

    var description = ui.Label({
        value: names[i],
        style: { margin: '0 0 4px 6px' }
    });

    legend.add(colorBox);
    legend.add(description);
}

// Menambahkan panel legenda ke dalam peta
Map.add(legend);