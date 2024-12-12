import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Check for required environment variables
const requiredEnvVars = [
  'FIREBASE_ADMIN_TYPE',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_PRIVATE_KEY_ID',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_CLIENT_ID',
  'FIREBASE_ADMIN_AUTH_URI',
  'FIREBASE_ADMIN_TOKEN_URI',
  'FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL',
  'FIREBASE_ADMIN_CLIENT_X509_CERT_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create service account configuration from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://dacs-3847d-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

export default db;
export const auth = admin.auth();
