const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
];

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const downloadFile = (filename) => {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${filename}`;
    const filePath = path.join(modelsDir, filename);
    const file = fs.createWriteStream(filePath);

    console.log(`⬇️  Downloading: ${filename}`);

    https.get(url, (response) => {
      // Redirect handle karo
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✅ Done: ${filename}`);
            resolve();
          });
        }).on('error', reject);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Done: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.log(`❌ Failed: ${filename}`);
      reject(err);
    });
  });
};

const downloadAll = async () => {
  console.log('🚀 Downloading models...\n');
  for (const file of files) {
    try {
      await downloadFile(file);
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
  console.log('\n🎉 Done!');
};

downloadAll();