/*
TODO:
KNOWN BUGS:
1) Able to move larger stacks than normal into columns
2) Some stacks won't be moveable until lower cards are moved
3) No click, click support, only dragging
FUTURE TODO LIST:
1) use local storage to store and load games
DONE: 2) game statistics: win/loss ratio
3) game history: undo/redo moves
4) move hints: show available moves
5) if I get really bored, create AI to play game
*/

const NUM_SUITS = 4;
const CARDS_PER_SUIT=13;
const WIN_TRAYS = 4;
const FREE_CELLS = 4;
const COLUMNS = 8;

var game = {};
var board = [[],[],[],[],[],[],[],[]];
var currentboard = [];
var validCardMoveTarget = false; //will either be false or the div the card has moved to.
var autoMove = 0;
var wins=0;
var losses=0;
var games=0;
var percentage=0;
var win=false;

var historyArray = [];
var historyPoint = 0;


$(function(){
	//temporary position setup for divs
	loadGame();

	$("#reset").click(function(){
		if(win){
			win=false;
		}else{
			games++;
			losses++;
		}
		resetGame();
		updateSideBar();
	});
	$("#newgame").click(function(){
		if(win){
			win=false;
		}else{
			games++;
			losses++;
		}
		newGame();
		updateSideBar();
	});
	$(".togglemenu").click(function(){$("#sidebar").toggle();});
	$("#statistics").click(resetStatistics);
	$("#undo").click(undo);
	$("#redo").click(redo);
});

function addHistory(mover, to){//history stored as: id of old parent, id of new parent, stack size;
	while(historyArray.length>historyPoint&&historyArray.length!==0){
		historyArray.pop();
	}

	var stacksize = getStackSize(mover);
	var fromid = mover.parent().attr("id");
	var toid = to.attr("id");
	historyArray.push({from:fromid, to:toid, size:stacksize});
	historyPoint = historyArray.length;
}

function autoMoveCard(id){
	var pips = id%CARDS_PER_SUIT;
	var suit = Math.floor(id/CARDS_PER_SUIT);
	if($("#win"+suit).children().length===(pips)){
		moveCardTo($("#"+id), $("#win"+suit), true);
		$("#"+id).off('dblclick');
		return;
	}
}

function cardCanBePlacedOn(movingId, placingId){
	movingSuit = Math.floor(movingId/CARDS_PER_SUIT);
	placingSuit = Math.floor(placingId/CARDS_PER_SUIT);
	if(movingSuit===0||movingSuit===2){
		if(placingSuit===0||placingSuit===2){
			return false;
		}
	}else{
		if(placingSuit===1||placingSuit===3){
			return false;
		}
	}
	if((movingId%CARDS_PER_SUIT+1)===(placingId%CARDS_PER_SUIT)){
		return true;
	}
	return false;
}

function columnToIdArray(div){
	var array = [$(div).attr("id")];
	if($(div).children("div").length>0){
		return array.concat(columnToIdArray($(div).children("div").first()));
	}
	return array;
}

function doAutoMoves(){
	//this function is not recursive since if a move is done, doAutoMoves is called from moveCardTo
	var numcards = $(".exposedcard").length
	for(var i = 0; i<numcards;i++){
		var id = $($(".exposedcard")[i]).attr("id")
		if(id%CARDS_PER_SUIT<=autoMove+1){
			autoMoveCard(id);
		}
	}
}

function doubleClick(div){
	//if card goes in wintray, move there, otherwise move to first free cell, otherwise, do nothing
	var id = div.attr("id");
	var pips = id%CARDS_PER_SUIT;
	var suit = Math.floor(id/CARDS_PER_SUIT);
	//test for free cells
	for(var i = 0; i<FREE_CELLS; i++){
		if($("#cell"+i).children().length===0){
			moveCardTo(div, $("#cell"+i), true);
			return;
		}
	}
}

function dragStart(event, ui){
	//TODO: determine number of cards moving, if > 1, can't move to wintray or free cell
	//if > 1, make sure there are enough open spaces to move full stack.
	var movingObject = $(event.target);
	var stackSize = getStackSize(movingObject);
	var cardId = movingObject.attr("id");
	movingObject.addClass("topdiv");

	findValidDrops(movingObject, stackSize);
	//if card is stacked on another card, show the bottom card
	if(!movingObject.parent().hasClass("columntop")){
		exposeCard(movingObject.parent());
	}
}

