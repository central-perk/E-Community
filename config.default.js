/**
 *config
 */

var path = require("path");

var config = {
  // When debug is true, it is used for local debugging
  debug: true,

  get mini_assets() {
    return !this.debug;
  }, // Whether to enable merge compression of static files, see Loader in the view for details

  name: "Nodeclub", // community name
  description: "CNode: Node.js Professional Chinese Community", // Description of the community
  keywords: "nodejs, node, express, connect, socket.io",

  // information to add to the html head
  site_headers: ['<meta name="author" content="EDP@TAOBAO" />'],
  site_logo: "", // default is `name`
  site_icon: "/public/images/cnode_icon_32.png", // There is no favicon by default, fill in the URL here
  // Navigation area in the upper right corner
  site_navs: [
    // format [ path, title, [target=''] ]
    ["/about", "about"],
  ],
  // cdn host,
  site_static_host: "", // static file storage domain name
  // community domain name
  host: "localhost",
  // Default Google tracker ID, please modify your own site, application address: http://www.google.com/analytics/
  google_tracker_id: "",
  // The default cnzz tracker ID, please modify it for your own site
  cnzz_tracker_id: "",

  // mongodb configuration
  db: "mongodb://127.0.0.1/node_club_dev",
  db_name: "node_club_dev",

  session_secret: "node_club_secret", // must be modified
  auth_cookie_name: "node_club",

  // port the program is running on
  port: 3000,

  // The number of topics displayed in the topic list
  list_topic_count: 20,

  // Limit the time interval for posting, in milliseconds
  post_interval: 2000,

  // RSS configuration
  rss: {
    title: "CNode: Node.js Professional Chinese Community",
    link: "https://club.echuandan.com",
    language: "zh-cn",
    description: "CNode: Node.js Professional Chinese Community",
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
  admins: { user_login_name: true },

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
    accessKey: "your access key",
    secretKey: "your secret key",
    bucket: "your bucket name",
    domain: "http://{bucket}.qiniudn.com",
  },

  //file upload configuration
  //Note: If you fill in qn_access, it will be uploaded to 7Nu, the following configuration is invalid
  upload: {
    path: path.join(__dirname, "public/upload/"),
    url: "/public/upload/",
  },

  // section
  tabs: [
    ["share", "share"],
    ["ask", "Q&A"],
    ["job", "recruitment"],
  ],

  // Aurora push
  jpush: {
    appKey: "your access key",
    secretKey: "your secret key",
  },
};

module.exports = config;
