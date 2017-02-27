<?php

error_reporting(0);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$state = isset($_REQUEST['state']) ? $_REQUEST['state'] : null;

if (!empty($state)) {
    // Parse Bills CSV
    $police_killings = array();
    if (($handle = fopen('police_killings.csv', 'r')) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
            if ($data[0] === strtoupper($state)) {
                $police_killings = array(
                    'state_code' => $data[0],
                    'state' => $data[1],
                    'count' => $data[2]
                );
            }
        }
        fclose($handle);
    }

    exit(json_encode(array('data' => $police_killings)));
} else {
    exit(json_encode(array('error' => 'Invalid Request for Police Killings')));
}
