import db from "../config/firebaseConfig.js";

class ReportModel {
  static async createReportPost(content) {
    try {
      const reportRef = db.ref("reports");
      const reportKey = reportRef.push().key;
      const newReport = {
        idReport: reportKey,
        postId: content.postId || "",
        commentId: content.commentId || "",
        replyId: content.replyId || "",
        reason: content.reason || "",
        type: content.type || "",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      await reportRef.child(reportKey).set(newReport);

      console.log("Report created successfully:", newReport);
      return { success: true, report: newReport };
    } catch (error) {
      console.error("Error creating report:", error);
      return { success: false, error: error.message };
    }
  }
  static async getAllReport() {
    try {
      const snapshot = await db.ref("reports").once("value");
      const reports = snapshot.val() || {};
      const result = await Promise.all(
        Object.entries(reports).map(async ([key, value]) => {
          console.log("value", value);
          let relatedData = null;

          if (value.type === "POST" && value.postId) {
            // Lấy thông tin chi tiết bài viết
            const postSnapshot = await db
              .ref(`posts/${value.postId}`)
              .once("value");
            relatedData = postSnapshot.val();
          } else if (value.type === "COMMENT" && value.commentId) {
            // Lấy thông tin chi tiết bình luận
            const commentSnapshot = await db
              .ref(`commentsList/${value.commentId}`)
              .once("value");
            relatedData = commentSnapshot.val();
          }

          // Trả về báo cáo kèm thông tin liên quan
          return {
            idReport: key,
            ...value,
            relatedData, // Thông tin chi tiết của post/comment
          };
        })
      );

      console.log(
        "Fetched all reports successfully with related data:",
        result
      );
      return { success: true, reports: result };
    } catch (error) {
      console.error("Error getting reports:", error);
      return { success: false, error: error.message };
    }
  }
}

export default ReportModel;
