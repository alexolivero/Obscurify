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

$raw_user_id = $_POST['user_id'];
$user_id = mysqli_real_escape_string($conn,$raw_user_id);

$sql = "SELECT * from history WHERE user_id='$user_id';";
$result=mysqli_query($conn,$sql);
if ($result) {

  $jsonData = array();
  while ($array = mysqli_fetch_row($result)) {
    $temp = array();
    $temp[] = $array[0];
    $temp[] = $array[1];
    $temp[] = $array[2];
    $temp[] = (int)$array[3];
    $temp[] = (int)$array[4];
    $jsonData[] = $temp;
  }
  echo json_encode($jsonData);

}
else{
  echo "Failure";
}

$conn->close();

?>
