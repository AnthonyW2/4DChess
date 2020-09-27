//Code created by Anthony Wilson

//Protected by the GNU General Public License V3

// Project Started:
//24 July 2020
//24/7/20

// Release 1.0:
//13 September 2020
//13/9/20



"use strict";

// (Maj Version).(Min Version).(Patch).(Build)-(Release)
const version = "1.1.0.8-0";



///var t0 = performance.now();
///console.log(performance.now() - t0);



// -- Networking variables and constants -- \\

//The domain part of the URL
const URLdomain = window.location.hostname;

//The port that the web server is contacted on
const URLport = window.location.port;

//A variable which is used to make sure that 2 XML HTTP requests aren't sent at the same time
var serverBusy = false;

//The URL used to contact the NodeJS server (If you are hosting this yourself, be sure to change the port to match)
const nodeJSURL = URLdomain+":"+"8002"+"/4DChess/";



// -- Global variable declaration -- \\

//Reference to the DOM element that contains all the other game elements
var gameContainer = document.getElementById("Game");

//Main array containing all Fields (normally only one)
var fields = [];

//An array of the simplified version of past moves
var pastMoves = [];
//How many past moves can be stored at once (so that the page doesn't use up all of the device's memory storing previous game states)
var pastMoveLimit = 10;

//Stores a reference to the currently selected piece
var selectedPiece;

//An array of all the elements that show where a piece can move (which also handle the click event which triggers a move)
var movementVisuals = [];



// -- Game constants -- \\

//The width of the coloured border around a chess board
const boardOffset = 6; //px

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

//Layouts of the piece colors (corresponds to "startingLayouts"), 0 = White, 1 = Black
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

///const startingTimelines = 1;

const boardWidth = startingLayouts[chosenLayout][0].length;
const boardHeight = startingLayouts[chosenLayout].length;



// -- Classes for common game objects -- \\

//The main "Field" that contains all the other objects (boards, timelines, etc)
class Field{
  //id = FieldID
  constructor(id){
    this.id = id;
    this.timelines = [];
    
    this.fullid = "F"+this.id;
    
    this.movementVisuals = [];
    
    //Store the total amount of moves, as well as the amount of moves for each player
    this.moveAmounts = [0,0,0];
    
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Field");
    this.container.innerHTML = "";
    gameContainer.appendChild(this.container);
    
    this.gridContainer = document.createElement("div");
    this.render();
    this.container.appendChild(this.gridContainer);
    
    this.pastMoveContainer = document.createElement("div");
    this.container.appendChild(this.pastMoveContainer);
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
    fields[cloneid].render();
  }
  
  //Change the ID of the field (currently unused)
  changeID(newid){
    if(this.id != newid){
      this.clone(newid);
      this.container.remove();
    }else{
      console.warn("Warning: Attempted to change the ID of Field "+this.id+" to its own ID");
    }
  }
  
  //Add a new timeline with a specified ID (tid) to the field
  addTimeline(tid){
    this.timelines[tid] = new Timeline(this,tid);
    
    this.timelines[tid].container.style.top = tid*(boardHeight+1)*32+16-boardOffset+"px";
    this.timelines[tid].container.style.left = 16-boardOffset+"px";
    
    return this.timelines[tid];
  }
  
  //Remove a timeline from the field (only used for changing the ID of a timeline)
  removeTimeline(tid){
    this.timelines[tid].container.remove();
    this.timelines[tid] = undefined;
  }
  
  //Search for and return the main (starting) timeline
  getMainTimeline(){
    for(var a = 0;a < this.timelines.length;a += 1){
      if(this.timelines[a].boards[0] != undefined){
        return this.timelines[a];
      }
    }
  }
  
  //Get a board from given coordinates
  getBoard(bid,tid){
    return this.timelines[tid].boards[bid];
  }
  
  //Get a piece from given coordinates
  getPiece(bid,tid,x,y){
    var pid = this.timelines[tid].boards[bid].pieceIDMap[x][y];
    if(pid == -1){
      return undefined;
    }else{
      return this.timelines[tid].boards[bid].pieces[pid];
    }
  }
  
