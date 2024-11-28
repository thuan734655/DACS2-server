import {database} from '../config/ConnectDB';

const saveIdUser = (idUser, fullName, email) => {
  const userRef = database.ref('users/' + idUser);  // Lưu vào node "users"
  userRef.set({
    idUser: idUser,
    fullName: fullName,
    email: email,
  })
  .then(() => {
    console.log('User data saved!');
  })
  .catch((error) => {
    console.error('Error saving user data:', error);
  });
};

saveIdUser(199, 'HoangAnhPhi', 'nn4461119@gmail.com');
const saveMessageToFirebase = (senderId, receiverId, message) => {
    const messagesRef = database.ref('messages/'); // Tạo node "messages"
    const newMessageRef = messagesRef.push(); // Tạo ID mới cho tin nhắn
    newMessageRef.set({
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      timestamp: Date.now(),
    })
    .then(() => {
      console.log('Message sent!');
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
  };
  
  saveMessageToFirebase(199, 200, 'Hello, how are you?');
  