<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function convertIntToMonth($monthNum) {
	switch ($monthNum) {
		case 0:
			return "Jan.";
		case 1:
			return "Feb.";
		case 2:
			return "March";
		case 3:
			return "April";
		case 4:
			return "May";
		case 5:
			return "June";
		case 6:
			return "July";
		case 7:
			return "Aug.";
		case 8:
			return "Sept.";
		case 9:
			return "Oct.";
		case 10:
			return "Nov.";
		case 11:
			return "Dec.";
		default:
			return "";
	}
}

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
    $temp["user_id"] = $array[0];
    $temp["artist_ids"] = $array[1];
    $temp["track_ids"] = $array[2];
    $temp["start_month"] = convertIntToMonth((int)$array[3]);
    $temp["end_month"] = convertIntToMonth((int)$array[4]);
	$temp["year"] = (int)$array[5];
    $jsonData[] = $temp;
  }
  echo json_encode($jsonData);

}
else{
  echo "Failure";
}

$conn->close();

?>
