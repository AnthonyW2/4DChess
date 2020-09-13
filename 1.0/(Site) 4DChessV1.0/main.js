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



// -- String-operation functions -- \\

//Create a random game ID for a new game
function RandomiseGameID(){
  var randID = "";
  
  for(var a = 0;a < 8;a += 1){
    //Generate a random alphanumeric character and add it to the "randID" string
    var character = Math.floor(Math.random()*62);
    randID += String.fromCharCode(character+48+((character > 9)?(7+((character > 35)?6:0)):0));
  }
  
  document.getElementById("CreateOnlineCode").value = randID;
}

//Check if a given string is alphanumeric
function CheckAlphanumeric(s){
  for(var a = 0;a < s.length;a += 1){
    var charVal = s.charCodeAt(a);
    if(charVal < 48 || (charVal > 57 && charVal < 65) || (charVal > 90 && charVal < 97) || charVal > 122){
      return false;
    }
  }
  return true;
}



// -- Join/Create game functions -- \\

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
    return;
  }
  if(!CheckAlphanumeric(GameID)){
    document.getElementById("JoinOnlineStatus").innerHTML = "Please only use alphanumerical characters in the Game ID field";
    return;
  }
  
  var Password = document.getElementById("JoinOnlinePassword").value;
  if(!CheckAlphanumeric(Password)){
    document.getElementById("JoinOnlineStatus").innerHTML = "Please only use alphanumerical characters in the password field";
    return;
  }
  
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      var serverResult = xmlhttp.responseText;
      
      //Check the result from the server, and report it to the user through a clear message
      if(parseInt(xmlhttp.responseText) == 0){
        document.getElementById("JoinOnlineStatus").innerHTML = "Joining online game...";
        if(Password == "" || Password == undefined){
          window.location.href = "Play/?vs=1&id="+GameID+"&c="+PlayerColor;
        }else{
          //Yes, I know I'm submitting the password as plaintext, but for a game I don't believe that really matters too much
          document.getElementById("JoinOnlineForm").action = "Play/?vs=1&id="+GameID+"&c="+PlayerColor;
          document.getElementById("JoinOnlineForm").submit();
        }
      }else{
        document.getElementById("JoinOnlineStatus").innerHTML = "Illegal game ID, please supply a new one";
      }
    }
  }
  
  xmlhttp.open("GET","Server/confirmGameExists.php?id="+GameID,true);
  xmlhttp.send();
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
  if(!CheckAlphanumeric(GameID)){
    document.getElementById("CreateOnlineStatus").innerHTML = "Please only use alphanumerical characters in the Game ID field";
    return;
  }
  
  var Password = document.getElementById("CreateOnlinePassword").value;
  if(!CheckAlphanumeric(Password)){
    document.getElementById("CreateOnlineStatus").innerHTML = "Please only use alphanumerical characters in the password field";
    return;
  }
  
  //This synchronous XMLHttpRequest will give a deprecation warning, but should work fine
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if(this.readyState == 4 && this.status == 200){
      var serverResult = xmlhttp.responseText;
      
      //Check the result from the server, and report it to the user through a clear message
      switch(parseInt(serverResult)){
        case 0:
          document.getElementById("CreateOnlineStatus").innerHTML = "Successfully created new game, redirecting...";
          if(Password == "" || Password == undefined){
            window.location.href = "Play/?vs=1&id="+GameID+"&c="+PlayerColor;
          }else{
            //Yes, I know I'm submitting the password as plaintext, but for a game I don't believe that really matters too much
            document.getElementById("CreateOnlineForm").action = "Play/?vs=1&id="+GameID+"&c="+PlayerColor;
            document.getElementById("CreateOnlineForm").submit();
          }
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
  }
  
  if(Password == "" || Password == undefined){
    xmlhttp.open("GET","Server/newGame.php?l="+ChosenLayout+"&id="+GameID,true);
    xmlhttp.send();
  }else{
    xmlhttp.open("POST","Server/newGame.php?l="+ChosenLayout+"&id="+GameID,true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send("passw="+Password);
  }
}
