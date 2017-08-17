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
			var uniq = intformat(generator.next(), 'dec');
			db.Channel.create({
				name : req.body.name,
				owner : 'guest',
        current_video: '',
				date : Date.now(),
        queue: [],
        controls: req.body.controls,
				uniq : uniq,
			}, function(err, channel) {
				if (err) {
				} else {
					res.json(channel);
				}
			});
		});

	router.route('/:uniq')

		.get(function (req, res) {
			var uniq = req.params.uniq;
      var channelId;
      db.Channel.findOne({uniq:uniq}, function(err, channel){
        channelId = channel;
        if (channelId == null || channelId == "undefined"){
          res.format({
            html: function(){
              res.render('404.hbs');
              // res.sendStatus('404');
            }
          });
        } else {
          res.format({
            html: function() {
              res.render('channel.hbs');
            },
            json: function() {
              //search for channel
              // db.Channel.findOne({uniq:uniq}, function(err, channel) {
                //res.json({'channel':channels});
                if (err) {
                } else if (channel) {
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
      if(req.body.current_video){
        res.format({
          json: function() {
            return db.Channel.findOne({uniq:uniq}, function(err, channel){
              channel.current_video = req.body.current_video;
              return channel.save(function(err, saved){
                if (!err){
                }
                else {
                }
                res.json(saved);
              });
            });
          }
        });
      }else if(req.body.videoId){
        res.format({
          json: function(){
            // return db.channel.findOneAndUpdate(
            //   {uniq:uniq},
            //   {$push: {queue: req.body.videoId}}
            // });
            return db.Channel.findOne({uniq:uniq}, function(err, channel){
              // channel.update({"_id": channel.id}, {$push: {queue: {videoId: req.body}} }, function(err){
              //   if (!err){
              //   } else {
              //   }
              // });
              var found = false;
                for (var i = 0; i < channel.queue.length; i++){
                  if (channel.queue[i].videoId == req.body.videoId){
                    found = true;
                    break;
                  } else {
                  }
                }
                if(channel.queue.length === 0||found === false){
                  updateQueue();
                }
              function updateQueue(){
                  newQueue = {videoId: req.body.videoId};
                  channel.queue.push(newQueue);
                  return channel.save(function(err){
                    if (!err){
                      res.status(200).send();
                    }else {
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
      res.format({
        json: function() {
          //search for channel
          db.Channel.findOne({uniq:uniq}, function(err, channel) {
            if (err) {
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
      res.format({
        json: function(){
          db.Channel.findOne({uniq: uniq}, function(err, channel) {
            if (channel.queue[0] == undefined || channel.queue[0] == null){
            }else if(channel.queue[0].videoId === req.body.videoId){
              channel.queue[0].remove({_id: uniq}, function(err){
                return channel.save(function(err, saved){
                  if (!err){
                  }else {
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
