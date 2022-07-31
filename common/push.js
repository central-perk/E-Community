var User = require("../proxy/user");
var Message = require("../proxy/message");
var JPush = require("jpush-sdk");
var eventproxy = require("eventproxy");
var config = require("../config");
var client = null;
if (config.jpush && config.jpush.secretKey !== "your secret key") {
  client = JPush.buildClient(config.jpush.appKey, config.jpush.secretKey);
}

/**
 * Notification of occurrence of news through Jiguang push
 * @param {String} type message type
 * @param {String} author_id message author ID
 * @param {String} master_id Notifier ID
 * @param {String} topic_id related topic ID
 */
exports.send = function (type, author_id, master_id, topic_id) {
  if (client !== null) {
    var ep = new eventproxy();
    User.getUserById(author_id, ep.done("author"));
    Message.getMessagesCount(master_id, ep.done("count"));
    ep.all("author", "count", function (author, count) {
      var msg = author.loginname + " ";
      var extras = {
        topicId: topic_id,
      };
      switch (type) {
        case "at":
          msg += "@you";
          break;
        case "reply":
          msg += "replied to your thread";
          break;
        default:
          break;
      }
      client
        .push()
        .setPlatform(JPush.ALL)
        .setAudience(JPush.alias(master_id.toString()))
        .setNotification(
          msg,
          JPush.ios(msg, null, count, null, extras),
          JPush.android(msg, null, null, extras)
        )
        .setOptions(null, null, null, !config.debug)
        .send(function (err, res) {
          if (config.debug) {
            if (err) {
              console.log(err.message);
            } else {
              console.log("Sendno: " + res.sendno);
              console.log("Msg_id: " + res.msg_id);
            }
          }
        });
    });
  }
};