function dragStop(event, ui){
	var card = $(event.target);
	card.removeAttr("style");
	//test if droppableDragDropped fired, meaning card has been moved
	//otherwise return back to original location.
	if(validCardMoveTarget){//change card's parent
		moveCardTo(card, validCardMoveTarget, true)
		validCardMoveTarget=false;
	}

	if(!card.parent().hasClass("columntop")){//if the card has landed on another card, remove .topdiv
		card.removeClass("topdiv");			 //if the card has landed on a blank column, keep .topdiv
	}

	if(card.parent().hasClass("exposedcard")){
		hideCard(card.parent());
	}
	
	//move card back to original location
	//or position it properly in new div.
	//card.css({left:0, top:0});
	removeDroppables();
}

function droppableDragDropped(event, ui){
	//set flag stating card has been dropped in a new, valid location
	//dragStop will manage all card moves.
	validCardMoveTarget = $(event.target);
	//the card has been dropped on an approved droppable
}

function droppableDragEnded(event, ui){
	//card has been dropped, remove highlighting and listeners
	highlightOff(event.target);
	//$(event.target).droppable("destroy");
}

function droppableDragStarted(event, ui){
	//find all targets for the currently dragged card, highlight them
	highlightOn(event.target);
}

function exposeCard(div){
	if(!$(div).hasClass("exposedcard")&&!$(div).hasClass("columntop")){
		$(div).addClass("exposedcard");
		makeDraggable($(div));
		var id = $(div).attr("id");
		var imgElement = $(div).children("img").first();
		fullCard(imgElement, id);
		$(div).dblclick(function(e){
			e.stopPropagation();
			doubleClick($(this));
		});
	}
}

function findValidDrops(movingObject, stackSize){
	//when a card starts dragging, find all eligible drop locations and add droppable
	var id = movingObject.attr("id");
	var suit = Math.floor(id/CARDS_PER_SUIT);
	var pips = (id%CARDS_PER_SUIT);
	if(stackSize===1){
		if($("#win"+suit).children().length===(pips)){
			makeDroppable($("#win"+suit));
		}
		for(var i = 0; i<FREE_CELLS; i++){
			if($("#cell"+i).children().length===0){
				makeDroppable($("#cell"+i));
			}
		}
	}
	for(var i = 0; i<COLUMNS;i++){
		//if column empty
		if($("#col"+i).children("div").length===0){
			if(!(stackSize>(getMaxStackSize()/2))){
				makeDroppable($("#col"+i));
			}
		}

		//if card can be placed on bottom card
		var bottomCardId = idOfBottomCard("#col"+i);
		if(cardCanBePlacedOn(id, bottomCardId)){
			if(!(stackSize>getMaxStackSize())){
				makeDroppable($("#"+bottomCardId));
			}
		}
	}
}

function fullCard(imgElement, cardId){
	var element = $(imgElement);
	element.attr("src", "images/"+idToCard(cardId)+".png");
	return element;
}

function getMaxStackSize(){
	var stackSize = 1+getNumFreeCells();
	var multiplier = getNumFreeColumns();
	return stackSize*Math.pow(2,multiplier);
}

function getNumFreeCells(){
	var freecells=0;
	for(var i = 0; i<FREE_CELLS; i++){
		if($("#cell"+i).children().length===0){
			freecells++;
		}
	}
	return freecells;
}

function getNumFreeColumns(){
	var columns=0;
	for(var i = 0; i<COLUMNS; i++){
		if($("#col"+i).children("div").length===0){
			columns++;
		}
	}
	return columns;
}

function getPips(id){
	var pips = id%CARDS_PER_SUIT+1;
	switch(pips){
		case 11:
			pips = "j"
			break;
		case 12:
			pips = "q"
			break;
		case 13:
			pips = "k"
			break;
	}
	return pips;
}

function getStackSize(div){
	if(div.children("div").length===0){
		return 1;
	}
	return 1+getStackSize(div.children("div").first());
}

function getSuit(id){
	var suit = Math.floor(id/CARDS_PER_SUIT);
	switch(suit){
		case 0:
			suit = "c"
			break;
		case 1:
			suit = "d"
			break;
		case 2:
			suit = "s"
			break;
		case 3:
			suit = "h"
			break;
	}
	return suit;
}

