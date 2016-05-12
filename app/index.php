<?php

error_reporting(0);
header('Content-Type: application/json');

require('config.php');

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
$data = array(
  'apikey' => API_KEY,
  'lat' => $latitude,
  'long' => $longitude
);

// Make API call
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, sprintf("%s?%s", API_URL_LEGISLATORS, http_build_query($data)));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($curl, CURLOPT_HEADER, 0);

// Store API Result
$result = curl_exec($curl);

// Terminate cURL
curl_close($curl);

// Return JSON as PHP Array
$response = array(
  'results' => json_decode($result, true),
  'location' => array(
    'latitude' => $latitude,
    'longitude' => $longitude,
    'zipcode' => $zipcode
  )
);

exit(json_encode($response));
