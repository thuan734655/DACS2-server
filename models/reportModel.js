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
  static async getAllReport(limit = 4, lastKey = null) {
    try {
      let query = db.ref("reports").orderByKey().limitToFirst(limit);

      // Nếu đã có khóa cuối cùng (lastKey), chỉ lấy dữ liệu sau khóa đó
      if (lastKey) {
        query = query.startAfter(lastKey);
      }

      const snapshot = await query.once("value");
      const reports = snapshot.val() || {};

      // Nếu không có báo cáo nào, trả về rỗng
      if (Object.keys(reports).length === 0) {
        return { success: true, reports: [], nextKey: null };
      }

      const result = await Promise.all(
        Object.entries(reports).map(async ([key, value]) => {
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

      // Lấy khóa cuối cùng để sử dụng cho phân trang tiếp theo
      const nextKey = Object.keys(reports).pop();

      return {
        success: true,
        reports: result,
        nextKey: nextKey || null, // null nếu không còn khóa nào
      };
    } catch (error) {
      console.error("Error getting reports:", error);
      return { success: false, error: error.message };
    }
  }

  static async deleteReport(idReport) {
    try {
      if (!idReport) {
        console.error("No report ID provided to delete");
        return { success: false, error: "No report ID provided to delete" };
      }

      const reportRef = db.ref(`reports/${idReport}`);
      const snapshot = await reportRef.once("value");

      if (snapshot.exists()) {
        await reportRef.remove();
        console.log(`Report with ID ${idReport} deleted successfully.`);
        return { success: true };
      } else {
        console.warn(`Report with ID ${idReport} not found.`);
        return { success: false, error: "Report not found" };
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      return { success: false, error: error.message };
    }
  }
}

export default ReportModel;
