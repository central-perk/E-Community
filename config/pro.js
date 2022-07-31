/**
 * config
 */

var path = require("path");

var config = {
  debug: false,
  list_topic_count: 15,
  clubDb: {
    host: "127.0.0.1:27017",
    name: "echuandan_club_production",
  },
  ecdDb: {
    host: "${yourHost}:27017",
    name: "echuandan_production",
  },
  db: "mongodb://127.0.0.1/echuandan_club_production",
  dbEcd: "mongodb://${yourHost}/echuandan_production",
  db_name: "echuandan_club_production",
  admins: {
    "a.kinguo@gmail.com": true,
    "fejustin@126.com": true,
    "13681595606@126.com": true,
    "justinwong@echuandan.com": true,
    "qinglu@echuandan.com": true,
    "chizhang@echuandan.com": true,
    "team@echuandan.com": true,
  },
  hosts: {
    club: "http://club.echuandan.com",
    home: "http://echuandan.com/",
    mailer: "http://mailer.echuandan.com/",
    logger: "http://logger.echuandan.com/",
    sms: "http://sms.echuandan.com/",
  },
};

module.exports = config;