  //Render the field grid
  render(){
    this.gridContainer.innerHTML = "";
    
    var fieldwidth = 0;
    for(var a = 0;a < this.timelines.length;a += 1){
      if(this.timelines[a] != undefined && this.timelines[a].boards.length > fieldwidth){
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
  
  //Add a 32x32px square indicationg a previous move
  addMovementVisual(tid,bid,x,y){
    this.movementVisuals[this.movementVisuals.length] = [tid,bid,x,y];
    var visual = document.createElement("div");
    visual.innerHTML = "";
    visual.classList.add("PastMoveVisual");
    visual.style.left = (boardWidth+1)*32*bid+x*32+16+"px";
    visual.style.top = (boardHeight+1)*32*tid+y*32+16+"px";
    this.pastMoveContainer.appendChild(visual);
  }
  
  //Increment this.moveAmounts[0] by 1 and do the same for the corresponding color
  incrementMoveAmounts(color){
    this.moveAmounts[0] += 1;
    this.moveAmounts[1+color] += 1;
  }
  
  //Refresh all the visuals by removing and re-adding the HTML elements
  refreshMovementVisuals(){
    //Clear all the existing movement visual elements
    this.pastMoveContainer.innerHTML = "";
    
    //Loop through the visuals stored in the variable "this.movementVisuals" and re-add an element for each of those
    for(var a = 0;a < this.movementVisuals.length;a += 1){
      var visual = document.createElement("div");
      visual.innerHTML = "";
      visual.classList.add("PastMoveVisual");
      visual.style.left = (boardWidth+1)*32*this.movementVisuals[a][1]+this.movementVisuals[a][2]*32+16+"px";
      visual.style.top = (boardHeight+1)*32*this.movementVisuals[a][0]+this.movementVisuals[a][3]*32+16+"px";
      this.pastMoveContainer.appendChild(visual);
    }
  }
  
  //Create a simplified version of the entire current field object (ready to be converted to JSON)
  simplify(){
    //Declare the simplified version of the field object
    var simplifiedObj = {
      //Using the Array.slice() function here stores a new version of the array instead of a reference to the original
      version: version,
      moveAmounts: this.moveAmounts.slice(),
      boardWidth: boardWidth,
      boardHeight: boardHeight,
      movementVisuals: this.movementVisuals.slice(),
      timelines: []
    };
    
    //Loop through all child timelines and get their simplified versions, then store them in the simplified parent object
    for(var a = 0;a < this.timelines.length;a += 1){
      simplifiedObj.timelines[a] = this.timelines[a].simplify();
    }
    
    return simplifiedObj;
  }
  
  //Re-initialise the current object (and all child objects) from a simplified version of itself (returns true on success)
  fromSimpleObject(obj){
    if(obj.version != version){
      console.warn("Version number of simple object does not match client");
    }
    
    //Remove and recreate the main container element
    this.container.remove();
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Field");
    this.container.innerHTML = "";
    gameContainer.appendChild(this.container);
    
    //Recreate the grid container element and at it to the main container
    this.gridContainer = document.createElement("div");
    this.render();
    this.container.appendChild(this.gridContainer);
    
    //Recreate the past move container
    this.pastMoveContainer = document.createElement("div");
    this.container.appendChild(this.pastMoveContainer);
    
    //Restore the total amount of moves made
    this.moveAmounts = obj.moveAmounts.slice();
    
    //Loop through the timelines of the simple object and re-initialise them in the same way (as this function)
    for(var t = 0;t < obj.timelines.length;t += 1){
      if(obj.timelines[t] != undefined){
        //Add a new timeline to the field
        var newTimeline = this.addTimeline(t);
        
        //Set the active attribute of the timeline
        newTimeline.active = obj.timelines[t].active;
        
        //Loop through the timelines stored in the simplified object
        for(var b = 0;b < obj.timelines[t].boards.length;b += 1){
          
          //Check if the board is null or undefined
          if(obj.timelines[t].boards[b] == undefined || obj.timelines[t].boards[b] == null){
            //Add a null board to the timeline
            newTimeline.addBoard(b,true);
          }else{
            //Create a new board and add it to the timeline
            var newBoard = newTimeline.addBoard(b);
            
            //Set the selectable attribute and the starting layout of the newly added board
            newBoard.setSelectable(obj.timelines[t].boards[b].selectable);
            newBoard.setStartingLayout(-1);
            
            //Loop through the pieces of the simplified board object
            for(var p = 0;p < obj.timelines[t].boards[b].pieces.length;p += 1){
              //Store the simplified piece object in a variable for easy access
              var simplePiece = obj.timelines[t].boards[b].pieces[p];
              
              if(simplePiece != undefined){
                //Create a new piece and add it to the board
                var newPiece = newBoard.addPiece(p,simplePiece.type,simplePiece.color,simplePiece.x,simplePiece.y);
                
                //Set the moveAmount attribute of the new piece
                newPiece.moveAmount = simplePiece.moveAmount;
                
                //Set the direction that the new piece should face
                newPiece.direction = simplePiece.direction;
              }
            }
          }
        }
      }
    }
    
    //Loop through the movement visuals of the simple object and add them
    for(var a = 0;a < obj.movementVisuals.length;a += 1){
      this.addMovementVisual(obj.movementVisuals[a][0],obj.movementVisuals[a][1],obj.movementVisuals[a][2],obj.movementVisuals[a][3]);
    }
    
    this.render();
    
    //Return true on success
    return true;
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
    
    var newTimeline = newparentfield.addTimeline(cloneid);
    for(var a = 0;a < this.boards.length;a += 1){
      if(this.boards[a] != undefined){
        this.boards[a].clone(newTimeline,a);
      }
    }
  }
  
  changeID(newid){
    if(this.id != newid){
      this.clone(this.parent,newid);
      this.parent.removeTimeline(this.id);
    }else{
      console.warn("Warning: Attempted to change the ID of Timeline "+this.id+" to its own ID");
    }
  }
  
  addBoard(bid, nullBoard = false){
    if(!nullBoard){
      this.boards[bid] = new Board(this,bid);
      
      this.boards[bid].container.style.left = bid*(boardWidth+1)*32+"px";
      this.boards[bid].container.style.top = 0+"px";
      
      //Rendering the arrow
      
      //Get the amount of blank spaces before the first visible board
      var nullBoards = 0;
      for(var a = 0;a < this.boards.length;a += 1){
        if(this.boards[a] == undefined){
          nullBoards += 1;
        }
      }
      
      ///if(nullBoards > 0 && this.boards.length-nullBoards == 1){
      ///  var arrowbranch = document.createElement("div");
      ///  arrowbranch.style.position = "absolute";
      ///  arrowbranch.style.zIndex = "11";
      ///  arrowbranch.style.left = boardHeight*16-32+boardOffset+"px";
      ///  ///arrowbranch.style.top = boardHeight*16-32+boardOffset+"px";
      ///  arrowbranch.style.top = (boardHeight*16+boardOffset+32)+"px";
      ///  arrowbranch.style.width = "64px";
      ///  arrowbranch.style.height = (boardHeight*16)+"px";
      ///  arrowbranch.style.backgroundColor = "#606060";
      ///  this.container.appendChild(arrowbranch);
      ///}
      
      this.arrowshaft.style.left = (nullBoards*(boardWidth+1)*32-10)+"px";
      this.arrowshaft.style.width = ((this.boards.length-nullBoards)*(boardWidth+1)*32+boardOffset+12)+"px"; //Add 2 pixels to make sure there's no visible seam between the line and the triangle
      ///this.arrowshaft.style.width = (this.boards.length*(boardWidth+1)*32+boardOffset+12)+"px";
      this.arrowtriangle.style.left = (this.boards.length*(boardWidth+1)*32+boardOffset)+"px";
    }else{
      this.boards[bid] = undefined;
    }
    return this.boards[bid];
  }
  
  //Render the timeline (only run once - when the timeline is created)
  render(){
    //Create the shaft of the arrow
    this.arrowshaft = document.createElement("div");
    this.arrowshaft.style.position = "absolute";
    this.arrowshaft.style.zIndex = "11";
    this.arrowshaft.style.left = "-10px";
    this.arrowshaft.style.top = boardHeight*16-32+boardOffset+"px";
    this.arrowshaft.style.width = "0px";
    this.arrowshaft.style.height = "64px";
    this.arrowshaft.style.backgroundColor = "#606060";
    this.container.appendChild(this.arrowshaft);
    
    //Create the end of the arrow
    this.arrowtriangle = document.createElement("div");
    this.arrowtriangle.style.position = "absolute";
    this.arrowtriangle.style.zIndex = "12";
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
  
  //Create a simplified version of the current timeline object
  simplify(){
    //Declare the simplified version of the timeline object
    var simplifiedObj = {
      active: this.active,
      boards: []
    };
    
    //Loop through all child boards and get their simplified versions
    for(var a = 0;a < this.boards.length;a += 1){
      if(this.boards[a] == undefined){
        simplifiedObj.boards[a] = null;
      }else{
        simplifiedObj.boards[a] = this.boards[a].simplify();
      }
    }
    return simplifiedObj;
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
    
    this.pieceTypeMap = [[]];
    this.pieceIDMap = [[]];
    this.turnColor = this.id % 2; // 0 = White, 1 = Black
    this.selectable = false;
    
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
      turnColorMask.style.zIndex = "99";
      turnColorMask.style.position = "absolute";
      turnColorMask.style.width = boardWidth*32+"px";
      turnColorMask.style.height = boardHeight*32+"px";
      this.container.appendChild(turnColorMask);
    }
  }
  
  //Safely clone the current object and all child objects
  clone(newparenttimeline,cloneid){
    if(newparenttimeline.boards[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing board");
      newparenttimeline.boards[cloneid].container.remove();
      newparenttimeline.boards[cloneid] = undefined;
    }
    
    var newBoard = newparenttimeline.addBoard(cloneid);
    newBoard.setSelectable(this.selectable);
    newBoard.setStartingLayout(-1);
    for(var a = 0;a < this.pieces.length;a += 1){
      if(this.pieces[a] != undefined){
        this.pieces[a].clone(newBoard,a);
      }
    }
  }
  
  //Duplicate the current board and extend the current timeline (or create a new one if needed) - triggered whenever a piece moves
  extendTimeline(){
    //Make the current (now old) instance of the board no longer selectable
    this.setSelectable(false);
    
    //Check if the board is at the end of the current timeline
    if(this.id == this.parent.boards.length-1){
      //Extend the current timeline
      this.clone(this.parent,this.id+1);
      
      //Scroll the end of the timeline into view
      this.parent.arrowtriangle.scrollIntoView();
      
      //Make the new instance of the board selectable
      this.parent.boards[this.id+1].setSelectable(true);
      
      //Return the new instance of the board
      return this.parent.boards[this.id+1];
    }else{
      //Create a new timeline if the board is in the past
      
      //Declare a variable to store the new timeline ID
      var newtid = this.parent.parent.timelines.length;
      
      var newTimeline = null;
      
      //Check the color of the board
      if(this.turnColor == playerColor && !(opponent == 1 && playerColor == 1)){
        //Add a new timeline to the end of the parent field
        newTimeline = this.parent.parent.addTimeline(newtid);
      }else{
        //Shift all the timelines down by one and add a new timeline to the start of the parent field
        for(var a = this.parent.parent.timelines.length-1;a >= 0;a -= 1){
          this.parent.parent.timelines[a].changeID(a+1);
        }
        newtid = 0;
        newTimeline = this.parent.parent.addTimeline(newtid);
        
        //Shift all the movement visuals of the parent field down by one timeline
        var mv = this.parent.parent.movementVisuals;
        for(var a = 0;a < mv.length;a += 1){
          mv[a][0] += 1;
        }
        this.parent.parent.refreshMovementVisuals();
      }
      
      //Declare all the empty slots of the new timeline as undefined
      for(var a = 0;a <= this.id;a += 1){
        newTimeline.boards[a] = undefined;
      }
      
      //Clone the current instance of the board to the new timeline
      this.clone(newTimeline,this.id+1);
      
      //Make the new instance of the board selectable
      newTimeline.boards[this.id+1].setSelectable(true);
      
      //Return the new instance of the targetted board
      return newTimeline.boards[this.id+1];
    }
    
    //Return undefined if (for some reason) nothing gets returned above
    return undefined;
  }
  
  //Loop through all the child pieces and set all of their selectable attributes to true or false
  setSelectable(s){
    this.selectable = s;
    for(var a = 0;a < this.pieces.length;a += 1){
      if(this.pieces[a] != undefined){
        this.pieces[a].setSelectable(s);
      }
    }
  }
  
  //Add a new piece to the board
  addPiece(pid,type,color,x,y){
    if(x < 0 || y < 0 || x >= boardWidth || y >= boardHeight){
      console.error("Attempted to add piece outside of board boundaries");
      return undefined;
    }
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
    
    if(y > boardHeight/2){
      this.pieces[pid].direction = 0;
    }else{
      this.pieces[pid].direction = 1;
    }
    
    return this.pieces[pid];
  }
  
  //Remove the piece's container and update the array of pieces accordingly
  removePiece(pid){
    this.pieces[pid].container.remove();
    this.pieces[pid] = undefined;
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
      //The Y coords need to be flipped for online multiplayer
      if(opponent == 1){
        //Loop through the grid of the board and add the pieces according to the starting layout
        for(var a = 0;a < boardHeight;a += 1){
          this.pieceTypeMap[a] = [];
          this.pieceIDMap[a] = [];
          for(var b = 0;b < boardWidth;b += 1){
            this.pieceTypeMap[a][b] = 0;
            this.pieceIDMap[a][b] = -1;
            if(startingLayouts[chosenLayout][a][b] > 0){
              //Add each piece to the board, using the pieceLayouts[] and colorLayouts[] arrays to specify the type & color
              this.addPiece(this.pieces.length,startingLayouts[chosenLayout][a][b],colorLayouts[chosenLayout][a][b],b,a);
            }
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
              //Add each piece to the board, using the pieceLayouts[] and colorLayouts[] arrays to specify the type & color
              this.addPiece(this.pieces.length,startingLayouts[chosenLayout][a][b],(colorLayouts[chosenLayout][a][b]+playerColor)%2,b,a);
              //When playing a local game, the color of the pieces depends on the playerColor variable
            }
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
    this.container.style.backgroundColor = (this.turnColor == 0)?"#e0e0e0":"#101010";
    
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
  
  //Create a simplified version of the current board object
  simplify(){
    //Declare the simplified version of the board object
    var simplifiedObj = {
      turnColor: this.turnColor,
      selectable: this.selectable,
      pieces: []
    };
    
    //Loop through all child pieces and get their simplified versions
    for(var a = 0;a < this.pieces.length;a += 1){
      if(this.pieces[a] != undefined){
        simplifiedObj.pieces[a] = this.pieces[a].simplify();
      }
    }
    return simplifiedObj;
  }
}

//A single piece, normally contained by a Board object
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
    this.moveAmount = 0;
    this.direction = -1; // -1 = Not set (currently only used for the pawn)
    
    this.selected = false;
    
    this.container = document.createElement("div");
    this.container.id = this.fullid;
    this.container.classList.add("Piece");
    this.container.innerHTML = "[P]";
    this.parent.container.appendChild(this.container);
    
    this.setSelectable(this.parent.selectable);
    
    this.render();
  }
  
  //Safely clone the current piece
  clone(newparentboard, cloneid){
    if(newparentboard.pieces[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing piece");
      newparentboard.pieces[cloneid].container.remove();
      newparentboard.pieces[cloneid] = undefined;
    }
    
    var newPiece = newparentboard.addPiece(cloneid,this.type,this.color,this.getX(),this.getY());
    newPiece.moveAmount = this.moveAmount;
    newPiece.direction = this.direction;
  }
  
  setSelectable(s){
    if(s){
      //Check if the piece should be made selectable, depending on the piece color, the player color and the opponent
      if(this.color === this.parent.turnColor && (this.color === playerColor && opponent != 0 || opponent == 0)){
        var self = this;
        this.container.onclick = function(){
          selectPiece(self);
        };
        //All this does is change the cursor if it hovers over the piece
        this.container.classList.add("SelectablePiece");
      }
    }else{
      this.container.onclick = function(){};
      this.container.classList.remove("SelectablePiece");
    }
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
  
  //Create a simplified version of the current piece object
  simplify(){
    //Declare the simplified version of the piece object
    var simplifiedObj = {
      type: this.type,
      color: this.color,
      moveAmount: this.moveAmount,
      direction: this.direction,
      x: this.getX(),
      y: this.getY(),
      selectable: this.selectable
    };
    return simplifiedObj;
  }
}



// -- Functions for the game -- \\

//Deselect the previous piece and select the new piece
function selectPiece(piece){
  if(selectedPiece != undefined){
    selectedPiece.deselect();
  }
  if(piece.parent.id < piece.parent.parent.boards.length-1){
    console.warn("Huh, that's strange. Is this code modified in any way? If not, you should contact the site admin tell them how to reproduce this warning, because it should never happen.");
    alert("Is this code modified in any way?\nIf not, you should contact the site admin tell them how to reproduce this alert, because it should never happen.\nUntil this is fixed, you probably shouldn't exploit it.");
  }
  piece.select();
  selectedPiece = piece;
  
  addMoveVisuals(piece,getAvailableMoves(piece));
}

//Deselect the previous piece and select the new piece
function globalDeselect(){
  if(selectedPiece != undefined){
    selectedPiece.deselect();
  }
  selectedPiece = undefined;
  
  for(var a = 0;a < movementVisuals.length;a += 1){
    if(movementVisuals[a] != undefined){
      movementVisuals[a].remove();
      movementVisuals[a] = undefined;
    }
  }
}

//Move a specified piece to a new location
function movePiece(piece,x,y,board = undefined){
  if(board == undefined){
    board = piece.parent;
  }
  
  //Increment the total amount of moves in the field
  piece.parent.parent.parent.incrementMoveAmounts(piece.color);
  
  if(piece.parent == board){
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
    
    //If the piece is a pawn and it has moved to the end of the board, change it into a queen
    if(piece.type == 7 && ((piece.getY() == boardHeight-1 && piece.color !== playerColor) || (piece.getY() == 0 && piece.color === playerColor))){
      /// In the future, this should give the player a choice of any normal piece type, instead of automatically choosing the queen
      piece.type = 3;
      piece.parent.pieceTypeMap[piece.getX()][piece.getY()] = 3;
      piece.render();
    }
  }else{
    var newpid = board.pieces.length;
    
    //Add the piece to its new board
    var newPiece = board.addPiece(newpid,piece.type,piece.color,x,y);
    newPiece.moveAmount = piece.moveAmount+1;
    
    //Update the piece maps
    piece.parent.pieceTypeMap[piece.getY()][piece.getX()] = 0;
    piece.parent.pieceIDMap[piece.getY()][piece.getX()] = -1;
    board.pieceTypeMap[y][x] = piece.type;
    board.pieceIDMap[y][x] = newpid;
    
    //Remove the previous instance of the piece (using the parent board's removePiece() function)
    piece.parent.removePiece(piece.id);
  }
  
  piece.parent.parent.parent.render();
}

//Loop through an array of moves generated from the getAvailableMoves() function and create a "movement visual" element for each possibility
function addMoveVisuals(piece,moves){
  //Reset the movement visuals
  for(var a = 0;a < movementVisuals.length;a += 1){
    if(movementVisuals[a] != undefined){
      movementVisuals[a].remove();
      movementVisuals[a] = undefined;
    }
  }
  movementVisuals = [];
  
  if(moves.length < 1){
    return;
  }
  
  ///Having these 2 functions is a total mess, and will need to be fixed
  
  function addMoveVisual(v,x,y,isblocked,board = undefined,customFunc = undefined){
    //Create the visual element, position it and add it to the parent board
    movementVisuals[v] = document.createElement("div");
    movementVisuals[v].classList.add(isblocked ? "MovementVisualBlocked" : "MovementVisualAvailable");
    movementVisuals[v].id = "MV"+v+"_"+piece.fullid;
    movementVisuals[v].style.left = x*32+boardOffset+"px";
    movementVisuals[v].style.top = y*32+boardOffset+"px";
    //Check which board to add the visual to
    if(board == undefined){
      piece.parent.container.appendChild(movementVisuals[v]);
      //Set the baord variable to the piece's parent to simplify things later on
      board = piece.parent;
    }else{
      board.container.appendChild(movementVisuals[v]);
    }
    
    //Check if the move is available
    if(!isblocked){
      movementVisuals[v].addEventListener("click", function(){
        //Deselect the piece before doing anything
        globalDeselect();
        
        //Store the current game state as the previous move
        storePastMove();
        
        //Add the movement visuals
        piece.parent.parent.parent.addMovementVisual(piece.tid,piece.bid,piece.getX(),piece.getY());
        board.parent.parent.addMovementVisual(board.tid,board.id,x,y);
        
        if(piece.parent == board){
          //Create a new board when a piece is moved
          var newboard = piece.parent.extendTimeline();
          
          //Confirm that the new board was successfully created
          if(newboard != undefined){
            //Move the piece (The one on the new instance of the board, not the original)
            movePiece(newboard.pieces[piece.id],x,y);
          }else{
            throwError("An error occurred when trying to extend the timeline, please contact the system admin");
          }
        }else{
          //The extra related to this variable is there to re-point "newboard1" to the new instance of its board if the timeline branches (and the other timelines are shifted down)
          var branched = (board.id < board.parent.boards.length-1);
          
          //Create a new board and branch the timeline when a piece time travels
          var newboard1 = piece.parent.extendTimeline();
          var newboard2 = board.extendTimeline();
          
          //Check if the timeline branched off
          if(branched){
            //Check if the branched timeline was created above the rest
            if(board.turnColor != playerColor || (opponent == 1 && board.turnColor == 1)){
              //Re-point "newboard1" to its new instance
              newboard1 = newboard1.parent.parent.timelines[newboard1.tid+1].boards[newboard1.id];
            }
          }
          
          //Confirm that the new boards were successfully created
          if(newboard1 != undefined && newboard2 != undefined){
            //Move the new instance of the piece to the new timeline
            movePiece(newboard1.pieces[piece.id],x,y,newboard2);
          }else{
            throwError("An error occurred when trying to extend the timeline(s), please contact the system admin");
          }
        }
        
        console.log("Moved piece");
      });
    }
    
    //If the "customFunc" variable is a function, add it to a second click event attached to the movement visual
    if(typeof(customFunc) == "function"){
      movementVisuals[v].addEventListener("click",customFunc);
    }
    
    //If the game is online multiplayer, send the move to the server
    if(opponent == 1){
      movementVisuals[v].addEventListener("click",requestMoves);
    }
  }
  
  //Add a capture visual and create the click event listener
  function addCaptureVisual(v,piece1,piece2){
    //Create the visual element, position it and add it to the parent board
    movementVisuals[v] = document.createElement("div");
    movementVisuals[v].classList.add("CaptureVisual");
    movementVisuals[v].id = "MV"+v+"_"+piece.fullid;
    movementVisuals[v].style.left = piece2.getX()*32+boardOffset+"px";
    movementVisuals[v].style.top = piece2.getY()*32+boardOffset+"px";
    piece2.parent.container.appendChild(movementVisuals[v]);
    
    //Add the capturing code to the click event of the visual
    movementVisuals[v].addEventListener("click", function(){
      //To note: The "piece1" and "piece2" variables are declared in the code where this function is defined. See getAvailableMoves() > addCaptureVisual()
      
      //Deselect the piece before doing anything
      globalDeselect();
      
      //Store the current game state as the previous move
      storePastMove();
      
      //Add the movement visuals
      piece1.parent.parent.parent.addMovementVisual(piece1.tid,piece1.bid,piece1.getX(),piece1.getY());
      piece2.parent.parent.parent.addMovementVisual(piece2.tid,piece2.bid,piece2.getX(),piece2.getY());
      
      //Check if the captured piece is a king (If it is, the player controlling piece1 wins the game)
      if(piece2.type == 2){
        win(piece1.color);
      }
      
      //Check if the captured piece is on a different board
      if(piece1.parent == piece2.parent){
        //Extend the current timeline
        var newboard = piece1.parent.extendTimeline();
        
        //Make sure the new board was created properly
        if(newboard == undefined){
          throwError("Failed to extend timeline while capturing piece");
        }
        
        //Update the piece maps
        piece2.parent.pieceTypeMap[piece2.getY()][piece2.getX()] = 0;
        piece2.parent.pieceIDMap[piece2.getY()][piece2.getX()] = -1;
        
        //Remove the captured piece
        piece2.parent.parent.boards[piece2.parent.parent.boards.length-1].pieces[piece2.id].parent.removePiece(piece2.id);
        
        //Move the capturing piece to its new position
        movePiece(newboard.pieces[piece1.id],piece2.getX(),piece2.getY());
      }else{
        var branched = (piece2.parent.id < piece2.parent.parent.boards.length-1);
        
        //Extend both timelines
        var newboard1 = piece1.parent.extendTimeline();
        var newboard2 = piece2.parent.extendTimeline();
        
        //Check if the timeline branched off
        if(branched){
          //Check if the branched timeline was created above the rest
          if(piece2.parent.turnColor != playerColor || (opponent == 1 && piece2.parent.turnColor == 1)){
            //Re-point "newboard1" to its new instance
            newboard1 = newboard1.parent.parent.timelines[newboard1.tid+1].boards[newboard1.id];
          }
        }
        
        //Make sure the new boards were created properly
        if(newboard1 == undefined || newboard2 == undefined){
          throwError("Failed to extend timeline(s) while capturing piece through time");
        }
        
        //Update the piece maps
        newboard2.pieceTypeMap[piece2.getY()][piece2.getX()] = 0;
        newboard2.pieceIDMap[piece2.getY()][piece2.getX()] = -1;
        
        //Remove the captured piece
        newboard2.removePiece(piece2.id);
        
        //Move the capturing piece to its new position
        movePiece(newboard1.pieces[piece1.id],piece2.getX(),piece2.getY(),newboard2);
      }
    });
    
    //If the game is online multiplayer, send the move to the server
    if(opponent == 1){
      movementVisuals[v].addEventListener("click",requestMoves);
    }
  }
  
  for(var a = 0;a < moves.length;a += 1){
    if(moves[a][3] == 2){
      addCaptureVisual(movementVisuals.length,piece,moves[a][4]);
    }else{
      addMoveVisual(movementVisuals.length,moves[a][1],moves[a][2],(moves[a][3] == 0),moves[a][0],moves[a][5]);
    }
  }
}

//Calculate all possible locations that any given piece can move to
function getAvailableMoves(piece,typeOverride = undefined){
  //Get the type from the piece, or use the supplied one
  var type = (typeOverride == undefined ? piece.type : typeOverride);
  
  //[ (0 = Board), (1 = X), (2 = Y), (3 = Type), (4 = Target - optional - only for captures), (5 = Custom function - used for castling, etc.) ]
  var movementVisualCoords = [];
  
  var px = piece.getX();
  var py = piece.getY();
  
  var field = piece.parent.parent.parent;
  
  //Add a set of coordinates (and type) for a movement visual (as well as a target if it's a capture)
  function addMoveVisual(board,x,y,type = undefined,target = undefined,customFunc = undefined){
    //board, x, y, type (0 = blocked, 1 = move, 2 = capture), target (target piece, only if capture), custom movement function
    
    //If the type passed in is undefined, it will be detected automatically from the coordinates
    if(type == undefined || (type == 2 && target == undefined)){
      if(board.pieceTypeMap[y][x] == 0){
        //Indicate that the move is blocked
        movementVisualCoords.push([board,x,y,1,undefined,customFunc]);
      }else{
        if(board.pieces[ board.pieceIDMap[y][x] ].color != piece.color){
          //Create a "capture" movement visual
          movementVisualCoords.push([board,x,y,2,board.pieces[ board.pieceIDMap[y][x] ],customFunc]);
        }else{
          //Create a normal movement visual
          movementVisualCoords.push([board,x,y,0,undefined,customFunc]);
        }
      }
    }else{
      //If the type indicates a capture but there is no target piece given, just make a "blocked" visual
      if(type == 2 && target == undefined){
        //Create a "blocked" movement visual
        movementVisualCoords.push([board,x,y,0,undefined,customFunc]);
      }else{
        //Create a normal capture visual
        movementVisualCoords.push([board,x,y,type,target,customFunc]);
      }
    }
  }
  
  //Checks for the existence of a board and timeline (the ID of each is found by the given board & timeline "offset")
  function checkForRelativeBoard(bOffset,tOffset,startingBoard = piece.parent){
    //Yes, I am quite aware that I can combine these into one if clause, but there's no point, and this is far more readable
    if(startingBoard.id+bOffset >= 0){
      if(startingBoard.parent.id+tOffset >= 0){
        if(startingBoard.parent.id+tOffset < startingBoard.parent.parent.timelines.length){
          if(startingBoard.id+bOffset < startingBoard.parent.parent.timelines[ startingBoard.parent.id+tOffset ].boards.length){
            if(startingBoard.parent.parent.timelines[ startingBoard.parent.id+tOffset ].boards[ startingBoard.id+bOffset ] != undefined){
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  
  //A recursive function to check for all moves in a given direction (4D vector)
  function checkMovesRecursively(board,directions,_x,_y){
    //directions = [x,y,b,t];
    
    if(_x >= 0 && _x < boardWidth && _y >= 0 && _y < boardHeight){
      
      //Add the movement visual depending on if the space is blocked or not
      if(board.pieceTypeMap[_y][_x] == 0){
        
        //Add a movement visual (type 1 = available)
        addMoveVisual(board,_x,_y,1);
        
        //Execute the function recursively in the same direction for the next board in line
        if(checkForRelativeBoard(directions[2]*2,directions[3],board)){
          var nextboard = board.parent.parent.timelines[board.tid+directions[3]].boards[board.id+directions[2]*2];
          
          checkMovesRecursively(nextboard,directions,_x+directions[0],_y+directions[1]);
        }
      }else{
        //Add a movement visual and let the function decide what type it should be
        addMoveVisual(board,_x,_y);
      }
    }
  }
  
  //Check for the type of piece, and add movement visuals depending on how the piece moves
  switch(type){
    case 1:
      //The Master piece can move anywhere on any board (It's used for debugging purposes, but could also be used as a custom piece, as long as the players manually keep track of where it can move)
      
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
                  //Let the function detect which type of visual should be used (available move, blocked move, or capture)
                  addMoveVisual(board,x,y);
                }
              }
            }
          }
        }
      }
      
      break;
    case 2:
      //The King can move in any one direction by one space (diagonals function the same way as the bishop, see below)
      
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
          addMoveVisual(piece.parent,px+spaces[a][0],py+spaces[a][1]);
        }
        
        //Do the same thing, but this time check the relative boards for available moves through time
        
        //Check if the target board exists
        if(checkForRelativeBoard(spaces[a][0]*2,spaces[a][1])){
          
          var board = piece.parent.parent.parent.timelines[ piece.parent.parent.id+spaces[a][1] ].boards[ piece.parent.id+spaces[a][0]*2 ];
          
          addMoveVisual(board,px,py);
          
          //From each board, loop through the available same-board moves again
          for(var b = 0;b < spaces.length;b += 1){
            if(px+spaces[b][0] >= 0 && py+spaces[b][1] >= 0 && px+spaces[b][0] < boardWidth && py+spaces[b][1] < boardHeight){
              addMoveVisual(board,px+spaces[b][0],py+spaces[b][1]);
            }
          }
        }
      }
      
      //Castling
      if(piece.moveAmount == 0){
        switch(chosenLayout){
          case 0:
            //Default (8x8) board
            
            //Check if the left rook is available to perform a castle
            if(piece.parent.pieceTypeMap[py][px-4] == 6){
              if(piece.parent.pieces[ piece.parent.pieceIDMap[py][px-4] ].moveAmount == 0){
                //Check if the space in between is available
                if(piece.parent.pieceTypeMap[py][px-1] == 0 && piece.parent.pieceTypeMap[py][px-2] == 0 && piece.parent.pieceTypeMap[py][px-3] == 0){
                  //Store the parent timeline and the ID of the new board outside of the function
                  var parentTimeline = piece.parent.parent;
                  var newBoardId = parentTimeline.boards.length;
                  
                  //Add a movement visual with an extra custom function
                  addMoveVisual(piece.parent,px-3,py,1,undefined,function(){
                    //Store the new board and the targetted rook objects
                    var newBoard = parentTimeline.boards[newBoardId];
                    var targetRook = newBoard.pieces[ piece.parent.pieceIDMap[py][px-4] ];
                    
                    //Update the piece maps
                    newBoard.pieceTypeMap[py][px-4] = 0;
                    newBoard.pieceIDMap[py][px-4] = -1;
                    newBoard.pieceTypeMap[py][px-1] = targetRook.type;
                    newBoard.pieceIDMap[py][px-1] = targetRook.id;
                    
                    //Move the piece to its new position
                    targetRook.setX(px-1);
                    
                    //Increment the amount of moves a piece has made
                    targetRook.moveAmount += 1;
                  });
                }else{
                  addMoveVisual(piece.parent,px-3,py,0);
                }
              }
            }
            
            //Check if the right rook is available to perform a castle
            if(piece.parent.pieceTypeMap[py][px+3] == 6){
              if(piece.parent.pieces[ piece.parent.pieceIDMap[py][px+3] ].moveAmount == 0){
                //Check if the space in between is available
                if(piece.parent.pieceTypeMap[py][px+1] == 0 && piece.parent.pieceTypeMap[py][px+2] == 0){
                  //Store the parent timeline and the ID of the new board outside of the function
                  var parentTimeline = piece.parent.parent;
                  var newBoardId = parentTimeline.boards.length;
                  
                  //Add a movement visual with an extra custom function
                  addMoveVisual(piece.parent,px+2,py,1,undefined,function(){
                    conaole.log("Castled");
                    
                    //Store the new board and the targetted rook objects
                    var newBoard = parentTimeline.boards[newBoardId];
                    var targetRook = newBoard.pieces[ piece.parent.pieceIDMap[py][px+3] ];
                    
                    //Update the piece maps
                    newBoard.pieceTypeMap[py][px+3] = 0;
                    newBoard.pieceIDMap[py][px+3] = -1;
                    newBoard.pieceTypeMap[py][px+1] = targetRook.type;
                    newBoard.pieceIDMap[py][px+1] = targetRook.id;
                    
                    //Move the piece to its new position
                    targetRook.setX(px+1);
                    
                    //Increment the amount of moves a piece has made
                    targetRook.moveAmount += 1;
                  });
                }else{
                  addMoveVisual(piece.parent,px+2,py,0);
                }
              }
            }
            break;
          case 1:
            ///Yet to implement
            break;
          case 2:
            ///Yet to implement
            break;
          case 3:
            ///Yet to implement
            break;
          default:
            console.warn("Warning: Invalid layout to check for castling");
        }
      }
      
      break;
    case 3:
      //The Queen can move in any one direction by an unlimited amount of spaces
      
      //This code is pretty much a combination of the bishop & rook movement code, see 'case 4' and 'case 6'
      
      //Loop through the 4 main directions, executing both the bishop and the rook code (for local board moves)
      for(var dir = 0;dir < 4;dir += 1){
        //Bishop code:
        
        var blocked = 0;
        
        //Loop through all diagonal tiles and check if there is line-of-sight to that position
        for(var a = 1;(dir%2 == 1 && a <= px || dir%2 == 0 && a < boardWidth-px) && (dir < 2 && a < boardHeight-py || dir >= 2 && a <= py);a += 1){
          //Store the coordinates of the tile that is currently being checked
          var _x = (dir%2 == 0)?(px+a):(px-a);
          var _y = (dir   <  2)?(py+a):(py-a);
          
          if(_x >= 0 && _y >= 0 && _x < boardWidth && _y < boardHeight){
            if(piece.parent.pieceTypeMap[_y][_x] != 0){
              blocked += 1;
            }
            //Create a different movement visual depending on the value of "blocked"
            switch(blocked){
              case 0:
                addMoveVisual(piece.parent,_x,_y,1);
                break;
              case 1:
                addMoveVisual(piece.parent,_x,_y);
                blocked += 1;
                break;
              default:
                addMoveVisual(piece.parent,_x,_y,0);
            }
          }
        }
        
        //Rook code:
        
        blocked = 0;
        
        //Loop through all orthogonal tiles and check if there is line-of-sight to that position
        for(var a = (dir < 2 ? px+1-(dir%2)*2 : py+1-(dir%2)*2);(a >= 0 && (dir < 2 && a < boardWidth || dir >= 2 && a < boardHeight));a += (dir%2 == 0?1:-1)){
          //Store the coordinates of the tile that is currently being checked
          var _x = (dir < 2)?(a):(px);
          var _y = (dir < 2)?(py):(a);
          
          //If the position is blocked, increment the "blocked" variable by one
          if(piece.parent.pieceTypeMap[_y][_x] != 0){
            blocked += 1;
          }
          //Create a different movement visual depending on the value of "blocked"
          switch(blocked){
            case 0:
              addMoveVisual(piece.parent,_x,_y,1);
              break;
            case 1:
              addMoveVisual(piece.parent,_x,_y);
              blocked += 1;
              break;
            default:
              addMoveVisual(piece.parent,_x,_y,0);
          }
        }
      }
      
      //Time travel directions (x,y,b,t)
      var directs = [
        //Same tile (X & Y), different board:
        
        //Orthogonal:
        [0,0,0,-1],
        [0,0,0,1],
        [0,0,-1,0],
        [0,0,1,0],
        
        //Diagonal:
        [0,0,-1,-1],
        [0,0,1,-1],
        [0,0,-1,1],
        [0,0,1,1]
      ];
      
      //Calculate the rest of the queen's time-travel moves (find the old code for this in "Alternate Code/Old Movement Code/")
      for(var a = 0;a < 4;a += 1){
        for(var b = 0;b < 4;b += 1){
          for(var c = 0;c < 4;c += 1){
            directs.push([
              ( a%2 == 0 ? (b < 2 ? 0 : (1-(b%2)*2)) : (b%2 == 0 ? -1 : 1) ),
              ( a%2 == 0 ? (b < 2 ? (1-(b%2)*2) : 0) : (b < 2 ? -1 : 1) ),
              ( a < 2 ? (c < 2 ? 0 : (1-(c%2)*2)) : (c%2 == 0 ? -1 : 1) ),
              ( a < 2 ? (c < 2 ? (1-(c%2)*2) : 0) : (c < 2 ? -1 : 1) )
            ]);
          }
        }
      }
      
      //Loop through all the directions and start the checkMovesRecursively() function in each direction
      for(var a = 0;a < directs.length;a += 1){
        //Execute the function recursively in the same direction for the next board in line
        if(checkForRelativeBoard(directs[a][2]*2,directs[a][3],piece.parent)){
          var nextboard = piece.parent.parent.parent.timelines[piece.parent.tid+directs[a][3]].boards[piece.parent.id+directs[a][2]*2];
          
          checkMovesRecursively(nextboard,directs[a],px+directs[a][0],py+directs[a][1]);
        }
      }
      
      break;
    case 4:
      //The Bishop moves up/down one square and sideways one square (making a diagonal move) by an unlimited amount of spaces
      
      //I have an expanded version of the loop below on GitHub (in 'Alternate Code/Bishop.js')
      
      //Loop through the 4 diagonal directions (0 = Down-Left/South-East, 2 = Down-Right/South-West, 3 = Up-Left/North-East, 4 = Up-Right/North-West)
      for(var dir = 0;dir < 4;dir += 1){
        var blocked = 0;
        
        //Loop through all diagonal tiles and check if there is line-of-sight to that position
        for(var a = 1;(dir%2 == 1 && a <= px || dir%2 == 0 && a < boardWidth-px) && (dir < 2 && a < boardHeight-py || dir >= 2 && a <= py);a += 1){
          //Store the coordinates of the tile that is currently being checked
          var _x = (dir%2 == 0)?(px+a):(px-a);
          var _y = (dir   <  2)?(py+a):(py-a);
          
          if(_x >= 0 && _y >= 0 && _x < boardWidth && _y < boardHeight){
            if(piece.parent.pieceTypeMap[_y][_x] != 0){
              blocked += 1;
            }
            //Create a different movement visual depending on the value of "blocked"
            switch(blocked){
              case 0:
                addMoveVisual(piece.parent,_x,_y,1);
                break;
              case 1:
                addMoveVisual(piece.parent,_x,_y);
                blocked += 1;
                break;
              default:
                addMoveVisual(piece.parent,_x,_y,0);
            }
          }
        }
      }
      
      var directs = [
        //Diagonal boards
        [0,0,-1,-1],
        [0,0,1,-1],
        [0,0,-1,1],
        [0,0,1,1],
        
        //Orthogonal boards are calculated using the loop below
      ];
      
      //Store all the possible cross-board moves in the "directs" array
      for(var a = 0;a < 4;a += 1){
        for(var b = 0;b < 4;b += 1){
          //2 different ways of achieving the same thing (leaving both here for future reference)
          
          directs.push([ (a < 2 ? 0 : (1-(a%2)*2)) , (a < 2 ? (1-(a%2)*2) : 0) , (b < 2 ? 0 : (1-(b%2)*2)) , (b < 2 ? (1-(b%2)*2) : 0) ]);
          
          //directs.push([ (Math.floor(a/2)%2) * (1-(a%2)*2) , (Math.floor(a/2+1)%2) * (1-(a%2)*2) , (Math.floor(b/2)%2) * (1-(b%2)*2) , (Math.floor(b/2+1)%2) * (1-(b%2)*2) ]);
        }
      }
      
      //Loop through all the directions and execute the recursive move-checking function for each
      for(var a = 0;a < directs.length;a += 1){
        //Execute the function recursively in the same direction for the next board in line
        if(checkForRelativeBoard(directs[a][2]*2,directs[a][3],piece.parent)){
          var nextboard = piece.parent.parent.parent.timelines[piece.parent.tid+directs[a][3]].boards[piece.parent.id+directs[a][2]*2];
          
          checkMovesRecursively(nextboard,directs[a],px+directs[a][0],py+directs[a][1]);
        }
      }
      
      break;
    case 5:
      //The Knight moves orthogonally by 2 spaces then again by 1 space (perpinticular to its original direction), jumping over pieces that are in the way
      
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
      
      //Loop through the array of possible moves and check if each is available (same code as king)
      for(var a = 0;a < spaces.length;a += 1){
        if(px+spaces[a][0] >= 0 && py+spaces[a][1] >= 0 && px+spaces[a][0] < boardWidth && py+spaces[a][1] < boardHeight){
          addMoveVisual(piece.parent,px+spaces[a][0],py+spaces[a][1]);
        }
      }
      
      //Use a recursive function to calculate the time-travel moves of the knight
      function checkKnightMoves(board,iteration,direction){
        //Loop through the 4 orthogonal directions (0 = Left/East, 2 = Right/West, 3 = Down/South, 4 = Up/North)
        for(var dir = 0;dir < 4;dir += 1){
          //Check which iteration the function is up to
          switch(iteration){
            case 0:
              //Calculate the coordinates of the movement visual
              var _x = px+((dir < 2)?2-(dir%2)*4:0);
              var _y = py+((dir < 2)?0:2-(dir%2)*4);
              
              //Check that the visual is within the bounds of the board
              if(_x >= 0 && _y >= 0 && _x < boardWidth && _y < boardHeight){
                addMoveVisual(board,_x,_y);
              }
              
              //Execute the function for the next board in line
              if(dir == direction){
                //Check if the target board exists
                if(checkForRelativeBoard((dir < 2)?2-(dir%2)*4:0,(dir < 2)?0:1-(dir%2)*2,board)){
                  var nextboard = board.parent.parent.timelines[ board.parent.id+((dir < 2)?0:1-(dir%2)*2) ].boards[ board.id+((dir < 2)?2-(dir%2)*4:0) ];
                  
                  checkKnightMoves(nextboard,iteration+1,dir);
                }
              }
              
              break;
            case 1:
              //Calculate the coordinates of the movement visual
              var _x = px+((dir < 2)?1-(dir%2)*2:0);
              var _y = py+((dir < 2)?0:1-(dir%2)*2);
              
              //Check that the visual is within the bounds of the board
              if(_x >= 0 && _y >= 0 && _x < boardWidth && _y < boardHeight){
                addMoveVisual(board,_x,_y);
              }
              break;
            default:
              console.warn("Warning: Reached an invalid amount of iterations while attempting to calcuate knight time-travel moves");
          }
        }
      }
      
      //Loop through the 4 orthogonal directions (0 = Left/East, 2 = Right/West, 3 = Down/South, 4 = Up/North)
      for(var dir = 0;dir < 4;dir += 1){
        //Check that the target board exists
        if(checkForRelativeBoard((dir < 2)?2-(dir%2)*4:0,(dir < 2)?0:1-(dir%2)*2)){
          var board = piece.parent.parent.parent.timelines[ piece.parent.parent.id+((dir < 2)?0:1-(dir%2)*2) ].boards[ piece.parent.id+((dir < 2)?2-(dir%2)*4:0) ];
          //Call the function for each direction
          checkKnightMoves(board,0,dir);
        }
      }
      
      //Loop through the array of possible moves, but this time check the relative boards for available moves through time
      for(var a = 0;a < spaces.length;a += 1){
        //Check if the target board exists
        if(checkForRelativeBoard(spaces[a][0]*2,spaces[a][1])){
          var board = piece.parent.parent.parent.timelines[ piece.parent.parent.id+spaces[a][1] ].boards[ piece.parent.id+spaces[a][0]*2 ];
          addMoveVisual(board,px,py);
        }
      }
      
      break;
    case 6:
      //The Rook can move orthogonally in any one direction by an unlimited amount of spaces
      
      //The code below practically unreadable. I wouldn't blame you for not understanding it, so I have an expanded version of the below loop on GitHub (in 'Alternate Code/Rook.js')
      
      //Loop through the 4 orthogonal directions (0 = Left/East, 2 = Right/West, 3 = Down/South, 4 = Up/North)
      for(var dir = 0;dir < 4;dir += 1){
        var blocked = 0;
        //Loop through all orthogonal tiles and check if there is line-of-sight to that position
        for(var a = (dir < 2 ? px+1-(dir%2)*2 : py+1-(dir%2)*2);(a >= 0 && (dir < 2 && a < boardWidth || dir >= 2 && a < boardHeight));a += (dir%2 == 0?1:-1)){
          //Store the coordinates of the tile that is currently being checked
          var _x = (dir < 2)?(a):(px);
          var _y = (dir < 2)?(py):(a);
          
          //If the position is blocked, increment the "blocked" variable by one
          if(piece.parent.pieceTypeMap[_y][_x] != 0){
            blocked += 1;
          }
          //Create a different movement visual depending on the value of "blocked"
          switch(blocked){
            case 0:
              addMoveVisual(piece.parent,_x,_y,1);
              break;
            case 1:
              addMoveVisual(piece.parent,_x,_y);
              blocked += 1;
              break;
            default:
              addMoveVisual(piece.parent,_x,_y,0);
          }
        }
        
        //Calculate the board & timeline offset according to the direction
        var direction = [0,0,(dir < 2 ? 1-(dir%2)*2 : 0),(dir < 2 ? 0 : 1-(dir%2)*2)];
        
        //Execute the recursive moves function in the set direction for the next board in line
        if(checkForRelativeBoard(direction[2]*2,direction[3],piece.parent)){
          var nextboard = piece.parent.parent.parent.timelines[piece.parent.tid+direction[3]].boards[piece.parent.id+direction[2]*2];
          
          checkMovesRecursively(nextboard,direction,px+direction[0],py+direction[1]);
        }
      }
      
      break;
    case 7:
      //Pawns can move forward by one (or forward by 2 if it's their first move). They can take forward-diagonally.
      
      ///For future En Passant: check the previous board in the timeline (only if there is one) and if the target pawn has moved once, and if fits the conditions, add a movement visual to the array with a different coordinate than the target piece
      
      //The movement direction of the pawn
      var dir = 1;
      
      if(piece.direction == -1 || piece.direction == undefined){
        //Test whether the piece should move updard or downward (relative to the player's view)
        if(piece.color === playerColor && !(opponent == 1 && playerColor == 1)){
          dir = -1;
        }
      }else{
        if(piece.direction < 2){
          // Direction 0 = White
          dir = (piece.direction == 0?-1:1);
        }else{
          /// Yet to implement (this will allow for more than 2 players, if I ever even get around to that)
          
          /// Placeholder
          if(piece.color === playerColor && !(opponent == 1 && playerColor == 1)){
            dir = -1;
          }
        }
      }
      
      //Make sure that the pawn is not at the end of the board, but allow for the pawn to be at the very back (for custom layouts)
      if((py+dir >= 0 || dir == 1) && (py+dir < boardHeight || dir == -1)){
        //Allow the piece to move forward by one space if available
        if(piece.parent.pieceTypeMap[py+dir][px] == 0){
          addMoveVisual(piece.parent,px,py+dir,1);
        }else{
          addMoveVisual(piece.parent,px,py+dir,0);
        }
        
        //Allow the piece to capture on the forward-right diagonal
        if(px+1 < boardWidth){
          if(piece.parent.pieceTypeMap[ py+dir ][ px+1 ] != 0){
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+dir ][ px+1 ] ].color != piece.color){
              addMoveVisual(piece.parent,px+1,py+dir,2);
            }else{
              addMoveVisual(piece.parent,px+1,py+dir,0);
            }
          }else{
            addMoveVisual(piece.parent,px+1,py+dir,0);
          }
        }
        
        //Allow the piece to capture on the forward-left diagonal
        if(px-1 >= 0){
          if(piece.parent.pieceTypeMap[ py+dir ][ px-1 ] != 0){
            if(piece.parent.pieces[ piece.parent.pieceIDMap[ py+dir ][ px-1 ] ].color != piece.color){
              addMoveVisual(piece.parent,px-1,py+dir,2);
            }else{
              addMoveVisual(piece.parent,px-1,py+dir,0);
            }
          }else{
            addMoveVisual(piece.parent,px-1,py+dir,0);
          }
        }
        
        //If it's the piece's first move, allow it to move one extra space forward
        if(piece.moveAmount == 0){
          if(piece.parent.pieceTypeMap[ py+dir ][ px ] == 0 && piece.parent.pieceTypeMap[ py+dir*2 ][ px ] == 0){
            addMoveVisual(piece.parent,px,py+dir*2,1);
          }else{
            addMoveVisual(piece.parent,px,py+dir*2,0);
          }
        }
      }else{
        console.warn("Warning: This pawn should have been promoted");
      }
      
      //For time-travel, do the same thing as above, but for boards instead of tiles (With a lot of extra checks for the existence of boards)
      
      //Check that the pawn has another timeline in front of it to move to
      if(piece.parent.parent.id+dir >= 0 && piece.parent.parent.id+dir < piece.parent.parent.parent.timelines.length){
        //Allow the piece to move up by one board if available
        if(piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id] != undefined){
          var board = piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id];
          
          if(board.pieceTypeMap[py][px] == 0){
            addMoveVisual(board,px,py,1);
          }else{
            addMoveVisual(board,px,py,0);
          }
        }
        
        //Allow the piece to capture on the forward-right diagonal
        if(piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id+2] != undefined){
          var board = piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id+2];
          
          if(board.pieceTypeMap[py][px] != 0){
            if(board.pieces[ board.pieceIDMap[py][px] ].color != piece.color){
              addMoveVisual(board,px,py,2);
            }else{
              addMoveVisual(board,px,py,0);
            }
          }else{
            addMoveVisual(board,px,py,0);
          }
        }
        
