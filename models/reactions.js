import db from "../config/firebaseConfig.js";

class Reactions {
  static async addOrUpdateReaction(userId, commentId, type) {
    try {
      const reactionRef = db.ref(`reactions/comments/${commentId}/${userId}`);
      await reactionRef.set({
        type,
        timestamp: Date.now(),
        userId
      });
      return true;
    } catch (error) {
      console.error("Error adding/updating reaction:", error);
      throw error;
    }
  }

  static async removeReaction(userId, commentId) {
    try {
      await db.ref(`reactions/comments/${commentId}/${userId}`).remove();
      return true;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  }

  static async getReactionsForComment(commentId) {
    try {
      const snapshot = await db.ref(`reactions/comments/${commentId}`).once('value');
      const reactions = snapshot.val() || {};
      return Object.values(reactions);
    } catch (error) {
      console.error("Error getting reactions:", error);
      throw error;
    }
  }

  static async getReactionsForComments(commentIds) {
    try {
      const reactionsMap = {};
      await Promise.all(
        commentIds.map(async (commentId) => {
          const reactions = await this.getReactionsForComment(commentId);
          reactionsMap[commentId] = reactions;
        })
      );
      return reactionsMap;
    } catch (error) {
      console.error("Error getting reactions for comments:", error);
      throw error;
    }
  }
}

export default Reactions;
