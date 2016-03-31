
var socket = io();

// 2. This code loads the IFrame Player API code asynchronously.

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '390',
		width: '640',
		videoId: 'yecrOqC77jY',
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onStateChange
		}
	});
}
// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	//look up channel state
	//event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onStateChange(event) {
	var playerState = event.data;
	var playerTime = player.getCurrentTime();
	if (playerState == YT.PlayerState.PLAYING) {
		socket.emit('set player state', playerState, playerTime);
		console.log("Player set to playing");
		//console.log(player.getCurrentTime())vv
	} else if (playerState == YT.PlayerState.PAUSED) {
		console.log("Player set to paused");
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
		if (player.getCurrentTime().toPrecision(2) != time.toPrecision(2) && player.getPlayerState() != state) {
			player.seekTo(time);
		}
		player.playVideo();
		console.log("Set Player to playing at: "+time);
		//console.log(player.getCurrentTime())
	} else if (state == YT.PlayerState.PAUSED) {
		player.pauseVideo()
		console.log("Set Player to paused");
	}

}




$( document ).ready(function() {
	console.log("channel.js is running");


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
	// load new video
	$('#loadUrl').click (function loadVideo() {
		console.log("button is pressed");
		console.log($('#videoUrl').val());
		var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		var match = $('#videoUrl').val().match(regExp);
		if (match && match[2].length == 11) {
			player.loadVideoById(match[2]);
		}else
		//error
	});

	$('form').submit(function(){
		socket.emit('chat message', $('#m').val());
		return false;
	});
	socket.on('chat message', function(msg){
		$('#messages').append($('<li>').text(msg));
		$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
	});
	socket.on('set player state', function(state,time){
		setPlayerState(state,time);
	});

	function setChannel(channel) {
		$('#title').text('Channel: '+channel.name);
	};


});
