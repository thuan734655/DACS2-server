import admin from "firebase-admin";
import fs from "fs";
import "firebase/auth";
import "firebase/database";
import "firebase/firestore";
import "firebase/storage";
import "firebase/messaging";

const serviceAccount = JSON.parse(
  fs.readFileSync(
    "./config/dacs-3847d-firebase-adminsdk-oe6et-b9e5b4a683.json",
    "utf-8"
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://dacs-3847d-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();
export default db;
