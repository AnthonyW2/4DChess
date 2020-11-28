//Code created by Anthony Wilson

//Protected by the GNU General Public License V3

// Project Started:
//24 July 2020
//20-7-24

// 1.0 Release:
//13 September 2020
//20-9-13

// 1.1 Release:
//17 October 2020
//20-10-17



"use strict";

// (Maj Version).(Min Version).(Patch).(Build)-(Release)
const version = "1.2.0.15-0";



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

//The variable which will point to the WebSocket object used for online multiplayer
var socket;

//A variable to keep track of the state of the WebSocket
var socketOpen = false;



// -- Global variable declaration -- //

//Reference to the DOM element that contains all the other game elements
const gameContainer = document.getElementById("Game");

//Main playing "field" (containing all interactable game objects)
var playField;

//Object which stores extra data from game save files
var extraGameData = {};

//An array of the simplified version of past moves
var pastMoves = [];
//How many past moves can be stored at once (so that the page doesn't use up all of the device's memory storing previous game states)
var pastMoveLimit = 10;

//Stores a reference to the currently selected piece
var selectedPiece;

//An array of all the elements that show where a piece can move (which also handle the click event which triggers a move)
var movementVisuals = [];

//How many more active timelines a player can have than their opponent
var activeTimelineLimit = 1;



// -- Game constants -- //

const SupportsSVG = true;

//The width of the coloured border around a chess board
const boardOffset = 6; //px

//The names of all the pieces
const pieceNames = [
  "",           // 0
  "Stationary", // 1
  "King",       // 2
  "Queen",      // 3
  "Bishop",     // 4
  "Knight",     // 5
  "Rook",       // 6
  "Pawn",       // 7
  "Unicorn",    // 8
  "Dragon",     // 9
  "Princess",   // 10
  "Brawn"       // 11
];

//The icon paths of all the pieces
const pieceIconPaths = [
  [ // White pieces
    "",
    "../Resources/Pieces/64px/StationaryW.png",
    "../Resources/Pieces/64px/KingW.png",
    "../Resources/Pieces/64px/QueenW.png",
    "../Resources/Pieces/64px/BishopW.png",
    "../Resources/Pieces/64px/KnightW.png",
    "../Resources/Pieces/64px/RookW.png",
    "../Resources/Pieces/64px/PawnW.png",
    "", // Unicorn icon
    "", // Dragon icon
    "", // Princess icon
    ""  // Brawn icon
  ],
  [ // Black pieces
    "",
    "../Resources/Pieces/64px/StationaryB.png",
    "../Resources/Pieces/64px/KingB.png",
    "../Resources/Pieces/64px/QueenB.png",
    "../Resources/Pieces/64px/BishopB.png",
    "../Resources/Pieces/64px/KnightB.png",
    "../Resources/Pieces/64px/RookB.png",
    "../Resources/Pieces/64px/PawnB.png",
    "", // Unicorn icon
    "", // Dragon icon
    "", // Princess icon
    ""  // Brawn icon
  ]
];

//The SVG elements used throughout the game
var SVGs = [
  document.getElementById("TimelineArrowheadSVG"),
  document.getElementById("SmallArrowheadSVG")
];



// -- Classes for common game objects -- //

//The main "Field" that contains all the other objects (boards, timelines, etc)
class Field{
  //id = FieldID
  constructor(id,simpleObj = undefined,render = true){
    this.id = id;
    this.timelines = [];
    
    this.boardWidth = 8;
    this.boardHeight = 8;
    
    this.hasVisuals = render;
    
    this.presentPosition = 0;
    this.pastMoves = [];
    
    //Store the total amount of moves, as well as the amount of moves for each player
    this.moveAmounts = [0,0,0];
    
    if(this.hasVisuals){
      this.container = document.createElement("div");
      this.container.classList.add("Field");
      this.container.innerHTML = "";
      gameContainer.appendChild(this.container);
      
      this.gridContainer = document.createElement("div");
      this.render();
      this.container.appendChild(this.gridContainer);
      
      this.pastMoveContainer = document.createElement("div");
      this.container.appendChild(this.pastMoveContainer);
      
      this.presentLine = document.createElement("div");
      this.presentLine.classList.add("PresentLine");
      this.presentLine.style.width = (this.boardWidth/2)*32+"px";
      this.container.appendChild(this.presentLine);
    }
    
    if(simpleObj != undefined && typeof(simpleObj) == "object"){
      this.fromSimpleObject(simpleObj);
    }
  }
  
  //Safely clone the current object and all child objects
  clone(cloneid,render = true){
    var t0 = performance.now();
    var clonedField = new Field(cloneid,undefined,render);
    for(var a = 0;a < this.timelines.length;a += 1){
      if(this.timelines[a] != undefined){
        this.timelines[a].clone(clonedField,a,render);
      }
    }
    if(render){
      clonedField.render();
    }
    
    //According to my testing, simplifying the field and then creating a new one from that object is significantly slower (by nearly 20% on average) than cloning everything in one go.
    //var clonedField = new Field(cloneid,this.simplify(),render);
    
    console.log("Clone Field funcion time: ",performance.now() - t0);
    return clonedField;
  }
  
  //Add a new timeline with a specified ID (tid) to the field
  addTimeline(tid){
    this.timelines[tid] = new Timeline(this,tid,this.hasVisuals);
    
    if(this.hasVisuals){
      this.timelines[tid].container.style.top = ((tid+1)*(this.boardHeight+1)*32+16-boardOffset)+"px";
      this.timelines[tid].container.style.left = (16-boardOffset)+"px";
    }
    
    return this.timelines[tid];
  }
  
  //Shift all timelines down in the list (add 1 to their IDs)
  shiftTimelinesDown(){
    //Loop through all timeline, bottom to top
    for(var t = this.timelines.length-1;t >= 0;t -= 1){
      //Modify the ID
      this.timelines[t].id = t+1;
      if(this.hasVisuals){
        //Move the container
        this.timelines[t].container.style.top = ((t+2)*(this.boardHeight+1)*32+16-boardOffset)+"px";
      }
      
      //Loop through the child boards and pieces, updating their TIDs
      for(var b = 0;b < this.timelines[t].boards.length;b += 1){
        var board = this.timelines[t].boards[b];
        if(board != undefined){
          board.tid = t+1;
          for(var p = 0;p < board.pieces.length;p += 1){
            if(board.pieces[p] != undefined){
              board.pieces[p].tid = t+1;
            }
          }
        }
      }
      
      this.timelines[t+1] = this.timelines[t];
    }
    this.timelines[0] = undefined;
    
    //Shift all movement visuals down by one timeline
    var mv = this.pastMoves;
    for(var a = 0;a < mv.length;a += 1){
      mv[a][1] += 1;
      mv[a][5] += 1;
    }
    this.refreshMovementVisuals();
  }
  
  //Remove a timeline from the field (only used for changing the ID of a timeline)
  removeTimeline(tid){
    if(this.hasVisuals){
      this.timelines[tid].container.remove();
    }
    this.timelines[tid] = undefined;
  }
  
  //Search for and return the main (starting) timeline
  getStartingTimelines(){
    var startingTimelines = [];
    for(var a = 0;a < this.timelines.length;a += 1){
      if(this.timelines[a].boards[0] != undefined){
        startingTimelines.push(this.timelines[a]);
      }
    }
    return startingTimelines;
  }
  
  //Get all timelines made by a player
  getPlayerMadeTimelines(color){
    var timelines = [];
    
    ///if((opponent < 2 && color == 0) || (opponent == 2 && (color+playerColor)%2 == 1)){
    ///  
    ///}
    
    var startingTimelines = this.getStartingTimelines();
    
    if(color == 1){
      //Loop through all timelines before the first starting timeline
      for(var a = 0;a < startingTimelines[0].id;a += 1){
        timelines.push(this.timelines[a]);
      }
    }else{
      //Loop through all timelines after the last starting timeline
      for(var a = startingTimelines[startingTimelines.length-1].id+1;a < playField.timelines.length;a += 1){
        timelines.push(this.timelines[a]);
      }
    }
    
    return timelines;
  }
  
  //Set timelines to active or inactive, depending on the amount of them created by each player
  refreshActiveTimelines(){
    var whiteTimelines = this.getPlayerMadeTimelines(0);
    var blackTimelines = this.getPlayerMadeTimelines(1);
    
    var activeLimit = 0;
    if(whiteTimelines.length > blackTimelines.length){
      activeLimit = blackTimelines.length+activeTimelineLimit;
    }else{
      activeLimit = whiteTimelines.length+activeTimelineLimit;
    }
    
    for(var a = 0;a < whiteTimelines.length;a += 1){
      if(a < activeLimit){
        whiteTimelines[a].setActive(true);
      }else{
        whiteTimelines[a].setActive(false);
      }
    }
    for(var a = 0;a < blackTimelines.length;a += 1){
      if(a >= blackTimelines.length-activeLimit){
        blackTimelines[a].setActive(true);
      }else{
        blackTimelines[a].setActive(false);
      }
    }
  }
  
