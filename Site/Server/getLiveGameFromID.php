<?php
  //20 August 2020
  //20/8/20
  
  $gamepath = "/tmp/4DChess";
  
  $currentgames = glob($gamepath."/*");
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000"){
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
  
  exit("0");
?>

