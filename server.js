var ONEDAY = 86400000;

var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

var FlakeIdGen = require('flake-idgen')
    , intformat = require('biguint-format')
    , generator = new FlakeIdGen;


var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//middleware
app.use('/public', express.static(__dirname + '/public', { maxAge: ONEDAY }));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded



//getto database
var rooms = [
	{name:'My Room', owner: 'guest', date: 'some date', uniq:'kdshfalkf', tags:''}, 
	{name:'Your Room', owner: 'guest', date: 'some date', uniq:'asdjhfkasdj', tags:''}, 
];

var users = {};

//Routes

//index
app.get('/', function (req, res) {
	console.log('[log] : GET /');
	res.sendFile(__dirname + '/views/index.html');
});


//
app.get('/view/lobby', function (req, res) {
	console.log('[log] : GET /lobby');
	res.sendFile(__dirname + '/views/lobby.html');
});
/*
*	GET: /view/room/**uniq**
*
*	Servers the view for a room with the unique id
*
*	return room.html
*/
app.get('/view/room/:uniq', function (req, res) {
	var uniq = req.params.uniq;
	console.log('[log] : GET /view/room/'+uniq);
	res.sendFile(__dirname + '/views/room.html');
});

/*
*	GET: /room
*
*	Lists all the rooms in json format
*
*	return [{name:'',owner:''},....]
*/
app.get('/room', function(req, res) {
	console.log('[log] : GET /lobby/rooms');
	var response = [];
	for (var r=0; r<rooms.length; r++) {
			response.push(rooms[r]);
	}
	res.json({rooms:response});
});

// creates a new room uniquely named room
// may remove unique ids since names are unique however some names may not work in urls
/*
*	POST: /room
*
*	Body: {
*		name:'',
*		owner: '',
*	}
*
*	Creates a new room with the info provided and returns information on the room in json format
*
*	return {name:'',owner:''}
*/
app.post('/room', function(req, res){
	console.log('[log] : POST /room');
	console.log('[log] : Body: '+ req.body.name);
	var uniq = intformat(generator.next(), 'dec');
	var room = {
		name: req.body.name,
		owner: 'guest',
		date: 'some date',
		uniq: uniq, 
		tags:'',
	}
	rooms.push(room);
	res.json(room);
});

app.get('/room/:uniq', function(req, res){
	var uniq = req.params.uniq;
	console.log('[log] : GET /room/'+uniq);
	//search for room
	var room = null;
	for (var r=0; r<rooms.length; r++) {
		if (uniq == rooms[r].uniq) {
			room = rooms[r];
			break;
		}
	}
	if (room) {
		res.json(rooms[r]);
	} else {
		res.json({ error: 'Not found' });
	}
});


//Sockets
io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('addUser', function(data){ //adds user to room
		console.log('Added user to room: '+data.room_id);
		socket.join(data.room_id);
		socket.room_id = data.room_id;
		socket.user = data.user;
	});
	socket.on('disconnect', function(){
		console.log('User disconnected');
	});
	socket.on('set player state', function(state) {
		console.log('Room: '+socket.room_id+' set player state: ' + state);
		io.to(socket.room_id).emit('set player state', state);
	});
	socket.on('chat message', function(msg){
		console.log('Room: '+socket.room_id+' message: ' + msg);
		io.to(socket.room_id).emit('chat message', msg);
	});
});


http.listen(5000, function () {
  console.log('Attune listening on port 5000!');
});


