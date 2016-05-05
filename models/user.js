var mongoose = require('mongoose');
var channelSchema = require('./channel');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	name: String,
	password: String,
	channel: [channelSchema]
});

var User = mongoose.model('User', userSchema);

module.exports = User;