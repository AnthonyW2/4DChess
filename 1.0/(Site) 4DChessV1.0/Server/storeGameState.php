<?php
  //6 September 2020
  //6/9/20
  
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8 || $gameid == "00000000" || !ctype_alnum($gameid)){
    //Game ID not supplied or invalid, exit code 1
    exit("1");
  }
  
  //$gamepath = "/tmp/4DChessV1.0/".$gameid;
  $gamepath = "/srv/store/4DChessV1.0/".$gameid;
  
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
  
  $gamedata = $_REQUEST["gamedata"];
  if(!isset($gamedata)){
    //Game data not supplied, exit code 3
    exit("3");
  }
  //Sanitise game data (still need to remove out-of-place symbols)
  $gamedata = strip_tags($gamedata);
  
  $gameobj = null;
  
  try{
    $gameobj = json_decode($gamedata);
  }catch(Exception $e){
    //Game data invalid, exit code 3
    exit("3");
  }
  
  //Store the new JSON game data in the "gamestate.json" file
  $gamefile = fopen($gamepath."/gamestate.json","w");
  fwrite($gamefile,$gamedata);
  fclose($gamefile);
  
  //$moveamounts = json_decode($gamedata)->moveAmounts;
  $moveamounts = $gameobj->moveAmounts;
  
  //Update the "moves" file
  $movefile = fopen($gamepath."/moves","w");
  fwrite($movefile,json_encode($moveamounts));
  fclose($movefile);
  
  exit("0");
?>

