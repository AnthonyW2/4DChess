<?php
  //20 August 2020
  //20/8/20
  
  $gamepath = "/tmp/4DChess";
  
  $currentgames = glob($gamepath."/*");
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000"){
    //Game ID not supplied or invalid, error code 1
    exit("err_1");
  }
  $gamexeists = False;
  foreach($currentgames as $game){
    if($gamepath."/".$gameid == $game){
      $gamexeists = True;
    }
  }
  if(!$gamexeists){
    exit("err_1");
  }
  
  $color = $_REQUEST["c"];
  if(!isset($color) || $color == "" || $color > 1){
    //Color not set or invalid, error code 2
    exit("err_2");
  }
  
  $moves = glob($gamepath."/".$gameid."/moves/".$color."/*");
  
  foreach($moves As $move){
    //Echo out the file name (without the path)
    echo str_replace($gamepath."/".$gameid."/moves/".$color."/","",$move);
    //Remove the file
    unlink($move);
  }
?>

