<?php
$folderPaths = [
    'Digitasi Point',
    'Digitasi Polygon',
    'Digitasi Polyline',
];

$data = [];

foreach ($folderPaths as $folderPath) {
    // Validasi apakah folder ada
    if (!is_dir($folderPath)) {
        continue;
    }

    $files = glob($folderPath . '/*.shp');

    // Lewati folder jika tidak ada file .shp
    if (empty($files)) {
        continue;
    }

    $group = [
        'folder' => basename($folderPath),
        'layers' => [],
    ];

    foreach ($files as $file) {
        $filename = pathinfo($file, PATHINFO_FILENAME);
        $lowercaseFilename = strtolower($filename);

        $group['layers'][] = [
            'title' => $filename,
            'layerName' => 'gampong:' . $lowercaseFilename,
        ];
    }

    $data[] = $group;
}

// Header untuk CORS dan JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header('Content-Type: application/json');

// Output data JSON
echo json_encode($data, JSON_PRETTY_PRINT); // Gunakan JSON_PRETTY_PRINT untuk debugging
?>
