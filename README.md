8-tile sliding tile puzzle with optimal solution lengths
=====

This repository is a simple sliding tile puzzle with 8 tiles. It is a programming exercise to learn HTML/CSS/JavaScript layout (with help of jQuery) for the UI front end coupled with a breadth-first search algorithm running in the background as an exercise of writing nontrivial JavaScript code.

* Play: The user can click/tap on any tile adjacent to the space to move that tile into the space.
* Scramble: The user can click "scramble" to get a randomly scrambled tile configuration.
* Helper: The optimal solution length for the current position is displayed.

##### Behind the scenes: 
The optimal solution length is generated upon startup, by enumerating the entire problem space of the sliding tile puzzle and calculating the number of moves it takes to reach every solvable position via simple breadth-first search. This is feasible for the 8-puzzle, taking up ~360 kilobytes. (9! or 9 factorial bytes) This approach would not scale up for the 15-puzzle as that would require tens of terabytes (16! or 16 factorial bytes.)

Ideally the breadth-first search routine to generate this table is executed in parallel with the foreground puzzle board, but there's no such thing as a background thread in JavaScript. The closest I found are web workers, but communication is limited as I had no luck passing back the resulting 360kb table. I can revisit this in the future. In the meantime - the generation routine starts when the page is loaded. In order to preserve UI responsiveness, the algorithm would periodically pause and create a timer callback upon itself to resume. While this timer is running, the UI can respond to the user.
