<?php
header("Content-Type: application/octet-stream");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$chunk = str_repeat("A", 1024 * 1024); // 1 MB
$start = microtime(true);

while ((microtime(true) - $start) < 25) { // stream for ~25 seconds
    echo $chunk;
    flush();
}
?>