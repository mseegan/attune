$(document).ready(function() {
	// console.log("channel.js is running");

	var socket = io();
	var roomId = window.location.pathname.split('/')[2];

	// 2. This code loads the IFrame Player API code asynchronously.

	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	socket.emit('create', roomId);
	// 3. This function creates an <iframe> (and YouTube player)
	//    after the API code downloads.
	var player;
	var socketId;
	window.onYouTubeIframeAPIReady = function() {
		player = new YT.Player('player', {
			height: '390',
			width: '640',
			// videoId: 'yecrOqC77jY',
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onStateChange
			}
		});
	}
	// 4. The API will call this function when the video player is ready.
	function onPlayerReady(event) {
		var url = document.documentURI;
		var uniq = "";
		var matches = url.match(/\/channel\/([^\/]+)/);
		if (matches) {
			uniq = matches[1];    // "whatever"
			socket.emit('addUser', {
				user: 'guest',
				channel_id: uniq
			});
			$.ajax({
				url:'/channel/'+uniq,
				contentType: 'application/json',
				dataType: 'json',
				success: function(result) {
					setChannel(result);
				}
			})
		} else {
			// no match for the category
		}
		// socket.emit('new player state');
	}
	// 5. The API calls this function when the player's state changes.
	//    The function indicates that when playing a video (state=1),
	//    the player should play for six seconds and then stop.
	function onStateChange(event) {
		var playerState = event.data;
		var playerTime = player.getCurrentTime();
		if (playerState == YT.PlayerState.PLAYING) {
			socket.emit('set player state', playerState, playerTime);
			// console.log("Player set to playing");
			//console.log(player.getCurrentTime())vv
		} else if (playerState == YT.PlayerState.PAUSED) {
			// console.log("Player set to paused");
			socket.emit('set player state', playerState, playerTime);
		}
		/*
		if (player.getPlayerState() === 1) {
			console.log(player.getCurrentTime())
		}
		*/
	}
	function setPlayerState(state,time) {
		if (state == YT.PlayerState.PLAYING) {
			// console.log('state', state);
			// console.log('time', time);
			// console.log("player time: ", player.getCurrentTime());
			if (player.getCurrentTime().toPrecision(2) != time.toPrecision(2) && player.getPlayerState() != state) {
				player.seekTo(time);
			}
			player.playVideo();
			// console.log("Set Player to playing at: "+time);
			//console.log(player.getCurrentTime())
		} else if (state == YT.PlayerState.PAUSED) {
			player.pauseVideo()
			// console.log("Set Player to paused");
		}

	}
		// load new video
		$('#chatForm').submit(function(e){
			// console.log("submit pressed");
			e.preventDefault();
			if ($('#m').val()){
				socket.emit('chat message', $('#n').val() + ': ', $('#m').val());
				$('#m').val('');
			}
		});
		$('#loadUrl').click (function loadVideo(e) {
			// console.log("button is pressed");
			// console.log($('#videoUrl').val());
			e.preventDefault();
			var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			var match = $('#videoUrl').val().match(regExp);
			// console.log(match);
			if (match && match[2].length == 11) {
				var vidId = match[2];
				player.loadVideoById(match[2]);
				socket.emit('load video', vidId);
				$.ajax({
					url:'/channel/'+uniq,
					type: 'PUT',
					dataType: 'json',
					data: {current_video: match[2]},
					success: function(result){
						// console.log('updated current video', result);
					},
					error: function(error){
						// console.log('error', error);
					}
				})
			}else {
				$('#messages').append($('<li style="color: red;">').text("invalid url"));
				$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
			}
		return false;
		});
		// socket.on('request player state', function(){
		// 	playerState = player.getPlayerState();
		// 	playerTime = player.getCurrentTime();
		// 	socket.emit('respond player state', playerState, playerTime);
		// });
		$('#n').blur(
			function(){
				// console.log('blur');
				socket.emit('name change', socketId, $('#n').val());
			}
		);
		socket.on('new user', function(socket){
			// console.log('new user session id: ', socket);
			socketId = socket;
		});
		socket.on('chat message', function(msg){
			var d = new Date();
			$('#messages').append($('<li>').text('[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ' + msg));
			$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
		});
		socket.on('update name list', function(clients){
			nameList = clients;
			$(".userList").empty();
			console.log('nameList: ', nameList);
			// console.log('latest member: ', nameList[nameList.length-1]);
			// $'(.name').remove();
			for (name in nameList){
				if (nameList[name].roomId === roomId){
					$('.userList').append($('<li class="name">').text(nameList[name].name));
				}
			}
		});
		socket.on('new player', function(clients, id){
			if (player.getCurrentTime() != undefined){
				var playerTime = player.getCurrentTime();
				var userJoined =clients[clients.length-1].sessionId;
				// console.log("playerTime: ", socketId + ": "+ playerTime);
				// console.log('user joined: ', userJoined);
				socket.emit('send video data', userJoined, id, playerTime)
			}
		});
		socket.on('set player state', function(state,time){
			setPlayerState(state,time, "large");
		});
		socket.on('load video', function(id, time){
			// console.log("id: " + id + " time: " + time);
			player.loadVideoById(id, time + 1);
			return false;
		});
		function setChannel(channel) {
			$('#title').text('Channel: '+channel.name);
			id = channel.current_video
			socket.emit('user connected', id);
			player.loadVideoById(id);
		};



});
