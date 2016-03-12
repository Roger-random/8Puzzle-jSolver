//  Blank space is represented as tile number 0
var tileBlank = 0;

// Array tracks the position of tiles.
// Index in array = position on the board.
// Value in the array = number on the tile.
// 0 represents blank.
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
    window.innerHeight-$("#otherUI").innerHeight(), 
    tileBoard.innerWidth() );

  return (minDim / 3) * (1-tileSpace);
};

// Given a tile number, return its index in the array.
// Returns -1 if not found.
var indexOfTile = function(tileNum) {
  for (var i = 0; i < tilePosition.length; i++) {
    if (tilePosition[i] == tileNum) {
      return i;
    }
  }

  return -1;
};

// Given a tile number, starts an animation that moves the tile to its
// corresponding location on screen. Call this after the tile has been
// moved in the tilePosition[] array.
var updatePositionOfTile = function(tileNum) {
  var tileIndex = indexOfTile(tileNum);

  var tileRow = Math.floor(tileIndex / 3);
  var tileColumn = tileIndex % 3;
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

  for (var i = 1; i <= 8; i++) {
    updatePositionOfTile(i);
  }

  $("#tileBoard").css("height", (tileDim * (1/(1-tileSpace))) * 3);
};

// Initial setup of game board. Take the HTML for ".box" under the
// tileTemplateHost" and clone it 8 times for the game tile. 
// For each tile, the tile text is updated and the ID set to the tile number.
var setupTiles = function() {
  var tileBoard = $("#tileBoard");
  var tileTemplate = $("#tileTemplateHost .box");

  for (var i = 1; i < 9; i++) {
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
    indexClick % 3 < 2) {
    return true; // Move right
  } else if (indexClick - 1 == indexBlank &&
    indexClick % 3 > 0) {
    return true; // Move left
  } else if (indexBlank < 9 &&
    indexClick + 3 == indexBlank) {
    return true; // Move down
  } else if (indexBlank >= 0 &&
    indexClick - 3 == indexBlank) {
    return true; // Move up
  }
  return false;
};

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

// Evaluates the board position and update the status text
var updateStatusBar = function() {
  var displacedTiles = 0;
  var manhattanDistance = 0;
  
  for( var i = 0; i < tilePosition.length; i++) {
    if (tilePosition[i] != 0 &&
        tilePosition[i] != i+1) {
      displacedTiles++;
      
      manhattanDistance += calculateManhattanDistance(i);
    }
  }
  
  if (displacedTiles == 0) {
    $("#boardState").text("All tiles in correct position");
    $("#progress").text(playerMoves + " moves were taken. Press SCRAMBLE PUZZLE to start again.");
    $("#scrambleButton").css("background-color", "red");
    $("#scrambleText").text("SCRAMBLE PUZZLE")
    $("#scrambleButton").on("click", scramblePuzzle);
  } else {
    $("#boardState").text(displacedTiles + " tiles displaced by total of " + manhattanDistance + " spaces");
    $("#progress").text(playerMoves + " moves so far.");
  }
};

// Click event handler for .box delegated on the #tileBoard. $(this) is the 
// tile that got clicked on. Retrieve its index in the tilePosition array and
// the index of the blank to determine if they are adjacent. If so, it is a 
// valid move, and perform the swap.
var tileClicked = function(event) {
  var tileClick = $(this).attr("id");

  var indexClick = indexOfTile(tileClick);
  var indexBlank = indexOfTile(tileBlank);

  if (isValidSwap(indexClick, indexBlank)) {
    tilePosition[indexBlank] = tileClick;
    tilePosition[indexClick] = tileBlank;
    updatePositionOfTile(tileClick);
  }
  
  playerMoves++;
  updateStatusBar();
};

var scramblePuzzle = function(event) {
  // Placeholder scramble until I write the real one.
  tilePosition = [2, 6, 8, 
                  4, tileBlank, 3, 
                  1, 7, 5];
  for( var i = 1; i < tilePosition.length; i++) {
    updatePositionOfTile(i);
  }
  
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
  
});
