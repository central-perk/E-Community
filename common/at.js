/*!
 * nodeclub - topic mention user controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 *MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require("../proxy").User;
var Message = require("./message");
var EventProxy = require("eventproxy");
var _ = require("lodash");

/**
 * Extract the array of usernames tagged with @username from the text
 * @param {String} text text content
 * @return {Array} username array
 */
var fetchUsers = function (text) {
  var ignoreRegexs = [
    /```.+?```/g, // remove single line ```
    /^```[\s\S]+?^```/gm, // ``` contains the content of the pre tag
    /`[\s\S]+?`/g, // On the same line, `some code` should also not be parsed
    /^ .*/gm, // 4 spaces are also pre tags, here . will not match newlines
    /\b.*?@[^\s]*?\..+?\b/g, // somebody@gmail.com will be stripped
    /\[@.+?\]\(\/.+?\)/g, // username that has been linked
  ];

  ignoreRegexs.forEach(function (ignore_regex) {
    text = text.replace(ignore_regex, "");
  });

  var results = text.match(/@[a-z0-9\-_\u4e00-\u9fa5]+?\</gim),
    names = [];

  _.forEach(results, function (result, index) {
    names.push(result.slice(1, -1));
  });

  names = _.uniq(names);
  return names;
};
exports.fetchUsers = fetchUsers;

/**
 * Read the user according to the text content and send a message to the mentioned user
 * Callback:
 * - err, database exception
 * @param {String} text text content
 * @param {String} topicId topic ID
 * @param {String} authorId Author ID
 * @param {String} reply_id reply id
 * @param {Function} callback callback function
 */
exports.sendMessageToMentionUsers = function (
  text,
  topicId,
  authorId,
  reply_id,
  callback
) {
  if (typeof reply_id === "function") {
    callback = reply_id;
    reply_id = null;
  }
  callback = callback || _.noop;

  User.getUsersByNames(fetchUsers(text), function (err, users) {
    if (err || !users) {
      return callback(err);
    }
    var ep = new EventProxy();
    ep.fail(callback);
    ep.after("sent", users.length, function () {
      callback();
    });
    users.forEach(function (user) {
      Message.sendAtMessage(
        user._id,
        authorId,
        topicId,
        reply_id,
        ep.done("sent")
      );
    });
  });
};

/**
 * According to the text content, replace with the data in the database
 * Callback:
 * - err, database exception
 * - text, the replaced text content
 * @param {String} text text content
 * @param {Function} callback callback function
 */
exports.linkUsers = function (text, callback) {
  var users = fetchUsers(text);
  if (!callback) {
    return text;
  }
  return callback(null, text);
};
