<?php
$documentNames = ["My File"];
$documentDescs = [""];
$mediaFileIds = ["1" => "123"];
$files = [];

$maxIndex = max(
    count($documentNames),
    count($documentDescs),
    count($mediaFileIds),
    is_array($files) ? count($files) : 0
);
echo "MaxIndex: " . $maxIndex . "\n";

for ($i = 0; $i < $maxIndex; $i++) {
    if (isset($mediaFileIds[$i])) {
        echo "Found at $i\n";
    } else {
        echo "Not found at $i\n";
    }
}
