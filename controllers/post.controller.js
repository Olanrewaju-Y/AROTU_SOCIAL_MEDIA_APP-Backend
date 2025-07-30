const Post = require('../models/Post');
const User = require('../models/User');

// Create post
exports.createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    const post = await Post.create({ user: req.user.id, content, image });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error creating post' });
  }
};

// Get my posts
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your posts' });
  }
};

// Get friends' posts
exports.getFriendsPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends');
    const ids = [req.user.id, ...user.friends.map(f => f._id)];
    const posts = await Post.find({ user: { $in: ids } }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching friends posts' });
  }
};

// Edit post
exports.editPostSettings = async (req, res) => {
  try {
    const { content, image, visibility } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    post.content = content ?? post.content;
    post.image = image ?? post.image;
    post.visibility = visibility ?? post.visibility;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error editing post' });
  }
};

// Get friends' feed
exports.getFriendsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends');
    const ids = [req.user.id, ...user.friends.map(f => f._id)];
    const feed = await Post.find({ user: { $in: ids } })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(feed);
  } catch (err) {
    res.status(500).json({ message: 'Error loading feed' });
  }
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all posts' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized to delete post' });

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const hasLiked = post.likes.includes(req.user.id);
    if (hasLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
    }
    await post.save();
    res.json({ liked: !hasLiked });
  } catch (err) {
    res.status(500).json({ message: 'Error toggling like' });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user.id, text });
    await post.save();
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// Get comments
exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments.user', 'username avatar');
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const post = await Post.findById(req.params.id);
    post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
    await post.save();
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// Get post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post' });
  }
};

// Get posts by hashtag
exports.getPostsByHashtag = async (req, res) => {
  try {
    const posts = await Post.find({ content: { $regex: `#${req.params.hashtag}`, $options: 'i' } })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error searching by hashtag' });
  }
};

// Search posts
exports.searchPosts = async (req, res) => {
  try {
    const query = req.query.q;
    const posts = await Post.find({ content: { $regex: query, $options: 'i' } })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
};

// Bookmark post
exports.bookmarkPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.bookmarks.includes(req.user.id)) {
      post.bookmarks.pull(req.user.id);
      await post.save();
      return res.json({ bookmarked: false });
    }
    post.bookmarks.push(req.user.id);
    await post.save();
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ message: 'Bookmark failed' });
  }
};

// Get bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'bookmarks',
      populate: { path: 'user', select: 'username avatar' }
    });
    res.json(user.bookmarks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookmarks' });
  }
};

// Unbookmark post
exports.unbookmarkPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.bookmarks.pull(req.user.id);
    await post.save();
    res.json({ message: 'Post unbookmarked' });
  } catch (err) {
    res.status(500).json({ message: 'Error unbookmarking post' });
  }
};

// Repost
exports.repost = async (req, res) => {
  try {
    const { content } = req.body; // optional user-provided quote/comment
    const original = await Post.findById(req.params.id);

    if (!original) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    // Prevent reposting a repost (optional, but good for content tree clarity)
    const rootOriginalId = original.originalPost ? original.originalPost : original._id;

    const repost = await Post.create({
      user: req.user.id,
      content: content || '', // User’s quote or comment, or empty if not provided
      originalPost: rootOriginalId // always point to the true original
    });

    res.status(201).json(repost);
  } catch (err) {
    console.error('Error in reposting:', err);
    res.status(500).json({ message: 'Error reposting' });
  }
};

// Get reposts of a post
exports.getReposts = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('originalPost', 'content user');

    if (!originalPost) {
      return res.status(404).json({ message: 'Original post not found' });
    }

    const reposts = await Post.find({ originalPost: originalPost._id })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(reposts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reposts' });
  }
};
