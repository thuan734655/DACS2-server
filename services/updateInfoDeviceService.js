import connectDB from "../ConnectDB.js";

const updateInfoDevice = (infoDevice, email) => {
  connectDB.query(
    "UPDATE account SET infoDevice = ? WHERE email = ?",
    [infoDevice, email],
    (updateErr) => {
      if (updateErr) {
        console.error("Error updating IP:", updateErr);
      } else {
        console.log("Device IP updated:", infoDevice);
      }
    }
  );
};

export default updateInfoDevice;
