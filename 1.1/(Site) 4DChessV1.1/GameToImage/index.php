<!--
Anthony Wilson - 4D Chess

3 October 2020
3/10/20
-->

<?php
  $gamedata = $_REQUEST["data"];
?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>4D Chess - Game to Image</title>
    <link rel="stylesheet" type="text/css" href="../style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body onload="generateImage()">
    <h1 id="Title">Generating image...</h1>
    
    <button class="MenuButton" id="SaveImageBtn" onclick="saveImage()">Save Image</button>
    <br>
    
    <canvas id="ImageCanvas" width="100" height="100"></canvas>
    
    <a id="DownloadAnchor" href="" target="_blank" hidden style="display:none"></a>
    
    <!-- Load all the images so that they can be used -->
    <div id="Images" hidden>
      <img id="ImgMasterW" src="../Resources/Pieces/64px/MasterW.png">
      <img id="ImgKingW" src="../Resources/Pieces/64px/KingW.png">
      <img id="ImgQueenW" src="../Resources/Pieces/64px/QueenW.png">
      <img id="ImgBishopW" src="../Resources/Pieces/64px/BishopW.png">
      <img id="ImgKnightW" src="../Resources/Pieces/64px/KnightW.png">
      <img id="ImgRookW" src="../Resources/Pieces/64px/RookW.png">
      <img id="ImgPawnW" src="../Resources/Pieces/64px/PawnW.png">
      
      <img id="ImgMasterB" src="../Resources/Pieces/64px/MasterB.png">
      <img id="ImgKingB" src="../Resources/Pieces/64px/KingB.png">
      <img id="ImgQueenB" src="../Resources/Pieces/64px/QueenB.png">
      <img id="ImgBishopB" src="../Resources/Pieces/64px/BishopB.png">
      <img id="ImgKnightB" src="../Resources/Pieces/64px/KnightB.png">
      <img id="ImgRookB" src="../Resources/Pieces/64px/RookB.png">
      <img id="ImgPawnB" src="../Resources/Pieces/64px/PawnB.png">
    </div>
    
    <!-- Pass PHP variables directly to JavaScript -->
    <script>
      var gameData = "<?php echo addslashes($gamedata); ?>";
    </script>
    <script src="genImage.js"></script>
  </body>
</html>