        //Allow the piece to capture on the forward-left diagonal
        if(piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id-2] != undefined){
          var board = piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id-2];
          
          if(board.pieceTypeMap[py][px] != 0){
            if(board.pieces[ board.pieceIDMap[py][px] ].color != piece.color){
              addMoveVisual(board,px,py,2);
            }else{
              addMoveVisual(board,px,py,0);
            }
          }else{
            addMoveVisual(board,px,py,0);
          }
        }
      }
      
      //If it's the piece's first move, allow it to jump one extra board forward
      if(piece.moveAmount == 0){
        //Check for the presence of a valid board 2 boards in front of the pawn
        if(piece.parent.parent.id+dir*2 >= 0 && piece.parent.parent.id+dir*2 < piece.parent.parent.parent.timelines.length){
          if(piece.parent.parent.parent.timelines[piece.parent.parent.id+dir*2].boards[piece.parent.id] != undefined){
            //Store the new board in a variable to make it quicker to access
            var board = piece.parent.parent.parent.timelines[piece.parent.parent.id+dir*2].boards[piece.parent.id];
            
            //Check for the presence of a valid board 1 board in front of the pawn
            if(piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id] != undefined){
              //Check that the middle board has a free space for the pawn to jump across
              if(piece.parent.parent.parent.timelines[piece.parent.parent.id+dir].boards[piece.parent.id].pieceTypeMap[py][px] == 0){
                
                if(board.pieceTypeMap[py][px] == 0){
                  addMoveVisual(board,px,py,1);
                }else{
                  addMoveVisual(board,px,py,0);
                }
              }else{
                addMoveVisual(board,px,py,0);
              }
            }else{
              addMoveVisual(board,px,py,0);
            }
          }
        }
      }
      
      break;
    case 8:
      console.warn("Dragon selected, no way to calculate moves yet");
      
      break;
    case 9:
      console.warn("Unicorn selected, no way to calculate moves yet");
      
      break;
    default:
      console.warn("Warning: Attempted calculation of the moves of an invalid piece - "+piece.fullid);
  }
  
  return movementVisualCoords;
}


