var models = require("../models");
var User = models.User;
var utility = require("utility");
var uuid = require("node-uuid");
var config = require("../config");
var request = require("request");
var url = require("url");
var path = require("path");
var j = request.jar();
var request = request.defaults({
  jar: j,
  json: true,
});
/**
 * Find user list based on user name list
 * Callback:
 * - err, database exception
 * - users, list of users
 * @param {Array} names list of usernames
 * @param {Function} callback callback function
 */
exports.getUsersByNames = function (names, callback) {
  if (names.length === 0) {
    return callback(null, []);
  }
  User.find(
    {
      loginname: {
        $in: names,
      },
    },
    callback
  );
};

/**
 * Remote verification of account legitimacy
 *
 */
exports.apiValidateLogin = function (options, callback) {
  try {
    request.post(
      {
        url: url.resolve(config.hosts.home, path.join("api", "club", "login")),
        form: {
          token: "becluber",
          email: options.email,
          pwd: options.pwd,
        },
      },
      function (err, res, body) {
        if (!err && res.statusCode == 200) {
          if (body.code === 200) {
            var rsUser = body.msg;
            //Check if the user exists
            exports.getUserById(rsUser._id, function (err, user) {
              if (!err && user) {
                // user exists
                console.log("User exists");
                return callback(null, user);
              } else if (!err && !user) {
                // User does not exist, create
                exports.new(
                  {
                    _id: rsUser._id,
                    loginname: rsUser.nickname,
                    email: rsUser.email,
                    avatar: rsUser.head,
                    signature: rsUser.desc,
                    active: true,
                    accessToken: uuid.v4(),
                  },
                  function (err, newUser) {
                    if (!err) {
                      return callback(null, newUser);
                    } else {
                      console.log(err);
                      return callback(err);
                    }
                  }
                );
              } else {
                console.log(err);
                return callback(err);
              }
            });
          } else {
            callback(null);
          }
        } else {
          console.log(err);
          callback(err);
        }
      }
    );
  } catch (err) {
    callback(err);
  }
};

exports.auth = function (user, callback) {
  var rsUser = user;
  exports.getUserById(rsUser._id, function (err, user) {
    if (!err && user) {
      callback(null);
    } else if (!err && !user) {
      // User does not exist, create
      exports.new(
        {
          _id: rsUser._id,
          loginname: rsUser.nickname,
          email: rsUser.email,
          avatar: rsUser.head,
          signature: rsUser.desc,
          active: true,
          accessToken: uuid.v4(),
        },
        function (err, newUser) {
          if (!err) {
            return callback(null, newUser);
          } else {
            console.log(err);
            return callback(err);
          }
        }
      );
    } else {
      console.log(err);
      return callback(err);
    }
  });
};
/**
 * Find users by login name
 * Callback:
 * - err, database exception
 * - user, user
 * @param {String} loginName login name
 * @param {Function} callback callback function
 */
exports.getUserByLoginName = function (loginName, callback) {
  User.findOne(
    {
      loginname: loginName,
    },
    callback
  );
};

/**
 * Find users by user ID
 * Callback:
 * - err, database exception
 * - user, user
 * @param {String} id User ID
 * @param {Function} callback callback function
 */
exports.getUserById = function (id, callback) {
  User.findOne(
    {
      _id: id,
    },
    callback
  );
};

/**
 * Find users by email
 * Callback:
 * - err, database exception
 * - user, user
 * @param {String} email email address
 * @param {Function} callback callback function
 */
exports.getUserByMail = function (email, callback) {
  User.findOne(
    {
      email: email,
    },
    callback
  );
};

/**
 * Get a group of users based on a list of user IDs
 * Callback:
 * - err, database exception
 * - users, list of users
 * @param {Array} ids User ID list
 * @param {Function} callback callback function
 */
exports.getUsersByIds = function (ids, callback) {
  User.find(
    {
      _id: {
        $in: ids,
      },
    },
    callback
  );
};

/**
 * Get a group of users based on keywords
 * Callback:
 * - err, database exception
 * - users, list of users
 * @param {String} query keyword
 * @param {Object} opt option
 * @param {Function} callback callback function
 */
exports.getUsersByQuery = function (query, opt, callback) {
  User.find(query, "", opt, callback);
};

/**
 * Get a user according to the query conditions
 * Callback:
 * - err, database exception
 * - user, user
 * @param {String} name username
 * @param {String} key activation code
 * @param {Function} callback callback function
 */
exports.getUserByNameAndKey = function (loginname, key, callback) {
  User.findOne(
    {
      loginname: loginname,
      retrieve_key: key,
    },
    callback
  );
};

exports.new = function (options, callback) {
  var user = new User(options);
  user.save(callback);
};

exports.newAndSave = function (
  name,
  loginname,
  pass,
  email,
  avatar_url,
  active,
  callback
) {
  var user = new User();
  user.name = loginname;
  user.loginname = loginname;
  user.pass = pass;
  user.email = email;
  user.avatar = avatar_url;
  user.active = active || false;
  user.accessToken = uuid.v4();
  user.save(callback);
};

var makeGravatar = function (email) {
  return (
    "http://www.gravatar.com/avatar/" +
    utility.md5(email.toLowerCase()) +
    "?size=48"
  );
};
exports.makeGravatar = makeGravatar;

exports.getGravatar = function (user) {
  return user.avatar || makeGravatar(user);
};
