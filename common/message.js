var models = require('../models');
var eventproxy = require('eventproxy');
var Message = models.Message;
var User = require('../proxy').User;
var push = require('../common/push');
var messageProxy = require('../proxy/message');
var _ = require('lodash');
var config = require('../config');
var request = require('request');
var url = require('url');
var path = require('path');
var j = request.jar();
var request = request.defaults({
  jar: j,
  json: true
});
exports.sendReplyMessage = function(master_id, author_id, topic_id, reply_id, callback) {
  callback = callback || _.noop;
  var ep = new eventproxy();
  ep.fail(callback);
  var message = new Message();
  
  apiCreateMessage({
    type: 'reply',
    master_id: master_id,
    author_id: author_id,
    topic_id: topic_id,
    reply_id: reply_id
  }, function() {

  });
  message.save(ep.done('message_saved'));
  ep.all('message_saved', function(msg) {
    push.send(message.type, author_id, master_id, topic_id);
    callback(null, msg);
  });
};

exports.sendAtMessage = function(master_id, author_id, topic_id, reply_id, callback) {
  callback = callback || _.noop;
  var ep = new eventproxy();
  ep.fail(callback);
  var message = new Message();
  message.type = 'at';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id = topic_id;
  message.reply_id = reply_id;
  message.save(ep.done('message_saved'));
  apiCreateMessage({
    type: 'at',
    master_id: master_id,
    author_id: author_id,
    topic_id: topic_id,
    reply_id: reply_id
  }, function() {

  });
  ep.all('message_saved', function(msg) {
    push.send(message.type, author_id, master_id, topic_id);
    callback(null, msg);
  });
};


function apiCreateMessage(message, callback) {
  request.post({
    url: url.resolve(config.hosts.home, path.join('api', 'messages')),
    form: {
      token: 'becluber',
      message: {
        master: message.master_id ? message.master_id.toString() : null,
        author: message.author_id ? message.author_id.toString() : null,
        reply: message.reply_id ? message.reply_id.toString() : null,
        topic: message.topic_id ? message.topic_id.toString() : null,
        type: message.type
      }
    }
  }, function(err, res, body) {
    if (!err && res.statusCode == 200) {
      if (body.code === 200) {
        var rs = body.msg;
        callback(null, rs);
      } else {
        callback(err);
      }
    } else {
      callback(err);
    }
  });
}