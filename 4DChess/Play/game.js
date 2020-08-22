//24 July 2020
//24/7/20

/// TO DO:
// Add past-move visualisations
/// !!! Fix online multiplayer piece IDs !!!
// Add cleanup() method to all classes to remove undefined elements from their arrays (and fix IDs afterwards)
// Add castling & fix pawn promotion (customisable)
// Add per-game chat for online multiplayer
// Fix the top bar (make it collapsable)
// ??? Use NodeJS for online multiplayer ???

/// Roadmap:
// 1 - Fix current online multiplayer bugs
// 2 - Implement branching timelines (that will round out all of the "5D" functionality)
// 3 - Add "Undo" functionality (by cloning the field)
// 4 - Add "toJSON()" & "fromJSON" functions (for sending / storing the game)
// 5 - Rework online multiplayer (send games as JSON, store entire game on server, make the games cheat-resistant)
// 6 - Add time-travel moves for the rest of the pieces



"use strict";



var DEBUG = true;



// -- Global variable declaration -- \\

//DOM element for the entire game
var gameContainer = document.getElementById("Game");

//Main array containing all Fields (normally only one)
var fields = [];

//The ID path of the piece that is selected
var selectedPiece = [undefined,undefined,undefined,undefined]; //fid,tid,bid,pid

//An artificial way to reposition the grid square & pieces inside the board elements
const boardOffset = 6; //px

//An array of all the elements that show where a piece can move
var movementVisuals = [];

//The names of all the pieces
const pieceNames = [
  "",         // 0
  "Master",   // 1
  "King",     // 2
  "Queen",    // 3
  "Bishop",   // 4
  "Knight",   // 5
  "Rook",     // 6
  "Pawn",     // 7
  "Unicorn",  // 8
  "Dragon"    // 9
];

//The icon paths of all the pieces
const pieceIconPaths = [
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
  ],
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
  ]
];

//Starting board layouts
const startingLayouts = [
  [ //0 - Standard 8x8 chess board layout
    [6,5,4,3,2,4,5,6],
    [7,7,7,7,7,7,7,7],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [7,7,7,7,7,7,7,7],
    [6,5,4,3,2,4,5,6]
  ],
  [ //1 - 1st 4x4 starting layout
    [5,3,2,6],
    [7,7,7,7],
    [7,7,7,7],
    [5,3,2,6]
  ],
  [ //2 - 2nd 4x4 starting layout
    [2,3,6,4],
    [7,7,7,7],
    [7,7,7,7],
    [2,3,6,4]
  ],
  [ //3 - 1st 5x5 starting layout
    [2,3,4,5,6],
    [7,7,7,7,7],
    [0,0,0,0,0],
    [7,7,7,7,7],
    [2,3,4,5,6]
  ]
];