function halfCard(imgElement, cardId){
	var element = $(imgElement);
	element.attr("src", "images/"+idToCard(cardId)+"h.png");
	return element;
}

function hideCard(div){
	//remove dragable if not a sequence card
	if(!isInSequence(div)){
		removeDraggable($(div));
	}

	$(div).removeClass("exposedcard");
	var id = div.attr("id");
	var imgElement = div.children("img").first();
	halfCard(imgElement, id);
	$(div).off("dblclick");
}

function highlightOff(div){
	$(".highlighted").unwrap().removeClass("highlighted");
}

function highlightOn(div){
	if($(div).children("img").length>0){
		$(div).children("img").first().addClass("highlighted").wrap("<div class='tint'></div>");
		return;
	}
	$(div).addClass("highlighted");
}

function idOfBottomCard(div){
	if($(div).children("div")[0]){
		return idOfBottomCard($(div).children("div")[0]);
	}
	return $(div).attr("id");
}

function idToCard(id){
	return getSuit(id)+getPips(id);
}

function isInSequence(div){
	if($(div).children("div").length===0){
		return true;
	}
	var id = $(div).attr("id")
	var child = $(div).children("div").first()
	var childId = child.attr("id");
	if(cardCanBePlacedOn(childId, id)){
		return isInSequence(child);
	}
	return false;
}

function loadGame(){
	if(localStorage.getItem("freecell")){
		var game = JSON.parse(localStorage.getItem("freecell"));
		currentboard=game.currentboard;
		board=game.board;
		games=game.games;
		wins=game.wins;
		losses=game.losses;
		win=game.win;
		historyArray=game.historyArray;
		historyPoint=game.historyPoint;
		updateSideBar();
		placeBaseElements();
		placeLoadCards();
		exposeCard($('.carddiv'));
		saveGame();
	}else{
		newGame();
	}
}

function loser(){//a very sad function, with a sad name
	updateSideBar();
	alert("looks like a loss!");
}

function makeDraggable(div){
	for(var i = 0; i<$(div).length; i++){
		if(cardCanBePlacedOn($($(div)[i]).attr("id"), $($(div)[i]).parent().attr("id"))){
			makeDraggable($($(div)[i]).parent());
		}
	}
	$(div).draggable({
		start: function(event, ui){dragStart(event, ui);},
		stop: function(event, ui){dragStop(event, ui);},
		}).addClass("draggable");
}

function makeDroppable(div){
	div.droppable({
		activate: function(event, ui){droppableDragStarted(event,ui);},
		deactivate: function(event, ui){droppableDragEnded(event,ui);},
		drop: function(event, ui){droppableDragDropped(event,ui);},
		tolerance: "touch"
		});
	div.addClass("droppable");
}

function moveCardTo(card, div, playermove){//playermove is false if player is undoing or redoing
	//TODO: record move (card, div, stacksize) into a history table, for undo/redo
	if(playermove){
		addHistory(card, div);
	}
	var oldParent = card.parent();
	if(oldParent.attr("id").indexOf("win")===-1&&oldParent.attr("id").indexOf("cell")===-1){
		exposeCard(oldParent);
	}
	card.removeAttr("style");
	$(div).append(card);
	card.addClass("topdiv");
	card.css({left:0, top:0});

	//if card has moved to wintray, make it unmoveable, and update the index for automoving cards to wintray
	if(div.attr("id").indexOf("win")!==-1){
		removeDraggable(div.children().last());
		div.children().last().removeClass("exposedcard");
		updateAutoMoveIndex();
		if(testForWin()){
			winner();
		}
	}
	if(!testForWin()){
		if(testForLose()){
			loser();
		}
	}
	saveGame();
	//TODO: test old parent for auto move to wintray
	//has to be tested here, since expose card would test cards during card move, not after
	if(playermove){
		setTimeout(doAutoMoves, 100);
	}
}

