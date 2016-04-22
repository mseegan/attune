var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 
				process.env.MONGOHQ_URL ||
				'mongodb://localhost:27017/attune');
				
var channel = require('./channel');
module.exports.Channel = channel;

var user = require('./user');
module.exports.user = user;