var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  upvotes: {type: Number, default: 0},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Posts' }
});

CommentSchema.methods.upvote = function(cb){
	this.upvotes +=1;
	this.save(cb);
}
var Comment = mongoose.model('Comments', CommentSchema);
module.exports = Comment;