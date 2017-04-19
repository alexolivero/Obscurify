<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$servername = "localhost";
$username = "root";
$password = "password";
$dbname = "obscurify";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT top_artist, COUNT(*) as fans from users group by top_artist order by fans desc limit 6;";
$result = $conn->query($sql);
if ($result) {
  $array = $result->fetch_all();
  echo json_encode($array);
} else{
  echo "Failure";
}

$conn->close();

?>
