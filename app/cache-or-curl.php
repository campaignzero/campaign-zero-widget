<?php

require_once('config.php');

/**
 * @param $url
 * @param $data
 * @param int $hours
 * @param string $fn
 * @param string $fn_args
 * @return mixed|string
 */
function get_content($url, $params, $hours = 24, $fn = '', $fn_args = '') {
  $file = CACHE_PATH . md5(sprintf("%s?%s", $url, http_build_query($params)));
	$current_time = time();
  $expire_time = $hours * 60 * 60;
  $file_time = filemtime($file);

	if(file_exists($file) && ($current_time - $expire_time < $file_time)) {
		return file_get_contents($file);
	} else {
		$content = get_url($url, $params);
		if ($fn) {
      $content = $fn($content, $fn_args);
    }
		file_put_contents($file, $content);
		return $content;
	}
}

/**
 * @param $data
 * @return mixed
 */
function get_url($url, $params) {
	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL, sprintf("%s?%s", $url, http_build_query($params)));
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($curl, CURLOPT_HEADER, 0);

	$result = curl_exec($curl);

	curl_close($curl);
	return $result;
}
