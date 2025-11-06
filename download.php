<?php
$size = 5 * 1024 * 1024; // 5MB
header("Content-Type: application/octet-stream");
header("Content-Length: $size");
echo str_repeat("A", $size);
?>