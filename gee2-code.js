/*
Topik: Polusi Udara
Tahap 1: Visualisasi Polusi Udara Tahun 2023
*/
// Import data sentinel-5P NO2
var datano2 = ee.ImageCollection("COPERNICUS/S5P/OFFL/L3_NO2");

function maskClouds(image) {
    var cf = image.select('cloud_fraction');
    var mask = cf.lte(0.3);
    return image.updateMask(mask).copyProperties(image);
}

// Masking clouds data Sentinel-5P NO2
var no2 = datano2
    .filterBounds(AOI)
    .map(maskClouds)
    .select('tropospheric_NO2_column_number_density');

// Menentukan range tanggal dan menghitung median 
var no2Median = no2.filterDate('2020-03-01', '2020-12-30').median();

// Pemotongan data Sentinel-5P NO2 sesuai dengan AOI
var no2MedianClipped = no2Median.clipToCollection(AOI);

//Menampilkan visualisasi median NO2
var no2Viz = {
    min: 0,
    max: 0.00015,
    palette: ['black', 'blue', 'purple', 'cyan', 'green',
        'yellow', 'red'
    ]
};
Map.addLayer(no2MedianClipped, no2Viz, 'NO2 2020');

/*
Tahap 2: Visualisasi Polusi Udara Tahun 2020–2023
*/
// Mengambil median NO2 untuk tahun 2020 (Lockdown)
var lockDown = no2.filterDate('2020-03-01', '2020-12-30')
    .median().clipToCollection(AOI);

// Mengambil median NO2 untuk tahun 2023 (New normal)
var newNormal = no2.filterDate('2023-01-01', '2023-08-30')
    .median().clipToCollection(AOI);

// Buat widget peta untuk menampung peta tahun 2020 dan peta tahun 2023
var leftMap = ui.Map().centerObject(AOI, 11).setOptions(
    'HYBRID');
var rightMap = ui.Map().setOptions('HYBRID');

// Buat widget panel terpisah untuk menampung 2 peta
var sliderPanel = ui.SplitPanel({
    firstPanel: leftMap,
    secondPanel: rightMap,
    orientation: 'horizontal',
    wipe: true,
    style: {
        stretch: 'both'
    }
});
var linker = ui.Map.Linker([leftMap, rightMap]);

// Membuat penel keterangan tahun pada 2 peta
function makeMapLab(lab, position) {
    var label = ui.Label({
        value: lab,
        style: {
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: 'bold',
            backgroundColor: '337CCF',
            padding: '0px'
        }
    });
    var panel = ui.Panel({
        widgets: [label],
        layout: ui.Panel.Layout.flow('horizontal'),
        style: {
            position: position,
            backgroundColor: '337CCF',
            padding: '0px'
        }
    });
    return panel;
}

// Buat layer tahun 2020 (lockdown), tambahkan ke bagian kiri, dan tambahkan label
var lockdownLayer = ui.Map.Layer(lockDown, no2Viz);
leftMap.layers().reset([lockdownLayer]);
leftMap.add(makeMapLab('Lock Down 2020', 'top-left'));

// Buat layer tahun 2023 (new normal), tambahkan ke bagian kanan, dan tambahkan label
var newNormallayer = ui.Map.Layer(newNormal, no2Viz);
rightMap.layers().reset([newNormallayer]);
rightMap.add(makeMapLab('New Normal 2023', 'top-right'));

//Menampilkan perubahan peta menggunakan widget 
ui.root.widgets().reset([sliderPanel]);