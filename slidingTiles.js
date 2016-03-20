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
  
  // Utility lookup table
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
  
  // Private methods

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
    /*
    if (encodedValue != encodeBoard(tileDecoded)) {
      console.log("Inconsistency between encode and decode.");
    }
    */
    
    return posDecoded;
  };
  
/*  
  // Deprecated - we're no longer passing arrays around representing board.
  
  var copyIfValid = function(inputPuzzle) {
    if (inputPuzzle === undefined) {
      // No given puzzle - go to default.
      return defaultState();
    } else if (givenPuzzle.length !== puzzleLength) {
      // Given array is the wrong size. Log it, then go to default (ignore given)
      console.log("Initialization array size is " + inputPuzzle.length + 
            " when " + puzzleLength + " was expected. Using default array instead.");
      return defaultState();
    } else {
      // Size is correct, make sure the tiles make sense.
      
      // Array to track the tiles we've seen.
      var seenArray = new Array(puzzleLength);
      for (var i = 0; i < puzzleLength; i++) {
        seenArray[i] = false;
      }
    
      // Examine the puzzle array
      for (var i = 0; i < puzzleLength; i++) {
        var givenTile = inputPuzzle[i];
        
        if (givenTile < 0 || givenTile >= puzzleLength) {
          console.log("Initialization array has invalid tile " + givenTile + 
            " at index " + i + ". Using default array instead.");
          return defaultState();
        } else if (seenArray[givenTile]) {
          console.log("Initialization givenPuzzle has duplicate tile " + 
            givenTile + ". Using default array instead.");
          return defaultState();
        } else {
          seenArray[givenTile] = true;
        }
      }
     
      // Everything looks good - make a copy of the input and return that. 
      return inputPuzzle.slice(0);
    }
  };
*/  

  var puzzleState = (encodedPuzzleState===undefined) ? defaultState() : decodeBoard(encodedPuzzleState);

  // Encode the puzzle state into a single number
  var encode = function() {
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
  
  ensureAuxStats();
  
  // This private function does not perform any validation of the two tile
  // indices, so it can perform swaps that are not valid sliding tile puzzle
  // moves.
  var swapTileNoValidation = function(tile1, tile2) {
    var tileTemp = puzzleState[tile1];
    puzzleState[tile1] = puzzleState[tile2];
    puzzleState[tile2] = tileTemp;
  };
  
  // This function takes an index of a tile to swap with the blank tile.
  // It will check to make sure it is a valid move. If valid, makes the move and
  // returns true. If invalid, nothing is moved and it returns false.
  
  // PUBLIC for the duration of the transition period. make PRIVATE after 
  // transition is complete.
  this.trySwapTile = function(indexSwap) {
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
      validAux = false;
      ensureAuxStats();
    }
    
    return validSwap;
  };
  
  // Public methods
  this.blankUp = function() {
    return this.trySwapTile(indexBlank-puzzleColumns);
  };
  
  this.blankDown = function() {
    return this.trySwapTile(indexBlank+puzzleColumns);
  };
  
  this.blankLeft = function() {
    return this.trySwapTile(indexBlank-1);
  };
  
  this.blankRight = function() {
    return this.trySwapTile(indexBlank+1);
  };

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

  // Public property getters
  this.getDisplacedTiles = function() {
    ensureAuxStats();
    
    return displacedTiles;
  };
  
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
  
  var tryResult = event.data.trySwapTile(indexClick);

  if (isValidSwap(indexClick, indexBlank)) {
    tilePosition[indexBlank] = tileClick;
    tilePosition[indexClick] = tileBlank;
    updatePositionOfTile(tileClick);
    
    if(!tryResult) {
      console.log("Mismatch - old code says valid but new code says not.");
    }
  } else if (tryResult) {
    console.log("Mismatch - old code says invalid but new code says OK.");
  }
  
  console.log(event.data.printState());
  
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
  var newPuzzle = new SlidingTilePuzzle(3, 3);

  setupTiles();
  $(window).resize(resizeTiles);
  $("#tileBoard").on("click", ".box", newPuzzle, tileClicked);
  $("#scrambleButton").on("click", scramblePuzzle);
  getOptimalMoves(tilePosition);
  
  console.log(newPuzzle.printState());
});
