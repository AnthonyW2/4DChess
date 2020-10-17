<?php
  //8 September 2020
  //8/9/20
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000" || !ctype_alnum($gameid)){
    //Game ID not supplied or invalid, error code 1
    exit("err_1");
  }
  
  //$gamepath = "/tmp/4DChessV1.1/".$gameid;
  $gamepath = "/srv/store/4DChessV1.1/".$gameid;
  if(!file_exists($gamepath)){
    //Game doesn't exist, error code 1
    exit("err_1");
  }
  
  $password = $_REQUEST["passw"];
  if(!isset($password) || !ctype_alnum($password)){
    $password = "";
  }
  
  //Check that the passord matches
  if(file_exists($gamepath."/passw")){
    $gamepassword = file_get_contents($gamepath."/passw");
    if($password.PHP_EOL != $gamepassword){
      //Password does not match, error code 2
      exit("err_2");
    }
  }
  
  echo file_get_contents($gamepath."/chat");
?>

