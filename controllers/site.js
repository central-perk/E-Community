/*!
 * nodeclub - site index controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 *MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require("../proxy").User;
var Topic = require("../proxy").Topic;
var config = require("../config");
var memoryCache = require("memory-cache");
var eventproxy = require("eventproxy");
var cache = require("../common/cache");
var xmlbuilder = require("xmlbuilder");
var renderHelper = require("../common/render_helper");
var url = require("url");
var path = require("path");

// The caching of the home page works. The home page needs to be actively cached
function indexCache() {
  if (config.debug) {
    return;
  }
  var limit = config.list_topic_count;
  // cache for all sections (tabs)
  [["", "all"]].concat(config.tabs).forEach(function (pair) {
    // Only the first page is cached, page = 1. The reason why options is generated every time is because when mongoose queries,
    // will change it
    var options = {
      skip: (1 - 1) * limit,
      limit: limit,
      sort: "-top -last_reply_at",
    };
    var tabValue = pair[0];
    var query = {};
    if (tabValue) {
      query.tab = tabValue;
    }
    var optionsStr = JSON.stringify(query) + JSON.stringify(options);
    Topic.getTopicsByQuery(query, options, function (err, topics) {
      cache.set(optionsStr, topics);
    });
  });
}
// setInterval(indexCache, 1000 * 5); // Update every five seconds
// indexCache();
// END home page caching works

exports.index = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var tab = req.query.tab || req.session.tab || "all";
  var user = req.user;
  req.session.tab = tab;
  console.log("./index");
  var proxy = new eventproxy();
  proxy.fail(next);

  // get topic
  var query = {};
  if (tab && tab !== "all") {
    if (tab === "good") {
      query.good = true;
    } else {
      query.tab = tab;
    }
  }

  var limit = config.list_topic_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: "-top -last_reply_at",
  };
  var optionsStr = JSON.stringify(query) + JSON.stringify(options);

  cache.get(
    optionsStr,
    proxy.done(function (topics) {
      if (topics) {
        return proxy.emit("topics", topics);
      }
      Topic.getTopicsByQuery(
        query,
        options,
        proxy.done("topics", function (topics) {
          return topics;
        })
      );
    })
  );
  // END takes the topic

  // Get the users on the leaderboard
  // cache.get('tops', proxy.done(function(tops) {
  // if (tops) {
  // proxy.emit('tops', tops);
  // } else {
  // User.getUsersByQuery({
  // '$or': [{
  // is_block: {
  // '$exists': false
  // }
  // }, {
  // is_block: false
  // }]
  // }, {
  // limit: 10,
  // sort: '-score'
  // },
  // proxy.done('tops', function(tops) {
  // cache.set('tops', tops, 1000 * 60 * 1);
  // return tops;
  // })
  // );
  // }
  // }));

  // get the topic of 0 replies
  cache.get(
    "no_reply_topics",
    proxy.done(function (no_reply_topics) {
      if (no_reply_topics) {
        proxy.emit("no_reply_topics", no_reply_topics);
      } else {
        Topic.getTopicsByQuery(
          {
            reply_count: 0,
          },
          {
            limit: 5,
            sort: "-create_at",
          },
          proxy.done("no_reply_topics", function (no_reply_topics) {
            cache.set("no_reply_topics", no_reply_topics, 1000 * 60 * 1);
            return no_reply_topics;
          })
        );
      }
    })
  );

  //User's topic
  cache.get(
    "user_topics",
    proxy.done(function (user_topics) {
      if (!user) return proxy.emit("user_topics", null);
      if (user_topics) {
        proxy.emit("user_topics", user_topics);
      } else {
        Topic.getTopicsByQuery(
          {
            author_id: user._id,
          },
          {
            limit: 5,
            sort: "-create_at",
          },
          proxy.done("user_topics", function (user_topics) {
            cache.set("user_topics", user_topics, 1000 * 60 * 1);
            return user_topics;
          })
        );
      }
    })
  );
  // Get paging data
  cache.get(
    "pages",
    proxy.done(function (pages) {
      if (pages) {
        proxy.emit("pages", pages);
      } else {
        Topic.getCountByQuery(
          query,
          proxy.done(function (all_topics_count) {
            var pages = Math.ceil(all_topics_count / limit);
            cache.set(JSON.stringify(query) + "pages", pages, 1000 * 60 * 1);
            proxy.emit("pages", pages);
          })
        );
      }
    })
  );

  var tabName = renderHelper.tabName(tab);
  console.log("./all");
  proxy.all(
    "topics",
    "no_reply_topics",
    "pages",
    "user_topics",
    function (topics, no_reply_topics, pages, user_topics) {
      res.render("index", {
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        user_topics: user_topics,
        no_reply_topics: no_reply_topics,
        pages: pages,
        tabs: config.tabs,
        tab: tab,
        pageTitle: tabName && tabName + "section",
      });
    }
  );
};

exports.sitemap = function (req, res, next) {
  var urlset = xmlbuilder.create("urlset", {
    version: "1.0",
    encoding: "UTF-8",
  });
  urlset.att("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");

  var ep = new eventproxy();
  ep.fail(next);

  ep.all("sitemap", function (sitemap) {
    res.type("xml");
    res.send(sitemap);
  });

  cache.get(
    "sitemap",
    ep.done(function (sitemapData) {
      if (sitemapData) {
        ep.emit("sitemap", sitemapData);
      } else {
        Topic.getLimit5w(function (err, topics) {
          if (err) {
            return next(err);
          }
          topics.forEach(function (topic) {
            urlset
              .ele("url")
              .ele("loc", "https://club.echuandan.com/topic/" + topic._id);
          });

          var sitemapData = urlset.end();
          cache.set("sitemap", sitemapData, 1000 * 3600 * 24);
          ep.emit("sitemap", sitemapData);
        });
      }
    })
  );
};

exports.appDownload = function (req, res, next) {
  if (/Android/i.test(req.headers["user-agent"])) {
    res.redirect("http://fir.im/ks4u");
  } else {
    res.redirect("https://itunes.apple.com/cn/app/id954734793");
  }
};

exports.plaza = function (req, res) {
  if (req.user) {
    res.redirect(url.resolve(config.hosts.home, "plaza"));
  } else {
    return redirectSignin(res);
  }
};

exports.u = function (req, res) {
  if (req.user) {
    return res.redirect(
      url.resolve(config.hosts.home, path.join("u", req.user._id.toString()))
    );
  } else {
    return redirectSignin(res);
  }
};

exports.account = function (req, res) {
  if (req.user) {
    return res.redirect(url.resolve(config.hosts.home, "account"));
  } else {
    return redirectSignin(res);
  }
};

exports.accountManage = function (req, res) {
  if (req.user) {
    return res.redirect(url.resolve(config.hosts.home, "account/manage"));
  } else {
    return redirectSignin(res);
  }
};

exports.messages = function (req, res) {
  if (req.user) {
    return res.redirect(url.resolve(config.hosts.home, "account?menu=2"));
  } else {
    return redirectSignin(res);
  }
};

exports.echuandan = function (req, res) {
  return res.redirect(config.hosts.home);
};

exports.signup = function (req, res) {
  return res.redirect(url.resolve(config.hosts.home, "signup.html"));
};

exports.signin = function (req, res) {
  return res.redirect(url.resolve(config.hosts.home, "signin.html"));
};

exports.listTabCount = function (req, res) {
  var topicTabCountData = memoryCache.get("topicTabCountData");
  if (!topicTabCountData) {
    var configTabs = config.tabs;
    var tabs = [];
    for (var i = 0, len = configTabs.length; i < len; i++) {
      tabs.push(configTabs[i][0]);
    }
    Topic.listTabCount(
      {
        tabs: tabs,
      },
      function (err, data) {
        var totalCount = 0;
        for (key in data) {
          totalCount += data[key];
        }
        data["all"] = totalCount;
        memoryCache.put("topicTabCountData", data, 120000);
        return res.json(data);
      }
    );
  } else {
    return res.json(topicTabCountData);
  }
};

function redirectSignin(res) {
  return res.redirect(url.resolve(config.hosts.home, "signin.html"));
}
