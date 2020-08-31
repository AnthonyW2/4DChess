//This is a code snippet from Anthony Wilson's 4D Chess

//This is the old local-board rook movement code, which was compacted into the current code found in:
// 4DChess/Site/Play/game.js > getAvailableMoves() > switch(piece.type) > case 6

//This code became outdated on:
//31/8/20

// ..................................................

      var blocked = 0;
      for(var a = px+1;a < boardWidth;a += 1){
        if(piece.parent.pieceTypeMap[ py ][ a ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(a,a,py,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ].color != piece.color){
              addCaptureVisual(a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ]);
            }else{
              addMoveVisual(a,a,py,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(a,a,py,true);
        }
      }
      blocked = 0;
      for(var a = px-1;a >= 0;a -= 1){
        if(piece.parent.pieceTypeMap[ py ][ a ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(a,a,py,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ].color != piece.color){
              addCaptureVisual(a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ]);
            }else{
              addMoveVisual(a,a,py,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(a,a,py,true);
        }
      }
      blocked = 0;
      for(var a = py+1;a < boardHeight;a += 1){
        if(piece.parent.pieceTypeMap[ a ][ px ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(movementVisuals.length,px,a,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ].color != piece.color){
              addCaptureVisual(movementVisuals.length,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ]);
            }else{
              addMoveVisual(movementVisuals.length,px,a,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(movementVisuals.length,px,a,true);
        }
      }
      blocked = 0;
      for(var a = py-1;a >= 0;a -= 1){
        if(piece.parent.pieceTypeMap[ a ][ px ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(movementVisuals.length,px,a,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ].color != piece.color){
              addCaptureVisual(movementVisuals.length,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ]);
            }else{
              addMoveVisual(movementVisuals.length,px,a,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(movementVisuals.length,px,a,true);
        }
      }

// ..................................................
