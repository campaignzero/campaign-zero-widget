<?php

error_reporting(0);
set_time_limit(5);

$token = $_REQUEST['token'];
$update = $_REQUEST['update'];
$valid_token = (md5($token) === '4bda0a6d7109fe8f622dca4600334368');

/**
 * URLs for Widget Data
 */
$bills_url = 'https://docs.google.com/a/peterschmalfeldt.com/spreadsheets/d/1DqdlFrfSJd3eQrhQ8RkRkCsJ50rsunQ9U1XOBQHyusw/export?format=csv&id=1DqdlFrfSJd3eQrhQ8RkRkCsJ50rsunQ9U1XOBQHyusw&gid=515068932';
$police_killings_url = 'https://docs.google.com/a/peterschmalfeldt.com/spreadsheets/d/1i69iECkad3mSIUF3ksN9L3bM8BNV0WmVJhsgBKKCisg/export?format=csv&id=1i69iECkad3mSIUF3ksN9L3bM8BNV0WmVJhsgBKKCisg&gid=154439846';
$resistance_url = 'https://docs.google.com/a/peterschmalfeldt.com/spreadsheets/d/1jgtpjh6zjEkTHgMhiC9gZuB6sJW8_oYHScnir5GLklw/export?format=csv&id=1jgtpjh6zjEkTHgMhiC9gZuB6sJW8_oYHScnir5GLklw&gid=227983952';

/**
 * @param $file
 * @param $name
 * @return string
 */
function update_file ($file, $name) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $file);
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_AUTOREFERER, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_FRESH_CONNECT, true);

    $result = curl_exec($ch);
    $output = "";

    if($errno = curl_errno($ch)) {
        $error_message = curl_strerror($errno);
        $output .= "<p><span class=\"label label-danger\">ERROR</span>&nbsp; Failed to Download <b>{$name}.csv</b> - Error ({$errno}): {$error_message}</p>";
    } else if (!$result) {
        $output .= "<p><span class=\"label label-danger\">ERROR</span>&nbsp; Failed to Download <b>{$name}.csv</b> CSV File</p>";
    } else {
        file_put_contents("{$name}.csv", $result);
        $output .= "<p><span class=\"label label-success\">SUCCESS</span>&nbsp; <a class='download-link' href='{$name}.csv' target='_blank'>{$name}.csv</a> downloaded &amp; widget updated</p>";
    }

    curl_close($ch);

    return $output;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Campaign Zero - Update Widget</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">

    <meta property="og:url" content="https://joincampaignzero.org" />
    <meta property="og:title" content="Campaign Zero - Update Widget" />
    <meta property="og:description" content="We can live in a world where the police don't kill people by limiting police interventions, improving community interactions, and ensuring accountability." />
    <meta property="og:image" content="https://embed.joincampaignzero.org/app-image.gif" />

    <meta name="twitter:image" content="https://embed.joincampaignzero.org/app-image.gif" />
    <meta name="twitter:card" content="summary">
    <meta name="twitter:site" content="@samswey">
    <meta name="twitter:domain" content="joincampaignzero.org">
    <meta name="twitter:creator" content="@mrmidi">

    <link rel="shortcut icon" href="https://embed.joincampaignzero.org/favicon.ico" />

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.css">

    <style>
        .main {
          padding-top: 40px;
        }
        .navbar-brand {
            color: #FFF !important;
        }
        .download-link {
            color: #222;
            text-decoration: none;
            font-weight: bold;
        }
        .download-link:hover {
            color: #000;
            text-decoration: underline;
        }
        a.btn-primary {
            width: 170px;
            text-align: left;
        }
    </style>
</head>
<body>
    <?php if ($valid_token): ?>
    <nav class="navbar navbar-inverse navbar-fixed-top">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <div class="navbar-brand">Campaign Zero</div>
            </div>

            <div id="navbar" class="navbar-collapse collapse">
                <ul class="nav navbar-nav">
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Manage Data <span class="caret"></span></a>
                        <ul class="dropdown-menu">
                            <li><a href="https://bit.ly/campaign-zero-widget-bills" target="_blank">Bills</a></li>
                            <li><a href="https://bit.ly/campaign-zero-widget-police" target="_blank">Police Killings</a></li>
                            <li><a href="https://bit.ly/campaign-zero-widget-resistance" target="_blank">Resistance</a></li>
                        </ul>
                    </li>
                </ul>
            </div><!--/.nav-collapse -->
        </div>
    </nav>
    <?php endif ?>

    <div class="container main" role="main">
      <?php if (!$update && $valid_token): ?>
        <div class="page-header">
            <h1>Campaign Zero Data</h1>
        </div>

        <p><span class="label label-info">CURRENT</span>&nbsp; <a class='download-link' href='bills.csv' target='_blank'>bills.csv</a> downloaded &amp; widget updated</p>
        <p><span class="label label-info">CURRENT</span>&nbsp; <a class='download-link' href='police_killings.csv' target='_blank'>police_killings.csv</a> downloaded &amp; widget updated</p>
        <p><span class="label label-info">CURRENT</span>&nbsp; <a class='download-link' href='resistance.csv' target='_blank'>resistance.csv</a> downloaded &amp; widget updated</p>
        <p>&nbsp;</p>
        <p><a href="update.php?update=true&token=<?= $_REQUEST['token']; ?>" type="button" class="btn btn-primary" onclick="return updateData()">Download Latest Data</a></p>
      <?php elseif ($update && $valid_token): ?>
        <div class="page-header">
            <h1>Downloaded Campaign Zero Data</h1>
        </div>
        <?= update_file($bills_url, 'bills'); ?>
        <?= update_file($police_killings_url, 'police_killings'); ?>
        <?= update_file($resistance_url, 'resistance'); ?>
        <p>&nbsp;</p>
        <p><a href="update.php?update=true&token=<?= $_REQUEST['token']; ?>" type="button" class="btn btn-primary" onclick="return updateData()">Download Latest Data</a></p>
      <?php else: ?>
        <h1><span class="label label-danger">Unauthorized Access</span></h1>
      <?php endif ?>
    </div>

    <script>
        function updateData() {
          if (confirm('This will overwrite the existing widget data and cannot be undone. Continue ?')) {
            $('a.btn-primary').attr('disabled', 'disabled').css('cursor', 'pointer').text('Downloading Data ...');
            return true;
          }

          return false;
        }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.js"></script>
</body>
</html>

