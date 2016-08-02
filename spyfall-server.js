var path = require('path');
var http = require('http');
var express = require('express');
var spyfall = express.Router();
var io = null;

var locations = [
	['Cruise Ship', 'Passenger', 'Capitain', 'Engine room worker', 'Bar tender', 'Cleaning lady'],
	['Airplane', 'Passenger', 'Flight attendant', 'Pilot', 'Copilot', 'Smuggler'],
	['Pirate Ship', 'Crew member', 'Capitain', 'Cabin boy', 'Crows nest lookout'],
	['Theater', 'Audience member', 'Orchastra conductor', 'Director', 'Cast member', 'Janitor'],
	['Hotel', 'Guest', 'Manager', 'Cleaning lady', 'Hobo', 'Bellboy'],
	['Hospital', 'Patient', 'Doctor', 'Nurse', 'Janitor', 'Secretary'],
	['School', 'Student', 'Pricipal', 'Assistant Principal', 'Teacher', 'Visitor'],
	['Submarine', 'Crew member', 'Capitain', 'Engine room worker', 'Navigator', 'Russian spy'],
	['Restaurant', 'Dinning', 'Waiter', 'Hostess', 'Waitress', 'Dish washer', 'Bus boy'],
	['Police Station', 'In custody', 'Police officer', 'Chief', 'Interrogator', 'Lawyer'],
	['Train', 'Passenger', 'Conductor', 'Engine room worker', 'Train attendant', 'Hobo'],
	['Beach', 'Land lubber', 'Lifeguard', 'Police officer', 'Parking lot attendant', 'Surfer'],
	['Grocery Store', 'Shopper', 'Manager', 'Stocker', 'Janitor', 'Cart collector'],
	['Circus', 'Attendee', 'Clown', 'Juggler', 'Acrobat', 'Ring leader'],
	['Military Base', 'Soldier', 'Captain', 'Major', 'Air traffic controller', 'Pilot']
];

// Functions

// @return a [list] of all Socket(s)
function getAllSockets(){
	var sockets = [];
	// io.sockets.sockets: { '<Socket.id>': Socket, ... }
	var socks = io.sockets.sockets;
	for(key in socks){
		sockets.push(socks[key]);
	}
	return sockets;
}

// @return a [list] of all Room(s)
function getAllRooms(){
	var rooms = [];
	// io.sockets.adapter.rooms: { '<Room name>': Room, ... }
	var rs = io.sockets.adapter.rooms;
	for(key in rs){
		rooms.push(rs[key]);
	}
	return rooms;
}

// @args the string name of a Room
// @return the Room for the given room name
function getRoomById(roomID){
	return io.sockets.adapter.rooms[roomID];
}

// @args a string of the socket id
// @return the Socket object
function getSocketById(socketID){
	return io.sockets.sockets[socketID];
}

// Set custom functions for rooms and sockets
function addCustomFunctions(socket, room, roomName){
	room.getSockets = function(){
		var sockets = [];
		var socketids = this.sockets;
		for(key in socketids){
			sockets.push(getSocketById(key));
		}
		return sockets;
	};
	room.getHost = function(){
		if(this.getSockets().length > 0){
			return this.getSockets()[0];
		}
		return null;
	};
	room.getName = function(){
		return roomName;
	};
	room.getPlayers = function(){
		var players = [];
		var socketids = this.sockets;
		for(key in socketids){
			players.push(getSocketById(key).getNickname());
		}
		return players;
	};
	room.setSpy = function(socket){
		this.spy = socket;
	}
	room.getSpy = function(){
		return this.spy;
	}
	socket.getRoom = function(){
		return room;
	};
	socket.isHost = function(){
		return room.getHost() == this;
	};
	socket.getNickname = function(){
		return this.nickname;
	};
	socket.setNickname = function(name){
		return this.nickname = name;
	};
}

// @callback args (<firstname>)
function getRandomName(callback){
	// Asynchronous request for a random name
	http.get('http://api.randomuser.me/?inc=name&nat=US', function(res){
		var str = '';
		res.on('data', function(chunk){
			str += chunk;
		});
		res.on('end', function(){
			var json = eval('(' + str + ')');
			var firstname = json.results[0].name.first;
			firstname = firstname.charAt(0).toUpperCase() + firstname.slice(1);
			callback(firstname);
		})
	});
}

function encodeHtmlEntity(str) {
	// Converts characters into html safe version
	var buf = [];
	for (var i=str.length-1;i>=0;i--) {
		buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
	}
	return buf.join('');
}

