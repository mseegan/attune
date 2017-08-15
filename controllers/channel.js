var FlakeIdGen = require('flake-idgen')
    , intformat = require('biguint-format')
    , generator = new FlakeIdGen;
var db = require('./../models');
// var express = require('express');
// var app = express();

module.exports.name = 'channel';
module.exports.controller = function(router, app) {

	router.route('/')
		.get(function (req, res) {
			// console.log('[log] : GET /lobby');
			res.format({
				html: function() {
					//res.sendFile(__dirname + '/views/lobby.html');
					res.render('lobby.hbs');
				},
				json: function(){
					db.Channel.find({}, function(err, channels) {
						res.json({'channels':channels});
					});
				}
			});
		})
		.post(function(req, res){
			// console.log('[log] : POST /channel');
			// console.log('[log] : Body: '+ req.body.name);
			var uniq = intformat(generator.next(), 'dec');
			db.Channel.create({
				name : req.body.name,
				owner : 'guest',
        current_video: '',
				date : Date.now(),
        queue: [],
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
			// console.log('[log] : GET /channel/'+uniq);
      var channelId;
      db.Channel.findOne({uniq:uniq}, function(err, channel){
        console.log("channel", channel);
        channelId = channel;
        if (channelId == null || channelId == "undefined"){
          console.log("channelId", channelId);
          res.format({
            html: function(){
              res.render('404.hbs');
              // res.sendStatus('404');
            }
          });
        } else {
          console.log("page exists");
          res.format({
            html: function() {
              res.render('channel.hbs');
            },
            json: function() {
              //search for channel
              // db.Channel.findOne({uniq:uniq}, function(err, channel) {
                //res.json({'channel':channels});
                if (err) {
                  console.log('[log] : Error - ',err);
                } else if (channel) {
                  console.log("channel is: ", channel);
                  res.json(channel);
                } else {
                  res.json({ error: 'Not found' });
                }
              // });
            }
          });
        }
      });
		})
    .put(function (req,res){
      var uniq = req.params.uniq;
      console.log("req.body", req.body);
      // console.log('[log] : PUT /channel/'+uniq);
      if(req.body.current_video){
        res.format({
          json: function() {
            return db.Channel.findOne({uniq:uniq}, function(err, channel){
              channel.current_video = req.body.current_video;
              return channel.save(function(err, saved){
                if (!err){
                  console.log('updated');
                }
                else {
                  console.log('[log] : Error - ',err);
                }
                res.json(saved);
              });
            });
          }
        });
      }else if(req.body.videoId){
        console.log("video ID got!", req.body.videoId);
        res.format({
          json: function(){
            // return db.channel.findOneAndUpdate(
            //   {uniq:uniq},
            //   {$push: {queue: req.body.videoId}}
            // });
            return db.Channel.findOne({uniq:uniq}, function(err, channel){
              console.log("id: ", channel._id);
              console.log("videoId: ", req.body);
              // channel.update({"_id": channel.id}, {$push: {queue: {videoId: req.body}} }, function(err){
              //   if (!err){
              //     console.log("updated queue");
              //   } else {
              //     console.log("update queue failed");
              //   }
              // });
              var found = false;
                for (var i = 0; i < channel.queue.length; i++){
                  console.log("iteration");
                  if (channel.queue[i].videoId == req.body.videoId){
                    found = true;
                    console.log("found one!");
                    break;
                  } else {
                    console.log("found none!");
                  }
                }
                if(channel.queue.length === 0||found === false){
                  updateQueue();
                }
              function updateQueue(){
                  newQueue = {videoId: req.body.videoId};
                  console.log("queue: ", newQueue);
                  channel.queue.push(newQueue);
                  console.log("newQueue: ", newQueue);
                  // console.log("channel: ", channel);
                  return channel.save(function(err){
                    if (!err){
                      console.log("updated queue!");
                      res.status(200).send();
                    }else {
                      console.log('[log] : Error - ', err);
                    }
                  });
                }
            });
          }
        });
      }
    });
	router.route('/:uniq/queue')
    .get(function (req, res) {
      var uniq = req.params.uniq;
      // console.log('[log] : GET /channel/'+uniq);
      res.format({
        json: function() {
          //search for channel
          db.Channel.findOne({uniq:uniq}, function(err, channel) {
            // console.log("channel: ", channel);
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
    })
    .put(function(req, res){
      var uniq = req.params.uniq;
      console.log("req.body.videoId: ", req.body.videoId);
      res.format({
        json: function(){
          db.Channel.findOne({uniq: uniq}, function(err, channel) {
            if (channel.queue[0] == undefined || channel.queue[0] == null){
              console.log("undefined or null");
            }else if(channel.queue[0].videoId === req.body.videoId){
              console.log("to be removed: ", channel.queue[0]);
              console.log("uniq: ", uniq);
              channel.queue[0].remove({_id: uniq}, function(err){
                if (err) {console.log("error - ", err); }
                return channel.save(function(err, saved){
                  if (!err){
                    console.log("removed!", channel);
                  }else {
                    console.log('[log] : Error - ', err);
                  }
                  res.json(saved);
                });
              })
            }
          });
        }
      });
    });
}
