var Models = require("../models");
var User = Models.User;
var authMiddleWare = require("../middlewares/auth");
var tools = require("../common/tools");
var eventproxy = require("eventproxy");
var uuid = require("node-uuid");
var validator = require("validator");

exports.callback = function (req, res, next) {
  var profile = req.user;
  User.findOne({ githubId: profile.id }, function (err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      user.githubUsername = profile.username;
      user.githubId = profile.id;
      user.githubAccessToken = profile.accessToken;
      // user.loginname = profile.username;
      user.avatar = profile._json.avatar_url;
      if (profile.emails[0].value) {
        user.email = profile.emails[0].value;
      }

      user.save(function (err) {
        if (err) {
          return next(err);
        }
        authMiddleWare.gen_session(user, res);
        return res.redirect("/");
      });
    } else {
      req.session.profile = profile;
      return res.redirect("/auth/github/new");
    }
  });
};

exports.new = function (req, res, next) {
  res.render("sign/new_oauth", { actionPath: "/auth/github/create" });
};

exports.create = function (req, res, next) {
  var profile = req.session.profile;
  var isnew = req.body.isnew;
  var loginname = validator.trim(req.body.name).toLowerCase();
  var password = validator.trim(req.body.pass);
  var ep = new eventproxy();
  ep.fail(next);

  if (!profile) {
    return res.redirect("/signin");
  }
  delete req.session.profile;
  if (isnew) {
    var user = new User({
      loginname: profile.username,
      pass: profile.accessToken,
      email: profile.emails[0].value,
      avatar: profile._json.avatar_url,
      githubId: profile.id,
      githubUsername: profile.username,
      githubAccessToken: profile.accessToken,
      active: true,
      accessToken: uuid.v4(),
    });
    user.save(function (err) {
      if (err) {
        // Decide how to respond to the user based on the error message of err.err, this place is ugly
        if (err.err.indexOf("duplicate key error") !== -1) {
          if (err.err.indexOf("users.$email") !== -1) {
            return res.status(500).render("sign/no_github_email");
          }
          if (err.err.indexOf("users.$loginname") !== -1) {
            return res
              .status(500)
              .send(
                "The username of your GitHub account is the same as the username previously registered in Club"
              );
          }
        }
        return next(err);
        // END decides how to respond to the user based on the error message of err.err, this place is ugly
      }
      authMiddleWare.gen_session(user, res);
      res.redirect("/");
    });
  } else {
    // Associate the old account
    ep.on("login_error", function (login_error) {
      res.status(403);
      res.render("sign/signin", {
        error: "The account name or password is incorrect.",
      });
    });
    User.findOne(
      { loginname: loginname },
      ep.done(function (user) {
        if (!user) {
          return ep.emit("login_error");
        }
        tools.bcompare(
          password,
          user.pass,
          ep.done(function (bool) {
            if (!bool) {
              return ep.emit("login_error");
            }
            user.githubUsername = profile.username;
            user.githubId = profile.id;
            // user.loginname = profile.username;
            user.avatar = profile._json.avatar_url;
            user.githubAccessToken = profile.accessToken;

            user.save(function (err) {
              if (err) {
                return next(err);
              }
              authMiddleWare.gen_session(user, res);
              res.redirect("/");
            });
          })
        );
      })
    );
  }
};
