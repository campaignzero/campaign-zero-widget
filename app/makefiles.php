<?php
require('zipcodes.php');
/**
 * Requires the main zipcodes.php file and writes individual zipcode files
 * for the first two digits of the zipcode
 */

function startsWith($haystack, $needle)
{
	$length = strlen($needle);
	return (substr($haystack, 0, $length) === $needle);
}

$prefixes = range(0, 99);

foreach ($prefixes as $prefix) {
	# Zipcodes start with "00" - "99"
	$prefix = str_pad($prefix, 2, "0", STR_PAD_LEFT);

	$file = fopen("zipcodedata/" . $prefix . ".php", "w");
	fwrite($file, "<?php\n\n");
	fwrite($file, "\$zipcodes = array();\n\n");

	foreach ($zipcodes as $zipcode => $geo) {
		$lat = $geo["lat"];
		$lon = $geo["lon"];

		if (startsWith($zipcode, $prefix)) {
			fwrite($file, "\$zipcodes['$zipcode'] = array('lat' => $lat, 'lon' => $lon);\n");
		}
	}
	fclose($file);
}