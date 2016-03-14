//  Blank space is represented as tile number 0
var tileBlank = 0;

// Array tracks the position of tiles.
// Index in array = position on the board.
// Value in the array = number on the tile.
var tilePosition = [1, 2, 3,
                    4, 5, 6, 
                    7, 8, tileBlank];

var boardRows = 3;
var boardColumns = 3;

// How long to take to animate a tile
var tileSlideTime = 25;

// How much space to put between tiles, in fraction of maximum tile space. 
// (0.05 = 5% space)
var tileSpace = 0.05;

// Track the number of times the player moved a tile
var playerMoves = 0;

// Number of tiles out of place
var displacedTiles = 0;

// Every out-of-place tile is some number of spaces away from their desired
// position. This is the sum of all the number of spaces.
var manhattanDistance = 0;

// Gets the length of a tile's side.
// The item #tileBoard is told to lay itself out at 100% of available width.
// We also query for the visible window's inner width and height.
// The minimum of all of those is the maximum possible dimension to be entirely visible.
// We divided that by number of rows/columns.
// Further subtract by however much space we want to put between tiles.
var getTileDim = function() {
  var tileBoard = $("#tileBoard");

  var minDim = Math.min(
    window.innerWidth, 
    window.innerHeight-$("#otherUI").outerHeight(), 
    tileBoard.innerWidth() );

  return (minDim / Math.max(boardRows, boardColumns)) * (1-tileSpace);
};

// Given a tile number, return its index in the array.
// Returns -1 if not found.
var indexOfTile = function(tileNum, gameBoard) {
  for (var i = 0; i < gameBoard.length; i++) {
    if (gameBoard[i] == tileNum) {
      return i;
    }
  }

  return -1;
};

// Given a tile number, starts an animation that moves the tile to its
// corresponding location on screen. Call this after the tile has been
// moved in the tilePosition[] array.
var updatePositionOfTile = function(tileNum) {
  var tileIndex = indexOfTile(tileNum, tilePosition);

  var tileRow = Math.floor(tileIndex / boardColumns);
  var tileColumn = tileIndex % boardColumns;
  var tileDim = getTileDim() * (1/(1-tileSpace));

  $("#" + tileNum).animate({
    "left": tileColumn * tileDim,
    "top": tileRow * tileDim
  }, tileSlideTime);
};

// When the viewport is resized, update size of board accordingly.
var resizeTiles = function() {
  var boxes = $(".box");
  var boxLabels = $(".boxLabel");
  var tileDim = getTileDim();

  boxes.css({
    "width": tileDim,
    "height": tileDim,
    "border-radius": (tileDim * 0.15)
  });

  boxLabels.css({
    "font-size": tileDim / 2 + "px",
    "padding": tileDim / 4 + "px"
  });

  for (var i = 1; i < tilePosition.length; i++) {
    updatePositionOfTile(i);
  }

  $("#tileBoard").css("height", (tileDim * (1/(1-tileSpace))) * boardRows);
};

// Initial setup of game board. Take the HTML for ".box" under the
// tileTemplateHost" and clone it 8 times for the game tile. 
// For each tile, the tile text is updated and the ID set to the tile number.
var setupTiles = function() {
  var tileBoard = $("#tileBoard");
  var tileTemplate = $("#tileTemplateHost .box");

  for (var i = 1; i < (boardRows * boardColumns); i++) {
    var newTile = tileTemplate.clone(false, false);
    newTile.attr("id", i);
    newTile.children(".boxLabel").text(i);
    tileBoard.append(newTile);
  }

  resizeTiles();
};

