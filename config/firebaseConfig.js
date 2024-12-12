import admin from "firebase-admin";
import fs from "fs";

// Đường dẫn đến tệp cấu hình Firebase Admin SDK
const serviceAccountPath =
  "./config/dacs-3847d-firebase-adminsdk-7b7t1-15038ac326.json";

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Service account file not found at ${serviceAccountPath}. Please ensure the file exists.`
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://dacs-3847d-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

export default db;

export const auth = admin.auth();
