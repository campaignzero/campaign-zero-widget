<?php

error_reporting(0);
header('Content-Type: application/json');

require('config.php');

$state = isset($_GET['state']) ? $_GET['state'] : null;
$session = isset($_GET['session']) ? $_GET['session'] : null;
$bill = isset($_GET['bill']) ? $_GET['bill'] : null;
$rep = isset($_GET['rep']) ? $_GET['rep'] : null;

// Make sure everything is set
if(empty($state) || empty($session) || empty($bill) || empty($rep)){
  exit(json_encode(array('error' => 'Invalid Request for Bill')));
}

// Build URL
$url = API_URL_BILLS . strtolower($state) . '/' . rawurlencode($session) . '/' . rawurlencode($bill) . '/';

// Create URL params for API call
$data = array(
  'apikey' => API_KEY
);

// Make API call
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, sprintf("%s?%s", $url, http_build_query($data)));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($curl, CURLOPT_HEADER, 0);

// Store API Result
$result = curl_exec($curl);

// Terminate cURL
curl_close($curl);

// Store results as JSON
$data = json_decode($result, true);

// loop through bills for specific rep
$status = 'unknown';
if($data && $data['votes']){
  for($i = 0; $i < count($data['votes']); $i++){
    for($j = 0; $j < count($data['votes'][$i]['yes_votes']); $j++){
      if($data['votes'][$i]['yes_votes'][$j]['leg_id'] === $rep){
        $status = 'supported';
        break;
      }
    }
    for($j = 0; $j < count($data['votes'][$i]['no_votes']); $j++){
      if($data['votes'][$i]['no_votes'][$j]['leg_id'] === $rep){
        $status = 'opposed';
        break;
      }
    }
  }
}

// Return JSON as PHP Array
$response = array(
  'results' => array('status' => $status),
  'request' => array(
    'state' => $state,
    'session' => $session,
    'bill' => $bill,
    'rep' => $rep
  )
);

exit(json_encode($response));
