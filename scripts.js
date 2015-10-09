/*
♠ black spade suit name: &spades &#9824
♡ red heart suit &#9825
♢ red diamond suit &#9826
♣ black club suit = shamrock name: &clubs &#9827
♤ red spade suit &#9828
♥ black heart suit = valentine name: &hearts &#9829
♦ black diamond suit name: &diams &#9830
♧ red club suit &#9831
*/

var board = [[],[],[],[],[],[],[],[]];
var validCardMoveTarget = false; //will either be false or the div the card has moved to.

function dragStart(event, ui){
	//console.log(event);
	var movingObject = $(event.target);
	movingObject.addClass("topdiv");
	//if card is stacked on another card, show the bottom card
	console.log(movingObject.parent()[0]);
	if(!movingObject.parent().hasClass("columntop")){
		movingObject.parent().addClass("bottomdiv");
	}

	//when a card starts dragging, find all eligible drop locations and add droppable
	$(".columntop").droppable({
		activate: function(event, ui){droppableDragStarted(event,ui);},
		deactivate: function(event, ui){droppableDragEnded(event,ui);},
		drop: function(event, ui){droppableDragDropped(event,ui);},
		tolerance: "pointer"
		});
}

function dragStop(event, ui){
	var card = $(event.target);
	card.removeAttr("style");
	//test if droppableDragDropped fired, meaning card has been moved
	//otherwise return back to original location.
	if(validCardMoveTarget){//change card's parent
		$(validCardMoveTarget).append(card);
		validCardMoveTarget=false;
	}

	if(!card.parent().hasClass("columntop")){//if the card has landed on another card, remove .topdiv
												//if the card has landed on a blank column, keep .topdiv
		card.removeClass("topdiv");
	}

	if(card.parent().hasClass("bottomdiv")){
		card.parent().removeClass("bottomdiv");
	}
	
	//move card back to original location
	//or position it properly in new div.
	card.css({left:0, top:0});
	
}

function droppableDragStarted(event, ui){
	//find all targets for the currently dragged card, highlight them
	highlightOn(event.target);
}

function droppableDragEnded(event, ui){
	//card has been dropped, remove highlighting and listeners
	highlightOff(event.target);
	//$(event.target).droppable("destroy");
}

function droppableDragDropped(event, ui){
	//set flag stating card has been dropped in a new, valid location
	//dragStop will manage all card moves.
	validCardMoveTarget = event.target;
	//the card has been dropped on an approved droppable
	//console.log(validCardMoveTarget);
}

function highlightOn(div){
	$(div).css("backgroundColor","blue");
}

function highlightOff(div){
	$(div).css("backgroundColor","white");
}

$(function(){
	//temporary position setup for divs
	pageload();

	$('.carddiv').draggable({
		start: function(event, ui){dragStart(event, ui);},
		stop: function(event, ui){dragStop(event, ui);},
		});
});

function pageload(){
	placeBaseElements();
	setBoard();
	placeCards();
}

function placeBaseElements(){
	//setup extra tray
	for(var i = 0; i<4; i++){
		var left = (i*100)+"px";
		var top = "0px"
		$("#extra"+i).css({"left":left, "top":top});
	}	
	//setup win tray
	for(var i = 0; i<4; i++){
		var left = 400+(i*100)+"px";
		var top = "0px"
		$("#win"+i).css({"left":left, "top":top});
	}	

	//setup main columns
	for(var i = 0; i<8; i++){
		var left = (i*100)+"px";
		var top = "150px"
		$("#col"+i).css({"left":left, "top":top});
	}
}

function setBoard(){
	var deck = shuffleDeck();
	for(var i=0; i<52;i++){
		board[i%8].push(deck[i]);
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

function placeCards(){
	var parent;
	for(var i=0; i<8;i++){
		parent=$("#col"+i);
		for(var j=0; j<board[i].length;j++){
			var cardId = board[i][j];
			var cardDiv = $("<div></div>").attr("id",cardId);
			var img;
			if(j===(board[i].length-1)){
				cardDiv.addClass("carddiv");
				console.log(i+":"+j+":"+board[i].length);
				img = $("<img>").attr("src", "images/"+idToCard(cardId)+".png");
			}else{
				img = $("<img>").attr("src", "images/"+idToCard(cardId)+"h.png");
			}
			cardDiv.append(img);
			parent.append(cardDiv);
			parent = parent.children("div").first();
		}
	}
}

function idToCard(id){
	return getSuit(id)+getPips(id);
}

function getSuit(id){
	var suit = Math.floor(id/13);
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

function getPips(id){
	var pips = id%13+1;
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