// Checks to see if the two given tile indices can be legally swapped.
// If so, return true.
var isValidSwap = function(indexClick, indexBlank) {
  if (indexClick + 1 == indexBlank &&
    (indexClick % boardColumns)+1 < boardColumns) {
    return true; // Move right
  } else if (indexClick - 1 == indexBlank &&
    indexClick % boardColumns > 0) {
    return true; // Move left
  } else if (indexBlank < tilePosition.length &&
    indexClick + boardColumns == indexBlank) {
    return true; // Move down
  } else if (indexBlank >= 0 &&
    indexClick - boardColumns == indexBlank) {
    return true; // Move up
  }
  return false;
};

// Lookup table of factorial values
var F = [1];

// Ensure the factorial values lookup table is ready
var ensureFactorialTable = function() {
  var tableSize = boardColumns * boardRows;
  
  if (F.length == tableSize) {
    return;
  } else {
    F[0] = 1;
    for (var i = 1; i < tableSize; i++) {
      F[i] = F[i-1]*i;
    }
  }
};

// Encode the board position into a single number
var encodeBoard = function(boardPositions) {
  var tableSize = boardColumns * boardRows;
  var tileEncoded = new Array(tableSize);
  var digitBase = tableSize-1;
  var encodeValue = 0;
  
  ensureFactorialTable();
  
  for (var i = 0; i < tableSize; i++) {
    tileEncoded[i] = false;
  }
  
  for (var i = 0; i < tableSize; i++) {
    var tileNum = boardPositions[i];
    var encodeNum = tileNum;
    
    for (var j = 0; j < tileNum; j++) {
      if (tileEncoded[j]) {
        encodeNum--;
      }
    }
    
    encodeValue += encodeNum * F[digitBase--];
    
    tileEncoded[tileNum] = true;
  }
  
  /*
  var decodeVerify = decodeBoard(encodeValue);
  for (var i = 0; i < boardPositions.length; i++) {
    if (decodeVerify[i] != boardPositions[i]) {
      console.log("Expected: " + boardPositions + " but got:" + decodeVerify);
    }
  }
  */
  
  return encodeValue;
};

// Decode the board number into a board layout
var decodeBoard = function(encodedValue) {
  var tableSize = boardColumns * boardRows;
  var tileDecoded = new Array(tableSize);
  var digitBase = tableSize-1;
  var posDecoded = new Array(tableSize);
  var decodeCurrent = 0;
  var decodeRemainder = encodedValue;

  ensureFactorialTable();
  
  for (var i = 0; i < tableSize; i++) {
    tileDecoded[i] = false;
  }
  
  for (var i = 0; i < tableSize; i++) {
    var tileNum = 0;
    decodeCurrent = Math.floor(decodeRemainder/F[digitBase]);
    decodeRemainder = decodeRemainder % F[digitBase];
    digitBase--;
    
    while (decodeCurrent > 0 || tileDecoded[tileNum]) {
      if (!tileDecoded[tileNum]) {
        decodeCurrent--;
      }
      tileNum++;
    }
    
    posDecoded[i] = tileNum;
    tileDecoded[tileNum] = true;
  }
  /*
  if (encodedValue != encodeBoard(tileDecoded)) {
    console.log("Inconsistency between encode and decode.");
  }
  */
  
  return posDecoded;
};


// Calculate the Manhattan Distance of the tile at the specified index.
var calculateManhattanDistance = function(index) {
  var tileAtIndex = tilePosition[index];
  var desiredIndex = 0;
  
  if (tileAtIndex == tileBlank ) {
    desiredIndex = tilePosition.length -1;
  } else {
    desiredIndex = tilePosition[index]-1;
  }

  var actualRow = Math.floor(index/boardColumns);
  var desiredRow= Math.floor(desiredIndex/boardColumns);
  
  var actualColumn = index%boardColumns;
  var desiredColumn = desiredIndex%boardColumns;
  
  return Math.abs(actualRow-desiredRow) + Math.abs(actualColumn-desiredColumn);
};

