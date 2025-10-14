import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// uploads 디렉토리가 없으면 생성
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as Request).user?.userId;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // MIME 타입 체크
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  // 파일 확장자 체크
  const ext = file.originalname.toLowerCase().split('.').pop();
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  if (allowedMimes.includes(file.mimetype) && ext && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 가능)'));
  }
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});