var validator = require("validator");
var _ = require("lodash");

var at = require("../common/at");
var message = require("../common/message");

var EventProxy = require("eventproxy");
var utils = process.common.utils;
var User = require("../proxy").User;
var Topic = require("../proxy").Topic;
var Reply = require("../proxy").Reply;
var config = require("../config");

/**
 * add reply
 */
exports.add = function (req, res, next) {
  var content = req.body.r_content;
  var topic_id = req.params.topic_id;
  var reply_id = req.body.reply_id;

  var str = validator.trim(content);
  if (str === "") {
    res.status(422);
    res.render("notify/notify", {
      error: "The reply content cannot be empty! ",
    });
    return;
  }

  var ep = EventProxy.create();
  ep.fail(next);

  Topic.getTopic(
    topic_id,
    ep.doneLater(function (topic) {
      if (!topic) {
        ep.unbind();
        // just 404 page
        return next();
      }
      ep.emit("topic", topic);
    })
  );

  ep.all("topic", function (topic) {
    User.getUserById(topic.author_id, ep.done("topic_author"));
  });

  ep.all("topic", "topic_author", function (topic, topicAuthor) {
    Reply.newAndSave(
      content,
      topic_id,
      req.user._id,
      reply_id,
      ep.done(function (reply) {
        Topic.updateLastReply(
          topic_id,
          reply._id,
          ep.done(function () {
            ep.emit("reply_saved", reply);
            //Send at message and prevent duplicate at author
            var newContent = content.replace(
              "@" + topicAuthor.loginname + " ",
              ""
            );
            at.sendMessageToMentionUsers(
              newContent,
              topic_id,
              req.user._id,
              reply._id
            );
          })
        );
      })
    );

    User.getUserById(
      req.user._id,
      ep.done(function (user) {
        // Comment out the integration logic comment
        // user.score += 5;
        user.reply_count += 1;
        user.save();
        req.user = user;
        ep.emit("score_saved");
      })
    );
  });

  ep.all("reply_saved", "topic", function (reply, topic) {
    if (topic.author_id.toString() !== req.user._id.toString()) {
      message.sendReplyMessage(
        topic.author_id,
        req.user._id,
        topic._id,
        reply._id
      );
    }
    ep.emit("message_saved");
  });

  ep.all("reply_saved", "message_saved", "score_saved", function (reply) {
    res.redirect("/topic/" + topic_id + "#" + reply._id);
  });
};

/**
 * delete reply message
 */
exports.delete = function (req, res, next) {
  var reply_id = req.body.reply_id;
  Reply.getReplyById(reply_id, function (err, reply) {
    if (err) {
      return next(err);
    }

    if (!reply) {
      res.status(422);
      res.json({
        status: "no reply" + reply_id + "exists",
      });
      return;
    }
    if (
      reply.author_id.toString() === req.user._id.toString() ||
      req.user.is_admin
    ) {
      reply.remove();
      res.json({
        status: "success",
      });

      if (!reply.reply_id) {
        // Comment out the integration logic comment
        // reply.author.score -= 5;
        reply.author.reply_count -= 1;
        reply.author.save();
      }
    } else {
      res.json({
        status: "failed",
      });
      return;
    }

    Topic.reduceCount(reply.topic_id, _.noop);
  });
};
/*
 Open reply editor
 */
exports.showEdit = function (req, res, next) {
  var reply_id = req.params.reply_id;

  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      res.status(422);
      res.render("notify/notify", {
        error: "This reply does not exist or has been deleted. ",
      });
      return;
    }
    if (
      req.user._id.toString() === reply.author_id.toString() ||
      req.user.is_admin
    ) {
      res.render("reply/edit", {
        reply_id: reply._id,
        content: reply.content,
        tab: req.session.tab || null,
        tabs: config.tabs,
      });
    } else {
      res.status(403);
      res.render("notify/notify", {
        error: "Sorry, you cannot edit this reply. ",
      });
    }
  });
};
/*
 Submit Edit Reply
 */
exports.update = function (req, res, next) {
  var reply_id = req.params.reply_id;
  var content = req.body.t_content;

  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      res.render("notify/notify", {
        error: "This reply does not exist or has been deleted. ",
      });
      return;
    }

    if (
      String(reply.author_id) === req.user._id.toString() ||
      req.user.is_admin
    ) {
      if (content.trim().length > 0) {
        content = utils.addAnchorTarget(content, "_blank");
        reply.content = content;
        reply.save(function (err) {
          if (err) {
            return next(err);
          }
          res.redirect("/topic/" + reply.topic_id + "#" + reply._id);
        });
      } else {
        res.render("notify/notify", {
          error: "The number of characters in the reply is too few. ",
        });
      }
    } else {
      res.render("notify/notify", {
        error: "Sorry, you cannot edit this reply. ",
      });
    }
  });
};

exports.up = function (req, res, next) {
  var replyId = req.params.reply_id;
  var userId = req.user._id;
  Reply.getReplyById(replyId, function (err, reply) {
    if (err) {
      return next(err);
    }
    if (reply.author_id.equals(userId) && !config.debug) {
      // can't help myself
      res.send({
        success: false,
        message: "Hehe, I can not give myself a thumbs up. ",
      });
    } else {
      var action;
      reply.ups = reply.ups || [];
      var upIndex = reply.ups.indexOf(userId);
      if (upIndex === -1) {
        reply.ups.push(userId);
        action = "up";
      } else {
        reply.ups.splice(upIndex, 1);
        action = "down";
      }
      reply.save(function () {
        res.send({
          success: true,
          action: action,
        });
      });
    }
  });
};
