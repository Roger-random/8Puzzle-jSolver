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

// The M of MVC: Model

// SlidingTilePuzzle represents the puzzle's state and some basic methods
// relating to the position of the tiles.

function SlidingTilePuzzle(columns, rows, encodedPuzzleState) {
  // Raw puzzle state
  var puzzleColumns = (columns===undefined) ? 4 : columns;
  var puzzleRows = (rows===undefined) ? 4 : rows;
  var puzzleLength = puzzleColumns * puzzleRows;
  // "var puzzleState" comes later since it calls copyIfValid
  
  // Auxiliary statistics
  var validAux = false;
  var indexBlank = -1;
  var displacedTiles = 0;
  var manhattanDistance = 0;
  
  /////////////////////////////////////////////////////////////////////////////
  // Factorial lookup table
  var F = [1];
  
  // Ensure the factorial values lookup table is ready
  var ensureFactorialTable = function() {
    if (F.length == puzzleLength) {
      return;
    } else {
      F[0] = 1;
      for (var i = 1; i < puzzleLength; i++) {
        F[i] = F[i-1]*i;
      }
    }
  };
  
  /////////////////////////////////////////////////////////////////////////////
  // We will either have defaultState or decodeBoard set up our puzzle state
  // array. Which one depends on the encodedPuzzleState parameter passed into
  // the constructor.

  // Generate an array representing this puzzle in the default solved state.
  var defaultState = function() {
    var newState = new Array(puzzleLength);
    
    for (var i = 1; i < puzzleLength; i++) {
      newState[i-1] = i;
    }
    newState[puzzleLength-1] = 0;
    
    return newState;
  };
  
  // Decode the board number into a board layout
  var decodeBoard = function(encodedValue) {
    var tileDecoded = new Array(puzzleLength);
    var digitBase = puzzleLength-1;
    var posDecoded = new Array(puzzleLength);
    var decodeCurrent = 0;
    var decodeRemainder = encodedValue;
  
    ensureFactorialTable();
    
    for (var i = 0; i < puzzleLength; i++) {
      tileDecoded[i] = false;
    }
    
    for (var i = 0; i < puzzleLength; i++) {
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

    return posDecoded;
  };
  
  var puzzleState = (encodedPuzzleState===undefined) ? defaultState() : decodeBoard(encodedPuzzleState);

  /////////////////////////////////////////////////////////////////////////////
  // Generate the auxiliary statistics
  var ensureAuxStats = function() {
    if (validAux) {
      return;
    }

    // Calculate the Manhattan Distance of the tile at the specified index.
    var calculateManhattanDistance = function(index) {
      var tileAtIndex = puzzleState[index];
      var desiredIndex = 0;
      
      if (tileAtIndex == 0 ) {
        desiredIndex = puzzleLength-1;
      } else {
        desiredIndex = puzzleState[index]- 1;
      }
    
      var actualRow = Math.floor(index/puzzleColumns);
      var desiredRow= Math.floor(desiredIndex/puzzleColumns);
      
      var actualColumn = Math.abs(index%puzzleColumns);
      var desiredColumn = Math.abs(desiredIndex%puzzleColumns);
      
      return  Math.abs(actualRow-desiredRow) + 
              Math.abs(actualColumn-desiredColumn);
    };

    displacedTiles = 0;
    manhattanDistance = 0;
  
    for( var i = 0; i < puzzleLength; i++) {
      if (puzzleState[i] == 0) {
        indexBlank = i;
      } else if (puzzleState[i] != i+1) {
        displacedTiles++;
        manhattanDistance += calculateManhattanDistance(i);
      }
    }
    validAux = true;
  };
  
  var invalidateAuxStats = function() {
    validAux = false;
  }
  
  ensureAuxStats();
  
  /////////////////////////////////////////////////////////////////////////////
  // Tile movment methods
  
  // This private function does not perform any validation of the two tile
  // indices, the caller is responsible for checking validity OR deliberately
  // making an illegal move.
  var swapTileNoValidation = function(tile1, tile2) {
    var tileTemp = puzzleState[tile1];
    puzzleState[tile1] = puzzleState[tile2];
    puzzleState[tile2] = tileTemp;

    invalidateAuxStats();
  };
  
  // This function takes an index of a tile to swap with the blank tile.
  // It will check to make sure it is a valid move. If valid, makes the move and
  // returns true. If invalid, nothing is moved and it returns false.
  var trySwapTile = function(indexSwap) {
    var validSwap = false;
    
    ensureAuxStats();
    
    if (indexSwap == indexBlank + 1 &&
        indexSwap%puzzleColumns > 0) {
      // Valid move with indexSwap on the right, indexBlank on the left.
      validSwap = true;
    } else if (indexSwap == indexBlank - 1 &&
        indexBlank%puzzleColumns > 0) {
      // Valid move with indexSwap on the left, indexBlank on the right.
      validSwap = true;
    } else if (indexSwap == indexBlank + puzzleColumns &&
        indexSwap < puzzleLength) {
      // Valid move with indexSwap below indexBlank
      validSwap = true;
    } else if (indexSwap == indexBlank - puzzleColumns &&
        indexSwap >= 0) {
      // Valid move with indexSwap above indexBlank
      validSwap = true;
    }
    
    if (validSwap) {
      // Make the swap and update stats
      swapTileNoValidation(indexBlank, indexSwap);
      ensureAuxStats();
    }
    
    return validSwap;
  };
  
  /////////////////////////////////////////////////////////////////////////////
  // Public methods
  /////////////////////////////////////////////////////////////////////////////
  
  /////////////////////////////////////////////////////////////////////////////
  // Some people think of a puzzle move as "moving a tile", others think of it
  // as "moving the blank". So we support both conventions. In all cases, if
  // the move succeeds, the return value is true. If the move is invalid,
  // nothing changes and the return value is false.
  
  // Try to move a tile down/blank up
  this.blankUp = function() { return trySwapTile(indexBlank-puzzleColumns); };
  this.tileDown = function() { return this.blankUp(); };
  
  // Try to move a tile up/blank down
  this.blankDown = function() { return trySwapTile(indexBlank+puzzleColumns); };
  this.tileUp = function() { return this.blankDown(); };
  
  // Try to move a tile right/blank left
  this.blankLeft = function() { return trySwapTile(indexBlank-1); };
  this.tileRight = function() { return this.blankLeft(); };
  
  // Try to move a tile left/blank right. 
  this.blankRight = function() { return trySwapTile(indexBlank+1); };
  this.tileLeft = function() { return this.blankRight(); };
  
  // Try to move the specified numbered tile. Will look up the position and see
  // if it is adjacent to the blank space. If true, moves the tile and returns
  // true. If not adjacent to blank, returns false.
  this.moveTile = function(tileNum) {
    var tileIndex = -1;
    
    for (var i = 0; i < puzzleLength && tileIndex == -1; i++) {
      if (puzzleState[i] == tileNum) {
        tileIndex = i;
      }
    }
    
    if (tileIndex >= 0) {
      return trySwapTile(tileIndex);
    }
    
    return false;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Puzzle state representation methods

  // Encode the puzzle state into a single number
  this.encode = function() {
    var tileEncoded = new Array(puzzleLength);
    var digitBase = puzzleLength-1;
    var encodeValue = 0;
    
    ensureFactorialTable();
    
    for (var i = 0; i < puzzleLength; i++) {
      tileEncoded[i] = false;
    }
    
    for (var i = 0; i < puzzleLength; i++) {
      var tileNum = puzzleState[i];
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

  // Returns a string that represents the state of this puzzle
  this.printState = function() {
    var stringBuilder = "DT="+displacedTiles+" MD="+manhattanDistance+" B@"+indexBlank;
    
    for (var row = 0; row < puzzleRows; row++) {
      stringBuilder += "\n";
      for (var col = 0; col < puzzleColumns; col++) {
        stringBuilder += puzzleState[row*puzzleColumns + col];
        stringBuilder += " ";
      }
    }
    stringBuilder += "\n";
    
    return stringBuilder;
  };

  /////////////////////////////////////////////////////////////////////////////
  // Public property getters
  /////////////////////////////////////////////////////////////////////////////
  
  // Returns the number of columns on the game board
  this.getColumns = function() { return puzzleColumns; };
  
  // Returns the number of rows on the game board
  this.getRows = function() { return puzzleRows; };
  
  // Returns the number of spaces on the game board
  this.getSize = function() { return puzzleLength; };
  
  // Returns the number of tiles displaced from their goal position
  this.getDisplacedTiles = function() {
    ensureAuxStats();
    
    return displacedTiles;
  };
  
  // Returns the sum of the distances of all displaced tiles from their goals
  this.getManhattanDistance = function() {
    ensureAuxStats();
    
    return manhattanDistance;
  };
}

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
    
    // console.log("Processed " + workerList.length + " positions of length " + workerState);
    
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
var updateStatusBar = function(puzzle) {

  if (puzzle.getDisplacedTiles() == 0) {
    $("#boardState").text("All tiles in correct position");
    $("#progress").text(playerMoves + " moves were taken. Press SCRAMBLE PUZZLE to start again.");
    $("#scrambleButton").css("background-color", "red");
    $("#scrambleText").text("SCRAMBLE PUZZLE");
    $("#scrambleButton").on("click", puzzle, scramblePuzzle);
  } else {
    $("#boardState").text("Displaced=" + puzzle.getDisplacedTiles() + 
      " Distance=" + puzzle.getManhattanDistance() + 
      " Optimal=" + getOptimalMoves(tilePosition));
    $("#progress").text(playerMoves + " moves so far.");
  }
};

// Click event handler for .box delegated on the #tileBoard. $(this) is the 
// tile that got clicked on. Retrieve its index in the tilePosition array and
// the index of the blank to determine if they are adjacent. If so, it is a 
// valid move, and perform the swap.
var tileClicked = function(event) {
  var tileClick = $(this).attr("id");
  var puzzle = event.data;
  if (puzzle.moveTile(tileClick)) {
    tilePosition = decodeBoard(puzzle.encode());
    updatePositionOfTile(tileClick);
    playerMoves++;
    updateStatusBar(puzzle);
    console.log(puzzle.printState());
  }
};

// Scrambles the puzzle until the manhattan distance of the configuration is at
// least twice that of the board size. (Every tile is at least 2 spaces out of
// place.)
var scramblePuzzle = function(event) {
  var scrambleSteps = 0;
  var success = false;
  
  var puzzle = event.data;

  while(puzzle.getManhattanDistance() < puzzle.getSize() * 2) {
    success = false;
    
    switch (Math.floor(Math.random()*4)) {
      case 0: // Try to move a tile down into the blank
        success = puzzle.blankUp();
        break;
      case 1: // Try to move a tile up into the blank
        success = puzzle.blankDown();
        break;
      case 2: // Try to move a tile left into the blank
        success = puzzle.blankRight();
        break;
      case 3: // Try to move a tile right into the blank
        success = puzzle.blankLeft();
        break;
      default:
        alert("Random number generation in scramblePuzzle did not behave as expected");
        break;
    }

    if (success) {
      scrambleSteps++;
    }
  }

  tilePosition = decodeBoard(puzzle.encode());
  for( var i = 0; i < tilePosition.length; i++) {
    updatePositionOfTile(i);
  }
    
  console.log("Scramble took " + scrambleSteps + " steps to meet criteria.");

  playerMoves = 0;
  updateStatusBar(puzzle);
  $("#scrambleButton").css("background-color", "gray");
  $("#scrambleText").text("PUZZLE IN PROGRESS");
  $("#scrambleButton").off("click", scramblePuzzle);
};

// Game board setup: generate tiles, size them correctly, and wait for the
// user to click.
$(document).ready(function() {
  var newPuzzle = new SlidingTilePuzzle(3, 3);

  setupTiles();
  $(window).resize(resizeTiles);
  $("#tileBoard").on("click", ".box", newPuzzle, tileClicked);
  $("#scrambleButton").on("click", newPuzzle, scramblePuzzle);
  getOptimalMoves(tilePosition);
  
  console.log(newPuzzle.printState());
});
