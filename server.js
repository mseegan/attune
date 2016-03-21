var ONEDAY = 86400000;

var express = require('express');
//var socket_io = require('socket.io');


var app = express();
//var io = socket_io(app);

app.use('/public', express.static(__dirname + '/public', { maxAge: ONEDAY }));

app.listen(5000, function () {
  console.log('Example app listening on port 5000!');
});


//geto database
var rooms = [
	{name:'My Room', owner: 'guest', date: 'some date', uniq:'kdshfalkf'}, 
	{name:'Your Room', owner: 'guest', date: 'some date', uniq:'asdjhfkasdj'}, 
];

//Endpoints
app.get('/', function (req, res) {
	console.log('[log] : GET /');
	res.sendFile(__dirname + '/views/index.html');
});


app.get('/lobby', function (req, res) {
	console.log('[log] : GET /lobby');
	res.sendFile(__dirname + '/views/lobby.html');
});

app.get('/lobby/rooms', function(req, res) {
	console.log('[log] : GET /lobby/rooms');
	var response = [];
	for (var r=0; r<rooms.length; r++) {
			response.push(rooms[r]);
	}
	res.json({rooms:response});
});

app.post('lobby/rooms', function(req, res){
	console.log('[log] : POST /lobby/rooms');
})

app.get('/room/:name', function (req, res) {
	console.log('[log] : GET /lobby'+name);
	res.sendFile(__dirname + '/views/room.html');
});

/*
//Sockets
io.on('connection', function (socket) {
	//socket.emit('change', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
	socket.on('disconnected', function() {
		console.log('User left');
	})
});
*/



