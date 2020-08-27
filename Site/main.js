//Anthony Wilson - 4DChess

//24 July 2020
//24/7/20



// -- Functions for menu buttons -- \\

//Button that changes the layout back to the default Main Menu
function MainMenu(){
  document.getElementById("MainMenu").hidden = false;
  document.getElementById("VersusMenu").hidden = true;
  document.getElementById("RulesMenu").hidden = true;
  document.getElementById("SettingsMenu").hidden = true;
}

//Button that changes the layout to the Versus menu
function VersusBtn(){
  document.getElementById("MainMenu").hidden = true;
  document.getElementById("VersusMenu").hidden = false;
}

//Button that will eventually go to a Puzzle Select menu
function PuzzlesBtn(){
  //document.getElementById("MainMenu").hidden = true;
  alert("[Placeholder]\nThere's nothing here yet");
}

//Button that changes the layout to the Rules page
function RulesBtn(){
  document.getElementById("MainMenu").hidden = true;
  document.getElementById("RulesMenu").hidden = false;
}

//Button that changes the layout to the Settings menu
function SettingsBtn(){
  document.getElementById("MainMenu").hidden = true;
  document.getElementById("SettingsMenu").hidden = false;
}

//Button that will eventually go to a full Credits page
function CreditsBtn(){
  //document.getElementById("MainMenu").hidden = true;
  alert("[Placeholder]\nThis is an open-source game heavily inspired by '5D Chess With Multiverse Time Travel'");
}

//2 Player local
function VersusBtn2PL(){
  document.getElementById("VersusSubmenu2PL").hidden = false;
  document.getElementById("VersusSubmenu2PJ").hidden = true;
  document.getElementById("VersusSubmenu2PC").hidden = true;
  document.getElementById("VersusSubmenuCPU").hidden = true;
}
//2 Player online - Join
function VersusBtn2PJ(){
  document.getElementById("VersusSubmenu2PL").hidden = true;
  document.getElementById("VersusSubmenu2PJ").hidden = false;
  document.getElementById("VersusSubmenu2PC").hidden = true;
  document.getElementById("VersusSubmenuCPU").hidden = true;
}
//2 Player online - Create
function VersusBtn2PC(){
  document.getElementById("VersusSubmenu2PL").hidden = true;
  document.getElementById("VersusSubmenu2PJ").hidden = true;
  document.getElementById("VersusSubmenu2PC").hidden = false;
  document.getElementById("VersusSubmenuCPU").hidden = true;
}
//Versus computer
function VersusBtnCPU(){
  document.getElementById("VersusSubmenu2PL").hidden = true;
  document.getElementById("VersusSubmenu2PJ").hidden = true;
  document.getElementById("VersusSubmenu2PC").hidden = true;
  document.getElementById("VersusSubmenuCPU").hidden = false;
}

//Create a new local game
function NewLocalGame(){
  var LayoutSelector = document.getElementById("LocalLayoutSelector");
  var ChosenLayout = LayoutSelector.options[LayoutSelector.selectedIndex].value;
  
  window.location.href = "Play/?vs=0&l="+ChosenLayout;
}

//Join an existing online game
function JoinOnlineGame(){
  document.getElementById("JoinOnlineStatus").innerHTML = "Verifying...";
    
  var ColorSelectorButtons = document.getElementsByName("JoinOnlineColorSelector");
  var PlayerColor = 0;
  for(a = 0;a < ColorSelectorButtons.length;a += 1){
    if(ColorSelectorButtons[a].checked){
      PlayerColor = a;
    }
  }
  var GameID = document.getElementById("JoinOnlineCode").value;
  
  if(GameID == "00000000" || GameID == "" || GameID == undefined){
    document.getElementById("JoinOnlineStatus").innerHTML = "Illegal game ID, please supply a new one";
  }
  //This synchronous XMLHttpRequest will give a deprecation warning, but should work fine
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET","Server/getLiveGameFromID.php?id="+GameID,false);
  xmlhttp.send();
  
  //Check the result from the server, and report it to the user through a clear message
  if(xmlhttp.responseText == 0){
    document.getElementById("JoinOnlineStatus").innerHTML = "Joining online game...";
    window.location.href = "Play/?vs=1&id="+GameID+"&c="+PlayerColor;
  }else{
    document.getElementById("JoinOnlineStatus").innerHTML = "Illegal game ID, please supply a new one";
  }
}

//Create a new online game
function CreateOnlineGame(){
  document.getElementById("CreateOnlineStatus").innerHTML = "Creating new game...";
  
  var ColorSelectorButtons = document.getElementsByName("CreateOnlineColorSelector");
  var PlayerColor = 0;
  for(a = 0;a < ColorSelectorButtons.length;a += 1){
    if(ColorSelectorButtons[a].checked){
      PlayerColor = a;
    }
  }
  var LayoutSelector = document.getElementById("CreateOnlineLayoutSelector");
  var ChosenLayout = LayoutSelector.options[LayoutSelector.selectedIndex].value;
  var GameID = document.getElementById("CreateOnlineCode").value;
  if(GameID == "" || GameID == undefined){
    document.getElementById("CreateOnlineStatus").innerHTML = "Please supply a game ID";
  }
  
  //This synchronous XMLHttpRequest will give a deprecation warning, but should work fine
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET","Server/newGame.php?l="+ChosenLayout+"&id="+GameID,false);
  xmlhttp.send();
  var serverResult = xmlhttp.responseText;
  
  //Check the result from the server, and report it to the user through a clear message
  switch(parseInt(serverResult)){
    case 0:
      document.getElementById("CreateOnlineStatus").innerHTML = "Successfully created new game, redirecting...";
      window.location.href = "Play/?vs=1&id="+GameID+"&c="+PlayerColor;
      break;
    case 1:
      document.getElementById("CreateOnlineStatus").innerHTML = "Illegal game ID, please supply a new one";
      break;
    case 2:
      document.getElementById("CreateOnlineStatus").innerHTML = "Game ID already in use, please supply different one";
      break;
    case 3:
      document.getElementById("CreateOnlineStatus").innerHTML = "Server-side write error, please contact the system admin";
      break;
    default:
      document.getElementById("CreateOnlineStatus").innerHTML = "An unknown error occured, please try again, or contact the system admin";
  }
}
