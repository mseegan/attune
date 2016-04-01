var ONEDAY = 86400000;

var express = require('express');
//var http = require('http');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var fs = require('fs');
var expressHbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

var io = require('socket.io')(server);


// database connection
//var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/mydb');

// middleware and environment varibles
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

//app.use(express.favicon());
//app.use(express.logger('dev'));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//app.use(express.methodOverride());
//app.use(express.cookieParser('your secret here'));
//app.use(express.session());
//app.use(app.router);
app.use('/public', express.static(__dirname + '/public', { maxAge: ONEDAY }));

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// dynamically include routes (Controller)
fs.readdirSync('./controllers').forEach(function (file) {
  if(file.substr(-3) == '.js') {
      route = require('./controllers/' + file);
	  var router = express.Router();
      route.controller(router, app);
	  var controller_name = route.name || '/'+file.substring( 0, file.indexOf( ".js" ));
	  var controller_endpoint = ''
	  if (controller_name=='index') { //index entry point will be /
			controller_endpoint = '/';
			app.use(controller_endpoint, router);
	  } else {
			controller_endpoint = '/'+controller_name;
			app.use(controller_endpoint, router);
	  }
	  console.log('[log] Initialized: '+controller_name+' controller -> Served at: '+controller_endpoint);
  }
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
  socket.on('load video', function(id) {
    io.to(channelId).emit('load video', id);
  });
});