// -- Check for piece danger and check/mate -- \\

//Check if a piece is in danger of being captured
function checkForPieceDanger(piece){
  //Run through all the moves of a Queen and a knight centered on the specified piece
  //If the check lands on a piece of the opposite color, check the moves of that piece
  //If it can capture the king, then the king is in check
  
  //An array storing a reference to all pieces that could be threatening the piece
  var piecesInRange = [];
  
  //Get all the queen and knight moves, centred on the king
  var combinedMoves = getAvailableMoves(piece,3).concat(getAvailableMoves(piece,5));
  
  var attackers = [];
  
  //Loop through all moves
  for(var a = 0;a < combinedMoves.length;a += 1){
    //Check if the move is a capture
    if(combinedMoves[a][3] == 2){
      var attacker = combinedMoves[a][4];
      if(attacker.parent.selectable){
        var possibleAttackerMoves = getAvailableMoves(attacker);
        for(var b = 0;b < possibleAttackerMoves.length;b += 1){
          if(possibleAttackerMoves[b][3] == 2 && possibleAttackerMoves[b][4] == piece){
            attackers.push(attacker);
          }
        }
      }
    }
  }
  
  return attackers;
}

//Check if any of the kings are in check
function checkForCheck(){
  ///var t0 = performance.now();
  for(var t = 0;t < fields[0].timelines.length;t += 1){
    for(var b = 0;b < fields[0].timelines[t].boards.length;b += 1){
      var board = fields[0].timelines[t].boards[b];
      if(board != undefined){
        for(var p = 0;p < board.pieces.length;p += 1){
          var piece = board.pieces[p];
          //Check that the piece exists and is a king
          if(piece != undefined && piece.type == 2){
            var threateningPieces = checkForPieceDanger(piece);
            if(threateningPieces.length > 0){
              console.log((piece.color == 0?"White":"Black")+" is in check");
              console.log(piece);
              console.log(threateningPieces);
              ///alert((piece.color == 0?"White":"Black")+" is in check");
              alert((piece.color == 0?"White":"Black")+" King (T"+piece.tid+",B"+piece.bid+",X"+piece.getX()+",Y"+piece.getY()+") is threatened by: "+pieceNames[threateningPieces[0].type]+" (T"+threateningPieces[0].tid+",B"+threateningPieces[0].bid+",X"+threateningPieces[0].getX()+",Y"+threateningPieces[0].getY()+")"+(threateningPieces.length > 1 ? (" and "+(threateningPieces.length-1)+" more") : ""));
            }
          }
        }
      }
    }
  }
  ///console.log(performance.now() - t0);
}

