// infrastructure/storage/localStorage.ts
import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
})