const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const ProgressBar = require('progress');
const { Parser } = require('json2csv');
const { config, remoteDir, localDir, skipDirs } = require('./config');

const sftp = new Client();

const failedDownloads = [];

// Ensure the local directory exists
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

async function downloadFile(remoteFilePath, localFilePath) {
  const fileStats = await sftp.stat(remoteFilePath);
  const fileSize = fileStats.size;

  const bar = new ProgressBar(`Downloading ${path.dirname(remoteFilePath)}/${path.basename(remoteFilePath)} [:bar] :percent :etas`, {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: fileSize,
  });

  return new Promise((resolve, reject) => {
    sftp.get(remoteFilePath, localFilePath).then(() => {
      const readStream = fs.createReadStream(localFilePath);
      readStream.on('data', (chunk) => {
        bar.tick(chunk.length);
      });
      readStream.on('end', resolve);
      readStream.on('error', reject);
    }).catch(err => {
      console.error(`Failed to download file: ${err.message}`);
      reject(err);
    });
  });
}

async function downloadDirectory(remoteDir, localDir) {
  await sftp.connect(config);

  async function walk(dir) {
    const list = await sftp.list(dir);

    for (const item of list) {
      const remoteFilePath = path.join(dir, item.name);
      const localFilePath = path.join(localDir, path.relative(remoteDir, remoteFilePath));

      if (skipDirs.includes(item.name)) {
        console.log(`Skipping directory: ${item.name}`);
        continue;
      }

      if (item.type === 'd') {
        fs.mkdirSync(localFilePath, { recursive: true });
        try {
          await walk(remoteFilePath);
        } catch (err) {
          console.error(`Failed to download directory: ${remoteFilePath}. Error: ${err.message}`);
          failedDownloads.push({ path: remoteFilePath, error: err.message });
        }
      } else {
        try {
          await downloadFile(remoteFilePath, localFilePath);
        } catch (err) {
          console.error(`Failed to download file: ${remoteFilePath}. Error: ${err.message}`);
          failedDownloads.push({ path: remoteFilePath, error: err.message });
        }
      }
    }
  }

  await walk(remoteDir);
  await sftp.end();
}

async function saveFailedDownloadsToCSV() {
  if (failedDownloads.length > 0) {
    const fields = ['path', 'error'];
    const parser = new Parser({ fields });
    const csv = parser.parse(failedDownloads);

    fs.writeFileSync('failed_downloads.csv', csv);
    console.log('Failed downloads have been logged to failed_downloads.csv');
  } else {
    console.log('No failed downloads.');
  }
}

downloadDirectory(remoteDir, localDir).then(() => {
  console.log('Backup completed successfully.');
  return saveFailedDownloadsToCSV();
}).catch(err => {
  console.error(`Backup failed: ${err.message}`);
  saveFailedDownloadsToCSV();
});
