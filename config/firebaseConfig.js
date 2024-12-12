import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
  // Thử đọc từ biến môi trường FIREBASE_ADMIN_CONFIG
  if (process.env.FIREBASE_ADMIN_CONFIG) {
    serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);
  } else {
    // Fallback to local JSON file for development
    const fs = await import('fs');
    const serviceAccountPath = "./config/dacs-3847d-firebase-adminsdk-7b7t1-15038ac326.json";
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Neither FIREBASE_ADMIN_CONFIG environment variable nor service account file at ${serviceAccountPath} found.`
      );
    }
    
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dacs-3847d-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  throw error;
}

const db = admin.database();

export default db;
export const auth = admin.auth();
