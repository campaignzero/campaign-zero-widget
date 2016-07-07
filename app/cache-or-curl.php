<?php

// quick and dirty cache from https://davidwalsh.name/php-cache-function
// change the $hours = 24 to however many hours the data should be stored, if 1 day is not correct

// gets the contents of $file if it exists
// otherwise grabs from the url based on the $data and caches
function get_content($file, $data, $hours = 24, $fn = '', $fn_args = '') {
	//vars
	$current_time = time(); $expire_time = $hours * 60 * 60; $file_time = filemtime($file);
	//decisions, decisions
	if(file_exists($file) && ($current_time - $expire_time < $file_time)) {
		//echo 'returning from cached file';
		return file_get_contents($file);
	}
	else {
		$content = get_url($data);
		if($fn) { $content = $fn($content, $fn_args); }
		$content.= '<!-- cached:  '.time().'-->';
		file_put_contents($file, $content);
		//echo 'retrieved fresh from '.$data.':: '.$content;
		return $content;
	}
}

/* gets content from a URL via curl */
function get_url($data) {
	// Make API call
	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL, sprintf("%s?%s", API_URL_LEGISLATORS, http_build_query($data)));
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($curl, CURLOPT_HEADER, 0);

	// Store API Result
	$result = curl_exec($curl);

	// Terminate cURL
	curl_close($curl);
	return $result;
}