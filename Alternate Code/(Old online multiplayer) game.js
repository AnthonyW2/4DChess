//Send the player's move to the server
function sendMove(piece,x,y,board = undefined){
  var moveString = "F"+piece.fid+"-T"+piece.tid+"-B"+piece.bid+"-X"+x+"-Y"+y;
  
  if(board != undefined){
    moveString = "F"+piece.fid+"-T"+piece.tid+"-B"+board.id+"-X"+x+"-Y"+y;
  }
  
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      switch(parseInt(this.responseText)){
        case 0:
          console.log("Successfully sent the move to the server");
          break;
        case 1:
          throwError("This game no longer exists");
          break;
        case 2:
          throwError("Invalid player colour when sending move to server (this should never happen)");
          break;
        case 3:
          throwError("Piece either invalid or not set when sending move to server");
          break;
        case 4:
          throwError("New piece location either invalid or not set when sending move to server");
          break;
        case 5:
          throwError("Server-side write error, please contact the system admin");
          break;
        default:
          throwError("An unkown error occurred while sending your move to the server");
      }
    }
  };
  xmlhttp.open("GET","../Server/storeMove.php?id="+gameID+"&c="+playerColor+"&p="+piece.fullid+"&m="+moveString,true);
  xmlhttp.send();
}

//This function will be executed every ~1 second
function requestMoves(){
  //Make an asynchronous request to the server which will return all of the specified player's moves (This will be changed in the future)
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      if(this.responseText == "err_1"){
        //Tell the player that the game no longer exists on the server if this error is recieved
        throwError("This game no longer exists");
      }else if(this.responseText == "err_2"){
        //Password detected as incorrect when requesting the amounts of moves
        throwError("Password detected as incorrect");
      }else if(this.responseText == "err_3"){
        //Throw an error if the "moves" file is missing from the server
        throwError("A server-side error occurred: \"moves\" file missing from game");
      }else{
        //Split the move string into 2 parts (the piece and the new location)
        var allMoves = this.responseText.split("\n");
        if(allMoves.length > 1 && allMoves[0] != "" && allMoves[0] != undefined){
          for(var a = 0;a < allMoves.length-1;a += 1){
            //Check that the string is not empty
            if(allMoves[a] != ""){
              //Split the piece ID part of the string and get the corresponding object
              var pieceFullID = allMoves[a].split("_")[0].split("-");
              for(var b = 0;b < 4;b += 1){
                pieceFullID[b] = parseInt(pieceFullID[b].substr(1,pieceFullID[b].length-1));
              }
              var piece = fields[ pieceFullID[0] ].timelines[pieceFullID[1]].boards[ pieceFullID[2] ].pieces[ pieceFullID[3] ];
              
              //Split the movement part of the string and store the new position
              var movePos = allMoves[a].split("_")[1].split("-");
              for(var b = 0;b < 5;b += 1){
                movePos[b] = parseInt(movePos[b].substr(1,movePos[b].length-1));
              }
              var newX = movePos[3];
              var newY = movePos[4];
              
              //Get the new board that the piece will move to (this is only used if the piece time travels)
              var board = fields[ movePos[0] ].timelines[ movePos[1] ].boards[ movePos[2] ];
              
              //Make sure that the piece is on a valid board to be moved
              if(piece.parent.id == piece.parent.parent.boards.length-1){
                //Check if the piece travelled through time
                if(piece.parent == board){
                  console.log("Moved opponent's piece");
                  //Create a new board when the piece is moved
                  var newboard = piece.parent.extendTimeline();
                  
                  //Confirm that the new board was successfully created
                  if(newboard != undefined){
                    //Move the piece (The one on the new instance of the board, not the original)
                    movePiece(newboard.pieces[piece.id],newX,newY);
                  }else{
                    throwError("An error occurred when trying to extend the timeline, please contact the system admin");
                  }
                }else{
                  /// Move the piece to a new board (yet to be implemented)
                }
              }else{
                console.warn("Attempted move of piece in the past");
              }
            }
          }
        }
      }
    }
  };
  xmlhttp.open("GET","../Server/requestMoves.php?id="+gameID+"&c="+((playerColor+1)%2),true);
  xmlhttp.send();
  
  setTimeout(requestMoves,2000);
}
