var allElements = document.getElementsByTagName("*");

// The only useful thing from jQuery
function $(id){
	var e = document.getElementById(id);
	if (e == null) throw ('$(' + id + ') does not exist!');
	return e;
}

var socket = io();

var name = 'name';

var room = '';

var players = [];

var locations = [];

// Functions
function forEach(className, doStuff){
	var elements = document.getElementsByClassName(className);
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		doStuff(element);
	}
}

function joinRoom(){
	if($('room-input').value != ''){
		var room = $('room-input').value;
		$('setup').style.display = 'none';
		socket.emit('joinRoomRequest', room);
		$('room-input').value = '';
		$('chat-input').focus();
	}
}

function sendChatMessage(){
	if($('chat-input').value != ''){
		var msg = $('chat-input').value;
		if(msg.charAt(0) == '/'){
			msg = msg.substring(1);
			var args = msg.split(' ');
			var cmd = args.shift();
			socket.emit('command', cmd, args);
		} else {
			socket.emit('chatMessage', $('chat-input').value);
		}
		$('chat-input').value = '';
	}
}

function displayMessage(msg){
	$('chat-box').innerHTML = msg + $('chat-box').innerHTML;
}

// Event listeners
window.onload = function() {
	$('setup').style.display = 'flex';
	$('room-input').focus();
};

$('room-button').addEventListener('click', function(){joinRoom();});

$('room-input').addEventListener('keypress', function(e) {
	if(e.charCode == 13){
		joinRoom();
	}
});

$('send-button').addEventListener('click', function(){sendChatMessage();});

$('chat-input').addEventListener('keypress', function(e) {
	if(e.charCode == 13){
		sendChatMessage();
	}
});

$('start-stop-button').addEventListener('click', function(){
	$('start-stop-button').disabled = true;
	if($('start-stop-button').innerHTML == 'START'){
		socket.emit('gameStart');
	} else {
		socket.emit('gameStop');
	}
});

$('name-display').addEventListener('click', function(){
	if($('start-stop-button').innerHTML == 'START'){
		$('name-change').style.display = 'block';
	}
});

// socket listeners
socket.on('nameChange', function(theName){
	name = theName;
	forEach('name', function(e){e.innerHTML = name;});
});

socket.on('joinRoomResponse', function(theRoom, currentPlayers){
	room = theRoom;
	forEach('room', function(e){e.innerHTML = room;});
	players = currentPlayers;
});

socket.on('playersUpdated', function(plrs) {
	players = plrs;
});

socket.on('chatMessage', function(msg){
	displayMessage(msg);
});

socket.on('clearChat', function(){
	$('chat-box').innerHTML = '';
});

socket.on('host', function(){
	$('host-controls').style.display = 'block';
});

socket.on('gameStart', function(gamePlayers, gameLocations, location, role){
	$('start-stop-button').innerHTML = 'STOP';
	$('start-stop-button').disabled = false;
	$('players').innerHTML = '';
	$('game-interface').style.display = 'block';
	players = gamePlayers;
	$('my-info').style.display = 'block';
	for (var i = 0; i < players.length; i++) {
		$('players').innerHTML += '<p class="strikeable">' + players[i] + '</p>';
	}
	locations = gameLocations;
	for (var i = 0; i < locations.length; i++) {
		var html = '';
		html += '<div class="strikeable"><p style="margin-bottom: 5px;"><b>' + locations[i][0] + '</b></p>';
		for(var j = 1;j<locations[i].length;j++){
			html += '<p style="text-align: left;">' + locations[i][j] + '</p>';
		}
		html += '</div>';
		$('locations').innerHTML += html;
	}
	forEach('strikeable', function(e){
		e.addEventListener('click', function(){
			if(e.className == 'strikeable'){
				e.className += ' strikethrough';
				e.style.color = '#999';
			} else {
				e.className = 'strikeable';
				e.style.color = '';
			}
		});
	});
	$('location').innerHTML = 'Location: ' + location;
	$('role').innerHTML = 'Role: ' + role;
	forEach('interface', function(e){
		e.style.display = 'none';
	});
});

socket.on('gameStop', function(){
	$('start-stop-button').innerHTML = 'START';
	$('start-stop-button').disabled = false;
	$('players').innerHTML = '';
	$('locations').innerHTML = '';
	$('location').innerHTML = 'Location: ';
	$('role').innerHTML = 'Role:';
	$('game-interface').style.display = 'none';
	$('my-info').style.display = 'none';
	forEach('interface', function(e){
		e.style.display = 'none';
	});
});

