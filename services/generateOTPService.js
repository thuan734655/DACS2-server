const generateOTP = () => {
  function randomNumber() {
    return Math.floor(100000 + Math.random() * 900000);
  }
  const otp = randomNumber();
  return otp;
};

export default generateOTP;
