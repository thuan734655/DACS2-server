import db from "../config/firebaseConfig.js";

class ReportModel {
  static async createReportPost(content) {
    try {
      const reportRef = db.ref("reports");
      const reportKey = reportRef.push().key;

      const newReport = {
        id: reportKey,
        content,
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
}

export default ReportModel;
