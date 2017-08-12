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
io.on('connection', function(socket){
	var roomId;
  socket.on('create', function(room){
    roomId = room;
    rooms.push(room);
    socket.join(room);
    console.log("room list connection: ", io.sockets.adapter.rooms)
  });
  socket.on('user connected', function(id){
    // console.log("ran");
    clients.push({ 'name': 'Anonymous', 'sessionId': socket.id, 'roomId': roomId});
    console.log('user connected: ' + socket.id);
    console.log("CLIENTS: ", clients);
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
        console.log("client to be deleted: ", clients[q]);
        clients.splice(q, 1);
      }
    }
    console.log('clients', clients);
    io.to(roomId).emit('update name list', clients);
    //////////////////////////////////
    var test = io.sockets.adapter.rooms;
    console.log("test: ", test);
    // console.log("length of test: ", test.length);
    var keys = Object.keys(test);
    console.log("keys: ", keys);
    console.log("room to be deleted: ", roomId);
    if (clients.length === 0){
      console.log("nobody is connected. Deleting room: ", roomId);
      clearRoom();
    } else {
      var usersConnected = 0;
      for (j=0; j < clients.length; j++){
        // for(i=0; i < keys.length; i++){
        //   if (keys[i] != clients[j].roomId){
            if (clients[j].roomId != roomId){
              console.log(clients[j].sessionId, " is not in the room: ", roomId);
              console.log(clients[j].sessionId, " is in the room: ", clients[j].roomId);
            } else {
              console.log(clients[j].sessionId, " is in the room: ", clients[j].roomId);
              usersConnected++
            }
        //   }
        // }
      }
      shouldDelete(usersConnected);
      function shouldDelete(num){
        console.log("num: ", num);
        if(num === 0){
          console.log("room is empty; delete room: ", roomId);
          clearRoom();
        } else{
          console.log("room has members; don't delete: ", roomId);
        }
      }
      var timeout;
      console.log(clients);
    }
    function clearRoom(){
      var uniq = roomId;
      setTimeout(function(){
        db.Channel.findOne({uniq:uniq}, function(err, channel){
          console.log("found it!")
          console.log("channel: ", channel);
          channel.remove(function(err, result){
            if(err){ console.log("[log] error - ", err); }
            else{
              console.log("sucessfully removed the channel!");
              socket.to('lobby').emit('update');
            }
          });
        });
      }
      , 5000);
    }
    // for (i=0; i < keys.length; i++){
    //   if (keys[i] === roomId){
    //     console.log("roomiD matches key");
    //     for (j=0; j < clients.length; j++){
    //       console.log("roomId: ", roomId);
    //       console.log("key: ", keys[i]);
    //       console.log("client room id: ", clients[j].roomId);
    //       if(clients[j].roomId === keys[i]){
    //         console.log("client's room matches key");
    //       } else {
    //           console.log("client's room does not match key");
    //       }
    //     }
    //   }
    // }
    // for (key in keys){
    //   if (keys[key] === roomId ){
    //     for (client in clients){
    //       console.log("roomId: ", roomId);
    //       console.log("key: ", keys[key]);
    //       console.log("client room id: ", clients[client].roomId);
    //
    //       // console.log("client room: ", clients[client].roomId);
    //       // console.log("key: ", keys[key]);
    //       if (clients[client].roomId === roomId){
    //         if (keys[key] === roomId && clients[client].roomId === roomId){
    //           console.log("found one!")
    //         } else {
    //           console.log("found none!");
    //         }
    //       }
    //     }
    //   }
    // }
    //////////////////////////////
	});
  socket.on('name change', function(socketId, newName){
    // console.log('newName: ', newName);
    // console.log("socketId: ", socketId);
    // console.log("clients: ", clients);
    for (client in clients) {
      if (socketId == clients[client].sessionId){
        clients[client].name = newName;
        // console.log("new name: ", clients[client].name);
      }
    }
    io.to(roomId).emit('update name list', clients);
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
    // console.log('current id', currentVideoId);
  });
  socket.on('queue video', function(queue){
    socket.broadcast.to(roomId).emit('queue video', queue);
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

//     // function stopCountdown(){
//     //   console.log("Stopped!");
//     //     clearTimeout(timeout);
//     // }

//     // socket.on('stop countdown', function(roomId){
//     //   console.log("user connected to: ", roomId);
//     //   console.log("stopping...");
//     //   if (roomId === uniq){
//     //     stopCountdown();
//     //   }
//     // });
//   }
// }