var calculateHeuristics = function() {
  displacedTiles = 0;
  manhattanDistance = 0;
  
  for( var i = 0; i < tilePosition.length; i++) {
    if (tilePosition[i] != 0 &&
        tilePosition[i] != i+1) {
      displacedTiles++;
      
      manhattanDistance += calculateManhattanDistance(i);
    }
  }
};

// For 8-puzzle we can get away with brute force table of 362k bytes.
var optimalMovesReady = false;
var optimalMovesInProgress = false;
var optimalMovesTable;

var workerState;
var workerList;

var checkAddBoard = function(steps, boardPosition, indexBlank, indexSwap, openList) {
  var checkEncode = 0;
  
  // Perform the swap
  boardPosition[indexBlank] = boardPosition[indexSwap];
  boardPosition[indexSwap] = tileBlank;

  // Encode the position and check status in the table    
  checkEncode = encodeBoard(boardPosition);
  
  if (optimalMovesTable[checkEncode] > steps) {
    optimalMovesTable[checkEncode] = steps;
    openList.push(checkEncode);
  }
  
  // Swap back
  boardPosition[indexSwap] = boardPosition[indexBlank];
  boardPosition[indexBlank] = tileBlank;
};

var addToOpenList = function(steps, boardPosition, openList) {
  var workingBoard = Array.from(boardPosition);
  var indexBlank = indexOfTile(tileBlank, workingBoard);
  
  // Is "move tile down into blank" a valid move? If so check if it should be added to open list.
  if (indexBlank >= boardColumns) {
    checkAddBoard(steps, workingBoard, indexBlank, indexBlank-boardColumns, openList);
  }
  
  // Check "move tile up into blank"
  if (indexBlank+boardColumns < boardPosition.length) {
    checkAddBoard(steps, workingBoard, indexBlank, indexBlank+boardColumns, openList);
  }
  
  // Check "move tile right into blank"
  if (indexBlank % boardColumns > 0) {
    checkAddBoard(steps, workingBoard, indexBlank, indexBlank-1, openList);
  }
  
  // Check "move tile left into blank"
  if ((indexBlank+1) % boardColumns != 0) {
    checkAddBoard(steps, workingBoard, indexBlank, indexBlank+1, openList);
  }
};

var optimalMovesTableWorker = function() {
  var openList = new Array(0);
  
  if (workerState == 0) {
    var solvedBoard = [1,2,3,4,5,6,7,8,0];

    optimalMovesTable[encodeBoard(solvedBoard)] = 0;
    
    addToOpenList(1, solvedBoard, openList);

    console.log("Started optimal moves search table");

    workerList = openList;
    workerState++;
    
    setTimeout(optimalMovesTableWorker, 5);
  } else if (workerList.length > 0) {

    for ( var i = 0; i < workerList.length; i++) {
      var nowBoard = decodeBoard(workerList[i]);
      addToOpenList(workerState+1, nowBoard, openList);  
    }
    
    //console.log("Processed " + workerList.length + " positions of length " + workerState);
    
    workerList = openList;
    workerState++;
    setTimeout(optimalMovesTableWorker, 5);
  } else {
    optimalMovesReady = true;
  }
};

var getOptimalMoves = function(gameBoard) {
    if (!optimalMovesReady) {
      if (!optimalMovesInProgress) {
        var boardSize = gameBoard.length;
        ensureFactorialTable();
        optimalMovesTable = new Uint8Array(boardSize * F[boardSize-1]);
        for( var i = 0; i < optimalMovesTable.length; i++) {
          optimalMovesTable[i] = 255;
        }

        workerState = 0;
        setTimeout(optimalMovesTableWorker, 5);
        
        optimalMovesInProgress = true;
      } 
      return "[Calculating...]";
    } else {
      return optimalMovesTable[encodeBoard(gameBoard)];
    }
};

