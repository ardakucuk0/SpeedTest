<?php
$bytes = file_get_contents("php://input");
echo json_encode(["bytesReceived" => strlen($bytes)]);
?>