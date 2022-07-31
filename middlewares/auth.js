var mongoose = require("mongoose");
var UserModel = mongoose.model("User");
var Message = require("../proxy").Message;
var config = require("../config");
var eventproxy = require("eventproxy");
var UserProxy = require("../proxy").User;
var utils = process.common.utils;
/**
 * requires admin rights
 */
exports.adminRequired = function (req, res, next) {
  if (!req.user) {
    return res.render("notify/notify", {
      error: "You are not logged in. ",
    });
  }
  if (!req.user.is_admin) {
    return res.render("notify/notify", {
      error: "Administrator privileges required. ",
    });
  }
  next();
};

/**
 * Login required
 */
exports.userRequired = function (req, res, next) {
  if (!req.session || !req.user) {
    return res.status(403).send("forbidden!");
  }
  next();
};

exports.blockUser = function () {
  return function (req, res, next) {
    if (req.path === "/signout") {
      return next();
    }
    if (req.user && req.user.is_block && req.method !== "GET") {
      return res
        .status(403)
        .send("You have been blocked by the administrator.");
    }
    next();
  };
};

function gen_session(user, res) {
  var auth_token = user._id + "$$$$"; // More information may be stored later, separated by $$$$
  res.cookie(config.auth_cookie_name, auth_token, {
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    signed: true,
    httpOnly: true,
    domain: config.isproduction ? ".echuandan.com" : null,
  }); //cookie is valid for 30 days
}

exports.gen_session = gen_session;

// Verify that the user is logged in
exports.authUser = function (req, res, next) {
  var ep = new eventproxy();
  ep.fail(next);
  if (config.debug && req.cookies["mock_user"]) {
    var mockUser = JSON.parse(req.cookies["mock_user"]);
    req.user = new UserModel(mockUser);
    if (mockUser.is_admin) {
      req.user.is_admin = true;
    }
    return next();
  }

  ep.all("get_user", function (user) {
    if (!user) {
      return next();
    }
    user = res.locals.current_user = req.user;

    if (config.admins.hasOwnProperty(user.email)) {
      user.is_admin = true;
    }
    next();
  });

  if (req.user) {
    req.user._id = req.user._id.toString();
    UserProxy.auth(req.user, function (err, user) {
      ep.emit("get_user", req.user);
    });
  } else {
    var auth_token = req.signedCookies[config.auth_cookie_name];
    if (!auth_token) {
      return next();
    }

    var auth = auth_token.split("$$$$");
    var user_id = auth[0];
    UserProxy.getUserById(user_id, ep.done("get_user"));
  }
};

// function clearCookies(req, res) {
// res.clearCookie(config.session_secret, {
// path: '/',
// domain: config.isproduction ? '.echuandan.com' : null
// });
// }
