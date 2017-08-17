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
app.set('views', __dirname + '/views');
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

//////////////////////////////
//set up express application//
//////////////////////////////
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/public', express.static(__dirname + '/public', { maxAge: ONEDAY }));

server.listen(process.env.PORT || 5000, function(){

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
  }
});
//Sockets
var clients = [];
var rooms = [];
var timers = [];
io.on('connection', function(socket){
	var roomId;
  socket.on('create', function(room){
    roomId = room;
    socket.join(room);
  });
  socket.on('user connected', function(id){
    clients.push({ 'name': 'Anonymous', 'sessionId': socket.id, 'roomId': roomId});
    socket.emit('new user', socket.id);
    io.to(roomId).emit('update name list', clients);
    io.to(roomId).emit('new player', clients, id);
  });
  socket.on('send video data', function(user, videoId, playerTime){
      socket.broadcast.to(user).emit('load video', videoId, playerTime);
  });
	socket.on('disconnect', function(){
    for (var q=0; q < clients.length; q++){
      if(clients[q].sessionId === this.id){
        clients.splice(q, 1);
      }
    }
    io.to(roomId).emit('update name list', clients);
    var test = io.sockets.adapter.rooms;
    var keys = Object.keys(test);
    if (clients.length === 0){
      clearRoom();
    } else {
      var usersConnected = 0;
      for (j=0; j < clients.length; j++){
            if (clients[j].roomId != roomId){
            } else {
              usersConnected++
            }
      }
      shouldDelete(usersConnected);
      function shouldDelete(num){
        if(num === 0){
            clearRoom();
        }
      }
      var timeout;
    }
    function clearRoom(){
      if (roomId != "lobby" && roomId != undefined){
      var uniq = roomId;
      rooms.push(roomId);
      timers.push(setTimeout(function(){
        db.Channel.findOne({uniq:uniq}, function(err, channel){
          if (channel != null){
            channel.remove(function(err, result){
              else{
                socket.to('lobby').emit('update');
                for(i=0; i<rooms.length; i++){
                  if(rooms[i] === uniq){
                    timers.splice(i, 1);
                    rooms.splice(i, 1);
                  }
                }
              }
            });
          }
        });
      }
      , 1000 * 10));
    }
    }
	});
  socket.on('name change', function(socketId, newName){
    for (i=0; i < clients.length; i++){
      if (socketId == clients[i].sessionId){
        clients[i].name = newName;
      }
    }
    io.to(roomId).emit('update name list', clients);
  });
  socket.on('skip expired', function(){
    io.to(roomId).emit('cancel timer');
    resetSkip(roomId);
    io.to(roomId).emit('unhide skip');
    io.to(roomId).emit('skip message', '[SERVER]: Skip vote Timed out.')
  });
  socket.on('vote skip', function(uid, time){
    var skipCount = 0;
    var total = 0;
    for (i=0; i<clients.length; i++){
      if(clients[i].sessionId == uid){
        clients[i].skip = true;
        socket.emit('vote skip', function(){
        });
        for (i=0; i< clients.length; i++){
          if(clients[i].roomId == roomId){
            total ++
            if(clients[i].skip == true){
              skipCount++
            }
          }
        }
        rounded = Math.ceil(total/2);
        if (skipCount >= rounded){
          io.to(roomId).emit('skip message', '[SERVER]: Skip vote passes. Skipping...');
          io.to(roomId).emit('cancel timer');
          io.to(roomId).emit('unhide skip');
          io.to(roomId).emit('skip', time);
          resetSkip(roomId);
        } else if (skipCount < rounded){
          io.to(roomId).emit('skip message', '[SERVER]: ' + skipCount +' out of '+ rounded + ' required votes to skip current video.');
        }
      }
    }
  });
  function resetSkip(id){
    for (i=0; i< clients.length; i++){
      if(clients[i].skip == true){
        clients[i].skip = false;
      }
    }
  }
  socket.on('check video', function(vidid, id){
    counter = 0;
    for (i=0; i<clients.length; i++){
      if (clients[i].roomId == roomId){
        counter++
      }
        if (counter > 1){
          socket.broadcast.to(roomId).emit('check video',vidid, id);
        } else {
        socket.emit('video compare', 'match');
      }
    }
  });
  socket.on('video compare', function(vidid, uid){
    if (vidid == 'match'){
      socket.broadcast.to(uid).emit('video compare', "match");
    } else {
      socket.broadcast.to(uid).emit('video compare', vidid);
    }
  });
	socket.on('set player state', function(state, time) {

		io.to(roomId).emit('set player state', state, time);
	});
	socket.on('chat message', function(username, msg){

		io.to(roomId).emit('chat message', username + msg);
	});
  socket.on('load video', function(id) {
    currentVideoId = id;
    io.to(roomId).emit('load video', id, 0);
    io.to(roomId).emit('unhide skip');

  });
  socket.on('hide load', function(){
    socket.broadcast.to(roomId).emit('hide load');
  });
  socket.on('queue video', function(queue){
    io.to(roomId).emit('queue video', queue);
  });
  socket.on('skip', function(time){

    io.to(roomId).emit('skip', time);
  });
  socket.on('remove', function(){
    socket.broadcast.to(roomId).emit('remove');
  });
  socket.on('stop countdown', function(rid){
      for (i=0; i < rooms.length; i ++){
        if (rid == rooms[i]){
          stopCountdown(i);
        }
      }
    function stopCountdown(timeoutID){
      clearTimeout(timers[timeoutID]);
      timers.splice(timeoutID, 1);
      rooms.splice(timeoutID, 1);


    }
  });
});
