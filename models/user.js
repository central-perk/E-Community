var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var utility = require("utility");

var UserSchema = new Schema({
  name: { type: String },
  loginname: { type: String },
  pass: { type: String },
  email: {
    type: String,
    sparse: true,
  },
  url: { type: String },
  profile_image_url: { type: String },
  location: { type: String },
  signature: { type: String },
  profile: { type: String },
  weibo: { type: String },
  avatar: { type: String },
  githubId: { type: String },
  githubUsername: { type: String },
  githubAccessToken: { type: String },
  is_block: { type: Boolean, default: false },

  score: { type: Number, default: 0 },
  topic_count: { type: Number, default: 0 },
  reply_count: { type: Number, default: 0 },
  follower_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  collect_tag_count: { type: Number, default: 0 },
  collect_topic_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  is_star: { type: Boolean },
  level: { type: String },
  active: { type: Boolean, default: false },

  receive_reply_mail: { type: Boolean, default: false },
  receive_at_mail: { type: Boolean, default: false },
  from_wp: { type: Boolean },

  retrieve_time: { type: Number },
  retrieve_key: { type: String },

  accessToken: { type: String },
});

UserSchema.virtual("avatar_url").get(function () {
  // var url = this.avatar || ('//gravatar.com/avatar/' + utility.md5(this.email.toLowerCase()) + '?size=48');

  // // www.gravatar.com is walled
  // url = url.replace('//www.gravatar.com', '//gravatar.com');

  // // Make the protocol adaptive protocol
  // if (url.indexOf('http:') === 0) {
  // url = url. slice(5);
  // }

  // // If it is github's avatar, limit the size
  // if (url.indexOf('githubusercontent') !== -1) {
  // url += '&s=120';
  // }
  var url = "http://s.echuandan.com/head/chrome.png?imageView2/0/w/40";
  return this.avatar || url;
});

UserSchema.virtual("isAdvanced").get(function () {
  // Points above 700 are considered advanced users
  return this.score > 700 || this.is_star;
});

UserSchema.index({ loginname: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ score: -1 });
UserSchema.index({ githubId: 1 });
UserSchema.index({ accessToken: 1 });

mongoose.model("User", UserSchema);