//Layouts of the piece colors (corresponds to "startingLayouts"), 0 = Black, 1 = White
const colorLayouts = [
  [ //0 - Standard 8x8 chess board color layout
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
  ],
  [ //1 - 1st 4x4 color layout
    [1,1,1,1],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  [ //2 - 2nd 4x4 color layout
    [1,1,1,1],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  [ //3 - 1st 5x5 color layout
    [1,1,1,1,1],
    [1,1,1,1,1],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0]
  ]
];

const boardWidth = startingLayouts[chosenLayout][0].length;
const boardHeight = startingLayouts[chosenLayout].length;



// -- Classes for all objects in the game -- \\

//The main "Field" that contains all the other objects (boards, timelines, etc)
class Field{
  //FieldID
  constructor(id){
    this.id = id;
    this.timelines = [];
    
    this.fullid = "F"+this.id;
    
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Field");
    this.container.innerHTML = "";
    gameContainer.appendChild(this.container);
    
    this.gridContainer = document.createElement("div");
    this.render();
    this.container.appendChild(this.gridContainer);
  }
  
  //Safely clone the current object and all child objects
  clone(cloneid){
    if(fields[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing field");
      fields[cloneid].container.remove();
      fields[cloneid] = undefined;
    }
    
    fields[cloneid] = new Field(cloneid);
    for(var a = 0;a < this.timelines.length;a += 1){
      if(this.timelines[a] != undefined){
        this.timelines[a].clone(fields[cloneid],a);
      }
    }
  }
  
  changeID(newid){
    if(this.id != newid){
      this.clone(newid);
      this.container.remove();
    }else{
      console.warn("Warning: Attempted to change the ID of Field "+this.id+" to its own ID");
    }
  }
  
  addTimeline(tid){
    this.timelines[tid] = new Timeline(this,tid);
    
    this.timelines[tid].container.style.top = tid*(boardHeight+1)*32+16-boardOffset+"px";
    this.timelines[tid].container.style.left = 16-boardOffset+"px";
    
    this.render();
  }
  
  /// Probably redundant, because timelines shouldn't need to be removed
  removeTimeline(tid){
    this.timelines[tid].container.remove();
    this.timelines[tid] = undefined;
    
    this.render();
  }
  
  render(){
    this.gridContainer.innerHTML = "";
    
    var fieldwidth = 0;
    for(var a = 0;a < this.timelines.length;a += 1){
      if(this.timelines[a].boards.length > fieldwidth){
        fieldwidth = this.timelines[a].boards.length;
      }
    }
    
    //Add the grid tiles to the background
    for(var a = 0;a < Math.ceil(fieldwidth/2);a += 1){
      for(var b = 0;b < this.timelines.length;b += 1){
        var gridSquare = document.createElement("div");
        gridSquare.innerHTML = "";
        gridSquare.classList.add("FieldTile");
        gridSquare.style.backgroundColor = ((a+b)%2 == 0)?("#282828"):("#202020");
        gridSquare.style.left = (boardWidth+1)*32*2*a+"px";
        gridSquare.style.top = (boardWidth+1)*32*b+"px";
        gridSquare.style.width = ((boardWidth+1)*32)*2+"px";
        gridSquare.style.height = (boardWidth+1)*32+"px";
        this.gridContainer.appendChild(gridSquare);
      }
    }
  }
}

//The Timeline class will contain all the "Board" objects. The "Timeline"s will be contained in the main "Field" class.
class Timeline{
  //Parent Field, TimelineID
  constructor(field,id){
    this.fid = field.id;
    this.id = id;
    this.boards = [];
    this.parent = field;
    
    this.fullid = "F"+this.fid+"-T"+this.id;
    
    this.active = true;
    
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Timeline");
    this.container.innerHTML = "";
    this.parent.container.appendChild(this.container);
    this.render();
  }
  
  //Safely clone the current object and all child objects
  clone(newparentfield, cloneid){
    if(newparentfield.timelines[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing timeline");
      newparentfield.timelines[cloneid].container.remove();
      newparentfield.timelines[cloneid] = undefined;
    }
    
    newparentfield.addTimeline(cloneid);
    for(var a = 0;a < this.boards.length;a += 1){
      if(this.boards[a] != undefined){
        this.boards[a].clone(newparentfield.timelines[cloneid],a);
      }
    }
  }
  
  changeID(newid){
    if(this.id != newid){
      this.clone(this.parent,newid);
      this.container.remove();
      this.parent.render();
    }else{
      console.warn("Warning: Attempted to change the ID of Timeline "+this.id+" to its own ID");
    }
  }
  
  addBoard(bid, nullBoard = false){
    if(!nullBoard){
      this.boards[bid] = new Board(this,bid);
      
      this.boards[bid].container.style.left = bid*(boardWidth+1)*32+"px";
      this.boards[bid].container.style.top = 0+"px";
      
      this.arrow.style.width = this.boards.length*(boardWidth+1)*32+boardOffset+2+"px"; //Add 2 pixels to make sure there's no visible seam between the line and the triangle
      this.arrowtriangle.style.left = this.boards.length*(boardWidth+1)*32+boardOffset+"px";
      
      this.parent.render();
    }else{
      this.boards[bid] = undefined;
    }
  }
  
  /// Probably redundant
  removeBoard(bid){
    if(this.boards[a] != undefined){
      this.boards[bid].container.remove();
      this.boards[bid] = undefined;
    }
  }
  
  render(){
    //Create the shaft of the arrow
    this.arrow = document.createElement("div");
    this.arrow.style.position = "inherit";
    this.arrow.style.left = "0px";
    this.arrow.style.top = boardHeight*16-32+boardOffset+"px";
    this.arrow.style.width = "0px";
    this.arrow.style.height = "64px";
    this.arrow.style.backgroundColor = "#606060";
    this.container.appendChild(this.arrow);
    
    //Create the end of the arrow
    this.arrowtriangle = document.createElement("div");
    this.arrowtriangle.style.position = "inherit";
    this.arrowtriangle.style.left = "0px";
    this.arrowtriangle.style.top = boardHeight*16-64+boardOffset+"px";
    this.arrowtriangle.style.width = "0px";
    this.arrowtriangle.style.height = "0px";
    this.arrowtriangle.style.borderTop = "64px solid transparent";
    this.arrowtriangle.style.borderLeft = "64px solid #606060";
    this.arrowtriangle.style.borderBottom = "64px solid transparent";
    this.arrowtriangle.style.backgroundColor = "";
    this.container.appendChild(this.arrowtriangle);
  }
}

//The Board class represents an instance of a board which is contained in a Timeline. The Board class contains all the pieces.
class Board{
  //Parent Timeline, BoardID
  constructor(timeline,id){
    this.fid = timeline.parent.id;
    this.tid = timeline.id;
    this.id = id;
    this.pieces = [];
    this.parent = timeline;
    
    this.fullid = "F"+this.fid+"-T"+this.tid+"-B"+this.id;
    
    this.pieceTypeMap = [[],[]];
    this.pieceIDMap = [[],[]];
    this.turnColor = (this.id + 1) % 2; // 0 = Black, 1 = White
    
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Board");
    this.container.innerHTML = "";
    this.parent.container.appendChild(this.container);
    
    this.gridContainer = document.createElement("div");
    this.render();
    this.container.appendChild(this.gridContainer);
    
    if(this.turnColor != playerColor && opponent != 0){
      var turnColorMask = document.createElement("div");
      turnColorMask.style.backgroundColor = "#808080";
      turnColorMask.style.opacity = "0.75";
      turnColorMask.style.zIndex = "50";
      turnColorMask.style.position = "absolute";
      turnColorMask.style.width = boardWidth*32+"px";
      turnColorMask.style.height = boardHeight*32+"px";
      this.container.appendChild(turnColorMask);
    }
  }
  
  //Safely clone the current object and all child objects
  clone(newparenttimeline, cloneid){
    if(newparenttimeline.boards[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing board");
      newparenttimeline.boards[cloneid].container.remove();
      newparenttimeline.boards[cloneid] = undefined;
    }
    
    newparenttimeline.addBoard(cloneid);
    newparenttimeline.boards[cloneid].setStartingLayout(-1);
    for(var a = 0;a < this.pieces.length;a += 1){
      if(this.pieces[a] != undefined){
        this.pieces[a].clone(newparenttimeline.boards[cloneid],a);
      }
    }
  }
  
  //Duplicate the current board and extend the current timeline (or create a new one if needed) - triggered whenever a piece moves
  extendTimeline(){
    //Check if the board is at the end of the timeline. If it is, just extend the timeline, if it isn't, then 
    var newid = this.parent.boards.length;
    
    //Remove the selectable attributes from the pieces on the old board
    for(var a = 0;a < this.pieces.length;a += 1){
      if(this.pieces[a] != undefined){
        this.pieces[a].container.onclick = function(){};
        this.pieces[a].container.classList.remove("SelectablePiece");
      }
    }
    
    //Check if the board is at the end of the current timeline
    if(this.id == newid-1){
      //Extend the current timeline
      this.clone(this.parent,newid);
      
      //Scroll the end of the timeline into view
      this.parent.arrowtriangle.scrollIntoView();
      
      //Return the new board object
      return this.parent.boards[this.id+1];
    }else{
      /// Create a new timeline
      console.warn("Unimplemented");
    }
    return undefined;
  }
  
  addPiece(pid, type, color, x = 0, y = 0){
    if(this.pieceTypeMap[y][x] != 0){
      console.warn("Warning: Attempting to add piece to unnavailable position");
      this.pieces[this.pieceIDMap[y][x]].container.remove();
      this.pieces[this.pieceIDMap[y][x]] = undefined;
    }
    this.pieceTypeMap[y][x] = type;
    this.pieceIDMap[y][x] = pid;
    this.pieces[pid] = new Piece(this,pid,type,color);
    this.pieces[pid].container.style.left = x*32+boardOffset+"px";
    this.pieces[pid].container.style.top = y*32+boardOffset+"px";
  }
  
  removePiece(pid){
    //Remove the piece's container and update the array of pieces accordingly
    this.pieces[pid].container.remove();
    this.pieces[pid] = undefined;
    
    /// Causes strange behavior at the moment, will fix later
    //this.pieces.splice(_pid,1);
  }
  
  //Set the board to a default starting layout
  setStartingLayout(blank = false){
    if(blank){
      for(var a = 0;a < boardHeight;a += 1){
        this.pieceTypeMap[a] = [];
        this.pieceIDMap[a] = [];
        for(var b = 0;b < boardWidth;b += 1){
          this.pieceTypeMap[a][b] = 0;
          this.pieceIDMap[a][b] = -1;
        }
      }
    }else{
      //Loop through the grid of the board and add the pieces according to the starting layout
      for(var a = 0;a < boardHeight;a += 1){
        this.pieceTypeMap[a] = [];
        this.pieceIDMap[a] = [];
        for(var b = 0;b < boardWidth;b += 1){
          this.pieceTypeMap[a][b] = 0;
          this.pieceIDMap[a][b] = -1;
          if(startingLayouts[chosenLayout][a][b] > 0){
            this.addPiece(this.pieces.length,startingLayouts[chosenLayout][a][b], (colorLayouts[chosenLayout][a][b]+playerColor)%2 ,b,a);
          }
        }
      }
    }
  }
  
  //Add visuals to the board's container (DOM element)
  render(){
    //Set the width & height of the board depending on its size
    this.container.style.width = 32*boardWidth+"px";
    this.container.style.height = 32*boardHeight+"px";
    this.container.style.backgroundColor = (this.turnColor == 0)?"#101010":"#e0e0e0";
    
    this.gridContainer.innerHTML = "";
    
    var tileColors = ["#b0b0b0","#505050"];
    
    //The grid squares need to be colored differently depending on whether the width of the board is odd or even
    if(boardWidth%2 == 0){
      for(var a = 0;a < boardWidth*boardHeight;a += 1){
        var gridSquare = document.createElement("div");
        gridSquare.innerHTML = "";
        gridSquare.classList.add("BoardTile");
        gridSquare.style.backgroundColor = tileColors[ ((Math.floor(a/boardWidth)%2)+a)%2 ];
        gridSquare.style.left = (a%boardWidth)*32+boardOffset+"px";
        gridSquare.style.top = Math.floor(a/boardWidth)*32+boardOffset+"px";
        this.gridContainer.appendChild(gridSquare);
      }
    }else{
      for(var a = 0;a < boardWidth*boardHeight;a += 1){
        var gridSquare = document.createElement("div");
        gridSquare.innerHTML = "";
        gridSquare.classList.add("BoardTile");
        gridSquare.style.backgroundColor = tileColors[a%2];
        gridSquare.style.left = (a%boardWidth)*32+boardOffset+"px";
        gridSquare.style.top = Math.floor(a/boardWidth)*32+boardOffset+"px";
        this.gridContainer.appendChild(gridSquare);
      }
    }
  }
}

//A single piece, usually contained by a Board object
class Piece{
  //Parent Board, PieceID, Type, Color
  constructor(board,id,type,color){
    this.fid = board.parent.parent.id;
    this.tid = board.parent.id;
    this.bid = board.id;
    this.id = id;
    this.parent = board;
    
    this.fullid = "F"+this.fid+"-T"+this.tid+"-B"+this.bid+"-P"+this.id;
    
    this.type = type;
    this.color = color; // 0 = Black, 1 = White
    this.selected = false;
    this.moveAmount = 0;
    
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Piece");
    this.container.innerHTML = "[P]";
    this.parent.container.appendChild(this.container);
    
    //Check if the piece should be made selectable, depending on the piece color, the player color and the opponent (Local, Online or Computer)
    if(this.color === this.parent.turnColor && (this.color === playerColor && opponent != 0 || opponent == 0)){
      var self = this; // This may not function as intended in some cases, but it seems to work fine in Firefox 79.0 (First tested 12 Aug 2020)
      this.container.onclick = function(){
        selectPiece(self);
      };
      //All this does is change the cursor if it hovers over the piece
      this.container.classList.add("SelectablePiece");
    }
    
    this.render();
  }
  
  //Safely clone the current piece
  clone(newparentboard, cloneid){
    if(newparentboard.pieces[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing piece");
      newparentboard.pieces[cloneid].container.remove();
      newparentboard.pieces[cloneid] = undefined;
    }
    
    newparentboard.addPiece(cloneid,this.type,this.color,this.getX(),this.getY());
    newparentboard.pieces[cloneid].moveAmount = this.moveAmount;
  }
  
  changeID(newid){
    this.id = newid;
    this.fullid = "F"+this.fid+"-T"+this.tid+"-B"+this.bid+"-P"+this.id;
    this.container.id = this.fullid;
  }
  
  render(){
    this.container.innerHTML = "";
    
    //Add the piece icon to the piece container
    this.icon = document.createElement("img");
    this.icon.src = pieceIconPaths[this.color][this.type];
    this.icon.alt = pieceNames[this.type];
    this.icon.style.width = "32px";
    this.icon.style.height = "32px";
    this.container.appendChild(this.icon);
    
    //Rotate the opponent's pieces by 180 degrees
    if(this.color != playerColor){
      this.icon.style.transform = "rotate(180deg)";
    }
  }
  
  select(){
    this.container.style.backgroundColor = "#30c030";
    this.selected = true;
  }
  
  deselect(){
    this.container.style.backgroundColor = "";
    this.selected = false;
  }
  
  getX(){
    return Math.round((parseInt(this.container.style.left)-boardOffset)/32);
  }
  
  getY(){
    return Math.round((parseInt(this.container.style.top)-boardOffset)/32);
  }
  
  setX(_x){
    this.container.style.left = (_x*32+boardOffset)+"px";
  }
  
  setY(_y){
    this.container.style.top = (_y*32+boardOffset)+"px";
  }
}



// -- Functions for the game -- \\

//Deselect the previous piece and select the new piece
function selectPiece(piece){
  if(selectedPiece[0] != undefined && fields[selectedPiece[0]].timelines[selectedPiece[1]].boards[selectedPiece[2]].pieces[selectedPiece[3]] != undefined){
    fields[selectedPiece[0]].timelines[selectedPiece[1]].boards[selectedPiece[2]].pieces[selectedPiece[3]].deselect();
  }
  piece.select();
  selectedPiece = [piece.fid,piece.tid,piece.bid,piece.id];
  getAvailableMoves(piece);
}

//Deselect the previous piece and select the new piece
function globalDeselect(){
  if(selectedPiece[0] != undefined && fields[selectedPiece[0]].timelines[selectedPiece[1]].boards[selectedPiece[2]].pieces[selectedPiece[3]] != undefined){
    fields[selectedPiece[0]].timelines[selectedPiece[1]].boards[selectedPiece[2]].pieces[selectedPiece[3]].deselect();
  }
  selectedPiece = [undefined,undefined,undefined,undefined];
  
  for(var a = 0;a < movementVisuals.length;a += 1){
    if(movementVisuals[a] != undefined){
      movementVisuals[a].remove();
      movementVisuals[a] = undefined;
    }
  }
}

//Add the movePiece() function to the "click" event of a "movement visual" element
function addMoveListener(mvisual,piece,x,y,board = undefined){
  if(board == undefined){
    mvisual.addEventListener("click", function(){
      //Create a new board when a piece is moved
      var newboard = piece.parent.extendTimeline();
      
      //Confirm that the new board was successfully created
      if(newboard != undefined){
        //Move the piece (The one on the new instance of the board, not the original)
        movePiece(newboard.pieces[piece.id],x,y);
      }else{
        throwError("An error occurred when trying to extend the timeline, please contact the system admin");
      }
      
      //If the game is online multiplayer, send the move to the server
      if(opponent == 1){
        sendMove(piece,x,y);
      }
    });
  }else{
    mvisual.addEventListener("click", function(){
      ///Create a new board AND TIMELINE when a piece is moved
      ///piece.parent.extendTimeline();
      //Move the piece
      movePieceToBoard(piece,x,y,board);
    });
  }
}

//Move a specified piece to a new location (local board)
function movePiece(piece,x,y){
  //Update the piece maps
  piece.parent.pieceTypeMap[piece.getY()][piece.getX()] = 0;
  piece.parent.pieceIDMap[piece.getY()][piece.getX()] = -1;
  piece.parent.pieceTypeMap[y][x] = piece.type;
  piece.parent.pieceIDMap[y][x] = piece.id;
  
  //Move the piece to its new position
  piece.setX(x);
  piece.setY(y);
  
  //Increment the amount of moves a piece has made
  piece.moveAmount += 1;
  
  //Deselect the piece after moving it
  globalDeselect();
  
  //If the piece is a pawn and it has moved to the end of the board, change it into a queen
  if(piece.type == 7 && ((piece.getY() == boardHeight-1 && piece.color !== playerColor) || (piece.getY() == 0 && piece.color === playerColor))){
    /// In the future, this should give the player a choice of any normal piece type, instead of automatically choosing the queen
    piece.type = 3;
    piece.parent.pieceTypeMap[piece.getX()][piece.getY()] = 3;
    piece.render();
  }
}

//Move a specified piece to a new location (local board)
function movePieceToBoard(piece,x,y,board){
  /// Still needed: create a new board AND TIMELINE when a piece is moved
  
  
  
  var newpid = board.pieces.length;
  
  //Add the piece to its new board
  board.addPiece(newpid,piece.type,piece.color,x,y);
  board.pieces[newpid].moveAmount = piece.moveAmount+1;
  
  //Update the piece maps
  piece.parent.pieceTypeMap[piece.getY()][piece.getX()] = 0;
  piece.parent.pieceIDMap[piece.getY()][piece.getX()] = -1;
  board.pieceTypeMap[y][x] = piece.type;
  board.pieceIDMap[y][x] = newpid;
  
  //Remove the previous instance of the piece (using the parent board's removePiece() function)
  piece.parent.removePiece(piece.id);
  
  //Deselect the piece after moving it
  globalDeselect();
  
  /** //If the piece is a pawn and it has moved to the end of the board, change it into a queen
  if(piece.type == 7 && ((piece.getY() == boardHeight-1 && piece.color !== playerColor) || (piece.getY() == 0 && piece.color === playerColor))){
    /// In the future, this should give the player a choice of any normal piece type, instead of automatically choosing the queen
    piece.type = 3;
    piece.parent.pieceTypeMap[piece.getX()][piece.getY()] = 3;
    piece.render();
  }*/
}

//Add the capturePiece() function to the "click" event of a "capture visual" element
function addCaptureListener(cvisual,piece1,piece2){
  cvisual.addEventListener("click", function(){
    //Create a new board when a piece is moved
    var newboard = piece1.parent.extendTimeline();
      
    //Confirm that the new board was successfully created
    if(newboard != undefined){
      //Move the piece
      capturePiece(
        newboard.pieces[piece1.id],
        piece2.parent.parent.boards[piece2.parent.parent.boards.length-1].pieces[piece2.id]
      );
    }
  });
}

//Capture a piece (move piece1 to piece2's location and remove piece2)
function capturePiece(piece1,piece2){
  //Check if the captured piece is a king
  if(piece2.type == 2){
    win(piece1.color);
  }
  
  //Check if the captured piece is on a different board
  if(piece1.parent == piece2.parent){
    //Update the piece maps
    piece2.parent.pieceTypeMap[piece2.getY()][piece2.getX()] = 0;
    piece2.parent.pieceIDMap[piece2.getY()][piece2.getX()] = -1;
    
    //Move the capturing piece to its new position
    movePiece(piece1,piece2.getX(),piece2.getY());
    
    //Remove the captured piece
    piece2.parent.removePiece(piece2.id);
  }else{
    //Update the piece maps
    piece2.parent.pieceTypeMap[piece2.getY()][piece2.getX()] = 0;
    piece2.parent.pieceIDMap[piece2.getY()][piece2.getX()] = -1;
    
    //Remove the captured piece
    piece2.parent.removePiece(piece2.id);
    
    //Move the capturing piece to its new position
    movePieceToBoard(piece1,piece2.getX(),piece2.getY(),piece2.parent);
  }
}

//Calculate all possible locations that any given piece can move to. Create a "movement visual" element for each possibility
//This is an extremeley large function, because it handles all the diverse moves of the pieces - both on their local boards and accross time.
function getAvailableMoves(piece){
  for(var a = 0;a < movementVisuals.length;a += 1){
    if(movementVisuals[a] != undefined){
      movementVisuals[a].remove();
      movementVisuals[a] = undefined;
    }
  }
  
  var px = piece.getX();
  var py = piece.getY();
  
  movementVisuals = [];
  
  function addMoveVisual(v,_x,_y,isblocked,board = undefined){
    movementVisuals[v] = document.createElement("div");
    movementVisuals[v].classList.add(isblocked ? "MovementVisualBlocked" : "MovementVisualAvailable");
    movementVisuals[v].id = "MV"+v+"_"+piece.fullid;
    movementVisuals[v].style.left = _x*32+boardOffset+"px";
    movementVisuals[v].style.top = _y*32+boardOffset+"px";
    if(board == undefined){
      piece.parent.container.appendChild(movementVisuals[v]);
    }else{
      board.container.appendChild(movementVisuals[v]);
    }
    if(!isblocked){
      addMoveListener(movementVisuals[v],piece,_x,_y,board);
    }
  }
  
  function addCaptureVisual(v,piece1,piece2){
    movementVisuals[v] = document.createElement("div");
    movementVisuals[v].classList.add("CaptureVisual");
    movementVisuals[v].id = "MV"+v+"_"+piece.fullid;
    movementVisuals[v].style.left = piece2.getX()*32+boardOffset+"px";
    movementVisuals[v].style.top = piece2.getY()*32+boardOffset+"px";
    piece2.parent.container.appendChild(movementVisuals[v]);
    addCaptureListener(movementVisuals[v],piece1,piece2);
  }
  
  switch(piece.type){
    case 1:
      //The Master piece can move anywhere on any board
      console.log("Master");
      
      //Loop through all the fields
      for(var f = 0;f < fields.length;f += 1){
        //Loop through all the timelines
        for(var t = 0;t < fields[f].timelines.length;t += 1){
          //Loop through all the boards
          for(var b = 0;b < fields[f].timelines[t].boards.length;b += 1){
            if(fields[f].timelines[t].boards[b] != undefined){
              var board = fields[f].timelines[t].boards[b];
              //Loop through all tiles of each board
              for(var x = 0;x < boardWidth;x += 1){
                for(var y = 0;y < boardHeight;y += 1){
                  //Detect which type of visual should be used (available move, blocked move, or capture)
                  if(board.pieceTypeMap[ y ][ x ] == 0){
                    addMoveVisual(movementVisuals.length,x,y,false,board);
                  }else{
                    if(board.pieces[ board.pieceIDMap[ y ][ x ] ].color != piece.color){
                      addCaptureVisual(movementVisuals.length,piece,board.pieces[ board.pieceIDMap[ y ][ x ] ]);
                    }else{
                      if(!(px == x && py == y && board == piece.parent)){
                        addMoveVisual(movementVisuals.length,x,y,true,board);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      break;
    case 2:
      //The King can move in any one direction by one space (diagonals function the same way as the bishop, see below)
      console.log("King");
      
      //Store all the adjacent spaces in an array (all the possible spaces that the king can move to)
      var spaces = [
        [-1,0],  //1 Left
        [-1,-1], //1 Left, 1 Up
        [0,-1],  //1 Up
        [1,-1],  //1 Right, 1 Up
        [1,0],   //1 Right
        [1,1],   //1 Right, 1 Down
        [0,1],   //1 Down
        [-1,1]   //1 Left, 1 Down
      ];
      
      //Loop through the array of possible moves and check if each is available
      for(var a = 0;a < spaces.length;a += 1){
        if(px+spaces[a][0] >= 0 && py+spaces[a][1] >= 0 && px+spaces[a][0] < boardWidth && py+spaces[a][1] < boardHeight){
          if(piece.parent.pieceTypeMap[ py+spaces[a][1] ][ px+spaces[a][0] ] == 0){
            addMoveVisual(a,px+spaces[a][0],py+spaces[a][1],false);
          }else{
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+spaces[a][1] ][ px+spaces[a][0] ] ].color != piece.color){
              addCaptureVisual(a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+spaces[a][1] ][ px+spaces[a][0] ] ]);
            }else{
              addMoveVisual(a,px+spaces[a][0],py+spaces[a][1],true);
            }
          }
        }
      }
      
      //Loop through the array of possible moves, but this time check the relative boards for available moves through time
      for(var a = 0;a < spaces.length;a += 1){
        if(piece.parent.id+spaces[a][0]*2 >= 0){
        if(piece.parent.parent.id+spaces[a][1] >= 0){
        if(piece.parent.parent.id+spaces[a][1] < piece.parent.parent.parent.timelines.length){
        if(piece.parent.id+spaces[a][0]*2 < piece.parent.parent.parent.timelines[ piece.parent.parent.id+spaces[a][1] ].boards.length){
        if(piece.parent.parent.parent.timelines[ piece.parent.parent.id+spaces[a][1] ].boards[ piece.parent.id+spaces[a][0]*2 ] != undefined){
          
          var board = piece.parent.parent.parent.timelines[ piece.parent.parent.id+spaces[a][1] ].boards[ piece.parent.id+spaces[a][0]*2 ];
          
          //Detect which type of visual should be used (available move, blocked move, or capture)
          if(board.pieceTypeMap[ py ][ px ] == 0){
            addMoveVisual(movementVisuals.length,px,py,false,board);
          }else{
            if(board.pieces[ board.pieceIDMap[ py ][ px ] ].color != piece.color){
              addCaptureVisual(movementVisuals.length,piece,board.pieces[ board.pieceIDMap[ py ][ px ] ]);
            }else{
              addMoveVisual(movementVisuals.length,px,py,true,board);
            }
          }
          
          for(var b = 0;b < spaces.length;b += 1){
            if(px+spaces[b][0] >= 0 && py+spaces[b][1] >= 0 && px+spaces[b][0] < boardWidth && py+spaces[b][1] < boardHeight){
              if(board.pieceTypeMap[ py+spaces[b][1] ][ px+spaces[b][0] ] == 0){
                addMoveVisual(movementVisuals.length,px+spaces[b][0],py+spaces[b][1],false,board);
              }else{
                if(board.pieces[ board.pieceIDMap[ py+spaces[b][1] ][ px+spaces[b][0] ] ].color != piece.color){
                  addCaptureVisual(movementVisuals.length,piece,board.pieces[ board.pieceIDMap[ py+spaces[b][1] ][ px+spaces[b][0] ] ]);
                }else{
                  addMoveVisual(movementVisuals.length,px+spaces[b][0],py+spaces[b][1],true,board);
                }
              }
            }
          }
        }
        }
        }
        }
        }
      }
      
      //Castling
      if(piece.moveAmount == 0){
        /// Check rooks for possibility of castling
        /// Make sure that there's empty space in between
      }
      
      break;
    case 3:
      //The Queen can move in any one direction by an unlimited amount of spaces (diagonals function the same way as the bishop, see below)
      console.log("Queen");
      
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
              addMoveVisual(a+boardWidth+boardHeight,px-a,py+a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-a ] ].color != piece.color){
                addCaptureVisual(a+boardWidth+boardHeight,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-a ] ]);
              }else{
                addMoveVisual(a+boardWidth+boardHeight,px-a,py+a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a+boardWidth+boardHeight,px-a,py+a,true);
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
              addMoveVisual(a+(boardWidth+boardHeight)*2,px+a,py-a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px+a ] ].color != piece.color){
                addCaptureVisual(a+(boardWidth+boardHeight)*2,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px+a ] ]);
              }else{
                addMoveVisual(a+(boardWidth+boardHeight)*2,px+a,py-a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a+(boardWidth+boardHeight)*2,px+a,py-a,true);
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
              addMoveVisual(a+(boardWidth+boardHeight)*3,px-a,py-a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px-a ] ].color != piece.color){
                addCaptureVisual(a+(boardWidth+boardHeight)*3,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px-a ] ]);
              }else{
                addMoveVisual(a+(boardWidth+boardHeight)*3,px-a,py-a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a+(boardWidth+boardHeight)*3,px-a,py-a,true);
          }
        }
      }
      
      var IDoffset = (boardWidth+boardHeight)*4;
      
      //Loop through all orthogonal moves and check if there is line-of-sight to that space
      blocked = 0;
      for(var a = px+1;a < boardWidth;a += 1){
        if(piece.parent.pieceTypeMap[ py ][ a ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(a+IDoffset,a,py,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ].color != piece.color){
              addCaptureVisual(a+IDoffset,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ]);
            }else{
              addMoveVisual(a+IDoffset,a,py,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(a+IDoffset,a,py,true);
        }
      }
      blocked = 0;
      for(var a = px-1;a >= 0;a -= 1){
        if(piece.parent.pieceTypeMap[ py ][ a ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(a+IDoffset,a,py,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ].color != piece.color){
              addCaptureVisual(a+IDoffset,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py ][ a ] ]);
            }else{
              addMoveVisual(a+IDoffset,a,py,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(a+IDoffset,a,py,true);
        }
      }
      blocked = 0;
      for(var a = py+1;a < boardHeight;a += 1){
        if(piece.parent.pieceTypeMap[ a ][ px ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(boardWidth+a+IDoffset,px,a,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ].color != piece.color){
              addCaptureVisual(boardWidth+a+IDoffset,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ]);
            }else{
              addMoveVisual(boardWidth+a+IDoffset,px,a,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(boardWidth+a+IDoffset,px,a,true);
        }
      }
      blocked = 0;
      for(var a = py-1;a >= 0;a -= 1){
        if(piece.parent.pieceTypeMap[ a ][ px ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(boardWidth+a+IDoffset,px,a,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ].color != piece.color){
              addCaptureVisual(boardWidth+a+IDoffset,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ]);
            }else{
              addMoveVisual(boardWidth+a+IDoffset,px,a,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(boardWidth+a+IDoffset,px,a,true);
        }
      }
      
      break;
    case 4:
      //The Bishop moves up/down one square and sideways one square (making a diagonal move) by an unlimited amount of spaces
      console.log("Bishop");
      
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
              addMoveVisual(a+boardWidth+boardHeight,px-a,py+a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-a ] ].color != piece.color){
                addCaptureVisual(a+boardWidth+boardHeight,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-a ] ]);
              }else{
                addMoveVisual(a+boardWidth+boardHeight,px-a,py+a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a+boardWidth+boardHeight,px-a,py+a,true);
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
              addMoveVisual(a+(boardWidth+boardHeight)*2,px+a,py-a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px+a ] ].color != piece.color){
                addCaptureVisual(a+(boardWidth+boardHeight)*2,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px+a ] ]);
              }else{
                addMoveVisual(a+(boardWidth+boardHeight)*2,px+a,py-a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a+(boardWidth+boardHeight)*2,px+a,py-a,true);
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
              addMoveVisual(a+(boardWidth+boardHeight)*3,px-a,py-a,false);
              break;
            case 1:
              if(piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px-a ] ].color != piece.color){
                addCaptureVisual(a+(boardWidth+boardHeight)*3,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py-a ][ px-a ] ]);
              }else{
                addMoveVisual(a+(boardWidth+boardHeight)*3,px-a,py-a,true);
              }
              blocked += 1;
              break;
            default:
              addMoveVisual(a+(boardWidth+boardHeight)*3,px-a,py-a,true);
          }
        }
      }
      
      break;
    case 5:
      //The Knight moves orthogonally by 2 spaces then again by 1 space (at a right angle to its original direction), jumping over pieces that are in the way
      console.log("Knight");
      
      //Store all the spaces that a knight can move to in an array
      var spaces = [
        [-2,-1], //2 Left,  1 Up
        [-2,1],  //2 Left,  1 Down
        [-1,-2], //1 Left,  2 Up
        [1,-2],  //1 Right, 2 Up
        [2,-1],  //2 Right, 1 Up
        [2,1],   //2 Right, 1 Down
        [-1,2],  //1 Left,  2 Down
        [1,2]    //1 Right, 2 Down
      ];
      
      //Loop through the array of possible moves and check if each is available
      for(var a = 0;a < spaces.length;a += 1){
        if(px+spaces[a][0] >= 0 && py+spaces[a][1] >= 0 && px+spaces[a][0] < boardWidth && py+spaces[a][1] < boardHeight){
          if(piece.parent.pieceTypeMap[ py+spaces[a][1] ][ px+spaces[a][0] ] == 0){
            addMoveVisual(a,px+spaces[a][0],py+spaces[a][1],false);
          }else{
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+spaces[a][1] ][ px+spaces[a][0] ] ].color != piece.color){
              addCaptureVisual(a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+spaces[a][1] ][ px+spaces[a][0] ] ]);
            }else{
              addMoveVisual(a,px+spaces[a][0],py+spaces[a][1],true);
            }
          }
        }
      }
      
      break;
    case 6:
      //The Rook can move orthogonally in any one direction by an unlimited amount of spaces
      console.log("Rook");
      
      //Loop through all orthogonal moves and check if there is line-of-sight to that space
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
            addMoveVisual(boardWidth+a,px,a,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ].color != piece.color){
              addCaptureVisual(boardWidth+a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ]);
            }else{
              addMoveVisual(boardWidth+a,px,a,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(boardWidth+a,px,a,true);
        }
      }
      blocked = 0;
      for(var a = py-1;a >= 0;a -= 1){
        if(piece.parent.pieceTypeMap[ a ][ px ] != 0){
          blocked += 1;
        }
        switch(blocked){
          case 0:
            addMoveVisual(boardWidth+a,px,a,false);
            break;
          case 1:
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ].color != piece.color){
              addCaptureVisual(boardWidth+a,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ a ][ px ] ]);
            }else{
              addMoveVisual(boardWidth+a,px,a,true);
            }
            blocked += 1;
            break;
          default:
            addMoveVisual(boardWidth+a,px,a,true);
        }
      }
      
      break;
    case 7:
      //Pawns can move forward by one (or forward by 2 if it's their first move). They can take forward-diagonally.
      console.log("Pawn");
      
      var a = 1;
      //Test whether the piece should move updard or downward (relative to the player's view)
      if(piece.color === playerColor){
        a = -1;
      }
      //Make sure that the pawn is not at the end of the board, but allow for the pawn to be at the very back (for custom layouts)
      if((py+a >= 0 || a == 1) && (py+a < boardHeight || a == -1)){
        //Allow the piece to move forward by one space if available
        if(piece.parent.pieceTypeMap[ py+a ][ px ] == 0){
          addMoveVisual(0,px,py+a,false);
        }else{
          addMoveVisual(0,px,py+a,true);
        }
        //Allow the piece to take on the forward-right diagonal
        if(px+1 < boardWidth){
          if(piece.parent.pieceTypeMap[ py+a ][ px+1 ] != 0){
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px+1 ] ].color != piece.color){
              addCaptureVisual(2,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px+1 ] ]);
            }else{
              addMoveVisual(2,px+1,py+a,true);
            }
          }else{
            addMoveVisual(2,px+1,py+a,true);
          }
        }
        //Allow the piece to take on the forward-left diagonal
        if(px-1 >= 0){
          if(piece.parent.pieceTypeMap[ py+a ][ px-1 ] != 0){
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-1 ] ].color != piece.color){
              addCaptureVisual(3,piece,piece.parent.pieces[ piece.parent.pieceIDMap[ py+a ][ px-1 ] ]);
            }else{
              addMoveVisual(3,px-1,py+a,true);
            }
          }else{
            addMoveVisual(3,px-1,py+a,true);
          }
        }
        //If it's the piece's first move, allow it to move one extra space forward
        if(piece.moveAmount == 0){
          if(piece.parent.pieceTypeMap[ py+a ][ px ] == 0 && piece.parent.pieceTypeMap[ py+a*2 ][ px ] == 0){
            addMoveVisual(1,px,py+a*2,false);
          }else{
            addMoveVisual(1,px,py+a*2,true);
          }
        }
      }
      
      break;
    case 8:
      console.log("Dragon");
      
      break;
    case 9:
      console.log("Unicorn");
      
      break;
    default:
      console.warn("Warning: Attempted calculation of the moves of an invalid piece - "+piece.fullid);
  }
}

