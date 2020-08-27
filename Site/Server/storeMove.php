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
  
  $color = $_REQUEST["c"];
  if(!isset($color) || $color == "" || $color > 1){
    //Color not set or invalid, exit code 2
    exit("2");
  }
  
  $piece = $_REQUEST["p"];
  if(!isset($piece) || $piece == ""){
    //Piece not set or invalid, exit code 3
    exit("3");
  }
  
  $move = $_REQUEST["m"];
  if(!isset($move) || $move == ""){
    //Move not set or invalid, exit code 4
    exit("4");
  }
  
  $filename = $gamepath."/".$gameid."/moves/".$color."/".$piece."_".$move;
  
  if(touch($filename)){
    //Change file permissions
    chmod($filename, 0777);
    
    //Report success, exit code 0
    exit("0");
  }else{
    //Write error, exit code 5
    exit("5");
  }
  
  //Unknown error
  exit("99");
?>

