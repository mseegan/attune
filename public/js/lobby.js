$(document).ready(function() {
// function loadPage() {
// 	createChannelFormSetVisibilty('none');
// }
updateTable();

var socket = io();

socket.emit('create', 'lobby');
// socket.emit('stop countdown', "lobby");

socket.on('update', function(){
	updateTable();
});

function updateTable() {
	// console.log("updating...");
	$.ajax({
		url: "/channel",
		contentType: 'application/json',
		dataType: 'json',
		success: function(result) {
			var channelsTable = document.getElementById("channelsTable");
			var tableLength = channelsTable.rows.length-1;
			for (var r=0; r<tableLength; r++) {
				channelsTable.deleteRow(1);
			}
			var channels = result['channels'];
			for (var r=0; r<channels.length; r++) {
				addRow(channelsTable, channels[r]);
			}
		}
	});
}
/*
	addRow
	tableEl - dom table element
	row - dictionary of all the elements in a row (name, owner, date, uniq)
*/
function addRow(tableEl, row) {
	var rowEl = tableEl.insertRow();
	rowEl.style = "outline: thin solid black;cursor: pointer;"
	rowEl.className = "col-xs-12"
	var nameCell = rowEl.insertCell(0);
	nameCell.className = "col-xs-12"
	nameCell.innerHTML = row.name;
	$('tbody').addClass('col-xs-3');
	$(rowEl).on('click', function() {
		//alert('you clicked ' + row['uniq']);
		window.open('/channel/'+row.uniq, '_blank');

	});
}
// $(.createChannel).click(function(e, visible){
// 	e.preventDefault();
// 	$('#createChannelForm').css("display", visible);
// })
	$('.create').click(function(e){
		e.preventDefault();
		// console.log("clicked!");
		createChannel();
	});
	function createChannel() {

		var newChannel = $('#channelName').val().replace(/</g, "&lt;").replace(/>/g, "&gt;");
		var data = {
			name: newChannel,
			owner: 'guest'
		};
		$('#channelName').val('');
		var data = JSON.stringify(data);
		// console.log("data:", data);
		$.ajax({
			url: "/channel",
			type: "POST",
			contentType: 'application/json',
			dataType: 'json',
			data: data,
			success: function() {
				// console.log("updating...");
				updateTable();
			},
		});
		// createChannelFormSetVisibilty('none');
	}
});
