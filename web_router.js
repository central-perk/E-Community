/*!
 * nodeclub - route.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require("express");
var sign = require("./controllers/sign");
var site = require("./controllers/site");
var user = require("./controllers/user");
var message = require("./controllers/message");
var topic = require("./controllers/topic");
var reply = require("./controllers/reply");
var rss = require("./controllers/rss");
var staticController = require("./controllers/static");
var auth = require("./middlewares/auth");
var limit = require("./middlewares/limit");
var github = require("./controllers/github");
var search = require("./controllers/search");
var passport = require("passport");
var configMiddleware = require("./middlewares/conf");
var config = require("./config");

var router = express.Router();

// home page
router.get("/", site.index);
router.get("/plaza", site.plaza);
router.get("/u", site.u);
router.get("/account/manage", site.accountManage);
router.get("/account", site.account);

router.get("/messages", site.messages);
router.get("/echuandan", site.echuandan);
router.get("/signup.html", site.signup);
router.get("/signin.html", site.signin);

// sitemap
router.get("/sitemap.xml", site.sitemap);
// mobile app download
router.get("/app/download", site.appDownload);

router.get("/tabs/count", site.listTabCount);

// sign controller
// if (config.allow_sign_up) {
// router.get('/signup', sign.showSignup); // Jump to the registration page
// router.post('/signup', sign.signup); // Submit registration information
// } else {
// router.get('/signup', configMiddleware.github, passport.authenticate('github')); // Authenticate with github
// }
router.get("/signout", sign.signout); // sign out
router.get("/signin", sign.showLogin); // enter the login page
router.post("/signin", sign.login); // login verification
router.get("/active_account", sign.active_account); //Account activation

router.get("/search_pass", sign.showSearchPass); // retrieve password page
router.post("/search_pass", sign.updateSearchPass); // update password
router.get("/reset_pass", sign.reset_pass); // Enter the reset password page
router.post("/reset_pass", sign.update_pass); // update password

// user controller
router.get("/user/:name", user.index); // user's personal homepage
// router.get('/setting', auth.userRequired, user.showSetting); // user personal setting page
// router.post('/setting', auth.userRequired, user.setting); // Submit personal information settings
// router.get('/stars', user.show_stars); // show all stars list page
// router.get('/users/top100', user.top100); // Display the top 100 user pages
// router.get('/user/:name/collections', user.get_collect_topics); // All topic pages collected by the user
router.get("/user/:loginname/topics", user.list_topics); // All topic pages published by the user
router.get("/user/:name/replies", user.list_replies); // All reply pages the user participated in
router.post("/user/set_star", auth.adminRequired, user.toggle_star); // Set a user as a master
router.post("/user/cancel_star", auth.adminRequired, user.toggle_star); // Cancel a user's master status
router.post("/user/:name/block", auth.adminRequired, user.block); // ban a user
router.post("/user/:name/delete_all", auth.adminRequired, user.deleteAll); // delete all speeches of a user

router.get("/messages/count", auth.userRequired, message.getCount);
// message controller
// router.get('/my/messages', auth.userRequired, message.index); // all message pages for the user

// topic

// New article interface
router.get("/topic/create", auth.userRequired, topic.create);

router.get("/topic/:tid", topic.index); // Display a topic
router.post("/topic/:tid/top/:is_top?", auth.adminRequired, topic.top); // Put a topic on top
router.post("/topic/:tid/good/:is_good?", auth.adminRequired, topic.good); // Refine a topic
router.get("/topic/:tid/edit", auth.userRequired, topic.showEdit); // edit a topic

router.post("/topic/:tid/delete", auth.userRequired, topic.delete);

// save the new article
router.post("/topic/create", auth.userRequired, limit.postInterval, topic.put);

router.post("/topic/:tid/edit", auth.userRequired, topic.update);
router.post("/topic/collect", auth.userRequired, topic.collect); // Follow a topic
router.post("/topic/de_collect", auth.userRequired, topic.de_collect); // unfollow a topic

// reply controller
router.post(
  "/:topic_id/reply",
  auth.userRequired,
  limit.postInterval,
  reply.add
); // Submit first-level reply
router.get("/reply/:reply_id/edit", auth.userRequired, reply.showEdit); // Modify your own comment page
router.post("/reply/:reply_id/edit", auth.userRequired, reply.update); // modify a comment
router.post("/reply/:reply_id/delete", auth.userRequired, reply.delete); // delete a comment
router.post("/reply/:reply_id/up", auth.userRequired, reply.up); // Like a comment
router.post("/upload", auth.userRequired, topic.upload); //Upload pictures

// static
router.get("/about", staticController.about);
router.get("/faq", staticController.faq);
router.get("/getstart", staticController.getstart);
router.get("/robots.txt", staticController.robots);
router.get("/api", staticController.api);

//rss
router.get("/rss", rss.index);

// github oauth
router.get(
  "/auth/github",
  configMiddleware.github,
  passport.authenticate("github")
);
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/signin",
  }),
  github.callback
);
router.get("/auth/github/new", github.new);
router.post("/auth/github/create", github.create);

router.get("/search", search.index);

module.exports = router;
