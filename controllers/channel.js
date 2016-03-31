var FlakeIdGen = require('flake-idgen')
    , intformat = require('biguint-format')
    , generator = new FlakeIdGen;
var db = require('./../models');

module.exports.name = 'channel';
module.exports.controller = function(router, app) {
/*
*	GET: /channel
*
*	Lists all the channels in json format
*
*	return [{name:'',owner:''},....]
*/
	router.route('/')
		.get(function (req, res) {
			console.log('[log] : GET /lobby');
			res.format({
				html: function() {
					//res.sendFile(__dirname + '/views/lobby.html');
					res.render('lobby.hbs');
				},
/*
*	GET: /channel
*
*	Lists all the channels in json format
*
*	return [{name:'',owner:''},....]
*/				
				json: function(){
					db.Channel.find({}, function(err, channels) {
						res.json({'channels':channels});  
					});
				}
			});
		})
// creates a new channel uniquely named channel
// may remove unique ids since names are unique however some names may not work in urls
/*
*	POST: /channel
*
*	Body: {
*		name: String,
*		owner: String,
*	}
*
*	Creates a new channel with the info provided and returns information on the channel in json format
*
*	return {name:'',owner:''}
*/
		.post(function(req, res){
			console.log('[log] : POST /channel');
			console.log('[log] : Body: '+ req.body.name);
			var uniq = intformat(generator.next(), 'dec');
			db.Channel.create({
				name : req.body.name,
				owner : 'guest',
				date : Date.now(),
				uniq : uniq,
			}, function(err, channel) {
				if (err) {
					console.log(err);
				} else {
					res.json(channel);
				}
			});
		});
	
	router.route('/:uniq')
		
		.get(function (req, res) {
			var uniq = req.params.uniq;
			console.log('[log] : GET /channel/'+uniq);
			res.format({
/*
*	GET: /channel/**uniq**
*
*	Servers the view for a channel with the unique id
*
*	return channel.html
*/
				html: function() {
					res.render('channel.hbs');
				},
/*
*	GET: /channel/**uniq**
*
*	Servers the view for a channel with the unique id
*
*	return channel.html
*/
				json: function() {
					//search for channel
					db.Channel.findOne({uniq:uniq}, function(err, channel) {
						//res.json({'channel':channels});  
						if (err) {
							console.log('[log] : Error - ',err);
						} else if (channel) {
							res.json(channel);
						} else {
							res.json({ error: 'Not found' });
						}
					});
				}
			});
		});
}
