<?php

require_once('config.php');

/**
 * @param $url
 * @param $params
 * @return mixed|string
 */
function get_content($url, $params)
{
    remove_old_files();

    $file = CACHE_PATH . md5(sprintf("%s?%s", $url, http_build_query($params))) . '.json';
    $current_time = time();
    $expire_time = CACHE_EXPIRE;
    $file_time = filemtime($file);
    $time_difference = $current_time - $expire_time;

    if (file_exists($file) && ($time_difference < $file_time)) {
        return file_get_contents($file);
    } else {
        $content = get_url($url, $params);

        if ($content) {
            file_put_contents($file, $content);
        }

        return $content;
    }
}

/**
 * @param $url
 * @param $params
 * @return mixed
 */
function get_url($url, $params)
{
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, sprintf("%s?%s", $url, http_build_query($params)));
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_HEADER, 0);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($curl, CURLOPT_TIMEOUT, 3);

    $result = curl_exec($curl);

    curl_close($curl);
    return (is_JSON($result)) ? $result : NULL;
}

/**
 * Remove Old File
 */
function remove_old_files()
{
    foreach (glob(CACHE_PATH . '*.json') as $file) {
        if (filemtime($file) < time() - CACHE_EXPIRE) {
            unlink($file);
        }
    }
}

function is_JSON($args) {
    json_decode($args);
    return (json_last_error() === JSON_ERROR_NONE);
}