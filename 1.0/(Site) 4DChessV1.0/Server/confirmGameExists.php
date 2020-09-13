<?php
  //20 August 2020
  //20/8/20
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000" || !ctype_alnum($gameid)){
    //Game ID not supplied or invalid, exit code 1
    exit("1");
  }
  
  //$currentgames = glob($gamepath."/*");
  //$gamexeists = False;
  //foreach($currentgames as $game){
  //  if($gamepath."/".$gameid == $game){
  //    $gamexeists = True;
  //  }
  //}
  //if(!$gamexeists){
  //  exit("1");
  //}
  
  //$gamepath = "/tmp/4DChessV1.0/".$gameid;
  $gamepath = "/srv/store/4DChessV1.0/".$gameid;
  if(!file_exists($gamepath)){
    exit("1");
  }
  
  exit("0");
?>

