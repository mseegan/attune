
var ONEDAY = 86400000;



var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
//var routes = require('routes/routes.js');

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

app.use(express.static(__dirname + '/public'));


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
*	GET: /channel/**uniq**
*
*	Servers the view for a channel with the unique id
*
*	return channel.html
*/
app.get('/channel/:uniq', function (req, res) {
	res.format({
		html: function() {
			var uniq = req.params.uniq;
			console.log('[log] : GET /channel/'+uniq);
			res.sendFile(__dirname + '/views/channel.html');
		},
		json: function() {
			var uniq = req.params.uniq;
			console.log('[log] : GET /channel/'+uniq);
			//search for channel
			db.Channel.findOne({uniq:uniq}, function(err, channel) {
				//res.json({'channel':channels});
				if (err) {
					console.log('[log] : Error - ',err);
				} else if (channel) {
					res.json(channel);
				} else {
					res.json({ error: 'Not found' });
				}
			});
		}
	});
});

/*
*	GET: /channel
*
*	Lists all the channels in json format
*
*	return [{name:'',owner:''},....]
*/
app.get('/channel', function(req, res) {
	console.log('[log] : GET /channel');
	db.Channel.find({}, function(err, channels) {
		res.json({'channels':channels});
	});
});

// creates a new channel uniquely named channel
// may remove unique ids since names are unique however some names may not work in urls
/*
*	POST: /channel
*
*	Body: {
*		name: String,
*		owner: String,
*	}
*
*	Creates a new channel with the info provided and returns information on the channel in json format
*
*	return {name:'',owner:''}
*/
app.post('/channel', function(req, res){
	console.log('[log] : POST /channel');
	console.log('[log] : Body: '+ req.body.name);
	var uniq = intformat(generator.next(), 'dec');
	db.Channel.create({
		name : req.body.name,
		owner : 'guest',
		date : Date.now(),
		uniq : uniq,
	}, function(err, channel) {
		if (err) {
			console.log(err);
		} else {
			res.json(channel);
		}
	});
});


//Sockets
io.on('connection', function(socket){
	console.log('a user connected');
	var channelId
	socket.on('addUser', function(data){ //adds user to channel
		console.log('Added user to channel: '+data);
		socket.join(data);
		channelId = data;
		//socket.user = data.user;
	});
	socket.on('disconnect', function(){
		console.log('User disconnected');
	});
	socket.on('set player state', function(state, time) {

		console.log('Channel: '+socket.channel_id+' set player state: ' + state +' time: '+time);
		io.to(channelId).emit('set player state', state, time);
	});
	socket.on('chat message', function(msg){
		console.log('Channel: '+socket.channel_id+' message: ' + msg);
		io.to(channelId).emit('chat message', msg);
	});
});


http.listen(5000, function () {
  console.log('Attune listening on port 5000!');
});

  res.sendFile(__dirname + '/views/index.html');
});

app.listen(5000, function () {
  console.log('Example app listening on port 5000!');
});
