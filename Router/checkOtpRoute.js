import express from "express";
import bodyParser from "body-parser";
import checkOTP from "../services/checkOTP.js";
import connectDB from "../ConnectDB.js";

const routerCheckOtp = express.Router();

routerCheckOtp.use(bodyParser.json());

// Route: /verify-otp
routerCheckOtp.post("/verify-otp", async (req, res) => {
  const { email, otp, infoDevice } = req.body;
  console.log(infoDevice);
  if (!email || !otp || !infoDevice) {
    return res
      .status(400)
      .send({ message: "Email and OTP code are required." });
  }

  try {
    checkOTP(email, otp, (resultCheckOTP) => {
      if (resultCheckOTP === 1) {
        connectDB.query(
          "UPDATE `account` SET `isActive`= 1 WHERE email = ?",
          [email],
          (err, resUpdateIsActive) => {
            if (err) {
              return res.status(400).send({ message: "update isActive fail!" });
            } else if (resUpdateIsActive) {
              res.status(200).send({ message: "OTP verified successfully" });
            }
          }
        );
        connectDB.query(
          "UPDATE `account` SET `infoDevice`= ? WHERE email = ?",
          [infoDevice, email],
          (errUpdateInfoDevice, resUpdateInfodevice) => {
            if (errUpdateInfoDevice) {
              return res
                .status(400)
                .send({ message: "update infodevice fail!" });
            } else if (resUpdateInfodevice) {
              res
                .status(200)
                .send({ message: "update infoDevice successfully" });
            }
          }
        );
      } else if (resultCheckOTP === -1) {
        // not match otp
        return res.status(400).send({ message: "Invalid OTP" });
      } else {
        //not found email
        return res.status(400).send({ message: "Email not found" });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

export default routerCheckOtp;
