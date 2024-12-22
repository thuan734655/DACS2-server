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
      console.log("All reports:", reports);
      return Object.values(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      throw error;
    }
  }
}

export default ReportModel;
