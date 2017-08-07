var ONEDAY = 86400000,

 express = require('express'),
// http = require('http'),
 path = require('path'),
 app = express(),
 server = require('http').Server(app),
 fs = require('fs'),
 expressHbs  = require('express-handlebars'),
 cookieParser = require('cookie-parser'),
 bodyParser = require('body-parser'),
 multer = require('multer'), // v1.0.5
 upload = multer(), // for parsing multipart/form-data

 morgan = require('morgan'),
 passport = require('passport'),
 flash = require('connect-flash'),
 session = require('express-session'),

 io = require('socket.io')(server),


// database connection
 mongoose = require('mongoose'),
 db = require('./models');
//mongoose.connect('mongodb://localhost/mydb');

// middleware and environment varibles
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

//////////////////////////////
//set up express application//
//////////////////////////////
//app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//////////////////////////////
//required for passport///////
//////////////////////////////
app.use(session({ secret: 'iloveanime'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


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
//update current video on individual channel
app.put('channel/:uniq',function update(req, res){
  db.Channel.findOne({uniq: matches[1]}, function(err, foundChannel){
    if (err) {console.log('error', err)}
    foundChannel.current_video = id;
    foundChannel.save(function(err, saved){
      if (err) {console.log('error', err)}
      res.json(saved);
    })
  });
});
//Sockets
io.on('connection', function(socket){
	console.log('a user connected');
	var roomId;
  socket.on('create', function(room){
    roomId = room;
    socket.join(room);
  });
	// socket.on('addUser', function(data){ //adds user to channel
	// 	console.log('Added user to channel: '+data);
	// 	socket.join(data);
	// 	roomId = data;
	// 	//socket.user = data.user;
	// });
	socket.on('disconnect', function(){
		console.log('User disconnected');
	});
	socket.on('set player state', function(state, time) {

		console.log('Channel: '+socket.channel_id+' set player state: ' + state +' time: '+time);
		io.to(roomId).emit('set player state', state, time);
	});
	socket.on('chat message', function(username, msg){
		console.log('Channel: ' + roomId + ' username: ' + username + ' message: ' + msg);
		io.to(roomId).emit('chat message', username + msg);
	});
  socket.on('load video', function(id) {
    currentVideoId = id;
    io.to(roomId).emit('load video', id);
    console.log('current id', currentVideoId);
  });
});