function movesAvailable(){//test if moves are available
	var movelist = {};//not yet implemented
	for(var i=0; i<FREE_CELLS; i++){
		if($("#cell"+i).children("div").length===0){
			return true;
		}else{
			var id = $("#cell"+i).children("div").first().attr("id");
			var pips = id%CARDS_PER_SUIT;
			var suit = Math.floor(id/CARDS_PER_SUIT);
			if($("#win"+suit).children().length===(pips)){
				return true;
			}
		}
	}
	for(var i=0; i<COLUMNS; i++){
		if($("#col"+i).children("div").length===0){
			return true;
		}
		for(var j=0; j<COLUMNS; j++){
			if(cardCanBePlacedOn(idOfBottomCard("#cell"+i), idOfBottomCard("#col"+j))){
				return true;
			}
		}
	}
	for(var i=0; i<COLUMNS; i++){
		for(var j=0; j<COLUMNS; j++){
			var id = idOfBottomCard("#col"+i);
			if(cardCanBePlacedOn(id, idOfBottomCard("#col"+j))){
				return true;
			}
			var pips = id%CARDS_PER_SUIT;
			var suit = Math.floor(id/CARDS_PER_SUIT);
			if($("#win"+suit).children().length===(pips)){
				return true;
			}
		}
	}
	return false;
}

function newGame(){
	$(".columntop").empty();
	board = [[],[],[],[],[],[],[],[]];
	placeBaseElements();
	setBoard();
	placeCards();
	exposeCard($('.carddiv'));
	saveGame();
	historyArray=[];
	historyPoint=0;
}

function placeBaseElements(){
	//setup free cells
	for(var i = 0; i<FREE_CELLS; i++){
		var left = (i*80)+"px";
		var top = "0px"
		$("#cell"+i).css({"left":left, "top":top});
	}	
	//setup win tray
	for(var i = 0; i<WIN_TRAYS; i++){
		var left = 460+(i*80)+"px";
		var top = "0px"
		$("#win"+i).css({"left":left, "top":top});
	}	

	//setup main columns
	for(var i = 0; i<COLUMNS; i++){
		var left = (i*100)+"px";
		var top = "150px"
		$("#col"+i).css({"left":left, "top":top});
	}
}

function placeCards(){
	var parent;
	for(var i=0; i<COLUMNS;i++){
		parent=$("#col"+i);
		for(var j=0; j<board[i].length;j++){
			var cardId = board[i][j];
			var cardDiv = $("<div></div>").attr("id",cardId);
			var img;
			if(j===(board[i].length-1)){
				cardDiv.addClass("carddiv");
				img = fullCard("<img>", cardId);

			}else{
				img = halfCard("<img>", cardId);
			}
			cardDiv.append(img);
			parent.append(cardDiv);
			parent = parent.children("div").first();
		}
	}
}

function placeLoadCards(){
	var parent;
	for(var i=0; i<COLUMNS;i++){
		parent=$("#col"+i);
		for(var j=0; j<currentboard[i].length;j++){
			if(currentboard[i][j]===null){
				continue;
			}
			var cardId = currentboard[i][j];
			var cardDiv = $("<div></div>").attr("id",cardId);
			var img;
			if(j===(currentboard[i].length-1)){
				cardDiv.addClass("carddiv");
				img = fullCard("<img>", cardId);

			}else{
				img = halfCard("<img>", cardId);
			}
			cardDiv.append(img);
			parent.append(cardDiv);
			parent = parent.children("div").first();
		}
	}
	for(var i=0; i<FREE_CELLS; i++){
		if(currentboard[i+8]){
			var parent=$("#cell"+i);
			var cardId = currentboard[i+8];
			var cardDiv = $("<div></div>").attr("id",cardId);
			cardDiv.addClass("carddiv");
			var img = fullCard("<img>", cardId);
			cardDiv.append(img);
			parent.append(cardDiv);
		}
	}
	for(var i=0; i<WIN_TRAYS; i++){
		var parent=$("#win"+i);
		for(var j=0; j<currentboard[i+12];j++){
			var cardId = CARDS_PER_SUIT*i+j;
			var cardDiv = $("<div></div>").attr("id",cardId);
			var img = fullCard("<img>", cardId);
			cardDiv.append(img);
			cardDiv.removeAttr("style");
			cardDiv.addClass("topdiv")
			cardDiv.css({left:0, top:0});
			parent.append(cardDiv);
		}
	}
}

