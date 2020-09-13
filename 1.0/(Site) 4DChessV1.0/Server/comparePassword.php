<?php
  //2 September 2020
  //2/9/20
  
  //$gamepath = "/tmp/4DChessV1.0";
  $gamepath = "/srv/store/4DChessV1.0";
  
  $currentgames = glob($gamepath."/*");
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000" || !ctype_alnum($gameid)){
    //Game ID not supplied or invalid, exit code 1
    exit("1");
  }
  $gamexeists = False;
  foreach($currentgames as $game){
    if($gamepath."/".$gameid == $game){
      $gamexeists = True;
    }
  }
  if(!$gamexeists){
    exit("1");
  }
  
  $suppliedpassword = $_REQUEST["passw"];
  if(!isset($suppliedpassword) || !ctype_alnum($suppliedpassword)){
    $suppliedpassword = "";
  }
  
  if(file_exists($gamepath."/".$gameid."/passw")){
    $gamepassword = file_get_contents($gamepath."/".$gameid."/passw");
    if($suppliedpassword.PHP_EOL == $gamepassword){
      //Password matches, exit code 0
      exit("0");
    }else{
      //Password does not match, exit code 2
      exit("2");
    }
  }else{
    //If there's no password set, exit with code 0 (same as match)
    exit("0");
  }
  
  //Unknown error, exit code 3
  exit("3");
?>

