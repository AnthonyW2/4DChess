<!--
Anthony Wilson - 4D Chess

30 September 2020
30/9/20
-->

<?php
  //Set the cache-control header for the dev version of the page
  header("Cache-Control: no-cache");
  
  //$chessroot = "/tmp/4DChess";
  $chessroot = "/srv/store/4DChess";
  
  $gameid = $_REQUEST["id"];
  //$gameid must be exactly 8 characters
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8){
    $gameid = "00000000";
    if($opponent == 1){
      exit("<h1 style=\"color: #eeeeee\">Game ID not supplied or invalid for online multiplayer game</h1>");
    }
  }
  if(!ctype_alnum($gameid)){
    exit("<h1 style=\"color: #eeeeee\">Game ID invalid - make sure it only contains alphanumeric characters</h1>");
  }
  
  $gamepath = $chessroot."/".$gameid;
  
  $og_title = "4D Chess - Spectate (".$gameid.")";
  $og_desc = "Spectate an online game of 4D Chess\nGame ID: '".$gameid);
  
  $password = $_REQUEST["passw"];
  if(!isset($password) || !ctype_alnum($password)){
    $password = "";
  }
  
  //Execute some extra code if the game is online multiplayer
  if($opponent == 1){
    //Check that the password matches
    if(file_exists($gamepath."/passw")){
      $gamepassword = file_get_contents($gamepath."/passw");
      if($password.PHP_EOL != $gamepassword){
        //If the password does not match, print this out
        exit("<h1 style=\"color: #eeeeee\">Password does not match</h1>");
      }
    }
    
    $layout = intval(file_get_contents($gamepath."/layout"));
  }
  
  $urlpath = 'http://'.$_SERVER['HTTP_HOST'].'/4DChess/Play/';
?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>4D Chess - Spectate</title>
    <link rel="stylesheet" type="text/css" href="../style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="icon" type="image/png" href="../../Resources/Favicon64x64.png" sizes="64x64">
    <link rel="icon" type="image/png" href="../../Resources/Favicon96x96.png" sizes="96x96">
    <link rel="icon" type="image/png" href="../../Resources/Favicon128x128.png" sizes="128x128">
    <link rel="shortcut icon" type="image/png" href="../../Resources/Favicon96x96.png">
    <link rel="apple-touch-icon" href="../../Resources/TouchIcon256x256.png">
    
    <meta name="description" content="This is an open-source game heavily inspired by '5D Chess With Multiverse Time Travel'">
    
    <!--meta property="og:title" content="4D Chess - Play (<?php echo $gameid; ?>)"-->
    <meta property="og:title" content="<?php echo $og_title; ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo $urlpath; ?>">
    <meta property="og:image" content="/4DChess/Play/PreviewImg.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="256">
    <meta property="og:image:height" content="256">
    <meta property="og:description" content="<?php echo $og_desc; ?>">
  </head>
  <body onload="startJS()">
    <div id="TitleBar">
      <h2 id="MainSubtitle">[Something went wrong. Please make sure javascript is enabled.]</h2>
      <h2 id="ColourSubtitle"></h2>
      
      <button class="MenuButton up1line" id="HideTitleBarBtn" onclick="toggleTitleBar()">Hide Title Bar</button>
      <button class="MenuButton up1line" id="ExportBtn" onclick="exportGame()">Export Game</button>
      
    </div>
    
    <div id="TitleBarUnhideButton" onclick="toggleTitleBar()" hidden>
      <div style="position: absolute; left: 6px; top: 9px; width: 20px; height: 2px; background-color: #d0d0d0;"></div>
      <div style="position: absolute; left: 6px; top: 15px; width: 20px; height: 2px; background-color: #d0d0d0;"></div>
      <div style="position: absolute; left: 6px; top: 21px; width: 20px; height: 2px; background-color: #d0d0d0;"></div>
    </div>
    
    <div id="Game">
      <p>Something went wrong.<br>Make sure that javascript is enabled in your browser and allowed on this site and make sure to check your plugins.<br>If the problem persists, send an error ticket <a href="">here</a>.</p>
    </div>
    
    <!-- Pass PHP variables directly to JavaScript -->
    <script>
      const gameID = "<?php echo $gameid; ?>";
      //const opponent = parseInt(<?php echo $opponent; ?>);
      //const playerColor = ((opponent == 0) ? 0 : parseInt(<?php echo $color; ?>)); // 0 = White, 1 = Black
      //const chosenLayout = parseInt(<?php echo $layout; ?>);
      const password = "<?php echo $password; ?>";
    </script>
    <script src="game.js"></script>
  </body>
</html>
