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
$raw_start_month = $_POST['start_month'];
$start_month = mysqli_real_escape_string($conn,$raw_start_month);
$raw_end_month = $_POST['end_month'];
$end_month = mysqli_real_escape_string($conn,$raw_end_month);
$raw_year = $_POST['year'];
$year = mysqli_real_escape_string($conn,$raw_year);
$raw_artist_ids = $_POST['artist_ids'];
$artist_ids = mysqli_real_escape_string($conn,$raw_artist_ids);
$raw_track_ids = $_POST['track_ids'];
$track_ids = mysqli_real_escape_string($conn,$raw_track_ids);

$sql = "INSERT INTO history (user_id, start_month, end_month, artists, tracks, year)
        SELECT * FROM (SELECT '$user_id','$start_month','$end_month','$artist_ids','$track_ids','$year') AS tmp
        WHERE NOT EXISTS (
            SELECT user_id,end_month,year FROM history WHERE user_id = '$user_id' AND end_month = '$end_month' AND year = '$year'
        ) LIMIT 1;";
$result = $conn->query($sql);
if ($result) {

} else{
  echo "Failure to update";
}

$conn->close();

?>
