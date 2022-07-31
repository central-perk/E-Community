var mcache = require("memory-cache");

var get = function (key, callback) {
  setImmediate(function () {
    callback(null, mcache.get(key));
  });
};

exports.get = get;

// The time parameter is optional, in milliseconds
var set = function (key, value, time, callback) {
  if (typeof time === "function") {
    callback = time;
    time = null;
  }
  mcache.put(key, value, time);
  setImmediate(function () {
    callback && callback(null);
  });
};

exports.set = set;
