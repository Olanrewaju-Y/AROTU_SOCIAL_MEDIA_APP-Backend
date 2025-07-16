const Post = require('../models/Post');
const User = require('../models/User');

// Create post
exports.createPost = async (req, res) => {
  const { content, image } = req.body;
  const post = await Post.create({ user: req.user.id, content, image });
  res.status(201).json(post);
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

// update post
exports.updatePost = async (req, res) => {
  const { content, image } = req.body;
  const post = await Post.findByIdAndUpdate(req.params.id, { content, image }, { new: true })
    .populate('user', 'username avatar');
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json(post);
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
