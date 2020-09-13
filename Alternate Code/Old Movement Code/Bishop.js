//This is a code snippet from Anthony Wilson's 4D Chess

//This is the old local-board bishop movement code, which was compacted into the current code found in:
// 4DChess/Site/Play/game.js > getAvailableMoves() > switch(piece.type) > case 4

//This code became outdated on:
//31/8/20

// ..................................................

      //Loop through all diagonal moves and check if there is line-of-sight to that space
      var blocked = 0;
      for(var a = 1;a < boardWidth-px && a < boardHeight-py;a += 1){
        if(px+a >= 0 && py+a >= 0 && px+a < boardWidth && py+a < boardHeight){
          if(piece.parent.pieceTypeMap[ py+a ][ px+a ] != 0){
            blocked += 1;
          }
          switch(blocked){
            case 0:
              addMoveVisual(a,px+a,py+a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px+a ] ].color != piece.color){
                addCaptureVisual(a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px+a ] ]);
              }else{
                addMoveVisual(a,px+a,py+a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a,px+a,py+a,true);
          }
        }
      }
      blocked = 0;
      for(var a = 1;a <= px && a < boardHeight-py;a += 1){
        if(px-a >= 0 && py+a >= 0 && px-a < boardWidth && py+a < boardHeight){
          if(piece.parent.pieceTypeMap[ py+a ][ px-a ] != 0){
            blocked += 1;
          }
          switch(blocked){
            case 0:
              addMoveVisual(movementVisuals.length,px-a,py+a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-a ] ].color != piece.color){
                addCaptureVisual(movementVisuals.length,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-a ] ]);
              }else{
                addMoveVisual(movementVisuals.length,px-a,py+a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(movementVisuals.length,px-a,py+a,true);
          }
        }
      }
      blocked = 0;
      for(var a = 1;a < boardWidth-px && a <= py;a += 1){
        if(px+a >= 0 && py-a >= 0 && px+a < boardWidth && py-a < boardHeight){
          if(piece.parent.pieceTypeMap[ py-a ][ px+a ] != 0){
            blocked += 1;
          }
          switch(blocked){
            case 0:
              addMoveVisual(movementVisuals.length,px+a,py-a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px+a ] ].color != piece.color){
                addCaptureVisual(movementVisuals.length,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px+a ] ]);
              }else{
                addMoveVisual(movementVisuals.length,px+a,py-a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(movementVisuals.length,px+a,py-a,true);
          }
        }
      }
      blocked = 0;
      for(var a = 1;a <= px && a <= py;a += 1){
        if(px-a >= 0 && py-a >= 0 && px-a < boardWidth && py-a < boardHeight){
          if(piece.parent.pieceTypeMap[ py-a ][ px-a ] != 0){
            blocked += 1;
          }
          switch(blocked){
            case 0:
              addMoveVisual(movementVisuals.length,px-a,py-a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px-a ] ].color != piece.color){
                addCaptureVisual(movementVisuals.length,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px-a ] ]);
              }else{
                addMoveVisual(movementVisuals.length,px-a,py-a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(movementVisuals.length,px-a,py-a,true);
          }
        }
      }

// ..................................................
