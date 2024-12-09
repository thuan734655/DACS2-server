import admin from "firebase-admin";
import fs from "fs";
import "firebase/auth";
import "firebase/database";
import "firebase/firestore";
import "firebase/storage";
import "firebase/messaging";
const serviceAccount = JSON.parse(
  fs.readFileSync("./config/dacs-3847d-firebase-adminsdk-oe6et-163aecaa8b.json")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://dacs-3847d-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const db = admin.database();
export default db;