//Check if the player is mated
function checkForMate(){
  //I have no idea how I'm going to make this efficient
  
  
}



// -- Meta -- \\

//Create a new game with given paramaters (yet to be fully implemented)
function newGame(){
  gameContainer.innerHTML = "";
  
  // Create a new Field with ID 0
  fields[0] = new Field(0);
  
  // Create a new timeline with ID 0
  var startingTimeline = fields[0].addTimeline(0);
  
  var startingBoard = startingTimeline.addBoard(0);
  startingBoard.setSelectable(true);
  startingBoard.setStartingLayout();
  
  fields[0].render();
}

//Delete the old game and create a new one [DEBUG]
function resetGame(){
  globalDeselect();
  
  fields[0].container.remove();
  fields[0] = undefined;
  newGame();
  
  pastMoves = [];
  
  console.log("- - - - - - - -\nReset Game\n- - - - - - - -");
}

//Store a simplified version of the previous game state (for undo functionality)
function storePastMove(){
  //If the amount of stored game states exceeds the limit, remove the one [limit] moves old
  if(pastMoves.length >= pastMoveLimit){
    pastMoves[fields[0].moveAmounts[0]-pastMoveLimit] = undefined;
  }
  
  //Add the simplified version of the current (soon to be previous) game state (which is just field 0)
  pastMoves[fields[0].moveAmounts[0]] = fields[0].simplify();
}

