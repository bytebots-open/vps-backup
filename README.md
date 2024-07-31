# vps-Backup Script(windows)

This is a Node.js script to download files and directories from a VPS server using SFTP, showing download progress and logging any failed downloads to a CSV file.

## Prerequisites

- Node.js (version 20 or later)
- npm (Node Package Manager)

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/bytebots-open/vps-backup.git
    cd vps-backup
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Create a `config.yaml` file:**

    Create a `config.yaml` file in the root of your project directory and add the following configuration:

    ```yaml
    # SFTP server configuration
    sftp:
      host: 10.25.30.14        # The IP address or hostname of the SFTP server
      port: 22                 # The port number of the SFTP server (default is 22 for most servers)
      username: root           # The username to connect to the SFTP server
      password: password       # The password for the SFTP server user

    # Directories
    directories:
      remote: /usr/share/nginx/bots  # The target folder in your VPS or server
      local: files                   # The local directory to save downloaded files

    # Directories to skip
    skip_dirs:
      - node_modules
      - __pycache__
    ```

## Usage

Run the backup script:

```bash
node backup.js
