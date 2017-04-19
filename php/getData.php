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

$sql = "SELECT avg(obscurify_score),avg(energy),avg(happiness),avg(acousticness),avg(danceability) FROM users;";
$result = $conn->query($sql);
if ($result) {
  $row = $result->fetch_assoc();
  $data = [ 'obscurify_score' => $row["avg(obscurify_score)"],
            'energy' => $row["avg(energy)"],
            'happiness' => $row["avg(happiness)"],
            'acousticness' => $row["avg(acousticness)"],
            'danceability' => $row["avg(danceability)"]];
  echo json_encode( $data );
}

$conn->close();

?>
