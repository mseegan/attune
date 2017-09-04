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
//Sockets
var clients = [];
var rooms = [];
var timers = [];
io.on('connection', function(socket){
	var roomId;
  console.log("rooms: ", rooms);
  socket.on('create', function(room){
    roomId = room;
    socket.join(room);
    // console.log("room list connection: ", io.sockets.adapter.rooms)
  });
  socket.on('user connected', function(id){
    // console.log("ran");
    clients.push({ 'name': 'Anonymous', 'sessionId': socket.id, 'roomId': roomId});
    // console.log('user connected: ' + socket.id);
    // console.log("CLIENTS: ", clients);
    socket.emit('new user', socket.id);
    io.to(roomId).emit('update name list', clients);
    io.to(roomId).emit('new player', clients, id);
  });
  socket.on('send video data', function(user, videoId, playerTime){
      socket.broadcast.to(user).emit('load video', videoId, playerTime);
  });
	socket.on('disconnect', function(){
		console.log('User disconnected: ', this.id);
    for (var q=0; q < clients.length; q++){
      if(clients[q].sessionId === this.id){
        // console.log("client to be deleted: ", clients[q]);
        clients.splice(q, 1);
      }
    }
    // console.log('clients', clients);
    io.to(roomId).emit('update name list', clients);
    var test = io.sockets.adapter.rooms;
    // console.log("test: ", test);
    // console.log("length of test: ", test.length);
    var keys = Object.keys(test);
    // console.log("keys: ", keys);
    // console.log("room to be deleted: ", roomId);
    if (clients.length === 0){
      // console.log("nobody is connected. Deleting room: ", roomId);
      clearRoom();
    } else {
      var usersConnected = 0;
      for (j=0; j < clients.length; j++){
        // for(i=0; i < keys.length; i++){
        //   if (keys[i] != clients[j].roomId){
            if (clients[j].roomId != roomId){
              // console.log(clients[j].sessionId, " is not in the room: ", roomId);
              // console.log(clients[j].sessionId, " is in the room: ", clients[j].roomId);
            } else {
              // console.log(clients[j].sessionId, " is in the room: ", clients[j].roomId);
              usersConnected++
            }
        //   }
        // }
      }
      shouldDelete(usersConnected);
      function shouldDelete(num){
        // console.log("num: ", num);
        if(num === 0){
          // console.log("room is empty; delete room: ", roomId);
            clearRoom();
        } else{
          // console.log("room has members; don't delete: ", roomId);
        }
      }
      var timeout;
      // console.log(clients);
    }
    function clearRoom(){
      if (roomId != "lobby" && roomId != undefined){
      // console.log("roomID", roomId);
      var uniq = roomId;
      // console.log("uniq: ", uniq);
      console.log("counting down to deletion of channel: ", uniq);
      rooms.push(roomId);
      timers.push(setTimeout(function(){
        db.Channel.findOne({uniq:uniq}, function(err, channel){
          // console.log("found it!")
          // console.log("channel: ", channel);
          if (channel != null){
            channel.remove(function(err, result){
              if(err){ console.log("[log] error - ", err); }
              else{
                console.log("sucessfully removed the channel!");
                io.to('lobby').emit('update');
                for(i=0; i<rooms.length; i++){
                  // console.log('iteration');
                  if(rooms[i] === uniq){
                    // console.log("matched!");
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
    // console.log("rooms array: ", rooms);
    // console.log("timers array: ", timers);
    }
	});
  socket.on('name change', function(socketId, newName){
    for (i=0; i < clients.length; i++){
      if (socketId == clients[i].sessionId){
        clients[i].name = newName;
      }
    }
    // for (client in clients) {
    //   if (socketId == clients[client].sessionId){
    //     clients[client].name = newName;
    //   }
    // }
    io.to(roomId).emit('update name list', clients);
  });
  socket.on('skip expired', function(){
    io.to(roomId).emit('cancel timer');
    resetSkip(roomId);
    io.to(roomId).emit('unhide skip');
    io.to(roomId).emit('skip message', '[SERVER]: Skip vote Timed out.')
  });
  socket.on('vote skip', function(uid, time){
    console.log("ran");
    var skipCount = 0;
    var total = 0;
    for (i=0; i<clients.length; i++){
      console.log('sessionId');
      console.log("uid: ", uid);
      if(clients[i].sessionId == uid){
        clients[i].skip = true;
        socket.emit('vote skip', function(){
          console.log ("skip value for user", clients[i]);
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
        console.log("skipCount: ", skipCount);
        console.log("rounded: ", rounded);
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
    console.log("clients after reset: ", clients);
  }
  socket.on('remove queue', function(){
    io.to(roomId).emit('remove queue');
  });
  socket.on('check video', function(vidid, id){
    counter = 0;
    for (i=0; i<clients.length; i++){
      console.log("iteration");
      if (clients[i].roomId == roomId){
        counter++
        console.log("got one!")
      }
        if (counter > 1){
          console.log("counter > 1");
          socket.broadcast.to(roomId).emit('check video',vidid, id);
        } else {
        console.log("just me");
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
		// console.log('Channel: '+socket.channel_id+' set player state: ' + state +' time: '+time);
		io.to(roomId).emit('set player state', state, time);
	});
	socket.on('chat message', function(username, msg){
		// console.log('Channel: ' + roomId + ' username: ' + username + ' message: ' + msg);
		io.to(roomId).emit('chat message', username + msg);
	});
  socket.on('load video', function(id) {
    currentVideoId = id;
    // console.log('current video id', currentVideoId)
    io.to(roomId).emit('load video', id, 0);
    io.to(roomId).emit('unhide skip');
    // console.log('current id', currentVideoId);
  });
  socket.on('hide load', function(){
    socket.broadcast.to(roomId).emit('hide load');
  });
  socket.on('queue video', function(queue){
    io.to(roomId).emit('queue video', queue);
  });
  socket.on('skip', function(time){
    console.log('skipping...');
    io.to(roomId).emit('skip', time);
  });
  socket.on('remove', function(){
    socket.broadcast.to(roomId).emit('remove');
  });
  socket.on('stop countdown', function(rid){
    // console.log("roomId: ", roomId);
    // console.log("user connected to: ", rid);
    // if(rid === roomId){
      // console.log("stopping...");
      for (i=0; i < rooms.length; i ++){
        if (rid == rooms[i]){
          // console.log("stopping deletion for room :", rooms[i]);
          stopCountdown(i);
        }
      }
    // }
    // if (roomId === uniq){
    //   stopCountdown(timeoutID);
    // }
    function stopCountdown(timeoutID){
      console.log("Stopped countdown for:", roomId);
      clearTimeout(timers[timeoutID]);
      timers.splice(timeoutID, 1);
      rooms.splice(timeoutID, 1);
      // console.log("timers: ", timers);
      // console.log("rooms: ", rooms);
    }
  });
});


// for (client in clients) {
//   if (clients[client].sessionId === this.id){
//     console.log("we have a match!", this.id);
//     console.log("session ID for reference: ", clients[client].sessionId);
//     clients.splice(client, 1);
//   }
//   console.log("io.sockets.adapter.rooms", io.sockets.adapter.rooms);
//   console.log("check for rooms", rooms);
//   if(clients.length === 0){
//     console.log("the room is completely empty...");
//     console.log("counting down to deletion of roomId: ", roomId);
//   }
// }
