var mailer = require("nodemailer");
var config = require("../config");
var util = require("util");

var transport = mailer.createTransport("SMTP", config.mail_opts);
var SITE_ROOT_URL = "http://" + config.host;

/**
 * Send an email
 * @param {Object} data mail object
 */
var sendMail = function (data) {
  if (config.debug) {
    return;
  }
  // Traverse the mail array, send each mail, if there is a failure to send, it will be pushed into the array, and the mailEvent event will be triggered at the same time
  transport.sendMail(data, function (err) {
    if (err) {
      // write as log
      console.log(err);
    }
  });
};
exports.sendMail = sendMail;

/**
 * Send activation notification email
 * @param {String} who recipient's email address
 * @param {String} The token string used for token reset
 * @param {String} name recipient's username
 */
exports.sendActiveMail = function (who, token, name) {
  var from = util.format("%s <%s>", config.name, config.mail_opts.auth.user);
  var to = who;
  var subject = config.name + "community account activation";
  var html =
    "<p>Hello:" +
    name +
    "</p>" +
    "<p>We have received your registration in the " +
    config.name +
    " community, please click the link below to activate your account:</p>" +
    '<a href="' +
    SITE_ROOT_URL +
    "/active_account?key=" +
    token +
    "&name=" +
    name +
    '">active link</a>' +
    "<p>If you have not filled out the registration information in the " +
    config.name +
    " community, it means that someone has abused your email address, please delete this email, we are sorry for the inconvenience caused. </p>" +
    "<p>" +
    config.name +
    "Community Sincerely. </p>";

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html,
  });
};

/**
 * Send password reset notification email
 * @param {String} who recipient's email address
 * @param {String} The token string used for token reset
 * @param {String} name recipient's username
 */
exports.sendResetPassMail = function (who, token, name) {
  var from = util.format("%s <%s>", config.name, config.mail_opts.auth.user);
  var to = who;
  var subject = config.name + "community password reset";
  var html =
    "<p>Hello:" +
    name +
    "</p>" +
    "<p>We have received your request to reset your password in the " +
    config.name +
    " community, please click the link below to reset your password within 24 hours:</p>" +
    '<a href="' +
    SITE_ROOT_URL +
    "/reset_pass?key=" +
    token +
    "&name=" +
    name +
    '">reset password link</a>' +
    "<p>If you have not filled out the registration information in the " +
    config.name +
    " community, it means that someone has abused your email address, please delete this email, we are sorry for the inconvenience caused. </p>" +
    "<p>" +
    config.name +
    "Community Sincerely. </p>";

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html,
  });
};
