/*!
 * nodeclub - controllers/topic.js
 */

/**
 * Module dependencies.
 */

var validator = require("validator");

var at = require("../common/at");
var User = require("../proxy").User;
var Topic = require("../proxy").Topic;
var TopicCollect = require("../proxy").TopicCollect;
var EventProxy = require("eventproxy");
var tools = require("../common/tools");
var store = require("../common/store");
var config = require("../config");
var _ = require("lodash");
var utils = process.common.utils;
/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
  var user = req.user;

  function isUped(user, reply) {
    if (!reply.ups) {
      return false;
    }
    return reply.ups.indexOf(user._id) !== -1;
  }

  var topic_id = req.params.tid;
  if (topic_id.length !== 24) {
    return res.render("notify/notify", {
      error: "This thread does not exist or has been deleted. ",
    });
  }
  var events = ["topic", "other_topics", "user_topics"];
  var ep = EventProxy.create(
    events,
    function (topic, other_topics, user_topics) {
      req.session.tab = topic.tab;
      res.render("topic/index", {
        topic: topic,
        tab: topic.tab,
        author_other_topics: other_topics,
        user_topics: user_topics || [],
        isUped: isUped,
        tabs: config.tabs,
      });
    }
  );

  ep.fail(next);

  Topic.getFullTopic(
    topic_id,
    ep.done(function (message, topic, author, replies) {
      if (message) {
        ep.unbind();
        return res.render("notify/notify", {
          error: message,
        });
      }

      topic.visit_count += 1;
      topic.save();

      // format date
      topic.friendly_create_at = tools.formatDate(topic.create_at, true);
      topic.friendly_update_at = tools.formatDate(topic.update_at, true);

      topic.author = author;

      topic.replies = replies;

      // The answer with the number of likes ranked third, its number of likes is the threshold
      topic.reply_up_threshold = (function () {
        var allUpCount = replies.map(function (reply) {
          return (reply.ups && reply.ups.length) || 0;
        });
        allUpCount = _.sortBy(allUpCount, Number).reverse();

        return allUpCount[2] || 0;
      })();

      if (!req.user) {
        ep.emit("topic", topic);
      } else {
        TopicCollect.getTopicCollect(
          req.user._id,
          topic._id,
          ep.done(function (doc) {
            topic.in_collection = doc;
            ep.emit("topic", topic);
          })
        );
      }

      // get other_topics
      var options = {
        limit: 5,
        sort: "-last_reply_at",
      };
      var query = {
        author_id: topic.author_id,
        _id: {
          $nin: [topic._id],
        },
      };
      Topic.getTopicsByQuery(query, options, ep.done("other_topics"));

      // get user_topics
      if (user) {
        var options2 = {
          limit: 5,
          sort: "-create_at",
        };
        Topic.getTopicsByQuery(
          {
            author_id: user._id,
          },
          options2,
          ep.done("user_topics")
        );
      } else {
        ep.emit("user_topics", null);
      }
    })
  );
};

exports.create = function (req, res, next) {
  var user = req.user;
  var tab = req.session.tab;
  var _tag = req.param("_tag");
  if (_tag && _tag === "question") {
    tab = "feedback";
  }
  var options2 = {
    limit: 5,
    sort: "-create_at",
  };

  Topic.getTopicsByQuery(
    {
      author_id: user._id,
    },
    options2,
    function (err, user_topics) {
      res.render("topic/edit", {
        tabs: config.tabs,
        user_topics: user_topics || [],
        tab: tab,
      });
    }
  );
};

