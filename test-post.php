<?php
// Mock the framework request object logic for array parsing
$string = "document_media_file_ids[0]=5&document_names[0]=Test";
parse_str($string, $parsed);
var_dump($parsed);
