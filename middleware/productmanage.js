const multer = require('multer')
const path = require("path")
const sharp = require("sharp")
const fs = require("fs");
const { error } = require('console');

const storage = multer.memoryStorage();
exports.upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".jpg" && ext !== ".png" && ext !== ".jpeg") {
      return cb(new Error("Files are not images"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB file size limit
}).array('images', 10); 

exports.resizeAndSaveImage =async (buffer,filename) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = `./uploads/${filename}`
  await sharp(buffer)
  .resize(800,800,{fit:sharp.fit.cover})
  .toFile(filePath);
  return filePath
};


// exports.upload = multer({
//   storage,
//   fileFilter: (req,file,cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if(ext !== ".jpg" || ext !== ".png" || ext !== "jpeg"){
//       return cb(new Error("files are not images") ,false)
//     }
//     cb(null,true)
//   },
//   limits:{fileSize: 5 * 1024 * 1024},
// }).array('images', 10);