exports.put = function (req, res, next) {
  var user = req.user;
  var title = validator.trim(req.body.title);
  title = validator.escape(title);
  var tab = validator.trim(req.body.tab);
  tab = validator.escape(tab);
  var content = validator.trim(req.body.t_content);
  // get all tabs, e.g. ['ask', 'share', ..]
  var allTabs = config.tabs.map(function (tPair) {
    return tPair[0];
  });

  // verify
  var editError;
  if (title === "") {
    editError = "Title cannot be empty.";
  } else if (title.length < 5 || title.length > 100) {
    editError = "Title must be more than 5 small 100 characters.";
  } else if (!tab || allTabs.indexOf(tab) === -1) {
    editError = "A section must be selected.";
  } else if (content === "") {
    editError = "Content cannot be null";
  }
  // END validation

  if (editError) {
    res.status(422);
    var options2 = {
      limit: 5,
      sort: "-create_at",
    };

    Topic.getTopicsByQuery(
      {
        author_id: user._id,
      },
      options2,
      function (err, user_topics) {
        return res.render("topic/edit", {
          edit_error: editError,
          title: title,
          tab: req.session.tab,
          content: content,
          tabs: config.tabs,
          user_topics: user_topics,
        });
      }
    );
    return;
  }
  content = utils.addAnchorTarget(content, "_blank");

  Topic.newAndSave(title, content, tab, req.user._id, function (err, topic) {
    if (err) {
      return next(err);
    }

    var proxy = new EventProxy();

    proxy.all("score_saved", function () {
      res.redirect("/topic/" + topic._id);
    });
    proxy.fail(next);
    User.getUserById(
      req.user._id,
      proxy.done(function (user) {
        // Comment out the integration logic comment
        // user.score += 5;
        user.topic_count += 1;
        user.save();
        req.user = user;
        proxy.emit("score_saved");
      })
    );

    //Send at message
    at.sendMessageToMentionUsers(content, topic._id, req.user._id);
  });
};

exports.showEdit = function (req, res, next) {
  var topic_id = req.params.tid;

  Topic.getTopicById(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render("notify/notify", {
        error: "This thread does not exist or has been deleted.",
      });
      return;
    }
    var options2 = {
      limit: 5,
      sort: "-create_at",
    };

    Topic.getTopicsByQuery(
      {
        author_id: topic.author_id,
      },
      options2,
      function (err, user_topics) {
        if (
          String(topic.author_id) === String(req.user._id) ||
          req.user.is_admin
        ) {
          res.render("topic/edit", {
            action: "edit",
            topic_id: topic._id,
            title: topic.title,
            content: topic.content,
            tab: topic.tab,
            tabs: config.tabs,
            user_topics: user_topics,
          });
        } else {
          res.render("notify/notify", {
            error: "Sorry, you cannot edit this thread.",
          });
        }
      }
    );
  });
};

exports.update = function (req, res, next) {
  var topic_id = req.params.tid;
  var title = req.body.title;
  var tab = req.body.tab;
  var content = req.body.t_content;

  Topic.getTopicById(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render("notify/notify", {
        error: "This thread does not exist or has been deleted.",
      });
      return;
    }

    if (topic.author_id.equals(req.user._id) || req.user.is_admin) {
      title = validator.trim(title);
      title = validator.escape(title);
      tab = validator.trim(tab);
      tab = validator.escape(tab);
      content = validator.trim(content);

      // verify
      var editError;
      if (title === "") {
        editError = "Title cannot be empty.";
      } else if (title.length < 5 || title.length > 100) {
        editError = "Too many or too few characters in the title.";
      } else if (!tab) {
        editError = "A section must be selected.";
      }
      // END validation

      if (editError) {
        return res.render("topic/edit", {
          action: "edit",
          edit_error: editError,
          topic_id: topic._id,
          content: content,
          tabs: config.tabs,
          user_topics: user_topics || [],
        });
      }
      content = utils.addAnchorTarget(content, "_blank");

      //save topic
      topic.title = title;
      topic.content = content;
      topic.tab = tab;
      topic.update_at = new Date();
      topic.save(function (err) {
        if (err) {
          return next(err);
        }
        //Send at message
        at.sendMessageToMentionUsers(content, topic._id, req.user._id);

        res.redirect("/topic/" + topic._id);
      });
    } else {
      res.render("notify/notify", {
        error: "Sorry, you cannot edit this thread.",
      });
    }
  });
};

