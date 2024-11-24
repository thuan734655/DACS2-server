import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handleFileWebSocket = (listFileUrl) => {
  const fileUrls = [];
  if (listFileUrl && listFileUrl.length > 0) {
    listFileUrl.forEach((file) => {
      const { name, type, data } = file;

      const base64Data = data.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      // Tạo tên file duy nhất bằng cách sử dụng thời gian hiện tại và UUID
      const fileExtension = path.extname(name); // Lấy phần mở rộng của file (ví dụ: .jpg, .png)
      const sanitizedFileName = `${Date.now()}_${uuidv4()}${fileExtension}`; // Tên file duy nhất
      const uploadDir = path.join(__dirname, "../images");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, sanitizedFileName);

      // Lưu file
      fs.writeFileSync(filePath, buffer);
      console.log(`File đã lưu tại: ${filePath}`);

      // Lưu đường dẫn file
      fileUrls.push(`/images/${sanitizedFileName}`);
    });
  }
  return fileUrls;
};

export default handleFileWebSocket;