//Revert the game to a previous game state
function undoMove(){
  //Confirm the undo in online multiplayer
  if(opponent == 1){
    if(!confirm("Undoing your move will also reverse any moves the opponent has made since.\nAre you sure you want to revert the game to before your last move?")){
      return;
    }
  }
  
  var prevMove = fields[0].moveAmounts[0]-1;
  
  if(fields[0].moveAmounts[0] == 0){
    console.log("Cannot undo move");
    return;
  }
  if(pastMoves.length != fields[0].moveAmounts[0]){
    console.warn("Warning: Amount of previous moves stored doesn't match current total moves");
  }
  
  if(pastMoves[prevMove] == undefined){
    console.warn("Warning: Previous move not available");
    alert("Previous move unavailable");
    return;
  }
  
  ///Store the current field before removing it for adding redo functionality
  
  fields[0].container.remove();
  fields[0] = new Field(0);
  fields[0].fromSimpleObject(pastMoves[prevMove]);
  
  ///This will need to be removed to add redo functionality
  //pastMoves[prevMove] = undefined;
  pastMoves.pop();
  
  //Send the game to the server
  if(opponent == 1){
    syncGameToServer();
  }
}

//Pretty self-explanatory, make a specified player win the game
function win(player){
  var playerText = ["White","Black"];
  
  document.getElementById("ColourSubtitle").innerHTML = playerText[player]+" wins!";
}

