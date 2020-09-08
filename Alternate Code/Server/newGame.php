<?php
  //18 August 2020
  //18/8/20
  
  //Set the default timezone
  date_default_timezone_set("Australia/Melbourne");
  
  
  $gamepath = "/tmp/4DChess";
  //If the game path doesn't exist, create it (this should only need to be executed once per server reboot)
  if(!file_exists($gamepath)){
    mkdir($gamepath);
    chmod($gamepath, 0777);
    //Write to the log file
    file_put_contents("log.txt","[".date("Y-m-d H:i:s",time())."] Created the ".$gamepath."/ directory".PHP_EOL,FILE_APPEND | LOCK_EX);
  }
  
  
  //Handle values supplied through GET/POST
  $gameid = $_REQUEST["id"];
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8){
    //Game ID not supplied or invalid, exit code 1
    exit("1");
  }
  if($gameid == "00000000"){
    //Reserved game ID, exit code 2
    exit("2");
  }
  
  $layout = $_REQUEST["l"];
  //Set to the default layout if an invalid layout is specified
  if(!isset($layout) || $layout > 3){
    $layout = 0;
  }
  
  $password = $_REQUEST["passw"];
  //[Sanitise the string contained in $password]
  
  
  
  //Make sure a game with the specified ID doesn't already exist
  if(file_exists($gamepath."/".$gameid)){
    //Game ID already in use, exit code 2
    exit("2");
  }
  
  //If all tests have been passed, create a new game (and fix permissions)
  if(mkdir($gamepath."/".$gameid)){
    chmod($gamepath."/".$gameid, 0777);
  }else{
    //Write error, exit code 3
    exit("3");
  }
  
  //Create the 'moves' and 'chat' directories (and fix permissions)
  if(mkdir($gamepath."/".$gameid."/moves") && mkdir($gamepath."/".$gameid."/chat")){
    chmod($gamepath."/".$gameid."/moves", 0777);
    chmod($gamepath."/".$gameid."/chat", 0777);
  }else{
    //Write error, exit code 3
    exit("3");
  }
  
  //Create the 2 player colour move directories
  if(mkdir($gamepath."/".$gameid."/moves/0") && mkdir($gamepath."/".$gameid."/moves/1")){
    chmod($gamepath."/".$gameid."/moves/0", 0777);
    chmod($gamepath."/".$gameid."/moves/1", 0777);
  }else{
    //Write error, exit code 3
    exit("3");
  }
  
  //If a password is supplied, add it to a file for use when joining a game or submitting a move
  if(isset($password)){
    $passwfile = fopen($gamepath."/".$gameid."/passw","w");
    fwrite($passwfile,$password.PHP_EOL);
    fclose($passwfile);
    chmod($gamepath."/".$gameid."/passw", 0777);
  }
  
  
  
  //Write to the log file
  file_put_contents("log.txt","[".date("Y-m-d H:i:s",time())."] Created a new game with ID: ".$gameid.PHP_EOL,FILE_APPEND | LOCK_EX);
  
  //Everything was successful, exit with code 0
  exit("0");
?>
