"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// uploads 디렉토리가 없으면 생성
const uploadsDir = path_1.default.join(__dirname, '../../uploads/avatars');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?.userId;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `avatar-${userId}-${Date.now()}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    // MIME 타입 체크
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    // 파일 확장자 체크
    const ext = file.originalname.toLowerCase().split('.').pop();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (allowedMimes.includes(file.mimetype) && ext && allowedExts.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 가능)'));
    }
};
exports.avatarUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
//# sourceMappingURL=upload.js.map