const Client = require("ssh2-sftp-client");
const fs = require("fs");
const path = require("path");
const ProgressBar = require("progress");
const { Parser } = require("json2csv");
const yaml = require("js-yaml");

// Load configuration from YAML file
const configFile = fs.readFileSync("./config.yaml", "utf8");
const config = yaml.load(configFile);

const sftp = new Client();
const failedDownloads = [];

// Ensure the local directory exists
if (!fs.existsSync(config.directories.local)) {
  fs.mkdirSync(config.directories.local, { recursive: true });
}

async function downloadFile(remoteFilePath, localFilePath) {
  try {
    const fileStats = await sftp.stat(remoteFilePath);
    const fileSize = fileStats.size;

    const bar = new ProgressBar(
      `Downloading ${path.basename(remoteFilePath)} [:bar] :percent :etas`,
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: fileSize,
      }
    );

    const data = await sftp.get(remoteFilePath);
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(localFilePath);
      writeStream.write(data, (err) => {
        if (err) {
          reject(err);
        } else {
          bar.tick(fileSize);
          resolve();
        }
      });
    });
  } catch (err) {
    console.error(
      `Failed to download file: ${remoteFilePath}. Error: ${err.message}`
    );
    failedDownloads.push({ path: remoteFilePath, error: err.message });
  }
}

async function downloadDirectory(remoteDir, localDir) {
  await sftp.connect(config.sftp);

  async function walk(dir) {
    const list = await sftp.list(dir);

    for (const item of list) {
      const remoteFilePath = path.posix.join(dir, item.name);
      const localFilePath = path.join(
        localDir,
        path.relative(remoteDir, remoteFilePath)
      );

      if (config.skip_dirs.includes(item.name)) {
        console.log(`Skipping directory: ${item.name}`);
        continue;
      }

      if (item.type === "d") {
        fs.mkdirSync(localFilePath, { recursive: true });
        try {
          await walk(remoteFilePath);
        } catch (err) {
          console.error(
            `Failed to download directory: ${remoteFilePath}. Error: ${err.message}`
          );
          failedDownloads.push({ path: remoteFilePath, error: err.message });
        }
      } else {
        try {
          await downloadFile(remoteFilePath, localFilePath);
        } catch (err) {
          console.error(
            `Failed to download file: ${remoteFilePath}. Error: ${err.message}`
          );
          failedDownloads.push({ path: remoteFilePath, error: err.message });
        }
      }
    }
  }

  try {
    await walk(remoteDir);
  } catch (err) {
    console.error(
      `Failed to walk directory: ${remoteDir}. Error: ${err.message}`
    );
  } finally {
    await sftp.end();
  }
}

async function saveFailedDownloadsToCSV() {
  if (failedDownloads.length > 0) {
    const fields = ["path", "error"];
    const parser = new Parser({ fields });
    const csv = parser.parse(failedDownloads);

    fs.writeFileSync("failed_downloads.csv", csv);
    console.log("Failed downloads have been logged to failed_downloads.csv");
  } else {
    console.log("No failed downloads.");
  }
}

downloadDirectory(config.directories.remote, config.directories.local)
  .then(() => {
    console.log("Backup completed successfully.");
    return saveFailedDownloadsToCSV();
  })
  .catch((err) => {
    console.error(`Backup failed: ${err.message}`);
    saveFailedDownloadsToCSV();
  });