//Create a new game with given paramaters (yet to be fully implemented)
function newGame(){
  gameContainer.innerHTML = "";
  
  // Create a new Field with ID 0
  fields[0] = new Field(0);
  
  // Create a new timeline with ID 0
  fields[0].addTimeline(0);
  
  fields[0].timelines[0].addBoard(0);
  fields[0].timelines[0].boards[0].setStartingLayout();
  
  /**
  // Add boards to timeline 0
  for(var a = 0;a < 4;a += 1){
    fields[0].timelines[0].addBoard(a);
    fields[0].timelines[0].boards[a].setStartingLayout();
  }
  //fields[0].timelines[0].boards[1].addPiece(50,1,playerColor,0,0);
  
  
  // Create a new timeline with ID 1
  fields[0].addTimeline(1);
  
  // Add boards to timeline 1
  for(var a = 0;a < 2;a += 1){
    fields[0].timelines[1].addBoard(a);
    fields[0].timelines[1].boards[a].setStartingLayout();
  }
  
  
  // Create a new timeline with ID 2
  fields[0].addTimeline(2);
  fields[0].timelines[2].addBoard(0,true);
  
  // Add boards to timeline 2
  for(var a = 1;a < 3;a += 1){
    fields[0].timelines[2].addBoard(a);
    fields[0].timelines[2].boards[a].setStartingLayout();
  }/// */
}

