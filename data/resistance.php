<?php

error_reporting(0);
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require_once('config.php');
require('cache-or-curl.php');

$state = isset($_REQUEST['state']) ? $_REQUEST['state'] : null;
$session = isset($_REQUEST['session']) ? $_REQUEST['session'] : null;
$bill = isset($_REQUEST['bill']) ? $_REQUEST['bill'] : null;
$rep = isset($_REQUEST['rep']) ? $_REQUEST['rep'] : null;

if(empty($state) && empty($session) && empty($bill) && empty($rep)){
    exit(json_encode(array('error' => 'Invalid Request for Bill')));
}

if (!empty($state) && empty($session) && empty($bill) && empty($rep)) {
    // Parse Bills CSV
    $bills = array();
    if (($handle = fopen('resistance.csv', 'r')) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
            if ($data[0] === strtoupper($state)) {
                if( !isset($bills[$data[1]])) {
                    $bills[$data[1]] = array();
                }
                $bills[$data[1]][] = array(
                    'state' => $data[0],
                    'chamber' => $data[1],
                    'bill' => (!empty($data[2])) ? $data[2] : 'LINK',
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

    exit(json_encode(array('data' => $bills)));
}

// Build URL
$url = API_URL_BILLS . strtolower($state) . '/' . rawurlencode($session) . '/' . rawurlencode($bill) . '/';

// Create URL params for API call
$params = array('apikey' => 'bd38451d-7963-4afa-ad72-9577ea3d0eb1');

// replace curl call with function that caches, or loads from cache
$result = get_content($url, $params);

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
    'openstates' => $url,
    'state' => $state,
    'session' => $session,
    'bill' => $bill,
    'rep' => $rep
  )
);

exit(json_encode($response));
