import express from "express";
import bodyParser from "body-parser";
import connectDB from "../ConnectDB.js";
import dotenv from "dotenv";
import updateOTPService from "../services/updateOTPService.js";

dotenv.config();

const updateAccountRoute = express.Router();
updateAccountRoute.use(bodyParser.json());

updateAccountRoute.patch("/update-infoDevice", async (req, res) => {
  const { ip, email } = req.body;
  connectDB.query(
    "UPDATE account SET infoDevice = ? WHERE email = ?",
    [ip, email],
    (updateErr) => {
      if (updateErr) {
        console.error("Error updating IP:", updateErr);
      } else {
        console.log("Device IP updated:", ip);
        //deleted otp if exist
        updateOTPService("NULL", email);
      }
    }
  );
});

export default updateAccountRoute;
