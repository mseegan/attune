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
var db = require('./models');

//middleware
app.use('/public', express.static(__dirname + '/public', { maxAge: ONEDAY }));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


//getto database
var users = {};

//Routes

//index
app.get('/', function (req, res) {
	console.log('[log] : GET /');
	res.sendFile(__dirname + '/views/index.html');
});


//
app.get('/lobby', function (req, res) {
	console.log('[log] : GET /lobby');
	res.sendFile(__dirname + '/views/lobby.html');
});
/*
*	GET: /room/**uniq**
*
*	Servers the view for a room with the unique id
*
*	return room.html
*/
app.get('/room/:uniq', function (req, res) {
	res.format({
		html: function() {
			var uniq = req.params.uniq;
			console.log('[log] : GET /view/room/'+uniq);
			res.sendFile(__dirname + '/views/room.html');
		},
		json: function() {
			var uniq = req.params.uniq;
			console.log('[log] : GET /room/'+uniq);
			//search for room
			db.Channel.findOne({uniq:uniq}, function(err, channel) {
				//res.json({'room':channels});  
				if (channel) {
					res.json(channel);
				} else {
					res.json({ error: 'Not found' });
				}
				});

		}
	});
});

/*
*	GET: /room
*
*	Lists all the rooms in json format
*
*	return [{name:'',owner:''},....]
*/
app.get('/room', function(req, res) {
	console.log('[log] : GET /room');
	db.Channel.find({}, function(err, channels) {
		res.json({'rooms':channels});  
	});
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
	var channel = {
		name : req.body.name,
		owner : 'guest',
		date : Date.now(),
		uniq : uniq,
		tags : ''
	}
	var c = new db.Channel(channel);
	c.save(function(err) {
		if (err) {
			console.log(err);
		} else {
			res.json(channel);
		}
		
	})
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


