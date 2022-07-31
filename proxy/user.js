var models = require('../models');
var User = models.User;
var utility = require('utility');
var uuid = require('node-uuid');
var config = require('../config');
var request = require('request');
var url = require('url');
var path = require('path');
var j = request.jar();
var request = request.defaults({
  jar: j,
  json: true
});
/**
 * 根据用户名列表查找用户列表
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} names 用户名列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByNames = function(names, callback) {
  if (names.length === 0) {
    return callback(null, []);
  }
  User.find({
    loginname: {
      $in: names
    }
  }, callback);
};


/**
 * 远程验证账号合法性
 *
 */
exports.apiValidateLogin = function(options, callback) {
  try {
    request.post({
      url: url.resolve(config.hosts.home, path.join('api', 'club', 'login')),
      form: {
        token: 'becluber',
        email: options.email,
        pwd: options.pwd
      }
    }, function(err, res, body) {
      if (!err && res.statusCode == 200) {
        if (body.code === 200) {
          var rsUser = body.msg;
          //判断用户是否存在
          exports.getUserById(rsUser._id, function(err, user) {
            if (!err && user) {
              //存在用户
              console.log('存在用户');
              return callback(null, user);
            } else if (!err && !user) {
              //不存在用户,创建
              exports.new({
                _id: rsUser._id,
                loginname: rsUser.nickname,
                email: rsUser.email,
                avatar: rsUser.head,
                signature: rsUser.desc,
                active: true,
                accessToken: uuid.v4()
              }, function(err, newUser) {
                if (!err) {
                  return callback(null, newUser);
                } else {
                  console.log(err);
                  return callback(err);
                }
              });
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
    });
  } catch (err) {
    callback(err);
  }
}

exports.auth = function(user, callback) {
    var rsUser = user;
    exports.getUserById(rsUser._id, function(err, user) {
      if (!err && user) {
        callback(null);
      } else if (!err && !user) {
        //不存在用户,创建
        exports.new({
          _id: rsUser._id,
          loginname: rsUser.nickname,
          email: rsUser.email,
          avatar: rsUser.head,
          signature: rsUser.desc,
          active: true,
          accessToken: uuid.v4()
        }, function(err, newUser) {
          if (!err) {
            return callback(null, newUser);
          } else {
            console.log(err);
            return callback(err);
          }
        });
      } else {
        console.log(err);
        return callback(err);
      }
    });
  };
  /**
   * 根据登录名查找用户
   * Callback:
   * - err, 数据库异常
   * - user, 用户
   * @param {String} loginName 登录名
   * @param {Function} callback 回调函数
   */
exports.getUserByLoginName = function(loginName, callback) {
  User.findOne({
    'loginname': loginName
  }, callback);
};

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function(id, callback) {
  User.findOne({
    _id: id
  }, callback);
};

/**
 * 根据邮箱，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} email 邮箱地址
 * @param {Function} callback 回调函数
 */
exports.getUserByMail = function(email, callback) {

  User.findOne({
    email: email
  }, callback);

};

/**
 * 根据用户ID列表，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} ids 用户ID列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByIds = function(ids, callback) {
  User.find({
    '_id': {
      '$in': ids
    }
  }, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function(query, opt, callback) {
  User.find(query, '', opt, callback);
};

/**
 * 根据查询条件，获取一个用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {String} key 激活码
 * @param {Function} callback 回调函数
 */
exports.getUserByNameAndKey = function(loginname, key, callback) {
  User.findOne({
    loginname: loginname,
    retrieve_key: key
  }, callback);
};

exports.new = function(options, callback) {
  var user = new User(options);
  user.save(callback);
};


exports.newAndSave = function(name, loginname, pass, email, avatar_url, active, callback) {
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

var makeGravatar = function(email) {
  return 'http://www.gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48';
};
exports.makeGravatar = makeGravatar;

exports.getGravatar = function(user) {
  return user.avatar || makeGravatar(user);
};