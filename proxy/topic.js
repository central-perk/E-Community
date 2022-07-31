var EventProxy = require("eventproxy");

var models = require("../models");
var Topic = models.Topic;
var User = require("./user");
var Reply = require("./reply");
var tools = require("../common/tools");
var at = require("../common/at");
var _ = require("lodash");
var utils = process.common.utils;
/**
 * Get topic by topic ID
 * Callback:
 * - err, database error
 * - topic
 * - author
 * - lastReply, last reply
 * @param {String} id topic ID
 * @param {Function} callback callback function
 */
exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ["topic", "author", "last_reply"];
  proxy
    .assign(events, function (topic, author, last_reply) {
      if (!author) {
        return callback(null, null, null, null);
      }
      return callback(null, topic, author, last_reply);
    })
    .fail(callback);

  Topic.findOne(
    {
      _id: id,
    },
    proxy.done(function (topic) {
      console.log("22");
      if (!topic) {
        proxy.emit("topic", null);
        proxy.emit("author", null);
        proxy.emit("last_reply", null);
        return;
      }
      proxy.emit("topic", topic);

      User.getUserById(topic.author_id, proxy.done("author"));

      if (topic.last_reply) {
        Reply.getReplyById(
          topic.last_reply,
          proxy.done(function (last_reply) {
            proxy.emit("last_reply", last_reply);
          })
        );
      } else {
        proxy.emit("last_reply", null);
      }
    })
  );
};

/**
 * Get the number of topics that can be searched by keywords
 * Callback:
 * - err, database error
 * - count, number of topics
 * @param {String} query search keyword
 * @param {Function} callback callback function
 */
exports.getCountByQuery = function (query, callback) {
  return callback(null, 100);
  Topic.count(query, callback);
};

/**
 * Get a list of topics based on keywords
 * Callback:
 * - err, database error
 * - count, list of topics
 * @param {String} query search keyword
 * @param {Object} opt search options
 * @param {Function} callback callback function
 */
exports.getTopicsByQuery = function (query, opt, callback) {
  const mockTopic = {
    title: "New Issues",
    content: "New Issues Content",
    author: {
      loginname: "Jerry",
      avatar_url: "https://i.pravatar.cc/150?img=37",
    },
    top: true, // top post
    good: true, // Highlights
    reply_count: 100,
    visit_count: 999,
    collect_count: 2000,
    friendly_create_at: "a minute ago",
    create_at: Date.now,
    update_at: Date.now,
    last_reply: {},
    last_reply_at: Date.now,
    content_is_html: true,
    tab: "General forum announcement",
  };
  return callback(null, new Array(15).fill(mockTopic));
  // console.log( Topic.find)
  Topic.find(query, "_id", opt, function (err, docs) {
    // https://npmmirror.com/package/mongoose/v/3.8.3
    if (err) {
      return callback(err);
    }
    if (docs.length === 0) {
      return callback(null, []);
    }

    var topics_id = _.pluck(docs, "id");

    var proxy = new EventProxy();
    proxy.after("topic_ready", topics_id.length, function (topics) {
      // filter out empty values
      var filtered = topics.filter(function (item) {
        return !!item;
      });
      return callback(null, filtered);
    });
    proxy.fail(callback);

    topics_id.forEach(function (id, i) {
      exports.getTopicById(
        id,
        proxy.group("topic_ready", function (topic, author, last_reply) {
          // When the id is queried and the list is further queried, the article may have been deleted
          // so there may be null
          if (topic) {
            topic.author = author;
            topic.reply = last_reply;
            topic.friendly_create_at = tools.formatDate(topic.create_at, true);
          }
          return topic;
        })
      );
    });
  });
};

// for sitemap
exports.getLimit5w = function (callback) {
  Topic.find(
    {},
    "_id",
    {
      limit: 50000,
      sort: "-create_at",
    },
    callback
  );
};

/**
 * Get all the information on the subject
 * Callback:
 * - err, database exception
 * - message, message
 * - topic
 * - author, theme author
 * - replies, replies to the topic
 * @param {String} id topic ID
 * @param {Function} callback callback function
 */
exports.getFullTopic = function (id, callback) {
  var proxy = new EventProxy();
  var events = ["topic", "author", "replies"];
  proxy
    .assign(events, function (topic, author, replies) {
      callback(null, "", topic, author, replies);
    })
    .fail(callback);

  Topic.findOne(
    {
      _id: id,
    },
    proxy.done(function (topic) {
      if (!topic) {
        proxy.unbind();
        return callback(null, "This topic does not exist or has been deleted.");
      }
      at.linkUsers(
        topic.content,
        proxy.done("topic", function (str) {
          topic.linkedContent = str;
          return topic;
        })
      );

      User.getUserById(
        topic.author_id,
        proxy.done(function (author) {
          if (!author) {
            proxy.unbind();
            return callback(null, "The author of the topic is lost.");
          }
          proxy.emit("author", author);
        })
      );

      Reply.getRepliesByTopicId(topic._id, proxy.done("replies"));
    })
  );
};
/**
 * Update thread's last reply message
 * @param {String} topicId topic ID
 * @param {String} replyId reply ID
 * @param {Function} callback callback function
 */
exports.updateLastReply = function (topicId, replyId, callback) {
  Topic.findOne(
    {
      _id: topicId,
    },
    function (err, topic) {
      if (err || !topic) {
        return callback(err);
      }
      topic.last_reply = replyId;
      topic.last_reply_at = new Date();
      topic.reply_count += 1;
      topic.save(callback);
    }
  );
};

/**
 * Find a topic based on topic ID
 * @param {String} id topic ID
 * @param {Function} callback callback function
 */
exports.getTopic = function (id, callback) {
  Topic.findOne(
    {
      _id: id,
    },
    callback
  );
};

/**
 * Decrease the reply count of the current topic by 1, which is used when deleting replies
 * @param {String} id topic ID
 * @param {Function} callback callback function
 */
exports.reduceCount = function (id, callback) {
  Topic.findOne(
    {
      _id: id,
    },
    function (err, topic) {
      if (err) {
        return callback(err);
      }

      if (!topic) {
        return callback(new Error("The topic does not exist"));
      }

      topic.reply_count -= 1;
      topic.save(callback);
    }
  );
};

exports.newAndSave = function (title, content, tab, authorId, callback) {
  var topic = new Topic();
  topic.title = title;
  topic.content = content;
  topic.tab = tab;
  topic.author_id = authorId;
  topic.save(callback);
};

exports.listTabCount = function (options, callback) {
  var tabs = options.tabs;
  Topic.aggregate(
    [
      {
        $match: {
          tab: {
            $in: tabs,
          },
        },
      },
      {
        $group: {
          _id: "$tab",
          count: {
            $sum: 1,
          },
        },
      },
    ],
    function (err, data) {
      var result = {};
      for (var i = 0; i < data.length; i++) {
        result[data[i]._id] = data[i].count;
      }
      callback(null, result);
    }
  );
};