  //Get a board from given coordinates
  getBoard(bid,tid){
    return this.timelines[tid].boards[bid];
  }
  
  //Get a piece from given coordinates
  getPiece(bid,tid,x,y){
    if(this.getBoard(bid,tid) != undefined){
      var pid = this.getBoard(bid,tid).pieceIDMap[y][x];
      if(pid != -1){
        return this.timelines[tid].boards[bid].pieces[pid];
      }
    }
    return undefined;
  }
  
  //Update the position of "The Present"
  updatePresentPosition(){
    ///var t0 = performance.now();
    
    //Make sure all timelines are correctly active/inactive
    playField.refreshActiveTimelines();
    
    //Variable to store one of the timelines the present is based
    var presentTimeline = playField.timelines[0];
    
    var newPresentPos = presentTimeline.boards.length-1;
    
    //Loop through all active timelines
    for(var t = 0;t < playField.timelines.length;t += 1){
      if(playField.timelines[t].active){
        //If the length of the timeline is smaller than the present position, move the present back to there
        if(playField.timelines[t].boards.length-1 < newPresentPos){
          presentTimeline = playField.timelines[t];
          newPresentPos = presentTimeline.boards.length-1;
        }
      }
    }
    
    this.presentPosition = newPresentPos;
    
    ///console.log(newPresentPos);
    
    //Move the present visualisation element
    if(this.hasVisuals){
      this.presentLine.style.left = ((this.presentPosition*(this.boardWidth+1)+(this.boardWidth/4+0.5))*32-4)+"px";
      this.presentLine.style.height = ((this.timelines.length+1)*(this.boardHeight+1)*32+(this.boardHeight+1)*32-8)+"px";
      this.presentLine.style.backgroundColor = (presentTimeline.boards[this.presentPosition].turnColor == 0 ? "#c0c0c0" : "#101010");
    }
    
    ///console.log(performance.now() - t0+"ms");
  }
  
  //Render the field grid
  render(){
    if(this.hasVisuals){
      this.gridContainer.innerHTML = "";
      
      var fieldwidth = 0;
      for(var a = 0;a < this.timelines.length;a += 1){
        if(this.timelines[a] != undefined && this.timelines[a].boards.length > fieldwidth){
          fieldwidth = this.timelines[a].boards.length;
        }
      }
      
      //Add the grid tiles to the background
      for(var a = 0;a < Math.ceil(fieldwidth/2+1);a += 1){
        for(var b = 0;b < this.timelines.length+2;b += 1){
          var gridSquare = document.createElement("div");
          gridSquare.innerHTML = "";
          gridSquare.classList.add("FieldTile");
          gridSquare.style.backgroundColor = ((a+b)%2 == 0)?("#282828"):("#202020");
          gridSquare.style.left = (this.boardWidth+1)*64*a+"px";
          gridSquare.style.top = (this.boardWidth+1)*32*b+"px";
          gridSquare.style.width = (this.boardWidth+1)*64+"px";
          gridSquare.style.height = (this.boardWidth+1)*32+"px";
          if(b == 0 || b == this.timelines.length+1){
            gridSquare.innerHTML = "T"+a;
          }
          if(a == Math.ceil(fieldwidth/2) && b > 0 && b < this.timelines.length+1){
            gridSquare.innerHTML = "L"+(b-1);
          }
          this.gridContainer.appendChild(gridSquare);
        }
      }
    }
  }
  
  //Increment this.moveAmounts[0] by 1 and do the same for the corresponding color
  incrementMoveAmounts(color){
    this.moveAmounts[0] += 1;
    this.moveAmounts[1+color] += 1;
  }
  
  //Add a 32x32px square indicationg a previous move
  addPastMoveVisual(bid1,tid1,x1,y1,bid2,tid2,x2,y2,extraData = undefined){
    if(extraData == undefined){
      this.pastMoves.push([bid1,tid1,x1,y1,bid2,tid2,x2,y2]);
    }else{
      this.pastMoves.push([bid1,tid1,x1,y1,bid2,tid2,x2,y2,extraData]);
    }
    if(this.hasVisuals){
      var visual1 = document.createElement("div");
      visual1.innerHTML = "";
      visual1.classList.add("PastMoveVisual");
      visual1.style.left = (this.boardWidth+1)*32*bid1+x1*32+16+"px";
      visual1.style.top = (this.boardHeight+1)*32*(tid1+1)+y1*32+16+"px";
      
      var visual2 = document.createElement("div");
      visual2.innerHTML = "";
      visual2.classList.add("PastMoveVisual");
      visual2.style.left = (this.boardWidth+1)*32*bid2+x2*32+16+"px";
      visual2.style.top = (this.boardHeight+1)*32*(tid2+1)+y2*32+16+"px";
      
      this.pastMoveContainer.appendChild(visual1);
      this.pastMoveContainer.appendChild(visual2);
      
      if(bid1 != bid2 || tid1 != tid2){
        var pastarrow = createArrow(
          (this.boardWidth+1)*32*bid1+x1*32+16+16,
          (this.boardHeight+1)*32*(tid1+1)+y1*32+16+16,
          (this.boardWidth+1)*32*bid2+x2*32+16+16,
          (this.boardHeight+1)*32*(tid2+1)+y2*32+16+16,
          "#902090"
        );
        pastarrow.style.zIndex = "40";
        this.pastMoveContainer.appendChild(pastarrow);
      }
    }
  }
  
  //Refresh all the visuals by removing and re-adding the HTML elements
  refreshMovementVisuals(){
    if(this.hasVisuals){
      //Clear all the existing movement visual elements
      this.pastMoveContainer.innerHTML = "";
      
      //Loop through the visuals stored in the variable "this.pastMoves" and re-add an element for each of those
      for(var a = 0;a < this.pastMoves.length;a += 1){
        var visual1 = document.createElement("div");
        visual1.innerHTML = "";
        visual1.classList.add("PastMoveVisual");
        visual1.style.left = (this.boardWidth+1)*32*this.pastMoves[a][0]+this.pastMoves[a][2]*32+16+"px";
        visual1.style.top = (this.boardHeight+1)*32*(this.pastMoves[a][1]+1)+this.pastMoves[a][3]*32+16+"px";
        
        var visual2 = document.createElement("div");
        visual2.innerHTML = "";
        visual2.classList.add("PastMoveVisual");
        visual2.style.left = (this.boardWidth+1)*32*this.pastMoves[a][4]+this.pastMoves[a][6]*32+16+"px";
        visual2.style.top = (this.boardHeight+1)*32*(this.pastMoves[a][5]+1)+this.pastMoves[a][7]*32+16+"px";
        
        this.pastMoveContainer.appendChild(visual1);
        this.pastMoveContainer.appendChild(visual2);
        
        if(this.pastMoves[a][0] != this.pastMoves[a][4] || this.pastMoves[a][1] != this.pastMoves[a][5]){
          var pastarrow = createArrow(
            (this.boardWidth+1)*32*this.pastMoves[a][0]+this.pastMoves[a][2]*32+16+16,
            (this.boardHeight+1)*32*(this.pastMoves[a][1]+1)+this.pastMoves[a][3]*32+16+16,
            (this.boardWidth+1)*32*this.pastMoves[a][4]+this.pastMoves[a][6]*32+16+16,
            (this.boardHeight+1)*32*(this.pastMoves[a][5]+1)+this.pastMoves[a][7]*32+16+16,
            "#902090"
          );
          pastarrow.style.zIndex = "40";
          this.pastMoveContainer.appendChild(pastarrow);
        }
      }
    }
  }
  
