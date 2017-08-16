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
	socket.emit('stop countdown', roomId);
	// 3. This function creates an <iframe> (and YouTube player)
	//    after the API code downloads.
	var url = document.documentURI;
	var uniq = "";
	var matches = url.match(/\/channel\/([^\/]+)/);
	var player;
	var socketId;
	var playlist = [];
	var timer;
	var disableControl = "false";
	var countseconds;
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
			console.log('uniq', uniq);
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
			countingTheSeconds();
			// if(playlist.length === 0){
			// 	console.log("no videos...");
			// 	toggleLoad();
			// }
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
		console.log("event.data", event.data);
		if (event.data === 0){
			console.log("video is stopped", playlist);
			if(playlist.length >= 1){
				console.log("playlist has a video");
				socket.emit('load video', playlist[0].videoId);
				removeQueue();
			} else {
				toggleLoad();
			}
		}
		function removeQueue(){
			console.log("removing first item in queue");
			console.log("data: ", playlist[0]);
			$.ajax({
				method: 'PUT',
				url:'/channel/'+uniq+'/queue',
				dataType: 'text',
				data: {videoId: playlist[0].videoId},
				success: function(){
					console.log("removed");
					playlist.shift();
					socket.emit('remove');
					console.log("playlist: ", playlist);
					renderQueue(playlist);
					getQueue();
				}, error: function(error){
					console.log("error", error);
					console.log("playlist: ", playlist);
				}
			});
		}
		var playerState = event.data;
		var playerTime = player.getCurrentTime();
		if(disableControl == "false"){
			console.log("controls enabled...");
			if (playerState == YT.PlayerState.PLAYING) {
				socket.emit('set player state', playerState, playerTime);
				// console.log("Player set to playing");
				//console.log(player.getCurrentTime())vv
			} else if (playerState == YT.PlayerState.PAUSED) {
				// console.log("Player set to paused");
				socket.emit('set player state', playerState, playerTime);
			}
		} else if (disableControl == "true"){
			console.log("controls disabled...");
		}
		/*0
		if (player.getPlayerState() === 1) {
			console.log(player.getCurrentTime())
		}
		*/
	}
	function countingTheSeconds(){
		setInterval(function(){
			if ((player.getCurrentTime() < countseconds -3 || player.getCurrentTime() > countseconds +3)){
				console.log("update time");
				// player.seekTo(countseconds);
				playerState = player.getPlayerState();
				if (playerState == YT.PlayerState.PAUSED){
					console.log("unpaused");
					setPlayerState(YT.PlayerState.PLAYING,countseconds, "large");
				} else if (playerState == YT.PlayerState.PLAYING){
					console.log("was playing");
					player.seekTo(countseconds);
				}
				// socket.emit('set player state', YT.PlayerState.PLAYING, countseconds);
			}
		}, 1000 * 3);
		setInterval(function(){
			countseconds++
			console.log('countseconds: ', countseconds);
		}, 1000);
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
	//chat name change
	$('#n').bind('keyup', function(e){
		if (e.keyCode == '13'){
			socket.emit('name change', socketId, $('#n').val());
			$('#n').blur();
			$('#m').focus();
		}
	});
	//chat
		$('#chatForm').submit(function(e){
			// console.log("submit pressed");
			e.preventDefault();
			if ($('#m').val()){
					socket.emit('chat message', $('#n').val() + ': ', $('#m').val());
					$('#m').val('');
			}
		});
		var time = 0;
		$('.skip').click(function(){
			// console.log("playlist:", playlist);
			time = player.getDuration();
			console.log("duration", time);
			socket.emit('vote skip', socketId, time);
			$('.skip').addClass('hidden');
			timer = setTimeout(function(){
				socket.emit('skip expired');
			}, 1000 * 30);
			// socket.emit('skip', time);
		});
		//add video to queue
		$('#queueButton').click(function(e){
			e.preventDefault();
			var vidUrl = $('#queueUrl').val();
			console.log("button is pressed");
			console.log(vidUrl);
			var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			var match = vidUrl.match(regExp);
			console.log(match);
			if (match && match[2].length == 11) {
				console.log("ran");
				var vidId = match[2];
				$.ajax({
					url:'/channel/'+uniq,
					type: 'PUT',
					dataType: 'text',
					data: {videoId: match[2]},
					success: function(result){
						console.log('video added to queue', result);
					},
					error: function(error){
						console.log('error', error);
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
		// load new video
		$('#loadUrl').click (function loadVideo(e) {
			e.preventDefault();
			var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
			var match = $('#videoUrl').val().match(regExp);

			if (match && match[2].length == 11) {
				var vidId = match[2];
				player.loadVideoById(match[2]);
				socket.emit('load video', vidId);
				socket.emit('hide load');
				updateCurrent(match[2]);
				toggleLoad();
			}else {
				$('#messages').append($('<li style="color: red;">').text("invalid url"));
				$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
			}
			$('#videoUrl').val('');
		return false;
		});

		socket.on('new user', function(socket){
			// console.log('new user session id: ', socket);
			socketId = socket;
		});
		socket.on('hide load', function(){
			toggleLoad();
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
		socket.on('remove', function(){
			playlist.shift();
			console.log("shift...");
			renderQueue();
		});
		socket.on('load video', function(id, time){
			// console.log("id: " + id + " time: " + time);
			player.loadVideoById(id, time);
			if(disableControl = "true"){
				countseconds = time;
			}
			updateCurrent(id);
			return false;
		});
		socket.on('vote skip', function(){
			console.log("skip vote...");
			// socket.emit('skip', time);
		});
		socket.on('skip message', function(msg){
			console.log("skip message...");
			$('#messages').append($('<li style="color: red;">').text(msg));
			$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
		});
		socket.on('unhide skip', function(){
			if ($('.skip').hasClass('hidden')){
				$('.skip').removeClass('hidden');
			}
		});
		socket.on('skip', function(time){
			console.log("ran");
			seek(time);
		});
		socket.on('cancel timer', function(){
			if (timer != undefined){
				clearTimeout(timer);
			}
		});
		socket.on('queue video', function(queue){
			renderQueue(queue);
			console.log("queue", queue);
			// getQueue();
		});

		function seek(time){
			console.log("ran");
			if (player != undefined){
				player.seekTo(time);
				countseconds = time;
			}
		}
		function renderQueue(queue){
			$('.queueRender').remove();
			toggleLoad();
			console.log("queue: ", queue);
					queue.forEach(function(el){
						$('.queue').append($('<li class="queueRender">').text(el.title));
						$('.queue').append('<img class="queueRender" src='+el.thumbnail+'>');
					});
		};
		function setChannel(channel) {
			console.log("channel: ", channel);
			$('#title').text('Channel: '+channel.name);
			id = channel.current_video
			socket.emit('user connected', id);
			player.loadVideoById(id);
			disableControl = channel.controls;
		};
function getQueue(){
		$.ajax({
			url:'/channel/'+uniq+'/queue',
			type: 'GET',
			dataType:'json',
			success: function(result){
				console.log("got channel: ", result);
				console.log("got queue: ", result.queue);
				var state = player.getPlayerState();
				console.log("playlist: ", playlist);
				console.log("player state: ", state);
				if(playlist.length === 0 && state != 0){
					console.log("no videos...");
					toggleLoad();
				}
				var count = 1;
				if (result.queue != undefined){
					result.queue.forEach(function(e){
						console.log("e",e);
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
							console.log("e2: ", e);
						}).done(function(){
							if (count === result.queue.length){
								console.log("queue: ", result.queue);
								socket.emit('queue video', result.queue);
								renderQueue(result.queue);
								playlist = result.queue;
								console.log("playlist: ", playlist)
							}
							count++
						});
					});
				}
			},
			error: function(error){
				console.log("error: ", error);
			}
		});
	}
	function toggleLoad(){
		console.log("toggleLoad");
		console.log("queue: ", playlist);
		if(!$('.loadForm').hasClass('visible') && playlist.length == 0){
			console.log("changing to visible...");
			$('.loadForm').removeClass("hidden").addClass("visible");
			$('.queueForm').removeClass("visible").addClass("hidden");
		}else if ( $('.loadForm').hasClass('visible')){
			console.log("hiding...");
			$('.loadForm').removeClass("visible").addClass("hidden");
			$('.queueForm').removeClass("hidden").addClass("visible");
		}
	}
	function updateCurrent(id){
		$.ajax({
			url:'/channel/'+uniq,
			type: 'PUT',
			dataType: 'text',
			data: {current_video: id},
			success: function(result){
				getQueue();
				console.log('updated current video', result);
			},
			error: function(error){
				console.log('error', error);
			}
		});
	}
	function resetCounter(){
		countseconds = 0;
	}

});
