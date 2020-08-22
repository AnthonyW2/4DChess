<!--
Anthony Wilson

24 July 2020
24/7/20

This is not a full clone of the game "5D Chess With Multiverse Time Travel" on Steam, but simply a game that is heavily inspired by it.
While the game concept is not completely ours, this entire site was written from the ground up, so the code is ours.
-->

<?php
  $opponent = $_REQUEST["vs"];
  //$opponent can contain the value 0, 1 or 2
  if(!isset($opponent) || $opponent == "" || $opponent > 2 || $opponent < 0){
    $opponent = 0;
  }
  
  $gameid = $_REQUEST["id"];
  //$gameid must be exactly 8 characters
  if(!isset($gameid) || $gameid == "" || strlen($gameid) != 8){
    $gameid = "00000000";
  }
  
  $color = $_REQUEST["c"];
  //$color can contain the value 0 or 1
  if(!isset($color) || $color == "" || $color > 1 || $color < 0){
    $color = 0;
  }
  
  $layout = $_REQUEST["l"];
  //$layout can contain the values 0 - 3
  if(!isset($layout) || $layout == "" || $layout > 3 || $layout < 0){
    $layout = 0;
  }
  
  $layoutdesc = array(
    "8x8 Standard",
    "4x4 (King in the middle)",
    "4x4 (King in the corner)",
    "5x5 Simple (All pieces)"
  );
  
  if($opponent == 0){
    $og_desc = "Play a local game of 4D Chess\nLayout: ".$layoutdesc[$layout];
  }else if($opponent == 1){
    $og_desc = "Join an online game of 4D Chess\nGame ID: '".$gameid."'\nLayout: ".$layoutdesc[$layout]."\nColour: ".($color == 0 ? "Black" : "White");
  }else{
    $og_desc = "Play a game of 4D Chess against the computer\nLayout: ".$layoutdesc[$layout];
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
    
    <meta property="og:title" content="4D Chess - Play (<?php echo $gameid; ?>)">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo $urlpath; ?>">
    <meta property="og:image" content="<?php echo $urlpath; ?>PreviewImg.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="256">
    <meta property="og:image:height" content="256">
    <meta property="og:description" content="<?php echo $og_desc; ?>">
  </head>
  <body class="up1line" onload="startRequestLoop()">
    <div id="TitleBar">
      <h2 id="MainSubtitle">[Something went wrong. Please make sure javascript is enabled.]</h2>
      <h2 id="ColourSubtitle"></h2>
      <button class="MenuButton up1line" id="ResetBtn" onclick="resetGame()">Reset Game</button>
      <div id="Debug" class="up1line">Online multiplayer is nearly finished! [21 August 2020]</div>
    </div>
    
    <div id="Game">
      <p>Something went wrong.<br>Make sure that javascript is enabled in your browser and allowed on this site and make sure to check your plugins.<br>If the problem persists, send an error ticket <a href="">here</a>.</p>
    </div>
    
    <!-- Pass PHP variables directly to JavaScript -->
    <script>
      const gameID = "<?php echo $gameid; ?>";
      const opponent = <?php echo $opponent; ?>;
      const playerColor = <?php echo $color; ?>+(opponent == 0?1:0); // 0 = White, 1 = Black
      const chosenLayout = <?php echo $layout; ?>;
    </script>
    <script src="game.js"></script>
  </body>
</html>
