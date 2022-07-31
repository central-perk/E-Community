/**
 * config
 */

var path = require('path');

var config = {
  // debug 为 true 时，用于本地调试
  debug: true,

  get mini_assets() {
    return !this.debug;
  }, // 是否启用静态文件的合并压缩，详见视图中的Loader

  name: '易坛子|易传单', // 社区名字
  description: '易坛子|易传单', // 社区的描述
  keywords: 'nodejs, node, express, connect, socket.io',

  // 添加到 html head 中的信息
  site_headers: [
    '<meta name="author" content="EDP@TAOBAO" />'
  ],
  site_logo: './public/images/brand/logo_dark.png', // default is `name`
  site_icon: './public/images/brand/icon128.ico', // 默认没有 favicon, 这里填写网址
  // 右上角的导航区
  site_navs: [
    // 格式 [ path, title, [target=''] ]
    ['/about', '关于']
  ],
  site_static_host: '', // 静态文件存储域名
  // 社区的域名
  host: 'localhost',
  // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/
  google_tracker_id: '',
  // 默认的cnzz tracker ID，自有站点请修改
  cnzz_tracker_id: '',
  clubDb:{
    host:'127.0.0.1:27017',
    name:'echuandan_club_dev'
  },
  ecdDb:{
    host:'127.0.0.1:27017',
    name:'echuandan_development'
  },
  // mongodb 配置
  db: 'mongodb://127.0.0.1/echuandan_club_dev',
  dbEcd:'mongodb://127.0.0.1/echuandan_development',
  db_name: 'echuandan_club_dev',


  session_secret: '_ecd', // 务必修改
  session_key:'_ecd_sid',

  // auth_cookie_name: '_ecd_club_sid',
  // auth_ecd_cookie_name: '_ecd_sid',
  // connect_cookie_name: 'connect.sid',
  //易传单服务的session
  // secret: '_ecd',
  //     key: '_ecd_sid'
  // 程序运行的端口
  port: 15000,

  // 话题列表显示的话题数量
  list_topic_count: 20,

  // 限制发帖时间间隔，单位：毫秒
  post_interval: 2000,

  // RSS配置
  rss: {
    title: '易传单',
    link: 'http://echuandan.com',
    language: 'zh-cn',
    description: '易传单是免费强大的在线制作和托管电子传单的工具',
    //最多获取的RSS Item数量
    max_rss_items: 50
  },

  // 邮箱配置
  mail_opts: {
    host: 'smtp.126.com',
    port: 25,
    auth: {
      user: 'club@126.com',
      pass: 'club'
    }
  },

  //weibo app key
  weibo_key: 10000000,
  weibo_id: 'your_weibo_id',

  // admin 可删除话题，编辑标签，设某人为达人
  admins: {
    'example@example.com': true,
  },

  // github 登陆的配置
  GITHUB_OAUTH: {
    clientID: 'your GITHUB_CLIENT_ID',
    clientSecret: 'your GITHUB_CLIENT_SECRET',
    callbackURL: 'https://club.echuandan.com/auth/github/callback'
  },
  // 是否允许直接注册（否则只能走 github 的方式）
  allow_sign_up: true,

  // newrelic 是个用来监控网站性能的服务
  newrelic_key: 'yourkey',

  //7牛的access信息，用于文件上传
  qn_access: {
    accessKey: 'eFs9nYK8VWCB7ZANciCcadVcIw_igKQRpGs7nHca',
    secretKey: 'c-ZEtcMjVUplaWgfOrw_TEdL_ABp6WwS-NmKkmBr',
    bucket: 'club',
    domain: 'http://7vikc7.com1.z0.glb.clouddn.com'
  },

  //文件上传配置
  //注：如果填写 qn_access，则会上传到 7牛，以下配置无效
  upload: {
    path: path.join(__dirname, 'public/upload/'),
    url: '/public/upload/'
  },

  // 版块
  tabs: [
    ['official', '总坛布告'],
    ['freshman', '新丁上道'],
    ['feedback', '忠言良策'],
    ['experience', '十全大补 '],
    ['aq', '刨根问底'],
    ['works', '演武厅'],
    ['source', '军火库'],
    ['fun', '张牙武爪堂']
  ],

  // 极光推送
  jpush: {
    appKey: 'your access key',
    secretKey: 'your secret key'
  },

  //服务配置
  hosts: {
    club:'http://localhost:15000/',
    home: 'http://localhost:15000/',
    mailer: 'http://mailer.echuandan.com/',
    logger: 'http://logger.echuandan.com/',
    sms: 'http://sms.echuandan.com/'
  },
  TIME: {
    midnight: '0 10 1 * * *'
      // midnight: '0 33 15 * * *'
  }
};

module.exports = config;