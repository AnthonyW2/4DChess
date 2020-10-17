<?php
  //8 September 2020
  //8/9/20
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000" || !ctype_alnum($gameid)){
    //Game ID not supplied or invalid, exit code 1
    exit("1");
  }
  
  //$gamepath = "/tmp/4DChessV1.1/".$gameid;
  $gamepath = "/srv/store/4DChessV1.1/".$gameid;
  if(!file_exists($gamepath)){
    //Game doesn't exist, exit code 1
    exit("1");
  }
  
  $password = $_REQUEST["passw"];
  if(!isset($password) || !ctype_alnum($password)){
    $password = "";
  }
  
  //Check that the passord matches
  if(file_exists($gamepath."/passw")){
    $gamepassword = file_get_contents($gamepath."/passw");
    if($password.PHP_EOL != $gamepassword){
      //Password does not match, exit code 2
      exit("2");
    }
  }
  
  $message = $_REQUEST["message"];
  if(!isset($message)){
    //Message not supplied, exit code 3
    exit("3");
  }
  //Will need to filter the message to prevent RCE and XSS. ctype_alnum() is probably too limiting for the user.
  
  //Write to the file
  file_put_contents($gamepath."/chat",$message.PHP_EOL,FILE_APPEND | LOCK_EX);
  
  exit("0");
?>

