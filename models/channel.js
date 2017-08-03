var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var channelSchema = new Schema({
	name: String,
	owner: String,
	date: Date,
	uniq: String
});

var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
