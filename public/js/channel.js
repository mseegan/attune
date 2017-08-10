$(document).ready(function() {

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
	var url = document.documentURI;
	var uniq = "";
	var matches = url.match(/\/channel\/([^\/]+)/);
	var player;
	var socketId;
	var playList = [];
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
		if (matches) {
			uniq = matches[1];    // "whatever"
			// socket.emit('addUser', {
			// 	user: 'guest',
			// 	channel_id: uniq
			// });
			$.ajax({
				url:'/channel/'+ uniq,
				contentType: 'application/json',
				dataType: 'json',
				success: function(result) {
					setChannel(result);
				}
			});
			getQueue();
			// setInterval(getQueue(), 5000);
		} else {
			// no match for the category
		}
		// socket.emit('new player state');
	}
	// 5. The API calls this function when the player's state changes.
	//    The function indicates that when playing a video (state=1),
	//    the player should play for six seconds and then stop.
	function onStateChange(event) {
		if (event.data === 0){
			if(playlist.length >= 1){
				socket.emit('load video', playlist[0].videoId);
				removeQueue();
			} else {
			}
		}
		function removeQueue(){
			$.ajax({
				method: 'PUT',
				url:'/channel/'+uniq+'/queue',
				dataType: 'text',
				data: {videoId: playlist[0].videoId},
				success: function(){
					playlist.shift();
					renderQueue(playlist);
					getQueue();
				}, error: function(error){
				}
			});
		}
		var playerState = event.data;
		var playerTime = player.getCurrentTime();
		if (playerState == YT.PlayerState.PLAYING) {
			socket.emit('set player state', playerState, playerTime);
		} else if (playerState == YT.PlayerState.PAUSED) {
			socket.emit('set player state', playerState, playerTime);
		}
		/*
		if (player.getPlayerState() === 1) {
		}
		*/
	}
	function setPlayerState(state,time) {
		if (state == YT.PlayerState.PLAYING) {
			if (player.getCurrentTime().toPrecision(2) != time.toPrecision(2) && player.getPlayerState() != state) {
				player.seekTo(time);
			}
			player.playVideo();
		} else if (state == YT.PlayerState.PAUSED) {
			player.pauseVideo()
		}

	}
		// load new video
		$('#chatForm').submit(function(e){
			e.preventDefault();
			if ($('#m').val()){
				socket.emit('chat message', $('#n').val() + ': ', $('#m').val());
				$('#m').val('');
			}
		});
		$('#queueButton').click(function(e){
			e.preventDefault();
			var vidUrl = $('#queueUrl').val();
			var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			var match = vidUrl.match(regExp);
			if (match && match[2].length == 11) {
				var vidId = match[2];
				$.ajax({
					url:'/channel/'+uniq,
					type: 'PUT',
					dataType: 'text',
					data: {videoId: match[2]},
					success: function(result){
					},
					error: function(error){
					}
				}).done(function(){
					getQueue();
				});
			}else {
				$('#messages').append($('<li style="color: red;">').text("invalid url"));
				$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
			}

			$('#queueUrl').val('');
		return false;
		});
		$('#loadUrl').click (function loadVideo(e) {
			e.preventDefault();
			var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			var match = $('#videoUrl').val().match(regExp);

			if (match && match[2].length == 11) {
				var vidId = match[2];
				player.loadVideoById(match[2]);
				socket.emit('load video', vidId);
				updateCurrent(match[2]);
			}else {
				$('#messages').append($('<li style="color: red;">').text("invalid url"));
				$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
			}
			$('#videoUrl').val('');
		return false;
		});

		$('#n').blur(
			function(){
				socket.emit('name change', socketId, $('#n').val());
			}
		);
		socket.on('new user', function(socket){
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
				socket.emit('send video data', userJoined, id, playerTime)
			}
		});
		socket.on('set player state', function(state,time){
			setPlayerState(state,time, "large");
		});
		socket.on('load video', function(id, time){
			player.loadVideoById(id, time + 1);
			updateCurrent(id);
			return false;
		});
		socket.on('queue video', function(queue){
			renderQueue(queue);
		});
		var playlist =[];
		function renderQueue(queue){
			$('.queueRender').remove();
					queue.forEach(function(el){
						$('.queue').append($('<li class="queueRender">').text(el.title));
						$('.queue').append('<img class="queueRender" src='+el.thumbnail+'>');
					});
		};
		function setChannel(channel) {
			$('#title').text('Channel: '+channel.name);
			id = channel.current_video
			socket.emit('user connected', id);
			player.loadVideoById(id);
		};
function getQueue(){
		$.ajax({
			url:'/channel/'+uniq+'/queue',
			type: 'GET',
			dataType:'json',
			success: function(result){
				var count = 1;
				result.queue.forEach(function(e){
					var vidId = e.videoId;
					var url = 'https://youtube.com/watch?v='+vidId;
					$.getJSON('https://noembed.com/embed',
					{format: 'json', url: url}, function (data) {
						var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
						var match = data.url.match(regExp);
						var title = data.title;
						var thumbnail = "https://i.ytimg.com/vi/"+match[2]+"/default.jpg";
						e["title"] = title;
						e["thumbnail"] = thumbnail;
					}).done(function(){
						if (count === result.queue.length){
							socket.emit('queue video', result.queue);
							renderQueue(result.queue);
							playlist = result.queue;
						}
						count++
					});
				});
			},
			error: function(error){
			}
		});
	}
	function updateCurrent(id){
		$.ajax({
			url:'/channel/'+uniq,
			type: 'PUT',
			dataType: 'json',
			data: {current_video: id},
			success: function(result){
			},
			error: function(error){
			}
		});
	}

});
