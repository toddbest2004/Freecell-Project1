# WDI-Project1
##About:
Created by Todd Best (toddbest2004@gmail.com) on October 14, 2015
For General Assembly Seattle's Web Development Immersive Program
Week 3 Project 1
##Details:
I made a deliberate design decision to not use a stored game state during play. All game logic is done through the use of div ids and styles to determine if and where a card can be moved. This decision was made for several reasons:

1. The added challenge.
2. I felt I needed more practice with DOM traversal and manipulation.
3. I have made similar card and card-like games in the past that used a stored game state of some kind (usually an array or object) to keep track of the game. I wanted to try a new approach.

By using a stored game state, I believe I would be able to make the game more efficient and responsive. The current version uses recursion to traverse the DOM to make some of the move decisions. This is slower than using a simple object/array implementation.

Also, cards and divs undergo numerous class and listener changes during the course of a single card move. Using a stored game state, moves could be recorded and the board could be updated to reflect the changes. I believe this would be more efficient.

The game uses the browser's localStorage to store gamestate after each move. This state is only accessed on page load to return a player to the previous state of the game.

Game history is stored as an array that stores the ids of the moving card's parents before and after the move. When undoing or redoing a move, the cards can be moved back by inverting the parents and moving. Doing a new move after undoing one or more moves will delete history after the current position and start a new chain. Only the current order of moves will be retained.

##Resources:
* Card Images from http://www.jfitz.com/cards/
* Card tops created by me with imagemagick.
* Freecell rules copied from http://windows.microsoft.com/en-us/windows/freecell-how-to
