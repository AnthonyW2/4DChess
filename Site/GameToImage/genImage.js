//Anthony Wilson - 4D Chess

//7 October 2020
//7/10/20

//The icon paths of all the pieces
const pieceIconPaths = [
  [ // White pieces
    "",
    "../Resources/Pieces/64px/MasterW.png",
    "../Resources/Pieces/64px/KingW.png",
    "../Resources/Pieces/64px/QueenW.png",
    "../Resources/Pieces/64px/BishopW.png",
    "../Resources/Pieces/64px/KnightW.png",
    "../Resources/Pieces/64px/RookW.png",
    "../Resources/Pieces/64px/PawnW.png",
    "", // Unicorn icon
    ""  // Dragon icon
  ],
  [ // Black pieces
    "",
    "../Resources/Pieces/64px/MasterB.png",
    "../Resources/Pieces/64px/KingB.png",
    "../Resources/Pieces/64px/QueenB.png",
    "../Resources/Pieces/64px/BishopB.png",
    "../Resources/Pieces/64px/KnightB.png",
    "../Resources/Pieces/64px/RookB.png",
    "../Resources/Pieces/64px/PawnB.png",
    "", // Unicorn icon
    ""  // Dragon icon
  ]
];

var boardOffset = 6;

var canvas = document.getElementById("ImageCanvas");

