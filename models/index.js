var mongoose = require('mongoose');
var channel = require('./channel');
mongoose.connect(process.env.MONGOLAB_URI ||
				process.env.MONGOHQ_URL ||
				process.env.MONGODB_URI ||
				'mongodb://localhost:27017/attune');
module.exports.Channel = channel;

var user = require('./user');
module.exports.user = user;
