import admin from "firebase-admin";

import serviceAccount from "./dacs-3847d-firebase-adminsdk-oe6et-b9e5b4a683.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://dacs-3847d-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();
export default db;
