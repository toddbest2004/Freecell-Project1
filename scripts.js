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
	for(var i = 0; i<8; i++){
		var left = (i*100)+"px";
		$("#col"+i).css({"left":left});
	}
}