//Delete an old game and crate a new one
function resetGame(){
  globalDeselect();
  
  fields[0].container.remove();
  fields[0] = undefined;
  newGame();
  
  ///fields[0].clone(1);
  ///fields[0].container.remove();
  ///fields[0].timelines[2].changeID(3);
  
  console.log("- - - - - - - -");
  console.log("Reset Game");
  console.log("- - - - - - - -");
}

//Pretty self-explanatory, make a player win using one neat function
function win(player){
  var playerText = ["Black","White"];
  
  document.getElementById("ColourSubtitle").innerHTML = playerText[player]+" wins!";
}

//Deliberatly throw an error in case of critical failure (stop execution & make the error clear to the end-user)
function throwError(err){
  document.getElementById("MainSubtitle").innerHTML = err;
  gameContainer.innerHTML = "";
  throw new Error(err);
}



// -- Stuff to execute straight away -- \\

if(opponent == 0){
  //Opponent 0 = Local multiplayer
  
  document.getElementById("MainSubtitle").innerHTML = "Local Multiplayer";
  document.getElementById("ColourSubtitle").innerHTML = "";
  
  newGame();
  
}else if(opponent == 1){
  //Opponent 1 = Online multiplayer
  
  //Make sure the game ID is valid
  if(gameID == "00000000"){
    throwError("Invalid game ID");
  }
  //Make an asynchronous request to the server, confirming that a game with the current game ID exists
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      //Error code 1 
      if(this.responseText == 1){
        throwError("Invalid game ID");
      }
    }
  };
  xmlhttp.open("GET","../Server/getLiveGameFromID.php?id="+gameID,true);
  xmlhttp.send();
  
  //Set the main text in the titlebar to something relevant
  document.getElementById("MainSubtitle").innerHTML = "Online Multiplayer - Game ID: "+gameID;
  
  //Set the secondary text in the titlebar to the player's colo(u)r (I really dislike the two spellings of colo(u)r)
  if(playerColor == 0){
    document.getElementById("ColourSubtitle").innerHTML = "Colour: Black";
  }else{
    document.getElementById("ColourSubtitle").innerHTML = "Colour: White";
  }
  
  newGame();
  
}else{
  //Opponent 2 = VS computer
  
  //Set the main text in the titlebar to something relevant
  document.getElementById("MainSubtitle").innerHTML = "Versus Computer";
  
  //Set the secondary text in the titlebar to the player's colo(u)r
  if(playerColor == 0){
    document.getElementById("ColourSubtitle").innerHTML = "Colour: Black";
  }else{
    document.getElementById("ColourSubtitle").innerHTML = "Colour: White";
  }
  
  newGame();
}



// -- Network stuff for communicating with th server (only used with online multiplayer) -- \\

///A LOT OF THIS WILL BE MAJORLY CHANGED IN THE FUTURE

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
  
  console.log("Checked for moves...");
  setTimeout(requestMoves,2000);
}

//Called by the "onload()" function of a the body element, which starts the requestMoves() loop
function startRequestLoop(){
  if(opponent == 1){
    setTimeout(requestMoves,1000);
  }
}



/**
var frameCount = 0;
var doLoop = false; /// Disabled until required
//var frameRate = 30;
//var MSPT = 1000/frameRate;

function draw(){
  ///Currently disabled until required
  
  if(doLoop){
    frameCount += 1;
    //setTimeout(draw,Math.ceil(MSPT));
    window.requestAnimationFrame(draw);
  }
}
// The "draw()" function will be called by the "onload" event triggered by the body element
*/


/**
function asyncRequest(url){
  if(url != undefined){
    var result = 0;
    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
      if(this.readyState == 4 && this.status == 200){
        result = this.responseText;
      }
    };
    xmlhttp.open("GET",url,true);
    xmlhttp.send();
    
    return result;
  }
}*/
