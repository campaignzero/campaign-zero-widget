<?php

//error_reporting(0);
header('Content-Type: application/json');

require('config.php');
require('cache-or-curl.php');

$latitude = isset($_GET['latitude']) ? $_GET['latitude'] : null;
$longitude = isset($_GET['longitude']) ? $_GET['longitude'] : null;
$zipcode = isset($_GET['zipcode']) ? $_GET['zipcode'] : null;

if( !empty($zipcode)){
  require('zipcodes.php');

  if(isset($zipcodes[$zipcode])){
    $latitude = $zipcodes[$zipcode]['lat'];
    $longitude = $zipcodes[$zipcode]['lon'];
  } else {
    exit(json_encode(array('error' => 'Zip Code Does Not Exist')));
  }
}

// Make sure a $latitude and $longitude are set
if(empty($latitude) && empty($longitude)){
  exit(json_encode(array('error' => 'Missing Geo Location Data')));
}

// Create URL params for API call
$params = array(
  'apikey' => API_KEY,
  'lat' => $latitude,
  'long' => $longitude
);

$result = get_content(API_URL_LEGISLATORS, $params);

// Store results as JSON
$results = json_decode($result, true);

// Save Current State
$state = (isset($results[0]['state'])) ? strtoupper($results[0]['state']) : NULL;

// Parse Bills CSV
$bills = array();
if (($handle = fopen('data.csv', 'r')) !== FALSE) {
  while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
    if ($data[0] === $state) {
      if( !isset($bills[$data[1]])) {
        $bills[$data[1]] = array();
      }
      $bills[$data[1]][] = array(
        'state' => $data[0],
        'chamber' => $data[1],
        'bill' => $data[2],
        'session' => $data[3],
        'status' => $data[4],
        'progress' => $data[5],
        'label' => $data[6],
        'url' => $data[7]
      );
    }
  }
  fclose($handle);
}

// Parse Killings CSV
$killings = array();
if (($handle = fopen('killings.csv', 'r')) !== FALSE) {
  while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
    if ($data[0] === $state) {
      $killings = array(
        'code' => $data[0],
        'state' => $data[1],
        'count' => intval($data[2])
      );

      break;
    }
  }
  fclose($handle);
}

// Return JSON as PHP Array
$response = array(
  'results' => $results,
  'bills' => $bills,
  'killings' => $killings,
  'request' => array(
    'latitude' => $latitude,
    'longitude' => $longitude,
    'zipcode' => $zipcode
  )
);

// update to support jsonp responses

$json = json_encode($response);
exit(isset($_GET['callback'])
    ? "{$_GET['callback']}($json)"
    : $json);
