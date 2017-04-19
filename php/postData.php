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
$raw_user_country = $_POST['user_country'];
$user_country = mysqli_real_escape_string($conn,$raw_user_country);
$raw_top_artist = $_POST['top_artist'];
$top_artist = mysqli_real_escape_string($conn,$raw_top_artist);
$raw_obscurify_score = $_POST['obscurify_score'];
$obscurify_score = mysqli_real_escape_string($conn,$raw_obscurify_score);
$raw_happiness = $_POST['happiness'];
$happiness = mysqli_real_escape_string($conn,$raw_happiness);
$raw_energy = $_POST['energy'];
$energy = mysqli_real_escape_string($conn,$raw_energy);
$raw_acousticness = $_POST['acousticness'];
$acousticness = mysqli_real_escape_string($conn,$raw_acousticness);
$raw_danceability = $_POST['danceability'];
$danceability = mysqli_real_escape_string($conn,$raw_danceability);

$sql = "INSERT INTO users (user_id, obscurify_score, energy, happiness, acousticness, danceability, user_country, top_artist)
        VALUES ('$user_id',$obscurify_score,$energy,$happiness,$acousticness,$danceability,'$user_country','$top_artist')
        ON DUPLICATE KEY
        UPDATE obscurify_score = $obscurify_score, energy = $energy, happiness = $happiness, acousticness = $acousticness, danceability = $danceability, user_country = '$user_country', top_artist = '$top_artist';";
$result = $conn->query($sql);
if ($result) {

} else{
  echo "Failure to update";
}

$conn->close();

?>