exports.delete = function (req, res, next) {
  //Delete topic, topic author topic_count minus 1
  //Delete reply, reply author reply_count minus 1
  //Delete topic_collect, user collect_topic_count minus 1

  var topic_id = req.params.tid;

  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return res.send({
        success: false,
        message: err.message,
      });
    }
    if (!req.user.is_admin && !topic.author_id.equals(req.user._id)) {
      res.status(403);
      return res.send({
        success: false,
        message: "No permission",
      });
    }
    if (!topic) {
      res.status(422);
      return res.send({
        success: false,
        message: "This thread does not exist or has been deleted.",
      });
    }
    topic.remove(function (err) {
      if (err) {
        return res.send({
          success: false,
          message: err.message,
        });
      }
      res.send({
        success: true,
        message: "The topic has been deleted.",
      });
    });
  });
};

// set as top
exports.top = function (req, res, next) {
  var topic_id = req.params.tid;
  var is_top = req.params.is_top;
  var referer = req.get("referer");
  if (topic_id.length !== 24) {
    res.render("notify/notify", {
      error: "This thread does not exist or has been deleted.",
    });
    return;
  }
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render("notify/notify", {
        error: "This thread does not exist or has been deleted.",
      });
      return;
    }
    topic.top = is_top;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.top
        ? "This topic has been pinned."
        : "This topic has been unpinned.";
      res.render("notify/notify", {
        success: msg,
        referer: referer,
        tabs: config.tabs,
        tab: req.session.tab || "all",
      });
    });
  });
};

// set as essence
exports.good = function (req, res, next) {
  var topicId = req.params.tid;
  var isGood = req.params.is_good;
  var referer = req.get("referer");
  Topic.getTopic(topicId, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render("notify/notify", {
        error: "This thread does not exist or has been deleted.",
      });
      return;
    }
    topic.good = isGood;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.good
        ? "This topic has been refined."
        : "This topic has been removed.";
      res.render("notify/notify", {
        success: msg,
        referer: referer,
      });
    });
  });
};

exports.collect = function (req, res, next) {
  var topic_id = req.body.topic_id;
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({
        status: "failed",
      });
    }

    TopicCollect.getTopicCollect(req.user._id, topic._id, function (err, doc) {
      if (err) {
        return next(err);
      }
      if (doc) {
        res.json({
          status: "success",
        });
        return;
      }

      TopicCollect.newAndSave(req.user._id, topic._id, function (err) {
        if (err) {
          return next(err);
        }
        res.json({
          status: "success",
        });
      });
      User.getUserById(req.user._id, function (err, user) {
        if (err) {
          return next(err);
        }
        user.collect_topic_count += 1;
        user.save();
      });

      req.user.collect_topic_count += 1;
      topic.collect_count += 1;
      topic.save();
    });
  });
};
exports.de_collect = function (req, res, next) {
  var topic_id = req.body.topic_id;
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({
        status: "failed",
      });
    }
    TopicCollect.remove(req.user._id, topic._id, function (err) {
      if (err) {
        return next(err);
      }
      res.json({
        status: "success",
      });
    });

    User.getUserById(req.user._id, function (err, user) {
      if (err) {
        return next(err);
      }
      user.collect_topic_count -= 1;
      user.save();
    });

    topic.collect_count -= 1;
    topic.save();

    req.user.collect_topic_count -= 1;
  });
};

exports.upload = function (req, res, next) {
  req.busboy.on(
    "file",
    function (fieldname, file, filename, encoding, mimetype) {
      store.upload(
        file,
        {
          filename: filename,
        },
        function (err, result) {
          if (err) {
            console.log(err);
            return next(err);
          }
          res.json({
            success: true,
            file_path: result.url, //+'?imageView2/2/w/800'
          });
        }
      );
    }
  );

  // req.busboy.on('limit', function() {
  // console.log(222);
  // return res.json({
  // success: false,
  // msg: 'The image size cannot exceed 1M'
  // });
  // });

  req.pipe(req.busboy);
};
