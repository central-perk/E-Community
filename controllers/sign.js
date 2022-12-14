var validator = require("validator");
var eventproxy = require("eventproxy");
var config = require("../config");
var User = require("../proxy").User;
var mail = require("../common/mail");
var tools = require("../common/tools");
var utility = require("utility");
var authMiddleWare = require("../middlewares/auth");
var uuid = require("node-uuid");

//sign up
exports.showSignup = function (req, res) {
  res.render("sign/signup");
};

exports.signup = function (req, res, next) {
  var loginname = validator.trim(req.body.loginname).toLowerCase();
  var email = validator.trim(req.body.email).toLowerCase();
  var pass = validator.trim(req.body.pass);
  var rePass = validator.trim(req.body.re_pass);

  var ep = new eventproxy();
  ep.fail(next);
  ep.on("prop_err", function (msg) {
    res.status(422);
    res.render("sign/signup", {
      error: msg,
      loginname: loginname,
      email: email,
    });
  });

  // verify the correctness of the information
  if (
    [loginname, pass, rePass, email].some(function (item) {
      return item === "";
    })
  ) {
    ep.emit("prop_err", "Incomplete information.");
    return;
  }
  if (loginname.length < 5) {
    ep.emit("prop_err", "Username needs at least 5 characters.");
    return;
  }
  if (!tools.validateId(loginname)) {
    return ep.emit("prop_err", "The username is invalid.");
  }
  if (!validator.isEmail(email)) {
    return ep.emit("prop_err", "The mailbox is invalid.");
  }
  if (pass !== rePass) {
    return ep.emit("prop_err", "The two password inputs are inconsistent.");
  }
  // END verify the correctness of the information

  User.getUsersByQuery(
    {
      $or: [
        {
          loginname: loginname,
        },
        {
          email: email,
        },
      ],
    },
    {},
    function (err, users) {
      if (err) {
        return next(err);
      }
      if (users.length > 0) {
        ep.emit("prop_err", "Username or email address has been used.");
        return;
      }

      tools.bhash(
        pass,
        ep.done(function (passhash) {
          // create gravatar
          var avatarUrl = User.makeGravatar(email);
          User.newAndSave(
            loginname,
            loginname,
            passhash,
            email,
            avatarUrl,
            false,
            function (err) {
              if (err) {
                return next(err);
              }
              // send activation email
              mail.sendActiveMail(
                email,
                utility.md5(email + passhash + config.session_secret),
                loginname
              );
              res.render("sign/signup", {
                success:
                  "Welcome to " +
                  config.name +
                  "! We have sent an email to your registered email address, please click the link inside to activate your account. ",
              });
            }
          );
        })
      );
    }
  );
};

/**
 * Show user login page.
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 */
exports.showLogin = function (req, res) {
  req.session._loginReferer = req.headers.referer;
  res.render("sign/signin");
};

/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
var notJump = [
  "/active_account", //active page
  "/reset_pass", //reset password page, avoid to reset twice
  "/signup", //regist page
  "/search_pass", //serch pass page
];

/**
 * Handle user login.
 *
 * @param {HttpRequest} req
 * @param {HttpResponse} res
 * @param {Function} next
 */
exports.login = function (req, res, next) {
  var loginname = validator.trim(req.body.name).toLowerCase();
  var pass = validator.trim(req.body.pass);
  var ep = new eventproxy();
  ep.fail(next);

  if (!loginname || !pass) {
    res.status(422);
    return res.render("sign/signin", {
      error: "Incomplete information.",
    });
  }

  var getUser;
  //if (loginname.indexOf('@') !== -1) {
  getUser = User.apiValidateLogin;
  // } else {
  // getUser = User.getUserByLoginName;
  // }

  ep.on("login_error", function (login_error) {
    res.status(403);
    res.render("sign/signin", {
      error: "Incorrect username or password",
    });
  });

  //Remote server authentication
  getUser(
    {
      email: loginname,
      pwd: pass,
    },
    function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return ep.emit("login_error");
      }
      authMiddleWare.gen_session(user, res);
      //check at some page just jump to home page
      var refer = req.session._loginReferer || "/";
      for (var i = 0, len = notJump.length; i !== len; ++i) {
        if (refer.indexOf(notJump[i]) >= 0) {
          refer = "/";
          break;
        }
      }
      res.redirect(refer);
      // }));
    }
  );
};

