<?php
  //6 September 2020
  //6/9/20
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000"){
    //Game ID not supplied or invalid, exit code 1
    exit("1");
  }
  
  $gamepath = "/tmp/4DChess/".$gameid;
  
  if(!file_exists($gamepath)){
    //Game doesn't exist, exit code 1
    exit("1");
  }
  
  $password = $_REQUEST["passw"];
  if(!isset($password)){
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
  
  $gamedata = $_REQUEST["gamedata"];
  if(!isset($gamedata)){
    //Game data not supplied, exit code 3
    exit("3");
  }
  
  //Store the new JSON game data in the "gamestate.json" file
  $gamefile = fopen($gamepath."/gamestate.json","w");
  fwrite($gamefile,$gamedata);
  fclose($gamefile);
  
  $moveamounts = json_decode($gamedata)->moveAmounts;
  
  //Update the "moves" file
  $movefile = fopen($gamepath."/moves","w");
  fwrite($movefile,json_encode($moveamounts));
  fclose($movefile);
  
  exit("0");
?>

