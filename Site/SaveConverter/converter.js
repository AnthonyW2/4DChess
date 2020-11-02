//Code created by Anthony Wilson

//2 November 2020
//2/11/20



// (Maj Version).(Min Version).(Patch).(Build)-(Release)
const version = "1.2.0.12-0";



//Export the current game as JSON
function exportSave(){
  var simplified = JSON.parse(document.getElementById("SaveTextOutput").value);
  
  //Store the the JSON text in a URI encoded 
  var dataString = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(simplified,null,2));
  ///var dataString = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(simplified)); //Compressed format (no newlines, no extra spaces)
  
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
    document.getElementById("SaveTextInput").value = event.target.result;
    document.getElementById("SaveTextOutput").value = "";
  };
  
  //Read the file as one string of text
  reader.readAsText(this.files[0]);
}

//Convert save data from 1.1 to 1.2
function convertSave(){
  var oldObj = JSON.parse(document.getElementById("SaveTextInput").value);
  
  console.log("1.1 (input) object:",oldObj);
  
  //Create the skeleton of the new object
  var newObj = {
    version: version,
    moveAmounts: oldObj.moveAmounts,
    boardWidth: oldObj.boardWidth,
    boardHeight: oldObj.boardHeight,
    data: {},
    pastMoves: [],
    timelines: []
  };
  
  //Process extra data (added in 1.2)
  if(oldObj.boardWidth == 8 && oldObj.boardWidth == 8){
    newObj.data = {
      Castling: [
        [7,6,5],
        [0,2,3]
      ],
      PawnDoubleMove: true,
      EnPassant: true
    };
  }
  
  console.log(oldObj.movementVisuals.length);
  
  //Process past moves
  for(var a = 0;a < Math.floor(oldObj.movementVisuals.length/2);a += 1){
    console.log("a: ",a);
    newObj.pastMoves.push([
      oldObj.movementVisuals[a*2][1],
      oldObj.movementVisuals[a*2][0],
      oldObj.movementVisuals[a*2][2],
      oldObj.movementVisuals[a*2][3],
      oldObj.movementVisuals[a*2+1][1],
      oldObj.movementVisuals[a*2+1][0],
      oldObj.movementVisuals[a*2+1][2],
      oldObj.movementVisuals[a*2+1][3]
    ]);
  }
  
  //Process the timelines
  for(var t = 0;t < oldObj.timelines.length;t += 1){
    if(oldObj.timelines[t] != undefined){
      newObj.timelines.push({
        ancestor: 0,
        boards: []
      });
      
      //Process the boards
      for(var b = 0;b < oldObj.timelines[t].boards.length;b += 1){
        var oldBoard = oldObj.timelines[t].boards[b];
        if(oldBoard != undefined && oldBoard != null){
          newObj.timelines[t].boards.push({
            turnColor: oldBoard.turnColor,
            selectable: oldBoard.selectable,
            pieceXs: [],
            pieceYs: [],
            pieceTypes: [],
            pieceColors: [],
            pieceMoves: [],
            pieceDirects: [],
          });
          
          var newBoard = newObj.timelines[t].boards[b];
          
          //Process the pieces (this changed the most between 1.1 and 1.2)
          for(var p = 0;p < oldBoard.pieces.length;p += 1){
            if(oldBoard.pieces[p] != undefined && oldBoard.pieces[p] != null){
              newBoard.pieceXs.push(oldBoard.pieces[p].x);
              newBoard.pieceYs.push(oldBoard.pieces[p].y);
              newBoard.pieceTypes.push(oldBoard.pieces[p].type);
              newBoard.pieceColors.push(oldBoard.pieces[p].color);
              newBoard.pieceMoves.push(oldBoard.pieces[p].moveAmount);
              newBoard.pieceDirects.push(oldBoard.pieces[p].direction);
            }
          }
        }else{
          newObj.timelines[t].boards.push(null);
        }
      }
    }
  }
  
  console.log("1.2 (output) object:",newObj);
  
  document.getElementById("SaveTextOutput").value = JSON.stringify(newObj,null,2);
}

//Attach a "change" event listener to the file upload element to execute the importFromFile() function when a file is attached
document.getElementById("SaveFileInput").addEventListener("change", importFromFile);
