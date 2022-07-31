/**
 *config
 */

var path = require("path");

var config = {
  debug: true,

  get mini_assets() {
    return !this.debug;
  }, // Whether to enable merge compression of static files, see Loader in the view for details

  name: "ECD", // community name
  description: "Collaborative interface design tool | ECD", // description of the community
  keywords: "nodejs, node, express, connect, socket.io",

  // information to add to the html head
  site_headers: ['<meta name="author" content="EDP@TAOBAO" />'],
  site_logo: "./public/images/brand/logo_dark.png", // default is `name`
  site_icon: "./public/images/brand/icon128.ico", // There is no favicon by default, fill in the URL here
  // Navigation area in the upper right corner
  site_navs: [
    // format [ path, title, [target=''] ]
    ["/about", "about"],
  ],
  site_static_host: "", // static file storage domain name
  // community domain name
  host: "localhost",
  // Default Google tracker ID, please modify your own site, application address: http://www.google.com/analytics/
  google_tracker_id: "",
  // The default cnzz tracker ID, please modify it for your own site
  cnzz_tracker_id: "",
  clubDb: {
    host: "127.0.0.1:27017",
    name: "echuandan_club_dev",
  },
  ecdDb: {
    host: "127.0.0.1:27017",
    name: "echuandan_development",
  },
  // mongodb configuration
  db: "mongodb://127.0.0.1/echuandan_club_dev",
  dbEcd: "mongodb://127.0.0.1/echuandan_development",
  db_name: "echuandan_club_dev",

  session_secret: "_ecd", // must be modified
  session_key: "_ecd_sid",

  // auth_cookie_name: '_ecd_club_sid',
  // auth_ecd_cookie_name: '_ecd_sid',
  // connect_cookie_name: 'connect.sid',
  //Session of Easy Leaflet Service
  // secret: '_ecd',
  // key: '_ecd_sid'
  // port the program is running on
  port: 15000,

  // The number of topics displayed in the topic list
  list_topic_count: 20,

  // Limit the time interval for posting, in milliseconds
  post_interval: 2000,

  // RSS configuration
  rss: {
    title: "ECD",
    link: "http://echuandan.com",
    language: "zh-cn",
    description: "ECD is a collaborative interface design tool",
    //Maximum number of RSS Items obtained
    max_rss_items: 50,
  },

  // Email configuration
  mail_opts: {
    host: "smtp.126.com",
    port: 25,
    auth: {
      user: "club@126.com",
      pass: "club",
    },
  },

  //weibo app key
  weibo_key: 10000000,
  weibo_id: "your_weibo_id",

  // admin can delete topics, edit tags, and set someone as a master
  admins: {
    "example@example.com": true,
  },

  //Configuration of github login
  GITHUB_OAUTH: {
    clientID: "your GITHUB_CLIENT_ID",
    clientSecret: "your GITHUB_CLIENT_SECRET",
    callbackURL: "https://club.echuandan.com/auth/github/callback",
  },
  // Whether to allow direct registration (otherwise, only the way of github)
  allow_sign_up: true,

  // newrelic is a service for monitoring website performance
  newrelic_key: "yourkey",

  //7 cattle access information for file upload
  qn_access: {
    accessKey: "eFs9nYK8VWCB7ZANciCcadVcIw_igKQRpGs7nHca",
    secretKey: "c-ZEtcMjVUplaWgfOrw_TEdL_ABp6WwS-NmKkmBr",
    bucket: "club",
    domain: "http://7vikc7.com1.z0.glb.clouddn.com",
  },

  //file upload configuration
  //Note: If you fill in qn_access, it will be uploaded to 7Nu, the following configuration is invalid
  upload: {
    path: path.join(__dirname, "public/upload/"),
    url: "/public/upload/",
  },

  // section
  tabs: [
    ["official", "General forum announcement"],
    ["freshman", "New Ding on the Road"],
    ["feedback", "good advice"],
    ["experience", "Shiquan Dabu"],
    ["aq", "Get to the bottom of things"],
    ["works", "Martial Arts Hall"],
    ["source", "Arsenal"],
    ["fun", "Zhang Ya Wu Zaw Hall"],
  ],

  // Aurora push
  jpush: {
    appKey: "your access key",
    secretKey: "your secret key",
  },

  //service configuration
  hosts: {
    club: "http://localhost:15000/",
    home: "http://localhost:15000/",
    mailer: "http://mailer.echuandan.com/",
    logger: "http://logger.echuandan.com/",
    sms: "http://sms.echuandan.com/",
  },
  TIME: {
    midnight: "0 10 1 * * *",
    // midnight: '0 33 15 * * *'
  },
};

module.exports = config;
