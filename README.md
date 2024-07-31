# vps-Backup Script

This is a Node.js script to download files and directories from a vps server using sftp, showing download progress and logging any failed downloads to a CSV file.

## Prerequisites

- Node.js (version 20 or later)
- npm (Node Package Manager)

## Installation

> **Warning:** If you are using a Windows OS, please ensure you are on the `windows` branch of this repository. The default branch may not handle file paths correctly for Windows.

1. **Clone the repository:**

    ```bash
    git clone https://github.com/bytebots-open/vps-backup.git
    cd vps-backup
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Create a `.env` file:**

    Create a `.env` file in the root of your project directory and add the following variables:

    ```env
    HOST=10.25.30.14
    PORT=22
    USERNAME=root
    PASSWORD=password
    REMOTE_DIR=/usr/share/nginx/bots
    LOCAL_DIR=files
    SKIP_DIRS=node_modules,__pycache__
    ```


## Usage

Run the backup script:

```bash
node backup.js
