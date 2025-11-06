<?php
$size = 100 * 1024 * 1024; // 100MB
header("Content-Type: application/octet-stream");
header("Content-Length: $size");
echo str_repeat("A", $size);
?>