// sign out
exports.signout = function (req, res, next) {
  req.session.destroy();
  // var defOpt = {
  // path: '/',
  // domain: config.isproduction ? '.echuandan.com' : null
  // };
  // res.clearCookie(config.auth_cookie_name, defOpt);
  // res.clearCookie(config.auth_ecd_cookie_name, defOpt);
  // res.clearCookie(config.session_secret, defOpt);
  // res.clearCookie(config.connect_cookie_name, defOpt);
  res.redirect("/");
};

exports.active_account = function (req, res, next) {
  var key = req.query.key;
  var name = req.query.name;

  User.getUserByLoginName(name, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error("[ACTIVE_ACCOUNT] no such user: " + name));
    }
    var passhash = user.pass;
    if (
      !user ||
      utility.md5(user.email + passhash + config.session_secret) !== key
    ) {
      return res.render("notify/notify", {
        error: "Incorrect information, account cannot be activated.",
      });
    }
    if (user.active) {
      return res.render("notify/notify", {
        error: "The account is already active.",
      });
    }
    user.active = true;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.render("notify/notify", {
        success: "The account has been activated, please log in",
      });
    });
  });
};
exports.showSearchPass = function (req, res) {
  res.render("sign/search_pass");
};

exports.updateSearchPass = function (req, res, next) {
  var email = validator.trim(req.body.email).toLowerCase();
  if (!validator.isEmail(email)) {
    return res.render("sign/search_pass", {
      error: "The mailbox is invalid",
      email: email,
    });
  }

  // Dynamically generate retrieve_key and timestamp to users collection, then reset password for verification
  var retrieveKey = uuid.v4();
  var retrieveTime = new Date().getTime();
  User.getUserByMail(email, function (err, user) {
    if (!user) {
      res.render("sign/search_pass", {
        error: "There is no such email address.",
        email: email,
      });
      return;
    }
    user.retrieve_key = retrieveKey;
    user.retrieve_time = retrieveTime;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      // send reset password email
      mail.sendResetPassMail(email, retrieveKey, user.loginname);
      res.render("notify/notify", {
        success:
          "We have sent an email to your email address, please click the link within 24 hours to reset your password.",
      });
    });
  });
};

/**
 * reset password
 * 'get' to show the page, 'post' to reset password
 * after reset password, retrieve_key&time will be destroyed
 * @param {http.req} req
 * @param {http.res} res
 * @param {Function} next
 */
exports.reset_pass = function (req, res, next) {
  var key = req.query.key;
  var name = req.query.name;
  User.getUserByNameAndKey(name, key, function (err, user) {
    if (!user) {
      res.status(403);
      return res.render("notify/notify", {
        error: "Incorrect information, password cannot be reset.",
      });
    }
    var now = new Date().getTime();
    var oneDay = 1000 * 60 * 60 * 24;
    if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
      res.status(403);
      return res.render("notify/notify", {
        error: "The link has expired, please reapply.",
      });
    }
    return res.render("sign/reset", {
      name: name,
      key: key,
    });
  });
};

exports.update_pass = function (req, res, next) {
  var psw = validator.trim(req.body.psw) || "";
  var repsw = validator.trim(req.body.repsw) || "";
  var key = validator.trim(req.body.key) || "";
  var name = validator.trim(req.body.name) || "";
  var ep = new eventproxy();
  ep.fail(next);

  if (psw !== repsw) {
    return res.render("sign/reset", {
      name: name,
      key: key,
      error: "The two password entries are inconsistent.",
    });
  }
  User.getUserByNameAndKey(
    name,
    key,
    ep.done(function (user) {
      if (!user) {
        return res.render("notify/notify", {
          error: "Bad activation link",
        });
      }
      tools.bhash(
        psw,
        ep.done(function (passhash) {
          user.pass = passhash;
          user.retrieve_key = null;
          user.retrieve_time = null;
          user.active = true; // user active
          user.save(function (err) {
            if (err) {
              return next(err);
            }
            return res.render("notify/notify", {
              success: "Your password has been reset.",
            });
          });
        })
      );
    })
  );
};