  //Create a simplified version of the entire current field object (ready to be converted to JSON)
  simplify(){
    //Declare the simplified version of the field object
    var simplifiedObj = {
      //Using the Array.slice() function here stores a new version of the array instead of a reference to the original (the JSON encode/decode does the same thing for a 2D array)
      version: version,
      moveAmounts: this.moveAmounts.slice(),
      boardWidth: this.boardWidth,
      boardHeight: this.boardHeight,
      data: extraGameData,
      pastMoves: JSON.parse(JSON.stringify(this.pastMoves)),
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
    if(obj == undefined){
      throwError("Supplied simple object is undefined");
    }
    //Check if the version of the object matches the client version
    if(obj.version != version && obj.version != "-"){
      
      var objVer = obj.version.split("-")[0].split(".");
      var cliVer = version.split("-")[0].split(".");
      
      if(objVer[0] != cliVer[0]){
        alert("The recieved game data (from version "+obj.version+") is not compatible with 4D Chess v"+version);
        return;
      }else if(parseInt(objVer[1]) == 0){
        alert("The recieved game data is from 4D Chess v1.0 and is not compatible with version 1.2");
        return;
      }else if(parseInt(objVer[1]) > 2){
        alert("The recieved game data from 4D Chess v"+obj.version+" is from a future version, and may not be compatible");
      }else if(parseInt(objVer[2]) > parseInt(cliVer[2])){
        alert("The recieved game data from 4D Chess v"+obj.version+" is from a future patch, and may not be compatible");
      }else if(parseInt(objVer[1]) == 1){
        alert("The recieved game data is from 4D Chess v1.1 and must be converted to be played in version 1.2");
        return;
      }else{
        console.warn("Version number of simple object does not match client, this may cause errors");
      }
    }
    
    this.boardWidth = obj.boardWidth;
    this.boardHeight = obj.boardHeight;
    
    if(obj.data != undefined){
      extraGameData = obj.data;
    }else{
      extraGameData = {};
    }
    
    if(this.hasVisuals){
      //Remove and recreate the main container element
      this.container.remove();
      this.container = document.createElement("div");
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
      
      //Recreate the Present indicator element
      this.presentLine = document.createElement("div");
      this.presentLine.classList.add("PresentLine");
      this.presentLine.style.width = (this.boardWidth/2)*32+"px";
      this.container.appendChild(this.presentLine);
    }
    
    //Restore the total amount of moves made
    this.moveAmounts = obj.moveAmounts.slice();
    
    //Loop through the timelines of the simple object and re-initialise them in the same way (as this function)
    for(var t = 0;t < obj.timelines.length;t += 1){
      if(obj.timelines[t] != undefined){
        //Add a new timeline to the field
        var newTimeline = this.addTimeline(t);
        
        //Set the ancestor attribute
        newTimeline.ancestor = obj.timelines[t].ancestor;
        
        //Loop through the timelines stored in the simplified object
        for(var b = 0;b < obj.timelines[t].boards.length;b += 1){
          
          //Check if the board is null or undefined
          if(obj.timelines[t].boards[b] == undefined || obj.timelines[t].boards[b] == null){
            //Add a null board to the timeline
            newTimeline.addBoard(b,true);
          }else{
            var simpleBoard = obj.timelines[t].boards[b];
            
            //Create a new board and add it to the timeline
            var newBoard = newTimeline.addBoard(b,false,simpleBoard.turnColor);
            
            //Set the selectable attribute and the starting layout of the newly added board
            newBoard.setSelectable(simpleBoard.selectable);
            newBoard.setBlankLayout();
            
            //Loop through the pieces of the simplified board object
            for(var p = 0;p < simpleBoard.pieceXs.length;p += 1){
              //Create a new piece and add it to the board
              var newPiece = newBoard.addPiece(p,simpleBoard.pieceTypes[p],simpleBoard.pieceColors[p],simpleBoard.pieceXs[p],simpleBoard.pieceYs[p]);
              
              //Set the moveAmount attribute of the new piece
              newPiece.moveAmount = simpleBoard.pieceMoves[p];
              
              //Set the direction that the new piece should face
              newPiece.direction = simpleBoard.pieceDirects[p];
            }
          }
        }
      }
    }
    
    //Loop through the movement visuals of the simple object and add them
    for(var a = 0;a < obj.pastMoves.length;a += 1){
      this.addPastMoveVisual(
        obj.pastMoves[a][0],
        obj.pastMoves[a][1],
        obj.pastMoves[a][2],
        obj.pastMoves[a][3],
        obj.pastMoves[a][4],
        obj.pastMoves[a][5],
        obj.pastMoves[a][6],
        obj.pastMoves[a][7]
      );
    }
    
    this.render();
    
    //Return true on success
    return true;
  }
}

//The Timeline class will contain all the "Board" objects. The "Timeline"s will be contained in the main "Field" class.
class Timeline{
  //Parent Field, TimelineID
  constructor(field,id,render = true){
    this.fid = field.id;
    this.id = id;
    this.boards = [];
    this.parent = field;
    
    this.hasVisuals = render;
    
    this.active = true;
    
    this.ancestor = 0;
    
    if(this.hasVisuals){
      this.container = document.createElement("div");
      this.container.classList.add("Timeline");
      this.container.innerHTML = "";
      this.parent.container.appendChild(this.container);
      this.render();
    }
  }
  
  //Safely clone the current object and all child objects
  clone(newparentfield,cloneid){
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
    newTimeline.active = this.active;
  }
  
  changeID(newid){
    if(this.id != newid){
      this.clone(this.parent,newid);
      this.parent.removeTimeline(this.id);
    }else{
      console.warn("Warning: Attempted to change the ID of Timeline "+this.id+" to its own ID");
    }
  }
  
  //Change the active state of the timeline, and set the selectable attribute of the end board
  setActive(active){
    this.active = active;
    ///this.boards[this.boards.length-1].setSelectable(active);
  }
  
  addBoard(bid,nullBoard = false,color = undefined){
    if(!nullBoard){
      this.boards[bid] = new Board(this,bid,this.hasVisuals,color);
      
      if(this.hasVisuals){
        this.boards[bid].container.style.left = bid*(this.parent.boardWidth+1)*32+"px";
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
        ///  arrowbranch.style.left = this.parent.boardHeight*16-32+boardOffset+"px";
        ///  ///arrowbranch.style.top = this.parent.boardHeight*16-32+boardOffset+"px";
        ///  arrowbranch.style.top = (this.parent.boardHeight*16+boardOffset+32)+"px";
        ///  arrowbranch.style.width = "64px";
        ///  arrowbranch.style.height = (this.parent.boardHeight*16)+"px";
        ///  arrowbranch.style.backgroundColor = "#606060";
        ///  this.container.appendChild(arrowbranch);
        ///}
        
        this.arrowshaft.style.left = (nullBoards*(this.parent.boardWidth+1)*32-10)+"px";
        this.arrowshaft.style.width = ((this.boards.length-nullBoards)*(this.parent.boardWidth+1)*32+boardOffset+12)+"px"; //Add 2 pixels to make sure there's no visible seam between the line and the triangle
        ///this.arrowshaft.style.width = (this.boards.length*(this.parent.boardWidth+1)*32+boardOffset+12)+"px";
        this.arrowtriangle.style.left = (this.boards.length*(this.parent.boardWidth+1)*32+boardOffset)+"px";
      }
    }else{
      this.boards[bid] = undefined;
    }
    return this.boards[bid];
  }
  
  //Render the timeline (only run once - when the timeline is created)
  render(){
    if(this.hasVisuals){
      //Create the shaft of the arrow
      this.arrowshaft = document.createElement("div");
      this.arrowshaft.style.position = "absolute";
      this.arrowshaft.style.zIndex = "11";
      this.arrowshaft.style.left = "-10px";
      this.arrowshaft.style.top = this.parent.boardHeight*16-32+boardOffset+"px";
      this.arrowshaft.style.width = "0px";
      this.arrowshaft.style.height = "64px";
      this.arrowshaft.style.backgroundColor = "#606060";
      this.container.appendChild(this.arrowshaft);
      
      //Create the tip of the arrow
      if(SupportsSVG){
        //Create the tip of the arrow (SVG)
        this.arrowtriangle = SVGs[0].cloneNode(true);
        this.arrowtriangle.style.top = (this.parent.boardHeight*16-64+boardOffset)+"px";
      }else{
        this.arrowtriangle = document.createElement("div");
        this.arrowtriangle.style.left = "0px";
        this.arrowtriangle.style.top = this.parent.boardHeight*16-64+boardOffset+"px";
        this.arrowtriangle.style.width = "0px";
        this.arrowtriangle.style.height = "0px";
        this.arrowtriangle.style.borderTop = "64px solid transparent";
        this.arrowtriangle.style.borderLeft = "64px solid #606060";
        this.arrowtriangle.style.borderBottom = "64px solid transparent";
        this.arrowtriangle.style.backgroundColor = "";
      }
      this.arrowtriangle.style.position = "absolute";
      this.arrowtriangle.style.zIndex = "12";
      this.container.appendChild(this.arrowtriangle);
    }
  }
  
