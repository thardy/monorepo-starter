import util from 'util';
import multer from 'multer';

const maxSize = 20 * 1024 * 1024;

let upload: any = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: maxSize },
}).single("file");

const uploadFile = util.promisify(upload);

export { uploadFile };