function generateImage(){
  //Convert the JSON data to an object
  var obj = JSON.parse(gameData);
  
  //Set the height of the canvas
  canvas.height = (obj.boardWidth+1)*32*(obj.timelines.length);
  
  var fieldwidth = 0;
  for(var a = 0;a < obj.timelines.length;a += 1){
    if(obj.timelines[a] != undefined && obj.timelines[a].boards.length > fieldwidth){
      fieldwidth = obj.timelines[a].boards.length;
    }
  }
  //Set the width of the canvas
  canvas.width = (obj.boardWidth+1)*64*Math.ceil((fieldwidth+1)/2);
  
  var ctx = canvas.getContext("2d");
  
  //Create an arrow pointing from one location to another
  function createArrow(x1,y1,x2,y2,color = "#808080"){
    var angle = (Math.atan2(y1-y2,x1-x2)+Math.PI)%(Math.PI*2);
    var x3 = Math.sin(angle+Math.PI/2)*8;
    var y3 = -Math.cos(angle+Math.PI/2)*8;
    
    ctx.beginPath();
    ctx.moveTo(x1-x3,y1-y3);
    ctx.lineTo(x2-x3+x3/8,y2-y3+y3/8);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 16;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x2-x3,y2-y3);
    ctx.lineTo(x2-x3+Math.sin(angle)*16,y2-y3-Math.cos(angle)*16);
    ctx.lineTo(x2-x3+Math.sin(angle+Math.PI/2)*16,y2-y3-Math.cos(angle+Math.PI/2)*16);
    ctx.lineTo(x2-x3+Math.sin(angle+Math.PI)*16,y2-y3-Math.cos(angle+Math.PI)*16);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  //Create the field grid
  for(var a = 0;a < Math.ceil((fieldwidth+1)/2);a += 1){
    for(var b = 0;b < obj.timelines.length;b += 1){
      ctx.fillStyle = ((a+b)%2 == 0)?("#282828"):("#202020");
      ctx.fillRect(
        (obj.boardWidth+1)*64*a,
        (obj.boardWidth+1)*32*b,
        (obj.boardWidth+1)*64,
        (obj.boardWidth+1)*32
      );
    }
  }
  
  var tileColors = ["#b0b0b0","#505050"];
  
  //Loop through all timelines in the field
  for(var t = 0;t < obj.timelines.length;t += 1){
    if(obj.timelines[t] != undefined){
      //get the amount of null/undefined boards
      var nullBoards = 0;
      for(var b = 0;b < obj.timelines[t].boards.length;b += 1){
        if(obj.timelines[t].boards[b] == undefined){
          nullBoards += 1;
        }
      }
      ctx.fillStyle = "#606060";
      ctx.beginPath();
      //Draw the timeline line
      ctx.fillRect(
        nullBoards*(obj.boardWidth+1)*32,
        t*(obj.boardHeight+1)*32+obj.boardHeight*16-16,
        (obj.timelines[t].boards.length-nullBoards)*(obj.boardWidth+1)*32+boardOffset+10,
        64
      );
      //Draw the timeline triangle
      ctx.moveTo(
        (obj.timelines[t].boards.length*(obj.boardWidth+1)*32)+80,
        t*(obj.boardHeight+1)*32+obj.boardHeight*16+16
      );
      ctx.lineTo(
        (obj.timelines[t].boards.length*(obj.boardWidth+1)*32)+16,
        t*(obj.boardHeight+1)*32+obj.boardHeight*16-48
      );
      ctx.lineTo(
        (obj.timelines[t].boards.length*(obj.boardWidth+1)*32)+16,
        t*(obj.boardHeight+1)*32+obj.boardHeight*16+80
      );
      ctx.closePath();
      ctx.fill();
      for(var b = 0;b < obj.timelines[t].boards.length;b += 1){
        var board = obj.timelines[t].boards[b];
        if(board != undefined){
          //Draw the board border
          ctx.fillStyle = (board.turnColor == 0)?"#e0e0e0":"#101010";
          ctx.fillRect(
            b*(obj.boardWidth+1)*32+16-boardOffset,
            t*(obj.boardHeight+1)*32+16-boardOffset,
            32*obj.boardWidth+boardOffset*2,
            32*obj.boardHeight+boardOffset*2
          );
          
          //Draw the gridsquares
          if(obj.boardWidth%2 == 0){
            for(var a = 0;a < obj.boardWidth*obj.boardHeight;a += 1){
              ctx.fillStyle = tileColors[((Math.floor(a/obj.boardWidth)%2)+a)%2];
              ctx.fillRect(
                b*(obj.boardWidth+1)*32+16+(a%obj.boardWidth)*32,
                t*(obj.boardHeight+1)*32+16+Math.floor(a/obj.boardWidth)*32,
                32,
                32
              );
            }
          }else{
            for(var a = 0;a < obj.boardWidth*obj.boardHeight;a += 1){
              ctx.fillStyle = tileColors[a%2];
              ctx.fillRect(
                b*(obj.boardWidth+1)*32+16+(a%obj.boardWidth)*32,
                t*(obj.boardHeight+1)*32+16+Math.floor(a/obj.boardWidth)*32,
                32,
                32
              );
            }
          }
          
          //Draw all the pieces
          for(var p = 0;p < board.pieceXs.length;p += 1){
            //Create an image element
            var icon = document.createElement("img");
            //Add the source of the image (preloaded by the hidden images on the page)
            icon.src = pieceIconPaths[board.pieceColors[p]][board.pieceTypes[p]];
            //Draw the image to the canvas
            ctx.drawImage(
              icon,
              b*(obj.boardWidth+1)*32+16+board.pieceXs[p]*32,
              t*(obj.boardHeight+1)*32+16+board.pieceYs[p]*32,
              32,
              32
            );
          }
        }
      }
    }
  }
  
  //Loop through all the past-movement visuals and render them as slightly transparent rectangles
  for(var a = 0;a < obj.pastMoves.length;a += 1){
    ctx.fillStyle = "#ff00ff60";
    ctx.fillRect(
      obj.pastMoves[a][0]*(obj.boardWidth+1)*32+16+obj.pastMoves[a][2]*32,
      obj.pastMoves[a][1]*(obj.boardHeight+1)*32+16+obj.pastMoves[a][3]*32,
      32,
      32
    );
    ctx.fillRect(
      obj.pastMoves[a][4]*(obj.boardWidth+1)*32+16+obj.pastMoves[a][6]*32,
      obj.pastMoves[a][5]*(obj.boardHeight+1)*32+16+obj.pastMoves[a][7]*32,
      32,
      32
    );
    
    if(obj.pastMoves[a][0] != obj.pastMoves[a][4] || obj.pastMoves[a][1] != obj.pastMoves[a][5]){
      createArrow(
        (obj.boardWidth+1)*32*obj.pastMoves[a][0]+obj.pastMoves[a][2]*32+16+16,
        (obj.boardHeight+1)*32*obj.pastMoves[a][1]+obj.pastMoves[a][3]*32+16+16,
        (obj.boardWidth+1)*32*obj.pastMoves[a][4]+obj.pastMoves[a][6]*32+16+16,
        (obj.boardHeight+1)*32*obj.pastMoves[a][5]+obj.pastMoves[a][7]*32+16+16,
        "#902090"
      );
    }
  }
  
  document.getElementById("Title").innerHTML = "Finished generating image";
}

function saveImage(){
  var downloadAnchor = document.getElementById("DownloadAnchor");
  downloadAnchor.setAttribute("download","4D Chess Image.png");
  downloadAnchor.setAttribute("href",canvas.toDataURL("image/png").replace("image/png","image/octet-stream"));
  downloadAnchor.click();
}