//Deliberatly throw an error in case of critical failure (stop execution & make the error clear to the end-user)
function throwError(err){
  //Get the recovery element from the DOM and make it visible
  var recoveryElement = document.getElementById("FatalErrorRecovery");
  recoveryElement.hidden = false;
  
  //Make the titlebar visible
  document.getElementById("TitleBar").hidden = false;
  
  //Loop through all the previous moves of the game
  for(var a = 0;a < pastMoves.length;a += 1){
    if(pastMoves[a] != undefined){
      //Create a button to export the desired game state
      var recoveryButton = document.createElement("button");
      recoveryButton.innerHTML = "Move "+a;
      
      //Assign the value of the button as the ID of the game state
      recoveryButton.value = a;
      
      //Add the function to export the game state as the click event for the button
      recoveryButton.addEventListener("click",function(event){
        //Get the ID of the game state from the name target element (recoveryButton)
        var gamestate = parseInt(event.currentTarget.value);
        
        var simplified = pastMoves[gamestate];
        
        //Store the the JSON text in a URI encoded 
        var dataString = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(simplified,null,2));
        
        //Get the download anchor element
        var downloadAnchor = document.createElement("a");
        downloadAnchor.hidden = true;
        recoveryElement.appendChild(downloadAnchor);
        
        //Set the necessary attributes of the download anchor element so that it will initialise a download when clicked
        downloadAnchor.href = dataString;
        downloadAnchor.download = "4D Chess Game State (Move "+gamestate+").json";
        
        //Artificially "click" the download anchor element
        downloadAnchor.click();
        
        console.log("Exported a previous game state (move "+gamestate+") as JSON");
      });
      
      recoveryElement.appendChild(recoveryButton);
      recoveryElement.appendChild(document.createElement("br"));
    }
  }
  
  document.getElementById("MainSubtitle").innerHTML = err;
  document.getElementById("MainSubtitle").style.color = "#ff0000";
  gameContainer.innerHTML = "";
  throw new Error(err);
}

//Hide/unhide the title bar
function toggleTitleBar(){
  var titleBar = document.getElementById("TitleBar");
  if(titleBar.hidden){
    titleBar.hidden = false;
    document.getElementById("TitleBarUnhideButton").hidden = true;
    gameContainer.style.top = "10rem";
  }else{
    titleBar.hidden = true;
    document.getElementById("TitleBarUnhideButton").hidden = false;
    gameContainer.style.top = "0rem";
  }
}

//Create a link for someone to join the game
function shareGame(){
  var joinLink = window.location.href.replace("c="+playerColor,"c="+((playerColor+1)%2));
  var specLink = "[Unimplemented]";
  
  if(password == ""){
    alert("Join as opponent ("+(playerColor == 0 ? "White" : "Black")+") - "+joinLink+"\nSpectate game - "+specLink);
  }else{
    alert("This game is password protected and must be joined through the main menu");
  }
}



// -- Export/Import Game -- \\

//Export the current game as JSON
function exportGame(){
  var simplified = fields[0].simplify();
  
  //Store the the JSON text in a URI encoded 
  var dataString = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(simplified,null,2));
  
  //Get the download anchor element
  var downloadAnchor = document.getElementById("DownloadAnchor");
  
  //Set the necessary attributes of the download anchor element so that it will initialise a download when clicked
  downloadAnchor.href = dataString;
  downloadAnchor.target = "_blank";
  downloadAnchor.download = "4D Chess Save.json";
  
  //Artificially "click" the download anchor element
  downloadAnchor.click();
  
  console.log("Exported game as JSON");
}

