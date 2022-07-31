var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/*
 * type:
 * reply: xx replied to your thread
 * reply2: xx replied to you in the thread
 * follow: xx followed you
 * at: xx @ got you
 */

var MessageSchema = new Schema({
  type: { type: String },
  master_id: { type: ObjectId },
  author_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  reply_id: { type: ObjectId },
  has_read: { type: Boolean, default: false },
  create_at: { type: Date, default: Date.now },
});

MessageSchema.index({ master_id: 1, has_read: -1, create_at: -1 });

mongoose.model("Message", MessageSchema);