// Evaluates the board position and update the status text
var updateStatusBar = function() {

  calculateHeuristics();
  
  if (displacedTiles == 0) {
    $("#boardState").text("All tiles in correct position");
    $("#progress").text(playerMoves + " moves were taken. Press SCRAMBLE PUZZLE to start again.");
    $("#scrambleButton").css("background-color", "red");
    $("#scrambleText").text("SCRAMBLE PUZZLE");
    $("#scrambleButton").on("click", scramblePuzzle);
  } else {
    $("#boardState").text("Displaced=" + displacedTiles + " Distance=" + manhattanDistance + " Optimal=" + getOptimalMoves(tilePosition));
    $("#progress").text(playerMoves + " moves so far.");
  }
};

// Click event handler for .box delegated on the #tileBoard. $(this) is the 
// tile that got clicked on. Retrieve its index in the tilePosition array and
// the index of the blank to determine if they are adjacent. If so, it is a 
// valid move, and perform the swap.
var tileClicked = function(event) {
  var tileClick = $(this).attr("id");

  var indexClick = indexOfTile(tileClick, tilePosition);
  var indexBlank = indexOfTile(tileBlank, tilePosition);

  if (isValidSwap(indexClick, indexBlank)) {
    tilePosition[indexBlank] = tileClick;
    tilePosition[indexClick] = tileBlank;
    updatePositionOfTile(tileClick);
  }
  
  playerMoves++;
  updateStatusBar();
};

var scramblePuzzle = function() {
  var indexBlank;
  var tileCandidate = 0;
  var scramblePrevIndex = 0;
  var indexCandidate;
  var scrambleSteps = 0;

  calculateHeuristics();
  
  while(displacedTiles < tilePosition.length-1 ||
        manhattanDistance < tilePosition.length * 2) {
    indexCandidate = tilePosition.length;
    indexBlank = indexOfTile(tileBlank, tilePosition);
    
    while(indexCandidate == tilePosition.length) {
      var tryMove = Math.floor(Math.random()*4);
      
      switch (tryMove) {
        case 0: // Try to move a tile down into the blank
          if (indexBlank > boardColumns &&
              indexBlank-boardColumns != scramblePrevIndex) {
                indexCandidate = indexBlank-boardColumns;
              }
          break;
        case 1: // Try to move a tile up into the blank
          if (indexBlank + boardColumns < tilePosition.length &&
              indexBlank+boardColumns != scramblePrevIndex) {
                indexCandidate = indexBlank+boardColumns;
              }
          break;
        case 2: // Try to move a tile left into the blank
          if (indexBlank % boardColumns < boardColumns-1 &&
              indexBlank+1 != scramblePrevIndex) {
                indexCandidate = indexBlank+1;
              }
          break;
        case 3: // Try to move a tile right into the blank
          if (indexBlank % boardColumns > 0 &&
              indexBlank-1 != scramblePrevIndex) {
                indexCandidate = indexBlank-1;
              }
          break;
        default:
          alert("Random number generation in scramblePuzzle did not behave as expected");
          break;
      }
    }
    
    tileCandidate = tilePosition[indexCandidate];

    scramblePrevIndex = indexBlank;
    
    tilePosition[indexBlank] = tileCandidate;  
    tilePosition[indexCandidate] = tileBlank;

    updatePositionOfTile(tileCandidate);

    calculateHeuristics();
    scrambleSteps++;
  }
  
  console.log("Scramble took " + scrambleSteps + " steps to meet criteria.");

  playerMoves = 0;
  updateStatusBar();
  $("#scrambleButton").css("background-color", "gray");
  $("#scrambleText").text("PUZZLE IN PROGRESS");
  $("#scrambleButton").off("click", scramblePuzzle);
};

// Game board setup: generate tiles, size them correctly, and wait for the
// user to click.
$(document).ready(function() {
  setupTiles();
  $(window).resize(resizeTiles);
  $("#tileBoard").on("click", ".box", tileClicked);
  $("#scrambleButton").on("click", scramblePuzzle);
  getOptimalMoves(tilePosition);
});
