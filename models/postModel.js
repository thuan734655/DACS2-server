import db from "../config/firebaseConfig.js";
import UserModel from "./userModel.js";

class Post {
  // Tạo bài viết mới
  static async createPost(postData) {
    try {
      const postRef = db.ref("posts").push();
      await postRef.set({ ...postData, comments: [] });
      db.ref(`posts/${postRef.key}`).update({ postId: postRef.key });
      return postRef.key;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  // Thêm bình luận mới vào bài viết
  static async addComment(commentData) {
    try {
      const { postId, ...commentInfo } = commentData;
      console.log(postId, "gse");
      const commentRef = db.ref("commentsList").push();
      const commentId = commentRef.key;

      await commentRef.set({
        ...commentInfo,
        postId,
        replies: [],
        timestamp: Date.now(),
      });

      await db
        .ref(`posts/${postId}/comments`)
        .transaction((comments) => [...(comments || []), commentId]);

      return commentId;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Trả lời bình luận
  static async replyToComment({ commentId, newReplyData }) {
    console.log("replyToCommen", commentId);
    try {
      const replyRef = db.ref("replies").push();
      const replyId = replyRef.key;

      await replyRef.set({ ...newReplyData, replyId, commentId });

      await db
        .ref(`commentsList/${commentId}/replies`)
        .transaction((replies) => [...(replies || []), replyId]);

      return replyId;
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  }

  // Trả lời một phản hồi (reply to reply)
  static async replyToReply({ replyId, newReplyData }) {
    try {
      const replyRef = db.ref("replies").push();
      const newReplyId = replyRef.key;

      await replyRef.set({ ...newReplyData, replyId: newReplyId });

      await db
        .ref(`replies/${replyId}/replies`)
        .transaction((replies) => [...(replies || []), newReplyId]);

      return newReplyId;
    } catch (error) {
      console.error("Error replying to reply:", error);
      throw error;
    }
  }
  // Lấy danh sách người đã thích bài viết
  static async getLikes(postId) {
    try {
      const postRef = db.ref("posts").child(postId).child("likedBy");
      const snapshot = await postRef.once("value");

      const likes = snapshot.val() || {};
      console.log(likes);
      return likes;
    } catch (error) {
      throw new Error("Error fetching likes: " + error.message);
    }
  }
  // Thích một bài viết với emoji
  static async likePost(postId, emoji, idUser) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const userLikeRef = postRef.child(`likedBy/${idUser}`);
      const currentEmoji = (await userLikeRef.once("value")).val();

      if (currentEmoji === emoji) return "duplicate";

      await postRef
        .child(`likes/${emoji}`)
        .transaction((count) => (count || 0) + 1);

      if (currentEmoji) {
        await postRef
          .child(`likes/${currentEmoji}`)
          .transaction((count) => Math.max((count || 1) - 1, 0));
      }

      await userLikeRef.set(emoji);

      const likesSnapshot = await postRef.child("likes").once("value");
      return likesSnapshot.val() || {};
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  }

  // Xóa lượt thích
  static async deleteLike(userId, postId, emoji) {
    try {
      const postRef = db.ref(`posts/${postId}`);
      const userLikeRef = postRef.child(`likedBy/${userId}`);
      const currentEmoji = (await userLikeRef.once("value")).val();

      if (currentEmoji === emoji) {
        await userLikeRef.remove();
        await postRef
          .child(`likes/${emoji}`)
          .transaction((count) => (count > 1 ? count - 1 : null));
      }
    } catch (error) {
      console.error("Error deleting like:", error);
      throw error;
    }
  }

  static async getAllPosts(
    userId,
    fetchedPostIdsFromClient,
    page = 1,
    limit = 10
  ) {
    try {
      // Lấy tất cả các bài viết từ Firebase
      const postsSnapshot = await db
        .ref("posts")
        .orderByChild("createdAt")
        .once("value");
      const posts = postsSnapshot.val() || {};
      const infoPost = {};

      // Lấy danh sách bạn bè của người dùng
      const friendsList = await UserModel.getFriendsList(userId);

      // Chuyển đổi object posts thành mảng và sắp xếp theo thời gian tạo (mới nhất trước)
      const sortedPosts = Object.entries(posts).sort(
        (a, b) => b[1].createdAt - a[1].createdAt
      );

      // Tính toán vị trí bắt đầu và kết thúc cho phân trang
      const start = (page - 1) * limit;
      const end = start + limit;

      // Lọc các bài viết đã fetch trước đó
      const newPosts = sortedPosts.filter(
        ([postId]) => !fetchedPostIdsFromClient.includes(postId)
      );

      // Duyệt qua các bài viết mới trong phạm vi phân trang
      for (let i = start; i < end && i < newPosts.length; i++) {
        const [postId, post] = newPosts[i];

        // Kiểm tra quyền riêng tư bài viết
        if (
          post.privacy === "public" ||
          (post.privacy === "friends" && friendsList.includes(post.idUser))
        ) {
          const groupedLikes = {}; // Chứa thông tin like theo emoji
          const infoUserList = {}; // Thông tin người dùng
          let commentCount = 0; // Số lượng bình luận
          let replyCount = 0; // Số lượng phản hồi

          // Xử lý thông tin lượt thích (like) theo emoji
          if (post.likedBy) {
            for (const [userId, emoji] of Object.entries(post.likedBy)) {
              if (!groupedLikes[emoji]) groupedLikes[emoji] = [];
              groupedLikes[emoji].push(userId);
            }
          }

          // Lấy thông tin người dùng của bài viết
          if (post.idUser) {
            const [user] = await UserModel.getInfoByIdUser(post.idUser);
            infoUserList[post.idUser] = { id: post.idUser, ...user[0] };
          }

          // Hàm đệ quy để đếm số lượng phản hồi (replies)
          const countReplies = async (replyIds) => {
            if (!replyIds || replyIds.length === 0) return 0;

            const replies = await Promise.all(
              replyIds.map(async (replyId) => {
                const replySnapshot = await db
                  .ref(`replies/${replyId}`)
                  .once("value");
                const reply = replySnapshot.val();
                if (reply) {
                  // Đệ quy để đếm các replies con của reply hiện tại
                  const nestedReplies = await countReplies(reply.replies || []);
                  return nestedReplies + 1; // Đếm reply hiện tại
                }
                return 0;
              })
            );

            // Trả về tổng số reply
            return replies.reduce((total, count) => total + count, 0);
          };

          // Đếm số lượng comment và reply của từng comment
          if (Array.isArray(post.comments)) {
            commentCount = post.comments.length; // Số lượng bình luận

            // Đếm số lượng replies cho từng bình luận
            for (const commentId of post.comments) {
              const commentSnapshot = await db
                .ref(`commentsList/${commentId}`)
                .once("value");
              const comment = commentSnapshot.val();
              if (comment) {
                // Đếm replies cho bình luận
                const replies = await countReplies(comment.replies || []);
                replyCount += replies;
              }
            }
          }

          // Đưa dữ liệu vào infoPost
          infoPost[postId] = {
            post,
            groupedLikes,
            infoUserList,
            commentCount: commentCount + replyCount,
          };
        }
      }

      console.log("Fetched posts", infoPost);
      // Trả về infoPost chứa các bài viết hợp lệ đã phân trang
      return {
        posts: infoPost,
        hasMore: newPosts.length > end,
      };
    } catch (error) {
      console.error("Error getting all posts:", error);
      throw error;
    }
  }
  static async getAllUserPostsAndShares(
    userId,
    fetchedPostIdsFromClient,
    page = 1,
    limit = 10
  ) {
    try {
      // Lấy tất cả các bài viết từ Firebase
      const postsSnapshot = await db
        .ref("posts")
        .orderByChild("createdAt")
        .once("value");
      const posts = postsSnapshot.val() || {};

      // Lấy danh sách bạn bè của người dùng
      const friendsList = await UserModel.getFriendsList(userId);

      // Lấy tất cả các bài viết chia sẻ của người dùng
      const sharesPostSnapshot = await db.ref("shares-post").once("value");
      const sharesPosts = sharesPostSnapshot.val() || {};

      const infoPost = {};

      // Chuyển đổi object posts thành mảng và sắp xếp theo thời gian tạo (mới nhất trước)
      const sortedPosts = Object.entries(posts).sort(
        (a, b) => b[1].createdAt - a[1].createdAt
      );
      const sortedSharesPosts = Object.entries(sharesPosts).sort(
        (a, b) => b[1].sharedAt - a[1].sharedAt
      );

      // Tính toán vị trí bắt đầu và kết thúc cho phân trang
      const start = (page - 1) * limit;
      const end = start + limit;

      // Lọc các bài viết đã fetch trước đó
      const newPosts = sortedPosts.filter(
        ([postId]) => !fetchedPostIdsFromClient.includes(postId)
      );
      const newSharesPosts = sortedSharesPosts.filter(
        ([sharePostId]) => !fetchedPostIdsFromClient.includes(sharePostId)
      );

      // Duyệt qua các bài viết mới trong phạm vi phân trang
      for (let i = start; i < end && i < newPosts.length; i++) {
        const [postId, post] = newPosts[i];

        // Kiểm tra quyền riêng tư bài viết
        if (
          post.privacy === "public" ||
          (post.privacy === "friends" && friendsList.includes(post.idUser))
        ) {
          const groupedLikes = {}; // Chứa thông tin like theo emoji
          const infoUserList = {}; // Thông tin người dùng
          let commentCount = 0; // Số lượng bình luận
          let replyCount = 0; // Số lượng phản hồi

          // Xử lý thông tin lượt thích (like) theo emoji
          if (post.likedBy) {
            for (const [userId, emoji] of Object.entries(post.likedBy)) {
              if (!groupedLikes[emoji]) groupedLikes[emoji] = [];
              groupedLikes[emoji].push(userId);
            }
          }

          // Lấy thông tin người dùng của bài viết
          if (post.idUser) {
            const [user] = await UserModel.getInfoByIdUser(post.idUser);
            infoUserList[post.idUser] = { id: post.idUser, ...user[0] };
          }

          // Đếm số lượng comment và reply
          if (Array.isArray(post.comments)) {
            commentCount = post.comments.length; // Số lượng bình luận
            for (const commentId of post.comments) {
              const commentSnapshot = await db
                .ref(`commentsList/${commentId}`)
                .once("value");
              const comment = commentSnapshot.val();
              if (comment) {
                const replies = await countReplies(comment.replies || []);
                replyCount += replies;
              }
            }
          }

          // Đưa dữ liệu vào infoPost
          infoPost[postId] = {
            post,
            groupedLikes,
            infoUserList,
            commentCount: commentCount + replyCount,
          };
        }
      }

      // Duyệt qua các bài viết chia sẻ mới trong phạm vi phân trang
      for (let i = start; i < end && i < newSharesPosts.length; i++) {
        const [sharePostId, sharePost] = newSharesPosts[i];

        // Kiểm tra quyền riêng tư bài viết chia sẻ
        if (
          sharePost.privacy === "public" ||
          (sharePost.privacy === "friends" &&
            friendsList.includes(sharePost.originalUserId))
        ) {
          const groupedLikes = {}; // Chứa thông tin like theo emoji
          const infoUserList = {}; // Thông tin người dùng
          let commentCount = 0; // Số lượng bình luận
          let replyCount = 0; // Số lượng phản hồi

          // Xử lý thông tin lượt thích (like) theo emoji
          if (sharePost.likedBy) {
            for (const [userId, emoji] of Object.entries(sharePost.likedBy)) {
              if (!groupedLikes[emoji]) groupedLikes[emoji] = [];
              groupedLikes[emoji].push(userId);
            }
          }

          // Lấy thông tin người dùng của bài viết chia sẻ
          if (sharePost.originalUserId) {
            const [user] = await UserModel.getInfoByIdUser(
              sharePost.originalUserId
            );
            infoUserList[sharePost.originalUserId] = {
              id: sharePost.originalUserId,
              ...user[0],
            };
          }

          // Đếm số lượng comment và reply
          if (Array.isArray(sharePost.comments)) {
            commentCount = sharePost.comments.length;
            for (const commentId of sharePost.comments) {
              const commentSnapshot = await db
                .ref(`commentsList/${commentId}`)
                .once("value");
              const comment = commentSnapshot.val();
              if (comment) {
                const replies = await countReplies(comment.replies || []);
                replyCount += replies;
              }
            }
          }

          // Đưa dữ liệu vào infoPost
          infoPost[sharePostId] = {
            post: sharePost.sharedPostContent,
            groupedLikes,
            infoUserList,
            commentCount: commentCount + replyCount,
          };
        }
      }

      // Trả về tất cả bài viết và bài viết chia sẻ
      return {
        posts: infoPost,
        hasMore: newPosts.length > end || newSharesPosts.length > end,
      };
    } catch (error) {
      console.error("Error getting all user posts and shares:", error);
      throw error;
    }
  }

  // Hàm đệ quy để đếm số lượng phản hồi (replies)
  async countReplies(replyIds) {
    if (!replyIds || replyIds.length === 0) return 0;

    const replies = await Promise.all(
      replyIds.map(async (replyId) => {
        const replySnapshot = await db.ref(`replies/${replyId}`).once("value");
        const reply = replySnapshot.val();
        if (reply) {
          const nestedReplies = await countReplies(reply.replies || []);
          return nestedReplies + 1;
        }
        return 0;
      })
    );

    return replies.reduce((total, count) => total + count, 0);
  }

  static async getPostById(postId) {
    try {
      // Lấy dữ liệu của bài viết từ "posts/{postId}"
      const postSnapshot = await db.ref(`posts/${postId}`).once("value");
      const post = postSnapshot.val();
      if (!post) return null;

      const groupedLikes = {};
      const infoUserList = {};
      let commentCount = 0; // Số lượng bình luận
      let replyCount = 0; // Số lượng phản hồi

      // Xử lý thông tin lượt thích (like) theo emoji
      if (post.likedBy) {
        for (const [userId, emoji] of Object.entries(post.likedBy)) {
          if (!groupedLikes[emoji]) groupedLikes[emoji] = [];
          groupedLikes[emoji].push(userId);
        }
      }

      // Lấy thông tin người dùng của bài viết
      if (post.idUser) {
        const [user] = await UserModel.getInfoByIdUser(post.idUser);
        infoUserList[post.idUser] = { id: post.idUser, ...user[0] };
      }

      // Hàm đệ quy để đếm số lượng phản hồi (replies)
      const countReplies = async (replyIds) => {
        if (!replyIds || replyIds.length === 0) return 0;

        const replies = await Promise.all(
          replyIds.map(async (replyId) => {
            const replySnapshot = await db
              .ref(`replies/${replyId}`)
              .once("value");
            const reply = replySnapshot.val();
            if (reply) {
              // Đệ quy để đếm các replies con của reply hiện tại
              const nestedReplies = await countReplies(reply.replies || []);
              return nestedReplies + 1; // Đếm reply hiện tại
            }
            return 0;
          })
        );

        // Trả về tổng số reply
        return replies.reduce((total, count) => total + count, 0);
      };

      // Đếm số lượng comment và reply của từng comment
      if (Array.isArray(post.comments)) {
        commentCount = post.comments.length; // Số lượng bình luận

        // Đếm số lượng replies cho từng bình luận
        for (const commentId of post.comments) {
          const commentSnapshot = await db
            .ref(`commentsList/${commentId}`)
            .once("value");
          const comment = commentSnapshot.val();
          if (comment) {
            // Đếm replies cho bình luận
            const replies = await countReplies(comment.replies || []);
            replyCount += replies;
          }
        }
      }

      const infoPost = {
        post,
        groupedLikes,
        infoUserList,
        commentCount: commentCount + replyCount,
      };
      console.log(infoPost);
      return infoPost;
    } catch (error) {
      console.error("Error getting post by ID:", error);
      throw error;
    }
  }

  // Lấy bình luận của bài viết
  static async getComments(postId) {
    try {
      // Lấy danh sách ID của các bình luận cho bài viết từ "posts/{postId}/comments"
      const commentIds =
        (await db.ref(`posts/${postId}/comments`).once("value")).val() || [];
      // Hàm đệ quy để lấy tất cả các trả lời của bình luận
      const getRepliesRecursively = async (replyIds) => {
        try {
          // Nếu không có trả lời, trả về mảng rỗng
          if (!replyIds || replyIds.length === 0) return [];

          // Dùng Promise.all để xử lý tất cả các reply đồng thởi
          const replies = await Promise.all(
            replyIds.map(async (replyId) => {
              // Lấy dữ liệu của từng reply từ "replies/{replyId}"
              const replySnapshot = await db
                .ref(`replies/${replyId}`)
                .once("value");

              const reply = replySnapshot.val();

              // Lấy thông tin người dùng của reply
              const userInfo = await UserModel.getInfoByIdUser(reply.idUser);
              console.log(userInfo, reply, 124);
              reply.user = userInfo[0]; // Gán thông tin người dùng vào reply

              // Nếu reply có trả lời con (nested replies), gọi đệ quy để lấy các trả lời con
              if (reply.replies && reply.replies.length > 0) {
                reply.replies = await getRepliesRecursively(reply.replies); // Gọi đệ quy để lấy các trả lời con
              }

              return reply; // Trả về reply với trả lời con nếu có
            })
          );

          return replies; // Trả về mảng các reply đã được xử lý
        } catch (error) {
          console.error("Error getting replies:", error);
          throw error;
        }
      };
      // Sử dụng Promise.all để xử lý tất cả các comment đồng thởi
      return await Promise.all(
        commentIds.map(async (commentId) => {
          // Lấy dữ liệu của bình luận từ "commentsList/{commentId}"
          const commentSnapshot = await db
            .ref(`commentsList/${commentId}`)
            .once("value");

          const comment = commentSnapshot.val();

          // Lấy thông tin người dùng từ cơ sở dữ liệu qua idUser
          const userInfo = await UserModel.getInfoByIdUser(comment.idUser);
          comment.user = userInfo[0]; // Gán thông tin người dùng vào bình luận

          // Nếu bình luận có trả lời, gọi đệ quy để lấy các trả lời (replies)
          if (comment.replies && comment.replies.length > 0) {
            comment.replies = await getRepliesRecursively(comment.replies); // Gọi hàm đệ quy để lấy các trả lời
          }

          comment.commentId = commentId;

          return comment; // Trả về bình luận đã có thông tin người dùng và trả lời
        })
      );
    } catch (error) {
      console.error("Error getting comments:", error);
      throw error;
    }
  }

  // Lấy trả lời của bình luận
  static async getReplies(commentId) {
    try {
      const replyIds =
        (
          await db.ref(`commentsList/${commentId}/replies`).once("value")
        ).val() || [];
      return await Promise.all(
        replyIds.map(async (replyId) => {
          const replySnapshot = await db
            .ref(`replies/${replyId}`)
            .once("value");
          return replySnapshot.val();
        })
      );
    } catch (error) {
      console.error("Error getting replies:", error);
      throw error;
    }
  }

  // Share bài viết lên profile, chỉ lưu vào "shares-post"
  static async sharePost(originalPostId, idUser, shareText) {
    try {
      const originalPostRef = db.ref(`posts/${originalPostId}`);
      const snapshot = await originalPostRef.once("value");
      const originalPost = snapshot.val();

      if (!originalPost) throw new Error("Post không tồn tại");

      const [originalUser] = await UserModel.getInfoByIdUser(
        originalPost.idUser
      );
      const userInfo = { ...originalUser };

      const sharePostRef = db.ref("shares-post").push();
      const sharePostData = {
        originalPostId,
        sharedPostId: sharePostRef.key,
        originalUserId: originalPost.idUser,
        sharedBy: idUser,
        shareText: shareText || "",
        sharedAt: Date.now(),
        type: "profile",
        status: "active",
        sharedPostContent: {
          text: originalPost.text,
          mediaUrls: originalPost.mediaUrls || [],
          textColor: originalPost.textColor,
          backgroundColor: originalPost.backgroundColor,
          originalUser: {
            fullName: userInfo[0].fullName,
            avatar: userInfo[0].avatar,
          },
        },
        interactions: {
          likes: 0,
          comments: 0,
          shares: 0,
        },
      };

      await sharePostRef.set(sharePostData);
      await originalPostRef
        .child("shares")
        .transaction((shares) => (shares || 0) + 1);

      return { shareId: sharePostRef.key };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin share
  static async getShareInfo(shareId) {
    try {
      const shareRef = db.ref(`shares/${shareId}`);
      const snapshot = await shareRef.once("value");
      const share = snapshot.val();

      if (!share) {
        throw new Error("Share không tồn tại");
      }

      return share;
    } catch (error) {
      console.error("Error getting share info:", error);
      throw error;
    }
  }

  // Lấy danh sách bài viết được share với user
  static async getSharedPosts(userId) {
    try {
      const sharesRef = db.ref("shares");
      const snapshot = await sharesRef
        .orderByChild("sharedWith")
        .equalTo(userId)
        .once("value");

      const shares = [];
      const sharesData = snapshot.val() || {};

      for (const shareId in sharesData) {
        const share = sharesData[shareId];
        if (share.status === "active") {
          // Lấy thông tin bài viết được share
          const sharedPostRef = db.ref(`posts/${share.sharedPostId}`);
          const sharedPostSnapshot = await sharedPostRef.once("value");
          const sharedPost = sharedPostSnapshot.val();

          if (sharedPost) {
            // Lấy thông tin người share
            const [sharedByUser] = await UserModel.getInfoByIdUser(
              share.sharedBy
            );

            shares.push({
              shareId,
              ...share,
              post: sharedPost,
              sharedByUser,
            });
          }
        }
      }

      return shares;
    } catch (error) {
      console.error("Error getting shared posts:", error);
      throw error;
    }
  }

  // Hủy share bài viết
  static async revokeShare(shareId) {
    try {
      const shareRef = db.ref(`shares/${shareId}`);
      const snapshot = await shareRef.once("value");
      const share = snapshot.val();

      if (!share) {
        throw new Error("Share không tồn tại");
      }

      // Cập nhật trạng thái share
      await shareRef.update({
        status: "revoked",
        revokedAt: Date.now(),
      });

      // Giảm số lượt share của bài viết gốc
      const originalPostRef = db.ref(`posts/${share.postId}`);
      await originalPostRef
        .child("shares")
        .transaction((shares) => Math.max((shares || 0) - 1, 0));

      return true;
    } catch (error) {
      console.error("Error revoking share:", error);
      throw error;
    }
  }

  // Lấy danh sách bài viết được share bởi user
  static async getSharedPostsByUser(idUser) {
    try {
      const sharesRef = db.ref("shares-post");
      const snapshot = await sharesRef
        .orderByChild("sharedBy")
        .equalTo(idUser)
        .once("value");

      const shares = [];
      snapshot.forEach((childSnapshot) => {
        shares.push({
          shareId: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      return shares;
    } catch (error) {
      console.error("Error getting shared posts:", error);
      throw error;
    }
  }

  // Lấy danh sách shares của một bài viết
  static async getPostShares(postId) {
    try {
      const sharesRef = db.ref("shares-post");
      const snapshot = await sharesRef
        .orderByChild("originalPostId")
        .equalTo(postId)
        .once("value");

      const shares = [];
      snapshot.forEach((childSnapshot) => {
        shares.push({
          shareId: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      return shares;
    } catch (error) {
      console.error("Error getting post shares:", error);
      throw error;
    }
  }

  // Cập nhật tương tác trên bài share
  static async updateShareInteractions(shareId, type, value) {
    try {
      const shareRef = db.ref(`shares-post/${shareId}/interactions/${type}`);
      await shareRef.transaction((current) => (current || 0) + value);
    } catch (error) {
      console.error("Error updating share interactions:", error);
      throw error;
    }
  }

  // Lấy danh sách bài viết của user được share bởi người khác
  static async getPostsSharedByOthers(userId) {
    try {
      const sharesRef = db.ref("shares-post");
      const snapshot = await sharesRef
        .orderByChild("originalUserId")
        .equalTo(userId)
        .once("value");

      const shares = [];
      const posts = [];
      const users = new Set();

      snapshot.forEach((childSnapshot) => {
        const share = childSnapshot.val();
        if (share.sharedBy !== userId) {
          // Chỉ lấy bài share bởi người khác
          shares.push({
            ...share,
            shareId: childSnapshot.key,
          });
          users.add(share.sharedBy);
          users.add(share.originalUserId);
        }
      });

      // Lấy thông tin user
      const userInfoList = {};
      await Promise.all(
        Array.from(users).map(async (uid) => {
          const userSnapshot = await db.ref(`users/${uid}`).once("value");
          userInfoList[uid] = userSnapshot.val();
        })
      );

      // Lấy thông tin bài viết gốc
      await Promise.all(
        shares.map(async (share) => {
          const postSnapshot = await db
            .ref(`posts/${share.originalPostId}`)
            .once("value");

          const post = postSnapshot.val();
          if (post) {
            // Lấy số lượt like và comment
            const likesSnapshot = await db
              .ref(`likes-post/${share.originalPostId}`)
              .once("value");
            const commentsSnapshot = await db
              .ref(`comments-post/${share.originalPostId}`)
              .once("value");

            posts.push({
              post: {
                ...post,
                postId: share.originalPostId,
              },
              sharedAt: share.sharedAt,
              sharedBy: userInfoList[share.sharedBy],
              infoUserList: userInfoList,
              groupedLikes: likesSnapshot.val() || {},
              commentCount: commentsSnapshot.numChildren() || 0,
            });
          }
        })
      );

      return posts.sort((a, b) => b.sharedAt - a.sharedAt);
    } catch (error) {
      console.error("Error in getPostsSharedByOthers:", error);
      throw error;
    }
  }
}

export default Post;
