require('dotenv').config();

const config = {
  host: process.env.HOST,
  port: process.env.PORT,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
};

const remoteDir = process.env.REMOTE_DIR;
const localDir = process.env.LOCAL_DIR;
const skipDirs = process.env.SKIP_DIRS.split(',');

module.exports = { config, remoteDir, localDir, skipDirs };
