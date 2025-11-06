<?php
// Read and discard the incoming data
while (fread(STDIN ?? fopen("php://input", "r"), 8192)) {}
?>