//Import a game from JSON
function importGame(){
  var uploadWindow = document.getElementById("ImportGamePopup");
  if(uploadWindow.hidden){
    uploadWindow.hidden = false;
  }else{
    //Get the string stored in the input textarea
    var JSONString = document.getElementById("ImportGameTextInput").value;
    
    var importedObject;
    
    //Make sure the text string is long enough and is valid JSON data
    if(JSONString.length < 10){
      console.warn("Warning: Not enough text submitted");
      return;
    }
    try{
      //Convert the JSON string into a usable object
      importedObject = JSON.parse(JSONString);
    }catch(e){
      console.warn("Warning: Invalid JSON data submitted");
      return;
    }
    
    if(importedObject.boardWidth != boardWidth || importedObject.boardHeight != boardHeight){
      console.warn("Board width/height of imported game does not match that of the current game");
      alert("Board width/height of imported game does not match that of the current game\nCurrent game: "+boardWidth+"x"+boardHeight+"\nImported game: "+importedObject.boardWidth+"x"+importedObject.boardHeight);
      return;
    }
    
    //Remove the contents of the current game
    fields[0].container.remove();
    //Create a new filed
    fields[0] = new Field(0);
    //Recreate the new field from the imported JSON data
    fields[0].fromSimpleObject(importedObject);
    
    for(var a = 0;a < fields[0].moveAmounts[0];a += 1){
      pastMoves[a] = undefined;
    }
    
    //Hide the "Import Game" popup
    uploadWindow.hidden = true;
    
    console.log("Imported game from JSON");
    
    //Send the game to the server
    if(opponent == 1){
      syncGameToServer();
    }
  }
}

//Extract the text from the attached file and and put it into the import
function importFromFile(){
  //Make sure that a file has been attached
  if(this.files.length < 1){
    console.warn("Warning: No file selected to import game");
    return;
  }
  
  //Create a new file reader to extract the contents of the file as a string
  var reader = new FileReader();
  
  //Trigger when the reader has fully loaded
  reader.onload = function(event){
    //Store the text from the file in the imput textarea
    document.getElementById("ImportGameTextInput").value = event.target.result;
  };
  
  //Read the file as one string of text
  reader.readAsText(this.files[0]);
}

//Hide the "Import Game" window
function cancelImport(){
  document.getElementById("ImportGamePopup").hidden = true;
}

//Attach a "change" event listener to the file upload element to execute the importFromFile() function when a file is attached
document.getElementById("ImportGameFileInput").addEventListener("change", importFromFile);



// -- Network code -- \\

///const socket = new WebSocket("ws://127.0.0.1:8002");
var socketOpen = false;
///
///var sendData = "Test - "+gameID;
///
///socket.addEventListener("open",function(event){
///  socket.send(sendData);
///  console.log("Sent:\n"+sendData);
///});
///
///socket.addEventListener("message",function(event){
///  console.log("Received:\n"+event.data);
///  if(event.data == "Established Connection"){
///    console.log("Websocket opened");
///    socketOpen = true;
///  }
///});

//Request the amounts of moves from the server-side game and sync to/from the server accordingly
function requestMoves(){
  serverBusy = true;
  
  console.log("Requesting moves");
  
  ///var requestTimeStart = performance.now();
  
  //Make an asynchronous request to the server which will return all of the specified player's moves (This will be changed in the future)
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      serverBusy = false;
      
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
        ///console.log("Request time: "+(performance.now()-requestTimeStart)+"ms");
        
        var serverMoveAmounts = JSON.parse(this.responseText);
        
        if(serverMoveAmounts[0] == -1){
          console.log("Performing first server-sync of the game");
          syncGameToServer();
        }else{
          if(fields[0].moveAmounts[0] < serverMoveAmounts[0] || fields[0].moveAmounts[((playerColor+1)%2)+1] < serverMoveAmounts[((playerColor+1)%2)+1]){
            //Store the current game state as the previous move
            storePastMove();
            
            syncGameFromServer();
          }else if(fields[0].moveAmounts[0] > serverMoveAmounts[0] || fields[0].moveAmounts[playerColor+1] > serverMoveAmounts[playerColor+1]){
            syncGameToServer();
          }
        }
      }
    }
  };
  
  if(password == "" || password == undefined){
    xmlhttp.open("GET","../Server/checkMoves.php?id="+gameID,true);
    ///xmlhttp.open("GET","http://"+nodeJSURL+"checkMoves?id="+gameID,true);
    console.log(nodeJSURL+"checkMoves?id="+gameID);
    xmlhttp.send();
  }else{
    xmlhttp.open("POST","../Server/checkMoves.php?id="+gameID,true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("passw="+password);
  }
}

//Pull down the current online multiplayr game from the server and replace the client's game with that
function syncGameFromServer(){
  serverBusy = true;
  
  ///var requestTimeStart = performance.now();
  
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
      }else{
        ///console.log("Sync (down) time: "+(performance.now()-requestTimeStart)+"ms");
        
        var serverObject;
        
        //Make sure the text string is long enough and is valid JSON data
        if(this.responseText.length < 10){
          console.warn("Warning: Didn't recieve long enough JSON string from server");
          
          //Perform a sync to the server
          syncGameToServer();
          
          return;
        }
        try{
          //Convert the JSON string into a usable object
          serverObject = JSON.parse(this.responseText);
        }catch(e){
          console.warn("Warning: Recieved invalid JSON data from server");
          
          //Perform a sync to the server
          syncGameToServer();
          
          return;
        }
        
        if(serverObject.boardWidth != boardWidth || serverObject.boardHeight != boardHeight){
          throwError("Board width/height of server-side game does not match that of the current game\nCurrent game: "+boardWidth+"x"+boardHeight+"\nImported game: "+importedObject.boardWidth+"x"+importedObject.boardHeight);
          return;
        }
        
        //Remove the contents of the current game
        fields[0].container.remove();
        //Create a new filed
        fields[0] = new Field(0);
        //Recreate the new field from the imported JSON data
        fields[0].fromSimpleObject(serverObject);
        
        for(var a = 0;a < fields[0].moveAmounts[0];a += 1){
          pastMoves[a] = undefined;
        }
        
        console.log("Successfully synced game from server");
      }
      serverBusy = false;
    }
  };
  if(password == "" || password == undefined){
    xmlhttp.open("GET","../Server/getGameState.php?id="+gameID,true);
    xmlhttp.send();
  }else{
    xmlhttp.open("POST","../Server/getGameState.php?id="+gameID,true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("passw="+password);
  }
}

//Send the client's game data to the server
function syncGameToServer(){
  serverBusy = true;
  
  ///var requestTimeStart = performance.now();
  
  //Make an asynchronous request to the server which will return all of the specified player's moves (This will be changed in the future)
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      
      if(parseInt(this.responseText) == 0){
        ///console.log("Sync (up) time: "+(performance.now()-requestTimeStart)+"ms");
        
        console.log("Successfully synced game to server");
      }else if(parseInt(this.responseText) == 1){
        //Tell the player that the game no longer exists on the server if this error is recieved
        throwError("This game no longer exists");
        
      }else if(parseInt(this.responseText) == 2){
        //Password detected as incorrect when requesting the amounts of moves
        throwError("Password detected as incorrect");
        
      }else if(parseInt(this.responseText) == 3){
        //Password detected as incorrect when requesting the amounts of moves
        throwError("Server detected game data as invalid");
        
      }else{
        console.log(this.responseText);
        
        throwError("An unknown server-side error occurred");
      }
      serverBusy = false;
    }
  };
  
  var JSONString = JSON.stringify(fields[0].simplify());
  
  if(password == "" || password == undefined){
    xmlhttp.open("POST","../Server/storeGameState.php?id="+gameID,true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("gamedata="+JSONString);
  }else{
    xmlhttp.open("POST","../Server/storeGameState.php?id="+gameID,true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("passw="+password+"&gamedata="+JSONString);
  }
}

//Pull down the chat messages from the server
function syncChat(){
  
}

//Every 2 seconds, sync the current online multiplayer game with the server
function routineServerSync(){
  if(socketOpen){
    console.log("Socket open so no syncing occurred");
    
    setTimeout(routineServerSync,15000+1000);
  }else{
    if(!serverBusy){
      requestMoves();
      
      syncChat();
    }else{
      console.log("Server busy during routine sync");
    }
    
    setTimeout(routineServerSync,2000);
  }
}



// -- Executed on page load -- \\

//Called by the "onload()" function of a the body element, which calls the functions to start a game
function startJS(){
  if(opponent == 0){
    //[Opponent 0] - Local multiplayer
    
    document.getElementById("MainSubtitle").innerHTML = "Local Multiplayer";
    document.getElementById("ColourSubtitle").innerHTML = "";
    
    newGame();
    
  }else if(opponent == 1){
    //[Opponent 1] - Online multiplayer
    
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
    xmlhttp.open("GET","../Server/confirmGameExists.php?id="+gameID,true);
    xmlhttp.send();
    
    //Set the main text in the titlebar to something relevant
    document.getElementById("MainSubtitle").innerHTML = "Online Multiplayer - Game ID: "+gameID;
    
    //Set the secondary text in the titlebar to the player's colo(u)r (I really dislike having two different spellings of colour)
    ///if(playerColor == 0){
    ///  document.getElementById("ColourSubtitle").innerHTML = "Colour: White";
    ///}else{
    ///  document.getElementById("ColourSubtitle").innerHTML = "Colour: Black";
    ///}
    
    ///document.getElementById("UndoBtn").disabled = true;
    document.getElementById("ShareBtn").hidden = false;
    
    newGame();
    
    setTimeout(routineServerSync,200);
    
  }else{
    //[Opponent 2] - VS computer
    
    //Set the main text in the titlebar to something relevant
    document.getElementById("MainSubtitle").innerHTML = "Versus Computer (Unimplemented)";
    
    //Set the secondary text in the titlebar to the player's colo(u)r
    if(playerColor == 0){
      document.getElementById("ColourSubtitle").innerHTML = "Colour: White";
    }else{
      document.getElementById("ColourSubtitle").innerHTML = "Colour: Black";
    }
    
    newGame();
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
