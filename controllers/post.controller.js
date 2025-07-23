const Post = require('../models/Post');
const User = require('../models/User');

// Create post
exports.createPost = async (req, res) => {
  const { content, image } = req.body;
  const post = await Post.create({ user: req.user.id, content, image });
  res.status(201).json(post);
};

// Get my Posts
exports.getMyPosts = async (req, res) => {
  const posts = await Post.find({ user: req.user.id });
  res.json(posts);
};

// Get friends post
exports.getFriendsPosts = async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends');
  const ids = [req.user.id, ...user.friends.map(f => f._id)];
  const posts = await Post.find({ user: { $in: ids } });
  res.json(posts);
};

// Edit Post settings
exports.editPostSettings = async (req, res) => {
  const { content, image, visibility } = req.body;
  const post = await Post.findByIdAndUpdate(req.params.id, { content, image, visibility }, { new: true });
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json(post);
};

// Get feed (user + friends)
exports.getFriendsFeed = async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends');
  const ids = [req.user.id, ...user.friends.map(f => f._id)];
  const feed = await Post.find({ user: { $in: ids } })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(feed);
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  const posts = await Post.find({})
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(posts);
};

// delete post
exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  await post.remove();
  res.json({ message: 'Post deleted successfully' });
};

// Like or unlike
exports.toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const alreadyLiked = post.likes.includes(req.user.id);
  if (alreadyLiked) {
    post.likes.pull(req.user.id);
  } else {
    post.likes.push(req.user.id);
  }
  await post.save();
  res.json({ liked: !alreadyLiked });
};

// Add comment
exports.addComment = async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);
  post.comments.push({ user: req.user.id, text });
  await post.save();
  res.json(post.comments[post.comments.length - 1]);
};

// Get post by ID
exports.getPostById = async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'username avatar')
    .populate('comments.user', 'username avatar');
  res.json(post);
};

// Get posts by user ID
exports.getPostsByUserId = async (req, res) => {
  const posts = await Post.find({ user: req.params.id })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(posts);
};

// Get posts by hashtag
exports.getPostsByHashtag = async (req, res) => {
  const posts = await Post.find({ content: { $regex: req.params.hashtag, $options: 'i' } })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(posts);
};

// Get posts by room ID
exports.getPostsByRoomId = async (req, res) => {
  const posts = await Post.find({ room: req.params.id })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(posts);
};

// Get posts by search query
exports.searchPosts = async (req, res) => {
  const query = req.query.q;
  const posts = await Post.find({
    content: { $regex: query, $options: 'i' }
  }).populate('user', 'username avatar').sort({ createdAt: -1 });
  res.json(posts);
};

// Bookmark post
exports.bookmarkPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const alreadyBookmarked = post.bookmarks.includes(req.user.id);
  if (alreadyBookmarked) {
    post.bookmarks.pull(req.user.id);
  } else {
    post.bookmarks.push(req.user.id);
  }
  await post.save();
  res.json({ bookmarked: !alreadyBookmarked });
};

// Get bookmarks
exports.getBookmarks = async (req, res) => {
  const user = await User.findById(req.user.id).populate('bookmarks');
  res.json(user.bookmarks);
};

// Unbookmark post
exports.unbookmarkPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.bookmarks.pull(req.user.id);
  await post.save();
  res.json({ message: 'Post unbookmarked' });
};

// Comments
exports.getComments = async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('comments.user', 'username avatar');
  res.json(post.comments);
};

// delete comment
exports.deleteComment = async (req, res) => {
  const { commentId } = req.body;
  const post = await Post.findById(req.params.id);
  post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
  await post.save();
  res.json({ message: 'Comment deleted successfully' });
};

// repost
exports.repost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  const repost = await Post.create({
    user: req.user.id,
    content: `Repost of ${post._id}`,
    originalPost: post._id
  });
  res.status(201).json(repost);
};


