$(document).ready(function() {


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
	var cts;
	window.onYouTubeIframeAPIReady = function() {
		if (matches) {
			uniq = matches[1];    // "whatever"

			$.ajax({
				url:'/channel/'+ uniq,
				contentType: 'application/json',
				dataType: 'json',
				success: function(result) {
					disableControl = result.controls;


					if (disableControl == "true"){

						player = new YT.Player('player', {
							height: '390',
							width: '640',
							playerVars: {'controls': 0, 'disablekb': 1},
							events: {
								'onReady': onPlayerReady,
								'onStateChange': onStateChange
							}
						});
					} else {

						player = new YT.Player('player', {
							height: '390',
							width: '640',
							events: {
								'onReady': onPlayerReady,
								'onStateChange': onStateChange
							}
						});
					}
				}
			});
		}
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
			// if(playlist.length === 0){

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

		if (event.data === 0){

			if(playlist.length >= 1){

				var current = player.getVideoData()['video_id'];


				if (disableControl == "false"){

					socket.emit('load video', playlist[0].videoId);
					removeQueue();
				} if (disableControl == "true"){

					socket.emit('check video', current, socketId);
					// removeQueue();
				}
			} else {
				toggleLoad();
			}
		}
		var playerState = event.data;
		var playerTime = player.getCurrentTime();
		if(disableControl == "false"){

			if (playerState == YT.PlayerState.PLAYING) {
				socket.emit('set player state', playerState, playerTime);


			} else if (playerState == YT.PlayerState.PAUSED) {

				socket.emit('set player state', playerState, playerTime);
			}
		} else if (disableControl == "true"){

		}
		/*0
		if (player.getPlayerState() === 1) {

		}
		*/
	}
	function countingTheSeconds(){
		cts = setInterval(function(){
			if ((player.getCurrentTime() < countseconds -3 || player.getCurrentTime() > countseconds +3)){

				// player.seekTo(countseconds);
				playerState = player.getPlayerState();
				if (playerState == YT.PlayerState.PAUSED){

					setPlayerState(YT.PlayerState.PLAYING,countseconds, "large");
				} else if (playerState == YT.PlayerState.PLAYING){

					player.seekTo(countseconds);
				}
				// socket.emit('set player state', YT.PlayerState.PLAYING, countseconds);
			}
		}, 1000 * 3);
		setInterval(function(){
			countseconds++

		}, 1000);
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

			e.preventDefault();
			if ($('#m').val()){
					socket.emit('chat message', $('#n').val() + ': ', $('#m').val());
					$('#m').val('');
			}
		});
		var time = 0;
		$('.skip').click(function(){

			if(playlist.length >= 1){
				time = player.getDuration();

				socket.emit('vote skip', socketId, time);
				$('.skip').addClass('hidden');
				timer = setTimeout(function(){
					socket.emit('skip expired');
				}, 1000 * 30);
				// socket.emit('skip', time);
			} else{
				$('#messages').append($('<li style="color: red;">').text("[SERVER]: no videos queued."));
				$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
			}
		});
		//add video to queue
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
						getQueue();
					},
					error: function(error){

					}
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
		socket.on('remove', function(){
			playlist.shift();
			console.log("playlist: ", playlist);
			renderQueue(playlist);
		});
		socket.on('load video', function(id, time){

			player.loadVideoById(id, time);
			if(disableControl == "true"){
				countseconds = time;
			}
			updateCurrent(id);

			return false;
		});
		socket.on('vote skip', function(){

			// if (disableControl == "false"){
				// socket.emit('skip', time);
			// } else {
			// 	socket.emit('skip', countseconds);
			// }
		});
		socket.on('skip message', function(msg){

			$('#messages').append($('<li style="color: red;">').text(msg));
			$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
		});
		socket.on('unhide skip', function(){
			if ($('.skip').hasClass('hidden')){
				$('.skip').removeClass('hidden');
			}
		});
		socket.on('skip', function(time){

			// if (disableControl == "true"){
			// 	// duration = player.getDuration();
			// 	// seek(duration);

			// 	// clearInterval(cts);
			// 	// countseconds = 0;
			// 	// countingTheSeconds();
			// 	// seek(countseconds);
			// }
				seek(time);
		});
		socket.on('cancel timer', function(){
			if (timer != undefined){
				clearTimeout(timer);
			}
		});
		socket.on('queue video', function(queue){
			renderQueue(queue);
			playlist = queue;
			// getQueue();
		});
		socket.on('check video', function(vidid, uid){

			var myvid = player.getVideoData()['video_id'];
			if (vidid == myvid){

				socket.emit('video compare', "match", uid);
			} else {

				socket.emit('video compare', vidid, uid);
			}
		});
		socket.on('removeQueue', function(){
			removeQueue();
			// renderQueue(playlist);
		});
		socket.on('video compare', function(vidid){
			var myvid = player.getVideoData()['video_id'];
			if (vidid == "match"){

				socket.emit('load video', playlist[0].videoId);
				socket.emit('remove queue');
				// removeQueue();
			} else {

				setPlayerState(YT.PlayerState.PLAYING,countseconds, "large");
				// seekTo(countseconds);
			}
		});
		function seek(time){

			if (player != undefined){
				player.seekTo(time);
				countseconds = time;
			}
		}
		function renderQueue(queue){
			console.log("queue: ", queue);
			$('.queueRender').remove();
			toggleLoad();

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
			// disableControl = channel.controls;
			if(disableControl == "true"){

				countingTheSeconds();
			}
		};
function getQueue(){
		$.ajax({
			url:'/channel/'+uniq+'/queue',
			type: 'GET',
			dataType:'json',
			success: function(result){


				var state = player.getPlayerState();


				if(playlist.length === 0 && state != 0){

					toggleLoad();
				}
				var count = 1;
				if (result.queue != undefined){
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
				}
			},
			error: function(error){

			}
		});
	}
	function toggleLoad(){


		if(!$('.loadForm').hasClass('visible') && playlist.length == 0){

			$('.loadForm').removeClass("hidden").addClass("visible");
			$('.queueForm').removeClass("visible").addClass("hidden");
		}else if ( $('.loadForm').hasClass('visible')){

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

			},
			error: function(error){

			}
		});
	}
	function resetCounter(){
		countseconds = 0;
	}
	function removeQueue(){


		$.ajax({
			method: 'PUT',
			url:'/channel/'+uniq+'/queue',
			dataType: 'text',
			data: {videoId: playlist[0].videoId},
			success: function(){

				playlist.shift();
				socket.emit('remove');

				renderQueue(playlist);
				getQueue();
			}, error: function(error){


			}
		});
	}

});