function redo(){
	if(historyPoint<historyArray.length){//make sure there are moves to redo
		var toid = historyArray[historyPoint].from;
		var fromid = historyArray[historyPoint].to;
		var movebacker = $("#"+toid).children("div").last();
		var from = $("#"+fromid);
		hideCard(from);
		// if(!movebacker.parent().hasClass("columntop")){//if the card has landed on another card, remove .topdiv
		// 	movebacker.removeClass("topdiv");			 //if the card has landed on a blank column, keep .topdiv
		// }
		// if(movebacker.parent().hasClass("exposedcard")){
		// 	hideCard(movebacker.parent());
		// }
		moveCardTo(movebacker, from, false);

		movebacker.removeAttr("style");
		if(!movebacker.parent().hasClass("columntop")){//if the card has landed on another card, remove .topdiv
			movebacker.removeClass("topdiv");			 //if the card has landed on a blank column, keep .topdiv
		}
		historyPoint++;
		saveGame();
	}
}

function removeDraggable(div){
	if(div.hasClass("draggable")){
		div.draggable("destroy");
	}
}

function removeDroppables(){
	$(".droppable").droppable("destroy").removeClass("droppable");
}

function resetGame(){
	$(".columntop").empty();
	placeBaseElements();
	placeCards();
	exposeCard($('.carddiv'));
	saveGame();
	historyArray=[];
	historyPoint=0;
}

function resetStatistics(){
	wins=0;
	losses=0;
	games=0;
	percentage=0;
	updateSideBar();
}

function saveGame(){
	for(var i=0; i<COLUMNS; i++){
		currentboard[i] = columnToIdArray($("#col"+i).children("div").first());
	}
	for(var i=0; i<FREE_CELLS; i++){
		currentboard[i+8] = $("#cell"+i).children("div").first().attr("id");
	}
	for(var i=0; i<WIN_TRAYS; i++){
		currentboard[i+12] = $("#win"+i).children("div").length;
	}
	game = {board:board, currentboard: currentboard, wins: wins, games: games, losses:losses, win:win, historyArray:historyArray, historyPoint:historyPoint};
	localStorage.setItem("freecell", JSON.stringify(game));
}

function setBoard(){
	var deck = shuffleDeck();
	for(var i=0; i<52;i++){
		board[i%COLUMNS].push(deck[i]);
	}
}

function shuffleDeck(){
	var newdeck = [];
	var deck = [];
	for(var i=0; i<52; i++){
		newdeck.push(i);
	}
	while(newdeck.length>0){
		var index = Math.floor(Math.random()*newdeck.length);
		deck.push(newdeck.splice(index, 1)[0]);
	}
	return deck;
}

function testForWin(){
	for(var i=0; i<WIN_TRAYS; i++){
		if($("#win"+i).children("div").length<CARDS_PER_SUIT){
			return false;
		}
	}
	return true;
}

function testForLose(){
	if(!movesAvailable()){
		loser();
	}
	return false;
}

function undo(){
	if(historyPoint>0){//make sure there are moves to undo
		var fromid = historyArray[historyPoint-1].from;
		var toid = historyArray[historyPoint-1].to;
		var movebacker = $("#"+toid).children("div").last();
		var from = $("#"+fromid);
		moveCardTo(movebacker, from, false);

		hideCard(from);
		movebacker.removeClass("topdiv");
		if(toid.indexOf("win")!==-1){
			exposeCard(movebacker);
		}
		if(movebacker.parent().hasClass("exposedcard")){
			hideCard(movebacker.parent());
		}
		historyPoint--;
		saveGame();
	}
}

function updateAutoMoveIndex(){
	//find the lowest card in the wintray, all cards <= card+1 should auto move
	var index = CARDS_PER_SUIT;
	for(var i=0; i<WIN_TRAYS; i++){
		if($("#win"+i).children("div").length<index){
			index = $("#win"+i).children("div").length;
		}
	}
	autoMove=index;
}

function updateSideBar(){
	$("#games").html(games);
	$("#wins").html(wins);
	$("#losses").html(losses);
	percentage=Math.floor(wins/games*100);
	$("#percent").html(percentage);
	$("#sidebar").show();
}

function winner(){
	if(!win){
		win=true;
		games++;
		wins++;
		updateSideBar();
		alert('Standard "You Win!" Dialogue.');
	}
}