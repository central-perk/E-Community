var EventProxy = require("eventproxy");

var Message = require("../models").Message;
var config = require("../config");
var User = require("./user");
var Topic = require("./topic");
var Reply = require("./reply");
var url = require("url");
var request = require("request");
var path = require("path");
var j = request.jar();
var request = request.defaults({
  jar: j,
  json: true,
});
/**
 * Get the number of unread messages based on user ID
 * Callback:
 * Callback function parameter list:
 * - err, database error
 * - count, number of unread messages
 * @param {String} id User ID
 * @param {Function} callback Get the number of messages
 */
exports.getMessagesCount = function (id, callback) {
  // Message.count({master_id: id, has_read: false}, callback);
  //'/api/clubuser/:userID/messages/count/unread
  request.get(
    {
      url: url.resolve(
        config.hosts.home,
        path.join(
          "api",
          "clubuser",
          id.toString(),
          "messages",
          "count",
          "unread"
        )
      ),
      timeout: 4000,
    },
    function (err, res, body) {
      if (!err && res.statusCode == 200) {
        if (body.code === 200) {
          var count = body.msg;
          callback(null, count);
        } else {
          callback(null, 0);
        }
      } else {
        callback(null, 0);
      }
    }
  );
};

/**
 * Get the message according to the message Id
 * Callback:
 * - err, database error
 * - message, the message object
 * @param {String} id message ID
 * @param {Function} callback callback function
 */
exports.getMessageById = function (id, callback) {
  Message.findOne(
    {
      _id: id,
    },
    function (err, message) {
      if (err) {
        return callback(err);
      }
      if (
        message.type === "reply" ||
        message.type === "reply2" ||
        message.type === "at"
      ) {
        var proxy = new EventProxy();
        proxy.fail(callback);
        proxy.assign(
          "author_found",
          "topic_found",
          "reply_found",
          function (author, topic, reply) {
            message.author = author;
            message.topic = topic;
            message.reply = reply;
            if (!author || !topic) {
              message.is_invalid = true;
            }
            return callback(null, message);
          }
        ); // receive exception
        User.getUserById(message.author_id, proxy.done("author_found"));
        Topic.getTopicById(message.topic_id, proxy.done("topic_found"));
        Reply.getReplyById(message.reply_id, proxy.done("reply_found"));
      }

      if (message.type === "follow") {
        User.getUserById(message.author_id, function (err, author) {
          if (err) {
            return callback(err);
          }
          message.author = author;
          if (!author) {
            message.is_invalid = true;
          }
          return callback(null, message);
        });
      }
    }
  );
};

/**
 * Get a list of read messages based on user ID
 * Callback:
 * - err, database exception
 * - messages, list of messages
 * @param {String} userId user ID
 * @param {Function} callback callback function
 */
exports.getReadMessagesByUserId = function (userId, callback) {
  Message.find(
    {
      master_id: userId,
      has_read: true,
    },
    null,
    {
      sort: "-create_at",
      limit: 20,
    },
    callback
  );
};

/**
 * Get a list of unread messages based on user ID
 * Callback:
 * - err, database exception
 * - messages, list of unread messages
 * @param {String} userId user ID
 * @param {Function} callback callback function
 */
exports.getUnreadMessageByUserId = function (userId, callback) {
  Message.find(
    {
      master_id: userId,
      has_read: false,
    },
    null,
    {
      sort: "-create_at",
    },
    callback
  );
};
