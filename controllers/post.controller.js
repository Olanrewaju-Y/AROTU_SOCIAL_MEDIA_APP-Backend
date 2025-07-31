const mongoose = require('mongoose');

const Post = require('../models/Post');
const User = require('../models/User');

// Create post
exports.createPost = async (req, res) => {
  try {
    const { content, image, visibility } = req.body;
    const post = await Post.create({ user: req.user.id, content, image, visibility });
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
        // Option 1: Basic validation/check for potential issues
        // Ensure Post and User models are correctly imported/available in this context
        if (!mongoose.models.Post || !mongoose.models.User) {
            console.error("Mongoose models 'Post' or 'User' are not defined. Check your model imports.");
            return res.status(500).json({ message: 'Server configuration error: Models not found.' });
        }

        const posts = await Post.find({}) // Added an empty filter object for clarity, though optional
            .populate({
                path: 'user',
                select: 'username avatar visibility', // Select specific fields
                // Optionally, handle cases where the referenced user might be null/deleted
                // strictPopulate: false // Allows population even if reference is missing/invalid (Mongoose 7+)
            })
            .populate({
                path: 'comments.user', // Path to the user field within the comments array
                select: 'username avatar', // Select specific fields for comment authors
                // strictPopulate: false // Allows population even if reference is missing/invalid (Mongoose 7+)
            })
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        // Before sending, you might want to filter posts based on user visibility
        // For example, if only 'public' posts should be seen by everyone, or specific logic for 'private'
        const filteredPosts = posts.filter(post => {
            // Assuming 'visibility' is a field on the 'Post' model itself,
            // or if it's derived from the 'user' who created the post.
            // Let's assume 'visibility' is a field directly on the Post schema
            // and that you want to filter out 'private' posts unless some condition is met.

            // Example: Only show public posts to unauthenticated users,
            // or filter based on post.visibility if it's on the Post model
            // For now, this example will fetch all and then filter IF 'visibility' is on Post.
            // If 'visibility' is only on the User, and you want to filter User's private posts
            // then you need to adjust your Post model or filter logic differently.

            // A more common scenario is that the 'Post' itself has a 'visibility' property.
            // If the post has a 'visibility' field, you'd check it here.
            // For instance, if you only want to return "public" posts to this endpoint:
            // if (post.visibility && post.visibility === 'public') {
            //     return true;
            // }
            // return false;

            // Given your user populate includes 'visibility', it implies user-level visibility.
            // If a post's visibility depends on the creating user's settings (e.g., user profile is private)
            // you'd need more complex logic.
            // For now, if 'visibility' is a field on the Post, uncomment the below or adjust:
            // return post.visibility === 'public'; // Example: only show public posts
            return true; // Return all posts for now unless specific filtering is needed
        });


        res.status(200).json(filteredPosts);

    } catch (error) {
        console.error('Error in getAllPosts:', error); // Log the specific error for debugging
        // Check for specific Mongoose errors if possible
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format in population reference.', error: error.message });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error during data retrieval.', error: error.message });
        }
        res.status(500).json({ message: 'Server Error: Failed to retrieve posts.', error: error.message });
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
