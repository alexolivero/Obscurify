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

$sql = "select obscurify_score, count(*) from users group by obscurify_score;";
$result=mysqli_query($conn,$sql);
if ($result) {

  $jsonData = array();
  while ($array = mysqli_fetch_row($result)) {
    $temp = array();
    $temp[] = $array[0];
    $temp[] = (int)$array[1];
    $jsonData[] = $temp;
  }
  echo json_encode($jsonData);

  }
else{
  echo "Failure";
}

$conn->close();

?>
