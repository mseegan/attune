function loadPage() {
	createChannelFormSetVisibilty('none');
	updateTable();
}

function updateTable() {
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
	var nameCell = rowEl.insertCell(0);
	var nameOwner = rowEl.insertCell(1);
	nameCell.innerHTML = row.name;
	nameOwner.innerHTML = row.owner;
	$(rowEl).on('click', function() {
		//alert('you clicked ' + row['uniq']);
		window.open('/channel/'+row.uniq, '_blank');
		
	});
}
function createChannelFormSetVisibilty(visible) {
	$('#createChannelForm').css("display", visible);
};
function createChannel() {
	var newChannel = $('#channelName').val();
	var data = {
		name: newChannel,
		owner: 'guest'
	};
	$('#channelName').val('');
	var data = JSON.stringify(data);
	$.ajax({
		url: "/channel",
		type: "POST",
		contentType: 'application/json',
		dataType: 'json',
		data: data,
		success: function() {
			
		},
	});
	createChannelFormSetVisibilty('none');
	updateTable();
}