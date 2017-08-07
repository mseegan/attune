var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channelSchema = new Schema({
	name: String,
	owner: String,
	current_video: String,
	date: Date,
	queue: Array,
	uniq: String
});

var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