function shuffle(array) {
	var counter = array.length;
	// While there are elements in the array
	while (counter > 0) {
		// Pick a random index
		var index = Math.floor(Math.random() * counter);
		// Decrease counter by 1
		counter--;
		// And swap the last element with it
		var temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}

spyfall.get('/', function(req, res){
	res.sendFile(path.join(__dirname, 'public', 'spyfall', 'spyfall.html'));
});

function bind(socketio){
	io = socketio;

	// On connect
	io.on('connection', function(socket){

		// On join room request
		socket.on('joinRoomRequest', function(room) {
			// TODO add logic for custom name
			getRandomName(function(name) {
				// Join the actual socket.io room
				socket.join(room);
				var roomObject = getRoomById(room);
				addCustomFunctions(socket, roomObject, room);
				socket.setNickname(name);
				var players = [];
				var sockets = roomObject.getSockets();
				for(var i = 0;i < sockets.length;i++){
					players.push(sockets[i].getNickname());
				}
				socket.emit('joinRoomResponse', room, players);
				socket.emit('nameChange', name);
				roomObject.getHost().emit('host');
				io.to(room).emit('playersUpdated', roomObject.getPlayers());
				io.to(room).emit('chatMessage', '<p class="BLUE"><b>' + name + '</b> joined <b>' + room + '</b></p>');
			});

		});
		
		// On disconnect
		socket.on('disconnect', function() {
			// TODO check if leaving player is spy and end game if they are
			if(socket.getRoom != undefined){
				io.to(socket.getRoom().getName()).emit('chatMessage', '<p class="BLUE"><b>' + socket.getNickname() + '</b> left <b>' + socket.getRoom().getName() + '</b></p>');
				io.to(socket.getRoom().getName()).emit('playersUpdated', socket.getRoom().getPlayers());
				if(socket.getRoom().getHost() != null){
					socket.getRoom().getHost().emit('host');
					socket.getRoom().getHost().emit('chatMessage', '<p class="BLUE">You are now the host</p>');
				}
			}
		});

		// On name change request
		socket.on('nameChangeRequest', function(name) {
			// Currently unused
			var msg = '<p class="BLUE"><b>' + socket.getNickname() + '</b> is now <b>' + name + '</b></p>';
			io.to(socket.getRoom().getName()).emit('chatMessage', msg);
			socket.setNickname(name);
			socket.emit('nameChange', name);
			io.to(socket.getRoom().getName()).emit('playersUpdated', socket.getRoom().getPlayers());
		});

		// On chat message
		socket.on('chatMessage', function(msg) {
			io.to(socket.getRoom().getName()).emit('chatMessage', '<p><b>' + socket.getNickname() + '</b>: ' + encodeHtmlEntity(msg) + '</p>');
		});

		// On command
		socket.on('command', function(cmd, args) {
			if(cmd == 'clear'){
				if(socket.isHost()){
					io.to(socket.getRoom().getName()).emit('clearChat');
				} else {
					socket.emit('chatMessage', '<p class="RED">You are not the host</p>');
				}
			} else if(cmd == 'img') {
				if(args.length < 1){
					socket.emit('chatMessage', '<p class="RED">Indvalid arguments</p>');
					socket.emit('chatMessage', '<p class="RED">Usage: /img link</p>');
				} else {
					io.to(socket.getRoom().getName()).emit('chatMessage', '<div><b>' + socket.getNickname() + '</b>: <img src="' + args[0] + '" style="width: 100%;"></div>');
				}
			} else if(cmd == 'commands'){
				socket.emit('chatMessage', '<p class="BLUE">Commands: clear (clears chat, host only), img (posts an image to chat)</p>');
			} else {
				socket.emit('chatMessage', '<p class="RED">Invalid command</p>');
			}
		});

		// On game start
		socket.on('gameStart', function() {
			if(socket.isHost()){
				var room = socket.getRoom().getName();
				io.to(room).emit('clearChat');
				io.to(room).emit('chatMessage', '<p class="GREEN"><b>Game started</b></p>');
				var players = socket.getRoom().getPlayers();
				var location = locations[Math.floor(Math.random() * locations.length)];
				var locationName = location[0];
				var defaultRole = location[1];
				var otherRoles = location.slice(2, location.length);
				var sockets = socket.getRoom().getSockets();
				var order = [];
				for(sock in sockets){
					order.push(order.length);
				}
				shuffle(order);
				sockets[order[0]].emit('gameStart', players, locations, '???', 'Spy');
				socket.getRoom().setSpy(sockets[order[0]]);
				for(var i = 1; i < order.length; i++){
					var role = defaultRole;
					if(otherRoles.length > 0){
						role = otherRoles.pop();
					}
					sockets[order[i]].emit('gameStart', players, locations, locationName, role);
				}
			} else {
				socket.emit('chatMessage', '<p class="RED">You are not the host</p>');
			}
		});

		// On game stop
		socket.on('gameStop', function() {
			if(socket.isHost()){
				io.to(socket.getRoom().getName()).emit('gameStop');
				io.to(socket.getRoom().getName()).emit('chatMessage', '<p class="GREEN"><b>Game stopped</b></p>');
			} else {
				socket.emit('chatMessage', '<p class="RED">You are not the host</p>');
			}
		});

		// TODO add logic for spy guess and voting for spy

	});
}

function Spyfall(io){
	bind(io);
	return spyfall;
}

module.exports = Spyfall;