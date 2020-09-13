<!--
Anthony Wilson

Protected by the GNU General Public License V3

24 July 2020
24/7/20

This is not a full clone of the game "5D Chess With Multiverse Time Travel" on Steam, but simply a game that is heavily inspired by it.
While the game concept is not completely ours, this entire site was written from the ground up, so the code is entirely ours.

See https://github.com/Anthony-Wilson-Programming/4DChess for the complete source code.
-->

<?php
  //$chessroot = "/tmp/4DChessV1.0";
  $chessroot = "/srv/store/4DChessV1.0";
  
  $opponent = $_REQUEST["vs"];
  //$opponent can contain the value 0, 1 or 2
  if(!isset($opponent) || $opponent == "" || !($opponent >= 0 && $opponent <= 2)){
    $opponent = 0;
  }
  
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
  
  $color = $_REQUEST["c"];
  //$color can currently contain the value 0 (white) or 1 (black)
  if(!isset($color) || $color == "" || !($color >= 0 && $color <= 1)){
    $color = 0;
  }
  
  $layout = $_REQUEST["l"];
  //$layout can contain the values 0 - 3
  if(!isset($layout) || $layout == "" || !($layout >= 0 && $layout <= 3)){
    $layout = 0;
  }
  
  $layoutdesc = array(
    "8x8 Standard",
    "4x4 (King in the middle)",
    "4x4 (King in the corner)",
    "5x5 Simple (All pieces)"
  );
  
  $og_desc = "";
  $og_title = "";
  
  if($opponent == 0){
    $og_title = "4D Chess - Play";
    $og_desc = "Play a local game of 4D Chess\nLayout: ".$layoutdesc[$layout];
    
  }else if($opponent == 1){
    $og_title = "4D Chess - Play (".$gameid.")";
    $og_desc = "Join an online game of 4D Chess\nGame ID: '".$gameid."'\nLayout: ".$layoutdesc[$layout]."\nColour: ".($color == 0 ? "White" : "Black");
    
  }else{
    $opponent = 2;
    
    $og_title = "4D Chess - Play";
    $og_desc = "Play a game of 4D Chess against the computer\nLayout: ".$layoutdesc[$layout];
  }
  
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
    <title>4D Chess - Versus</title>
    <link rel="stylesheet" type="text/css" href="../style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <link rel="icon" type="image/png" href="../Resources/Favicon64x64.png" sizes="64x64">
    <link rel="icon" type="image/png" href="../Resources/Favicon96x96.png" sizes="96x96">
    <link rel="icon" type="image/png" href="../Resources/Favicon128x128.png" sizes="128x128">
    <link rel="shortcut icon" type="image/png" href="../Resources/Favicon96x96.png">
    <link rel="apple-touch-icon" href="../Resources/TouchIcon256x256.png">
    
    <meta name="description" content="This is an open-source game heavily inspired by '5D Chess With Multiverse Time Travel'">
    
    <!--meta property="og:title" content="4D Chess - Play (<?php echo $gameid; ?>)"-->
    <meta property="og:title" content="<?php echo $og_title; ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo $urlpath; ?>">
    <meta property="og:image" content="<?php echo $urlpath; ?>PreviewImg.png">
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
      <button class="MenuButton up1line" id="ResetBtn" onclick="resetGame()">[Debug] Reset Game</button>
      <button class="MenuButton up1line" id="ExportBtn" onclick="exportGame()">Export Game</button>
      <button class="MenuButton up1line" id="ImportBtn" onclick="importGame()">Import Game</button>
      <button class="MenuButton up1line" id="UndoBtn" onclick="undoMove()">Undo Move</button>
      <button class="MenuButton up1line" id="ShareBtn" onclick="shareGame()" hidden>Share Game</button>
      <button class="MenuButton up1line" id="CheckCheckBtn" onclick="checkForCheck()" hidden disabled>Check for Check</button>
      
      <!--div id="Debug" class="up1line">Release 1.0 scheduled for the 13th of September 2020</div-->
      
      <a id="DownloadAnchor" href="" target="_blank" hidden style="display:none"></a>
    </div>
    
    <div id="TitleBarUnhideButton" onclick="toggleTitleBar()" hidden><!--<img src="../Resources/UnhideTitlebar.png" alt="V">-->V</div>
    
    <div id="Game">
      <p>Something went wrong.<br>Make sure that javascript is enabled in your browser and allowed on this site and make sure to check your plugins.<br>If the problem persists, send an error ticket <a href="">here</a>.</p>
    </div>
    
    <div id="ImportGamePopup" hidden>
      <p>Import a game from JSON</p>
      <input type="file" class="up1line" id="ImportGameFileInput">
      <button class="MenuButton up1line" onclick="importGame()">Import Game</button>
      <button class="MenuButton up1line" onclick="cancelImport()">Cancel</button>
      <br>
      <textarea id="ImportGameTextInput" placeholder="JSON goes here"></textarea>
    </div>
    
    <div id="FatalErrorRecovery" style="position: absolute;z-index: 1000;top: 250px;" hidden>
      <h2>If a fatal error occured, you should be able to recover some previous game states by exporting them from the list below:</h2>
      
    </div>
    
    <!-- Pass PHP variables directly to JavaScript -->
    <script>
      const gameID = "<?php echo $gameid; ?>";
      const opponent = parseInt(<?php echo $opponent; ?>);
      const playerColor = ((opponent == 0) ? 0 : parseInt(<?php echo $color; ?>)); // 0 = White, 1 = Black
      const chosenLayout = parseInt(<?php echo $layout; ?>);
      const password = "<?php echo $password; ?>";
    </script>
    <script src="game.js"></script>
  </body>
</html>
