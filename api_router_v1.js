var express = require("express");

var topicController = require("./api/v1/topic");
var userController = require("./api/v1/user");
var toolsController = require("./api/v1/tools");
var replyController = require("./api/v1/reply");
var messageController = require("./api/v1/message");
var middleware = require("./api/v1/middleware");

var router = express.Router();

// theme
router.get("/topics", topicController.index);
router.get("/topic/:id", topicController.show);
router.post("/topics", middleware.auth, topicController.create);

// user
router.get("/user/:loginname", userController.show);

// accessToken test
router.post("/accesstoken", middleware.auth, toolsController.accesstoken);

// Comment
router.post(
  "/topic/:topic_id/replies",
  middleware.auth,
  replyController.create
);
router.post("/reply/:reply_id/ups", middleware.auth, replyController.ups);

// Notice
router.get("/messages", middleware.auth, messageController.index);
router.get("/message/count", middleware.auth, messageController.count);
router.post("/message/mark_all", middleware.auth, messageController.markAll);

module.exports = router;