  //Create a simplified version of the current timeline object
  simplify(){
    //Declare the simplified version of the timeline object
    var simplifiedObj = {
      ///active: this.active,
      ancestor: this.ancestor,
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
  constructor(timeline,id,render = true,color = undefined){
    this.fid = timeline.parent.id;
    this.tid = timeline.id;
    this.id = id;
    this.pieces = [];
    this.parent = timeline;
    
    this.hasVisuals = render;
    
    this.pieceTypeMap = [[]];
    this.pieceIDMap = [[]];
    //Set the color of the board. This may be supplied through the constructor, set relative to the board to the left (previous board), or made from the ID.
    this.turnColor = (color == undefined ? ((this.id == 0 || this.parent.boards[this.id-1] == undefined) ? this.id : (this.parent.boards[this.id-1].turnColor+1)) : color) % 2; // 0 = White, 1 = Black
    this.selectable = false;
    
    if(this.hasVisuals){
      this.container = document.createElement("div");
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
        turnColorMask.style.width = this.parent.parent.boardWidth*32+"px";
        turnColorMask.style.height = this.parent.parent.boardHeight*32+"px";
        this.container.appendChild(turnColorMask);
      }
    }
  }
  
  //Safely clone the current object and all child objects
  clone(newparenttimeline,cloneid,color = this.turnColor){
    if(newparenttimeline.boards[cloneid] != undefined){
      console.warn("Warning: Overwriting an existing board");
      newparenttimeline.boards[cloneid].container.remove();
      newparenttimeline.boards[cloneid] = undefined;
    }
    
    var newBoard = newparenttimeline.addBoard(cloneid,false,color);
    newBoard.setSelectable(this.selectable);
    newBoard.setBlankLayout();
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
      this.clone(this.parent,this.id+1,(this.turnColor+1)%2);
      
      if(this.hasVisuals){
        //Scroll the end of the timeline into view
        this.parent.arrowtriangle.scrollIntoView({behavior: "smooth", block: "center"});
        //this.parent.arrowtriangle.scrollIntoView(false);
      }
      
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
      ///if(this.turnColor == playerColor && !(opponent == 1 && playerColor == 1)){
      if(this.turnColor == 0){
        //Add a new timeline to the end of the parent field
        newTimeline = this.parent.parent.addTimeline(newtid,this.hasVisuals);
      }else{
        //Shift all the timelines down by one
        this.parent.parent.shiftTimelinesDown();
        
        //Add a new timeline as ID 0
        newtid = 0;
        newTimeline = this.parent.parent.addTimeline(newtid);
      }
      
      newTimeline.ancestor = this.tid-newTimeline.id;
      
      //Declare all the empty slots of the new timeline as undefined
      for(var a = 0;a <= this.id;a += 1){
        newTimeline.boards[a] = undefined;
      }
      
      //Clone the current instance of the board to the new timeline
      this.clone(newTimeline,this.id+1,(this.turnColor+1)%2);
      
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
    if(x < 0 || y < 0 || x >= this.parent.parent.boardWidth || y >= this.parent.parent.boardHeight){
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
    this.pieces[pid] = new Piece(this,pid,type,color,this.hasVisuals);
    this.pieces[pid].setX(x);
    this.pieces[pid].setY(y);
    
    if(y > this.parent.parent.boardHeight/2){
      this.pieces[pid].direction = 0;
    }else{
      this.pieces[pid].direction = 1;
    }
    
    return this.pieces[pid];
  }
  
  //Remove the piece's container and update the array of pieces accordingly
  removePiece(pid){
    if(this.pieces[pid].hasVisuals){
      this.pieces[pid].container.remove();
    }
    this.pieces[pid] = undefined;
  }
  
  //Set the arrays to a default state, creating a blank board
  setBlankLayout(){
    for(var a = 0;a < this.parent.parent.boardHeight;a += 1){
      this.pieceTypeMap[a] = [];
      this.pieceIDMap[a] = [];
      for(var b = 0;b < this.parent.parent.boardWidth;b += 1){
        this.pieceTypeMap[a][b] = 0;
        this.pieceIDMap[a][b] = -1;
      }
    }
  }
  
  //Add visuals to the board's container (DOM element)
  render(){
    if(this.hasVisuals){
      //Set the width & height of the board depending on its size
      this.container.style.width = 32*this.parent.parent.boardWidth+"px";
      this.container.style.height = 32*this.parent.parent.boardHeight+"px";
      this.container.style.backgroundColor = (this.turnColor == 0)?"#e0e0e0":"#101010";
      
      this.gridContainer.innerHTML = "";
      
      var tileColors = ["#b0b0b0","#505050"];
      
      //The grid squares need to be colored differently depending on whether the width of the board is odd or even
      if(this.parent.parent.boardWidth%2 == 0){
        for(var a = 0;a < this.parent.parent.boardWidth*this.parent.parent.boardHeight;a += 1){
          var gridSquare = document.createElement("div");
          gridSquare.innerHTML = "";
          gridSquare.classList.add("BoardTile");
          gridSquare.style.backgroundColor = tileColors[ ((Math.floor(a/this.parent.parent.boardWidth)%2)+a)%2 ];
          gridSquare.style.left = (a%this.parent.parent.boardWidth)*32+boardOffset+"px";
          gridSquare.style.top = Math.floor(a/this.parent.parent.boardWidth)*32+boardOffset+"px";
          this.gridContainer.appendChild(gridSquare);
        }
      }else{
        for(var a = 0;a < this.parent.parent.boardWidth*this.parent.parent.boardHeight;a += 1){
          var gridSquare = document.createElement("div");
          gridSquare.innerHTML = "";
          gridSquare.classList.add("BoardTile");
          gridSquare.style.backgroundColor = tileColors[a%2];
          gridSquare.style.left = (a%this.parent.parent.boardWidth)*32+boardOffset+"px";
          gridSquare.style.top = Math.floor(a/this.parent.parent.boardWidth)*32+boardOffset+"px";
          this.gridContainer.appendChild(gridSquare);
        }
      }
    }
  }
  
  //Create a simplified version of the current board object
  simplify(){
    //Declare the simplified version of the board object
    var simplifiedObj = {
      turnColor: this.turnColor,
      selectable: this.selectable,
      pieceXs: [],
      pieceYs: [],
      pieceTypes: [],
      pieceColors: [],
      pieceMoves: [],
      pieceDirects: []
    };
    
    //Loop through all child pieces and get their simplified versions
    for(var a = 0;a < this.pieces.length;a += 1){
      if(this.pieces[a] != undefined){
        simplifiedObj.pieceXs.push(this.pieces[a].getX());
        simplifiedObj.pieceYs.push(this.pieces[a].getY());
        simplifiedObj.pieceTypes.push(this.pieces[a].type);
        simplifiedObj.pieceColors.push(this.pieces[a].color);
        simplifiedObj.pieceMoves.push(this.pieces[a].moveAmount);
        simplifiedObj.pieceDirects.push(this.pieces[a].direction);
      }
    }
    return simplifiedObj;
  }
}

//A single piece, normally contained by a Board object
class Piece{
  //Parent Board, PieceID, Type, Color
  constructor(board,id,type,color,render = true){
    this.fid = board.parent.parent.id;
    this.tid = board.parent.id;
    this.bid = board.id;
    this.id = id;
    this.parent = board;
    
    this.hasVisuals = render;
    
    this.x = 0;
    this.y = 0;
    
    this.type = type;
    this.color = color; // 0 = Black, 1 = White
    this.moveAmount = 0;
    this.direction = -1; // -1 = Not set (currently only used for the pawn)
    
    this.selected = false;
    
    if(this.hasVisuals){
      this.container = document.createElement("div");
      this.container.classList.add("Piece");
      this.container.innerHTML = "[P]";
      this.parent.container.appendChild(this.container);
    }
    
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
    if(this.hasVisuals){
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
  }
  
  changeID(newid){
    this.id = newid;
  }
  
  render(){
    if(this.hasVisuals){
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
  }
  
  select(){
    this.selected = true;
    if(this.hasVisuals){
      this.container.style.backgroundColor = "#30c030";
    }
  }
  
  deselect(){
    this.selected = false;
    if(this.hasVisuals){
      this.container.style.backgroundColor = "";
    }
  }
  
  getX(){
    return this.x;
    ///return Math.round((parseInt(this.container.style.left)-boardOffset)/32);
  }
  
  getY(){
    return this.y;
    ///return Math.round((parseInt(this.container.style.top)-boardOffset)/32);
  }
  
  setX(x){
    this.x = x;
    if(this.hasVisuals){
      this.container.style.left = (x*32+boardOffset)+"px";
    }
  }
  
  setY(y){
    this.y = y;
    if(this.hasVisuals){
      this.container.style.top = (y*32+boardOffset)+"px";
    }
  }
}



// -- Functions for the game (These are global to save object memory) -- //

//Deselect the previous piece and select the new piece
function selectPiece(piece){
  if(selectedPiece != undefined){
    selectedPiece.deselect();
    if(selectedPiece == piece){
      //If the player selects the piece that is already selected, deselect it
      globalDeselect();
      return;
    }
  }
  if(piece.parent.id < piece.parent.parent.boards.length-1){
    console.warn("Huh, that's strange. Is this code modified in any way? If not, you should contact the site admin tell them how to reproduce this warning, because it should never happen.");
    alert("Is this code modified in any way?\nIf not, you should contact the site admin tell them how to reproduce this alert, because it should never happen.\nUntil this is fixed, you probably shouldn't exploit it.");
  }
  piece.select();
  selectedPiece = piece;
  
  if(piece.hasVisuals){
    addMoveVisuals(piece,getAvailableMoves(piece));
  }
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
    ///if(piece.type == 7 && ((piece.getY() == piece.parent.parent.parent.boardHeight-1 && piece.color !== playerColor) || (piece.getY() == 0 && piece.color === playerColor))){
    if(piece.type == 7 && ((piece.getY() == piece.parent.parent.parent.boardHeight-1 && piece.direction == 1) || (piece.getY() == 0 && piece.direction == 0))){
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
    newPiece.direction = piece.direction;
    
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
  ///The code in here is a mess. I might change it some time, but it works for now, and that's good enough for me.
  
  //Reset the movement visuals
  for(var a = 0;a < movementVisuals.length;a += 1){
    if(movementVisuals[a] != undefined){
      movementVisuals[a].remove();
      movementVisuals[a] = undefined;
    }
  }
  movementVisuals = [];
  
  if(moves.length < 1){
    console.warn("Warning: No moves supplied to create movement visuals");
    return;
  }
  
  function addListener(move){
    if(move[3] > 0){
      movementVisuals[a].addEventListener("click", function(){
        //Deselect the piece before doing anything
        globalDeselect();
        
        //Store the current game state as the previous move
        storePastMove();
        
        //Add the visuals indicating a previous move
        piece.parent.parent.parent.addPastMoveVisual(
          piece.bid,piece.tid,piece.getX(),piece.getY(),
          move[0].id,move[0].tid,move[1],move[2]
        );
        
        if(move[3] == 1){
          //Code for normal movement:
          
          if(piece.parent == move[0]){
            //Create a new board when a piece is moved
            var newboard = piece.parent.extendTimeline();
            
            //Confirm that the new board was successfully created
            if(newboard != undefined){
              //Move the piece (The one on the new instance of the board, not the original)
              movePiece(newboard.pieces[piece.id],move[1],move[2]);
            }else{
              throwError("An error occurred when trying to extend the timeline, please contact the system admin");
            }
          }else{
            //Create a new board and branch the timeline when a piece time travels
            var newboard1 = piece.parent.extendTimeline();
            var newboard2 = move[0].extendTimeline();
            
            //Confirm that the new boards were successfully created
            if(newboard1 != undefined && newboard2 != undefined){
              //Move the new instance of the piece to the new timeline
              movePiece(newboard1.pieces[piece.id],move[1],move[2],newboard2);
            }else{
              throwError("An error occurred when trying to extend the timeline(s), please contact the system admin");
            }
          }
        }else if(move[3] == 2){
          //Code for capturing:
          
          if(move[4].type == 2){
            win(piece.color);
          }
          
          //Check if the captured piece is on a different board
          if(piece.parent == move[4].parent){
            //Extend the current timeline
            var newboard = piece.parent.extendTimeline();
            
            //Make sure the new board was created properly
            if(newboard == undefined){
              throwError("Failed to extend timeline while capturing piece");
            }
            
            //Update the piece maps
            newboard.pieceTypeMap[move[4].getY()][move[4].getX()] = 0;
            newboard.pieceIDMap[move[4].getY()][move[4].getX()] = -1;
            
            //Remove the captured piece
            newboard.removePiece(move[4].id);
            
            //Move the capturing piece to its new position
            movePiece(newboard.pieces[piece.id],move[1],move[2]);
          }else{
            //Extend both timelines
            var newboard1 = piece.parent.extendTimeline();
            var newboard2 = move[4].parent.extendTimeline();
            
            //Make sure the new boards were created properly
            if(newboard1 == undefined || newboard2 == undefined){
              throwError("Failed to extend timeline(s) while capturing piece through time");
            }
            
            //Update the piece maps
            newboard2.pieceTypeMap[move[4].getY()][move[4].getX()] = 0;
            newboard2.pieceIDMap[move[4].getY()][move[4].getX()] = -1;
            
            //Remove the captured piece
            newboard2.removePiece(move[4].id);
            
            //Move the capturing piece to its new position
            movePiece(newboard1.pieces[piece.id],move[1],move[2],newboard2);
          }
        }
        
        move[0].parent.parent.updatePresentPosition();
      });
    }
  }
  
  for(var a = 0;a < moves.length;a += 1){
    //Create the visual element, position it and add it to the parent board
    movementVisuals[a] = document.createElement("div");
    var classes = ["MovementVisualBlocked","MovementVisualAvailable","CaptureVisual"];
    movementVisuals[a].classList.add(classes[moves[a][3]]);
    movementVisuals[a].id = "MV"+a;
    movementVisuals[a].style.left = moves[a][1]*32+boardOffset+"px";
    movementVisuals[a].style.top = moves[a][2]*32+boardOffset+"px";
    
    var board = moves[a][0];
    
    //Check which board to add the visual to
    if(board == undefined){
      //Set the baord variable to the piece's parent to simplify things later on
      board = piece.parent;
    }
    
    board.container.appendChild(movementVisuals[a]);
    
    addListener(moves[a]);
    
    //If the "customFunc" variable is a function, add it to a second click event attached to the movement visual
    if(typeof(moves[a][5]) == "function"){
      movementVisuals[a].addEventListener("click",moves[a][5]);
    }
    
    //If the game is online multiplayer, send the move to the server
    if(opponent == 1){
      movementVisuals[a].addEventListener("click",requestMoves);
    }
  }
}

//Calculate all possible locations that any given piece can move to
function getAvailableMoves(piece,includeBlocked = true,typeOverride = undefined){
  //Get the type from the piece, or use the supplied one
  var pieceType = (typeOverride == undefined ? piece.type : typeOverride);
  
  //[ (0 = Board), (1 = X), (2 = Y), (3 = Type), (4 = Target - optional - only for captures), (5 = Custom function - used for castling, etc.) ]
  var movementVisualCoords = [];
  
  var px = piece.getX();
  var py = piece.getY();
  
  var field = piece.parent.parent.parent;
  
  //Add a set of coordinates (and type) for a movement visual (as well as a target if it's a capture)
  function addMoveVisual(board,x,y,type = undefined,target = undefined,customFunc = undefined){
    //board, x, y, type (0 = blocked, 1 = move, 2 = capture), target (target piece, only if capture), custom movement function
    
    //If the type passed in is undefined (or if the type indicates a capture but there is no target piece given), it will be detected automatically from the coordinates
    if(type == undefined || (type == 2 && target == undefined)){
      if(board.pieceTypeMap[y][x] == 0){
        //Indicate that the move is blocked
        movementVisualCoords.push([board,x,y,1,undefined,customFunc]);
      }else{
        if(board.pieces[ board.pieceIDMap[y][x] ].color != piece.color){
          //Create a "capture" movement visual
          movementVisualCoords.push([board,x,y,2,board.pieces[ board.pieceIDMap[y][x] ],customFunc]);
        }else{
          //Create a "blocked" movement visual
          if(includeBlocked){
            movementVisualCoords.push([board,x,y,0,undefined,customFunc]);
          }
        }
      }
    }else{
      //Only a "blocked" visual is includeBlocked is true
      if(includeBlocked || type != 0){
        //Create a normal capture visual
        movementVisualCoords.push([board,x,y,type,target,customFunc]);
      }
    }
  }
  
  //Checks for the existence of a board and timeline (the ID of each is found by the given board & timeline "offset")
  function checkForRelativeBoard(bOffset,tOffset,startingBoard = piece.parent){
    if(
      startingBoard.id+bOffset >= 0 &&
      startingBoard.parent.id+tOffset >= 0 &&
      startingBoard.parent.id+tOffset < startingBoard.parent.parent.timelines.length &&
      startingBoard.id+bOffset < startingBoard.parent.parent.timelines[ startingBoard.parent.id+tOffset ].boards.length &&
      startingBoard.parent.parent.timelines[ startingBoard.parent.id+tOffset ].boards[ startingBoard.id+bOffset ] != undefined
    ){
      return true;
    }
    return false;
  }
  
  //A recursive function to check for all moves in a given direction (4D vector)
  function checkMovesRecursively(board,directions,_x,_y){
    //directions = [x,y,b,t];
    
    if(_x >= 0 && _x < piece.parent.parent.parent.boardWidth && _y >= 0 && _y < piece.parent.parent.parent.boardHeight){
      
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
  switch(pieceType){
    case 1:
      //The Stationary piece cannot move anywhere
      
      //Allow the piece to move anywhere for debugging purposes
      ///for(var t = 0;t < playField.timelines.length;t += 1){
      ///  //Loop through all the boards
      ///  for(var b = 0;b < playField.timelines[t].boards.length;b += 1){
      ///    if(playField.timelines[t].boards[b] != undefined){
      ///      var board = playField.timelines[t].boards[b];
      ///      //Loop through all tiles of each board
      ///      for(var x = 0;x < piece.parent.parent.parent.boardWidth;x += 1){
      ///        for(var y = 0;y < piece.parent.parent.parent.boardHeight;y += 1){
      ///          //Let the function detect which type of visual should be used (available move, blocked move, or capture)
      ///          addMoveVisual(board,x,y);
      ///        }
      ///      }
      ///    }
      ///  }
      ///}
      
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
        if(px+spaces[a][0] >= 0 && py+spaces[a][1] >= 0 && px+spaces[a][0] < piece.parent.parent.parent.boardWidth && py+spaces[a][1] < piece.parent.parent.parent.boardHeight){
          addMoveVisual(piece.parent,px+spaces[a][0],py+spaces[a][1]);
        }
        
        //Do the same thing, but this time check the relative boards for available moves through time
        
        //Check if the target board exists
        if(checkForRelativeBoard(spaces[a][0]*2,spaces[a][1])){
          
          var board = piece.parent.parent.parent.timelines[ piece.parent.parent.id+spaces[a][1] ].boards[ piece.parent.id+spaces[a][0]*2 ];
          
          addMoveVisual(board,px,py);
          
          //From each board, loop through the available same-board moves again
          for(var b = 0;b < spaces.length;b += 1){
            if(px+spaces[b][0] >= 0 && py+spaces[b][1] >= 0 && px+spaces[b][0] < piece.parent.parent.parent.boardWidth && py+spaces[b][1] < piece.parent.parent.parent.boardHeight){
              addMoveVisual(board,px+spaces[b][0],py+spaces[b][1]);
            }
          }
        }
      }
      
      //Check for castling possibility (rx = Rook start X, kxe = King end X, rxe = Rook end X)
      function checkCastling(rx,kxe,rxe){
        //Check if the position has a rook present
        if(piece.parent.pieceTypeMap[py][rx] == 6){
          if(piece.parent.pieces[ piece.parent.pieceIDMap[py][rx] ].moveAmount == 0){
            
            var dir = Math.sign(rx-px);
            
            //Check if the space in between is available
            for(var a = px+dir;a != rx;a += dir){
              if(piece.parent.pieceTypeMap[py][a] != 0){
                return;
              }
            }
            
            //Store the parent timeline and the ID of the new board outside of the function
            var parentTimeline = piece.parent.parent;
            var newBoardId = parentTimeline.boards.length;
            
            //Add a movement visual with an extra custom function
            addMoveVisual(piece.parent,kxe,py,1,undefined,function(){
              //Store the new board and the targetted rook objects
              var newBoard = parentTimeline.boards[newBoardId];
              var targetRook = newBoard.pieces[ piece.parent.pieceIDMap[py][rx] ];
              
              //Update the piece maps
              newBoard.pieceTypeMap[py][rx] = 0;
              newBoard.pieceIDMap[py][rx] = -1;
              newBoard.pieceTypeMap[py][rxe] = targetRook.type;
              newBoard.pieceIDMap[py][rxe] = targetRook.id;
              
              //Move the rook to its new position
              targetRook.setX(rxe);
              
              //Increment the amount of moves the rook has made
              targetRook.moveAmount += 1;
            });
          }else{
            addMoveVisual(piece.parent,kxe,py,0);
          }
        }
      }
      
      //Call the above function for the various layouts (no longer used as of 1.2.0.8)
      ///if(piece.moveAmount == 0 && checkForPieceDanger(piece,false).length < 1){
      ///  if((chosenLayout == 0 || chosenLayout == 2 || chosenLayout == 3) && piece.parent.parent.parent.boardWidth == 8){
      ///    //Default board (8x8)
      ///    
      ///    checkCastling(7,6,5);
      ///    checkCastling(0,2,3);
      ///  }else if((chosenLayout == 1) && piece.parent.parent.parent.boardWidth == 8){
      ///    //Defended pawn (8x8)
      ///    
      ///    checkCastling(7,5,4);
      ///    checkCastling(0,1,2);
      ///  }
      ///}
      
      //Loop through the castling rules in the extra data from the game save
      if(extraGameData.Castling != undefined){
        for(var a = 0;a < extraGameData.Castling.length;a += 1){
          checkCastling(extraGameData.Castling[a][0],extraGameData.Castling[a][1],extraGameData.Castling[a][2]);
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
        for(var a = 1;(dir%2 == 1 && a <= px || dir%2 == 0 && a < piece.parent.parent.parent.boardWidth-px) && (dir < 2 && a < piece.parent.parent.parent.boardHeight-py || dir >= 2 && a <= py);a += 1){
          //Store the coordinates of the tile that is currently being checked
          var _x = (dir%2 == 0)?(px+a):(px-a);
          var _y = (dir   <  2)?(py+a):(py-a);
          
          if(_x >= 0 && _y >= 0 && _x < piece.parent.parent.parent.boardWidth && _y < piece.parent.parent.parent.boardHeight){
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
        for(var a = (dir < 2 ? px+1-(dir%2)*2 : py+1-(dir%2)*2);(a >= 0 && (dir < 2 && a < piece.parent.parent.parent.boardWidth || dir >= 2 && a < piece.parent.parent.parent.boardHeight));a += (dir%2 == 0?1:-1)){
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
        for(var a = 1;(dir%2 == 1 && a <= px || dir%2 == 0 && a < piece.parent.parent.parent.boardWidth-px) && (dir < 2 && a < piece.parent.parent.parent.boardHeight-py || dir >= 2 && a <= py);a += 1){
          //Store the coordinates of the tile that is currently being checked
          var _x = (dir%2 == 0)?(px+a):(px-a);
          var _y = (dir   <  2)?(py+a):(py-a);
          
          if(_x >= 0 && _y >= 0 && _x < piece.parent.parent.parent.boardWidth && _y < piece.parent.parent.parent.boardHeight){
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
        if(px+spaces[a][0] >= 0 && py+spaces[a][1] >= 0 && px+spaces[a][0] < piece.parent.parent.parent.boardWidth && py+spaces[a][1] < piece.parent.parent.parent.boardHeight){
          addMoveVisual(piece.parent,px+spaces[a][0],py+spaces[a][1]);
        }
      }
      
      //Calculate the time-travel moves of the knight
      function checkKnightMoves(board,distance,direction){
        //Loop through the 4 orthogonal directions (0 = Left/East, 2 = Right/West, 3 = Down/South, 4 = Up/North)
        for(var dir = 0;dir < 4;dir += 1){
          //Calculate the coordinates of the movement visual
          var _x = px+((dir < 2)?distance-(dir%2)*2*distance:0);
          var _y = py+((dir < 2)?0:distance-(dir%2)*2*distance);
          
          //Check that the visual is within the bounds of the board
          if(_x >= 0 && _y >= 0 && _x < piece.parent.parent.parent.boardWidth && _y < piece.parent.parent.parent.boardHeight){
            addMoveVisual(board,_x,_y);
          }
        }
      }
      
      //Loop through the 4 orthogonal directions (0 = Left/East, 2 = Right/West, 3 = Down/South, 4 = Up/North)
      for(var dir = 0;dir < 4;dir += 1){
        //Call the function twice per direction
        for(var a = 1;a <= 2;a += 1){
          //Check that the target board exists
          if(checkForRelativeBoard(((dir < 2)?2-(dir%2)*4:0)*a,((dir < 2)?0:1-(dir%2)*2)*a)){
            var board = piece.parent.parent.parent.timelines[ piece.parent.parent.id+((dir < 2)?0:1-(dir%2)*2)*a ].boards[ piece.parent.id+((dir < 2)?2-(dir%2)*4:0)*a ];
            //Call the function for each direction
            checkKnightMoves(board,3-a,dir);
          }
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
        for(var a = (dir < 2 ? px+1-(dir%2)*2 : py+1-(dir%2)*2);(a >= 0 && (dir < 2 && a < piece.parent.parent.parent.boardWidth || dir >= 2 && a < piece.parent.parent.parent.boardHeight));a += (dir%2 == 0?1:-1)){
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
      
      //The movement direction of the pawn
      var dir = 1;
      
      if(piece.direction == -1 || piece.direction == undefined || piece.direction > 1){
        //Test whether the piece should move updard or downward (relative to the player's view)
        ///if(piece.color === playerColor && !(opponent == 1 && playerColor == 1)){
        if(piece.color === 0){
          dir = -1;
        }
      }else{
        // Direction 0 = White
        dir = (piece.direction == 0?-1:1);
      }
      
      //Make sure that the pawn is not at the end of the board, but allow for the pawn to be at the very back (for custom layouts)
      if((py+dir >= 0 || dir == 1) && (py+dir < piece.parent.parent.parent.boardHeight || dir == -1)){
        //Allow the piece to move forward by one space if available
        if(piece.parent.pieceTypeMap[py+dir][px] == 0){
          addMoveVisual(piece.parent,px,py+dir,1);
        }else{
          addMoveVisual(piece.parent,px,py+dir,0);
        }
        
        //Allow the piece to capture on the forward-right diagonal
        if(px+1 < piece.parent.parent.parent.boardWidth){
          //Normal capture
          if(piece.parent.pieceTypeMap[py+dir][px+1] != 0 && piece.parent.pieces[ piece.parent.pieceIDMap[py+dir][px+1] ].color != piece.color){
            addMoveVisual(piece.parent,px+1,py+dir,2);
          }else{
            //Check for En Passant
            if(
              extraGameData.EnPassant == true &&
              py+dir*2 < piece.parent.parent.parent.boardHeight &&
              py+dir*2 >= 0 &&
              piece.parent.pieceTypeMap[py][px+1] == 7 &&
              checkForRelativeBoard(-1,0) &&
              piece.parent.parent.boards[piece.bid-1].pieceTypeMap[py+dir*2][px+1] == 7 &&
              piece.parent.pieces[ piece.parent.pieceIDMap[py][px+1] ].color != piece.color &&
              piece.parent.pieces[ piece.parent.pieceIDMap[py][px+1] ].moveAmount == 1
            ){
              addMoveVisual(piece.parent,px+1,py+dir,2,piece.parent.pieces[ piece.parent.pieceIDMap[py][px+1] ]);
            }else{
              addMoveVisual(piece.parent,px+1,py+dir,0);
            }
          }
        }
        
        //Allow the piece to capture on the forward-left diagonal
        if(px-1 >= 0){
          //Normal capture
          if(piece.parent.pieceTypeMap[py+dir][px-1] != 0){
            if(piece.parent.pieces[ piece.parent.pieceIDMap[py+dir][px-1] ].color != piece.color){
              addMoveVisual(piece.parent,px-1,py+dir,2);
            }else{
              addMoveVisual(piece.parent,px-1,py+dir,0);
            }
          }else{
            //Check for En Passant
            if(
              extraGameData.EnPassant == true &&
              py+dir*2 < piece.parent.parent.parent.boardHeight &&
              py+dir*2 >= 0 &&
              piece.parent.pieceTypeMap[py][px-1] == 7 &&
              checkForRelativeBoard(-1,0) &&
              piece.parent.parent.boards[piece.bid-1].pieceTypeMap[py+dir*2][px-1] == 7 &&
              piece.parent.pieces[ piece.parent.pieceIDMap[py][px-1] ].color != piece.color &&
              piece.parent.pieces[ piece.parent.pieceIDMap[py][px-1] ].moveAmount == 1
            ){
              addMoveVisual(piece.parent,px-1,py+dir,2,piece.parent.pieces[ piece.parent.pieceIDMap[py][px-1] ]);
            }else{
              addMoveVisual(piece.parent,px-1,py+dir,0);
            }
          }
        }
        
        //If it's the piece's first move, allow it to move one extra space forward
        if(extraGameData.PawnDoubleMove == true && piece.moveAmount == 0){
          if(piece.parent.pieceTypeMap[py+dir][px] == 0 && piece.parent.pieceTypeMap[py+dir*2][px] == 0){
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
      if(extraGameData.PawnDoubleMove == true && piece.moveAmount == 0){
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
      console.warn("Warning: Attempted calculation of the moves of an invalid piece",piece);
  }
  
  return movementVisualCoords;
}


// -- Check for piece danger and check/mate -- //

//Check if a piece is in danger of being captured
function checkForPieceDanger(piece,imediateThreat = true){
  //An array storing a reference to all pieces that could be threatening the piece
  var piecesInRange = [];
  
  //Get all the queen and knight moves, centred on the king
  var combinedMoves = getAvailableMoves(piece,false,3).concat(getAvailableMoves(piece,false,5));
  
  var attackers = [];
  
  //Loop through all moves
  for(var a = 0;a < combinedMoves.length;a += 1){
    //Check if the move is a capture
    if(combinedMoves[a][3] == 2){
      var attacker = combinedMoves[a][4];
      //Make sure the attacker is able to move. If imediateThreat is true, make sure the threatening piece is on it's own color board)
      if(attacker.parent.selectable && (!imediateThreat || attacker.color == attacker.parent.turnColor)){
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
  
  //Loop through all the kings in the field
  for(var t = 0;t < playField.timelines.length;t += 1){
    for(var b = 0;b < playField.timelines[t].boards.length;b += 1){
      var board = playField.timelines[t].boards[b];
      if(board != undefined){
        for(var p = 0;p < board.pieces.length;p += 1){
          var piece = board.pieces[p];
          //Check that the piece exists and is a king
          if(piece != undefined && piece.type == 2){
            
            //Use the "checkForPieceDanger" on each king (Allow detection of next-turn threats so that the player can check before they make a move)
            var threateningPieces = checkForPieceDanger(piece,false);
            if(threateningPieces.length > 0){
              
              //Report each king in check to the player
              console.log((piece.color == 0?"White":"Black")+" is in check");
              console.log(piece);
              console.log(threateningPieces);
              alert((piece.color == 0?"White":"Black")+" King (L"+piece.tid+",T"+Math.floor(piece.bid/2)+",X"+piece.getX()+",Y"+piece.getY()+") is threatened by: "+pieceNames[threateningPieces[0].type]+" (L"+threateningPieces[0].tid+",T"+Math.floor(threateningPieces[0].bid/2)+",X"+threateningPieces[0].getX()+",Y"+threateningPieces[0].getY()+")"+(threateningPieces.length > 1 ? (" and "+(threateningPieces.length-1)+" more") : ""));
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
  try{
    var CheckMateBtn = document.getElementById("CheckMateBtn");
    CheckMateBtn.disabled = true;
    CheckMateBtn.innerHTML = "Checking for mate...";
    
    ///var t0 = performance.now();
    
    function checkIfStillCheck(field,color){
      for(var t = 0;t < field.timelines.length;t += 1){
        for(var b = 0;b < field.timelines[t].boards.length;b += 1){
          var board = field.timelines[t].boards[b];
          if(board != undefined){
            for(var p = 0;p < board.pieces.length;p += 1){
              var piece = board.pieces[p];
              //Check that the piece exists and is a king
              if(piece != undefined && piece.type == 2 && piece.color == color){
                
                //Use the "checkForPieceDanger" on each king (Allow detection of next-turn threats so that the player can check before they make a move)
                var threateningPieces = checkForPieceDanger(piece,false);
                if(threateningPieces.length > 0){
                  return true;
                }
              }
            }
          }
        }
      }
      return false;
    }
    
    function testForMoves(king){
      var parentField = king.parent.parent.parent;
      
      //Loop through every piece
      for(var t = 0;t < parentField.timelines.length;t += 1){
        for(var b = 0;b < parentField.timelines[t].boards.length;b += 1){
          var board = parentField.timelines[t].boards[b];
          if(board != undefined && board.selectable){
            for(var p = 0;p < board.pieces.length;p += 1){
              var piece = board.pieces[p];
              //Check that the piece exists and is the same color as the king
              if(piece != undefined && piece.color == king.color){
                //Get all moves the piece can make
                var moves = getAvailableMoves(piece,false);
                
                for(var a = 0;a < moves.length;a += 1){
                  if(moves[a][3] > 0){
                    //Clone the main game field to use for testing a piece's moves
                    var testField = playField.clone(1,false);
                    
                    //Get the equivalent piece in the testfield
                    var testPiece = testField.getPiece(piece.bid,piece.tid,piece.getX(),piece.getY());
                    
                    var movingKing = false;
                    if(testPiece == testField.getPiece(king.bid,king.tid,king.getX(),king.getY())){
                      movingKing = true;
                    }
                    
                    //Get the equivalent move of the equivalent piece
                    var move = getAvailableMoves(testPiece,false)[a];
                    
                    if(move[3] == 1){
                      //Code for normal movement:
                      
                      if(testPiece.parent == move[0]){
                        //Create a new board when a piece is moved
                        var newboard = testPiece.parent.extendTimeline();
                        
                        //Confirm that the new board was successfully created
                        if(newboard != undefined){
                          //Move the piece (The one on the new instance of the board, not the original)
                          movePiece(newboard.pieces[testPiece.id],move[1],move[2]);
                        }else{
                          throwError("An error occurred when trying to extend the timeline, please contact the system admin");
                        }
                      }else{
                        //Create a new board and branch the timeline when a piece time travels
                        var newboard1 = testPiece.parent.extendTimeline();
                        var newboard2 = move[0].extendTimeline();
                        
                        //Confirm that the new boards were successfully created
                        if(newboard1 != undefined && newboard2 != undefined){
                          //Move the new instance of the piece to the new timeline
                          movePiece(newboard1.pieces[testPiece.id],move[1],move[2],newboard2);
                        }else{
                          throwError("An error occurred when trying to extend the timeline(s), please contact the system admin");
                        }
                      }
                    }else if(move[3] == 2){
                      //Code for capturing:
                      
                      //Check if the captured piece is on a different board
                      if(testPiece.parent == move[4].parent){
                        //Extend the current timeline
                        var newboard = testPiece.parent.extendTimeline();
                        
                        //Make sure the new board was created properly
                        if(newboard == undefined){
                          throwError("Failed to extend timeline while capturing piece");
                        }
              
                        //Update the piece maps
                        newboard.pieceTypeMap[move[4].getY()][move[4].getX()] = 0;
                        newboard.pieceIDMap[move[4].getY()][move[4].getX()] = -1;
                        
                        //Remove the captured piece
                        newboard.removePiece(move[4].id);
                        
                        //Move the capturing piece to its new position
                        movePiece(newboard.pieces[testPiece.id],move[1],move[2]);
                      }else{
                        //Extend both timelines
                        var newboard1 = testPiece.parent.extendTimeline();
                        var newboard2 = move[4].parent.extendTimeline();
                        
                        //Make sure the new boards were created properly
                        if(newboard1 == undefined || newboard2 == undefined){
                          throwError("Failed to extend timeline(s) while capturing piece through time");
                        }
                        
                        //Update the piece maps
                        newboard2.pieceTypeMap[move[4].getY()][move[4].getX()] = 0;
                        newboard2.pieceIDMap[move[4].getY()][move[4].getX()] = -1;
                        
                        //Remove the captured piece
                        newboard2.removePiece(move[4].id);
                        
                        //Move the capturing piece to its new position
                        movePiece(newboard1.pieces[testPiece.id],move[1],move[2],newboard2);
                      }
                    }
                    
                    ///console.log(piece);
                    ///console.log(moves[a]);
                    
                    //Check if the king is still in check
                    if(!checkIfStillCheck(testField,king.color)){
                      ///console.log("King is not mated");
                      ///console.log("King:",testPiece);
                      ///console.log("Possible move:",move);
                      return true;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      return false;
    }
    
    //Loop through all the kings in the field
    for(var t = 0;t < playField.timelines.length;t += 1){
      for(var b = 0;b < playField.timelines[t].boards.length;b += 1){
        var board = playField.timelines[t].boards[b];
        if(board != undefined){
          for(var p = 0;p < board.pieces.length;p += 1){
            var piece = board.pieces[p];
            //Check that the piece exists and is a king
            if(piece != undefined && piece.type == 2){
              
              var tp = performance.now();
              
              //Use the "checkForPieceDanger" on each king
              var threateningPieces = checkForPieceDanger(piece,false);
              if(threateningPieces.length > 0){
                
                //For each king, check every move of every piece (essentially just bruteforce an answer), and if none of them get the king out of check, it's checkmate
                //Also check if the opponent can move the piece straight away (their turn). If so, it is obviously game over. Note: This will only occur if the player does not check for checkmate before they move.
                if(threateningPieces[0].color == piece.parent.turnColor || !testForMoves(piece)){
                  console.log(performance.now() - tp,"ms");
                  
                  console.log((piece.color == 0?"White":"Black")+" is mated",piece);
                  console.log("Threat: ",threateningPieces);
                  alert((piece.color == 0?"White":"Black")+" could be in checkmate");
                }
              }
            }
          }
        }
      }
    }
    
    ///console.log(performance.now() - t0,"ms");
  }catch(e){
    console.error(e);
    alert("A fatal error occurred while attempting to check for checkmate.\nPlease export your game and send it to the maintainer to get this issue fixed.");
  }
  
  CheckMateBtn.disabled = false;
  CheckMateBtn.innerHTML = "Check for Checkmate";
}



// -- Meta -- //

//Create a new game with given paramaters (yet to be fully implemented)
function newGame(layout = 0){
  gameContainer.innerHTML = "";
  
  //Make an asynchronous request to the server, confirming that a game with the current game ID exists
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      //Create a new Field with ID 0 from the simplified object in the JSON layout file
      playField = new Field(0,JSON.parse(this.responseText));
      
      if(opponent == 1){
        //Perform any syncing to/from the server that is required
        setTimeout(routineServerSync,200);
      }
      
      playField.updatePresentPosition();
    }
    if(this.status == 404){
      throwError("Supplied layout was not found on the server");
    }
  };
  xmlhttp.open("GET","Layouts/"+layout+".json",true);
  xmlhttp.send();
}

//Delete the old game and create a new one [DEBUG]
function resetGame(){
  globalDeselect();
  
  playField.container.remove();
  playField = undefined;
  newGame(chosenLayout);
  
  pastMoves = [];
  
  console.log("- - - - - - - -\nReset Game\n- - - - - - - -");
}

//Store a simplified version of the previous game state (for undo functionality)
function storePastMove(){
  //Add the simplified version of the current (soon to be previous) game state (which is just field 0)
  pastMoves[playField.moveAmounts[opponent == 0 ? 0 : (playerColor+1)]] = playField.simplify();
  
  //If the amount of stored game states exceeds the limit, remove the one [limit] moves old
  if(pastMoves.length >= pastMoveLimit){
    pastMoves[playField.moveAmounts[opponent == 0 ? 0 : (playerColor+1)]-pastMoveLimit] = undefined;
  }
}

//Revert the game to a previous game state
function undoMove(){
  //Confirm the undo in online multiplayer
  if(opponent == 1){
    if(!confirm("Undoing your move will also reverse any moves the opponent has made since.\nAre you sure you want to revert the game to before your last move?")){
      return;
    }
  }
  
  var prevMove = playField.moveAmounts[opponent == 0 ? 0 : (playerColor+1)]-1;
  
  if(prevMove < 0){
    console.log("Cannot undo move");
    alert("Previous move unavailable");
    return;
  }
  
  var pastMoveObj = pastMoves[prevMove];
  
  if(pastMoveObj == undefined){
    console.warn("Warning: Previous move not available");
    alert("Previous move unavailable");
    return;
  }
  
  playField.container.remove();
  playField = new Field(0,pastMoveObj);
  playField.updatePresentPosition();
  
  //Send the game to the server
  if(opponent == 1){
    syncGameToServer();
  }
  
  console.log("Reverted gamestate");
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

//Render the entire field to an image (this is handled by a seperate page)
function saveToImage(){
  var form = document.getElementById("SaveImageForm");
  form.data.value = JSON.stringify(playField.simplify());
  form.submit();
}

//Create an element that looks like an arrow pointing from one location (x1,y1) to another (x2,y2)
function createArrow(x1,y1,x2,y2,color = "#808080"){
  var arrow = document.createElement("div");
  arrow.classList.add("SmallArrow");
  
  //Create the shaft
  var shaft = document.createElement("div");
  shaft.style.position = "absolute";
  shaft.style.backgroundColor = color;
  shaft.style.width = (Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))+4)+"px";
  shaft.style.height = 16+"px";
  shaft.style.left = "-8px";
  shaft.style.top = "-8px";
  
  //Create the tip
  var tip;
  if(SupportsSVG){
    var tip = SVGs[1].cloneNode(true);
    tip.childNodes[1].setAttribute("fill",color);
  }else{
    var tip = document.createElement("div");
    tip.style.width = "0px";
    tip.style.height = "0px";
    tip.style.borderTop = "16px solid transparent";
    tip.style.borderLeft = "16px solid "+color;
    tip.style.borderBottom = "16px solid transparent";
    tip.style.backgroundColor = "";
  }
  tip.style.position = "absolute";
  tip.style.left = (Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))-8)+"px";
  tip.style.top = "-16px";
  
  arrow.appendChild(shaft);
  arrow.appendChild(tip);
  
  arrow.style.transform = "rotate("+(Math.atan2(y1-y2,x1-x2)+Math.PI)+"rad)";
  arrow.style.left = x1+"px";
  arrow.style.top = y1+"px";
  
  return arrow;
}



// -- Export/Import Game -- //

//Export the current game as JSON
function exportGame(){
  var simplified = playField.simplify();
  
  //Store the the JSON text in a URI encoded 
  ///var dataString = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(simplified,null,2));
  var dataString = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(simplified)); //Compressed format (no newlines, no extra spaces)
  
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
    
    //Remove the contents of the current game
    playField.container.remove();
    //Create a new filed from the imported JSON data
    playField = new Field(0,importedObject);
    
    playField.updatePresentPosition();
    
    pastMoves = [];
    
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



// -- Network code -- //

///socket = new WebSocket("ws://127.0.0.1:8002");
socketOpen = false;
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
          if(playField.moveAmounts[0] < serverMoveAmounts[0] || playField.moveAmounts[((playerColor+1)%2)+1] != serverMoveAmounts[((playerColor+1)%2)+1]){
            syncGameFromServer();
          }else if(playField.moveAmounts[0] > serverMoveAmounts[0] || playField.moveAmounts[playerColor+1] > serverMoveAmounts[playerColor+1]){
            syncGameToServer();
          }
        }
      }
    }
  };
  
  if(password == "" || password == undefined){
    xmlhttp.open("GET","../Server/checkMoves.php?id="+gameID,true);
    ///xmlhttp.open("GET","http://"+nodeJSURL+"checkMoves?id="+gameID,true);
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
        
        if(serverObject.boardWidth != playField.boardWidth || serverObject.boardHeight != playField.boardHeight){
          throwError("Board width/height of server-side game does not match that of the current game\nCurrent game: "+playField.boardWidth+"x"+playField.boardHeight+"\nImported game: "+importedObject.boardWidth+"x"+importedObject.boardHeight);
          return;
        }
        
        //Remove the contents of the current game
        playField.container.remove();
        //Create a new field from the imported JSON data
        playField = new Field(0,serverObject);
        
        playField.updatePresentPosition();
        
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
  
  var JSONString = JSON.stringify(playField.simplify());
  
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



// -- Executed on page load -- //

//Called by the "onload()" function of a the body element, which calls the functions to start a game
function startJS(){
  if(opponent == 0){
    //[Opponent 0] - Local multiplayer
    
    document.getElementById("MainSubtitle").innerHTML = "Local Multiplayer";
    document.getElementById("ColourSubtitle").innerHTML = "";
    
    newGame(chosenLayout);
    
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
    
    ///document.getElementById("ShareBtn").hidden = false;
    
    newGame(chosenLayout);
    
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
    
    newGame(chosenLayout);
  }
}









