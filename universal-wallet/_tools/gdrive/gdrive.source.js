/*
This script needs the following environment variables defined:

# no longer used - GOOGLE_UPLOAD_JSON_KEY_B64 - The service account JSON key (THIS MUST BE SECRET)

GOOGLE_UPLOAD_OAUTH_KEY_B64 - oauth key converted to base64
GOOGLE_UPLOAD_REFRESH_TOKEN - oauth refresh token
GOOGLE_UPLOAD_FOLDER - name of folder in google drive to save uploads (MUST BE UNIQUE IN ACCOUNT)

# Source is a single file with following dependancies
npm add google-auth-library
npm add -D esbuild

Usage:
node uploader.js list
node uploader.js upload <filepath>
node uploader.js getlink <filepath>

variable GOOGLE_UPLOAD_JSON_KEY_B64 must contain the Base64 encoded file of the service account key.
To create this key go to: https://console.cloud.google.com/
then create a new project.  In this project enable Google Drive API and create a new service account under:
APIs & Services -> Credentials -> Create credentials -> Service Account
Then generate a access key for this service account


*/
const fs = require('fs');
const path = require('path');
const {GoogleAuth, OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');

const prnt = console.log;

// Download your OAuth2 configuration from Google cloud console credentials
var keys = {};

function getOAuthKeys() {
  keys = JSON.parse(Buffer.from(process.env.GOOGLE_UPLOAD_OAUTH_KEY_B64, 'base64'));
  // prnt(">> KEYS", keys);
}

// provides a delay for an async function.  useful for testing, generally not needed in production
const delay = async msDelay => {
  return new Promise(resolve => setTimeout(() => resolve(), msDelay));
};

// Get authenticated API client
async function getAuthClient() {
  const serviceAccountJSONString = Buffer.from(process.env.GOOGLE_UPLOAD_JSON_KEY_B64, 'base64').toString('ascii');
  let json_file_content = '';
  try {
    json_file_content = JSON.parse(serviceAccountJSONString);
  } catch (_) {
    prnt('Service account key could not be decoded!');
    process.exit(-1);
  }

  // Authenticate with Google
  const auth = new GoogleAuth({
    credentials: json_file_content,
    scopes: 'https://www.googleapis.com/auth/drive',
  });
  const authClient = await auth.getClient();
  return authClient;
}

async function getOAuth2Client(refreshToken) {
  const oAuth2Client = new OAuth2Client(keys.web.client_id, keys.web.client_secret, keys.web.redirect_uris[0]);
  const result = await oAuth2Client.refreshToken(refreshToken);
  oAuth2Client.setCredentials(result.tokens);
  return oAuth2Client;
}

// Creata a new file in Google Drive
async function createDriveFile(authClient, folderID, filePath) {
  const parsedPath = path.parse(filePath);
  const filename = parsedPath.base;

  const createFile = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
  const res1 = await authClient.request({
    url: createFile,
    method: 'POST',
    data: {
      name: filename,
      originalFilename: filename,
      parents: [folderID],
      mimeType: 'application/octet-stream',
    },
  });
  // prnt(res1);
  // const uploadURL = res1.headers.location;
  return res1;
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size; // get file size in bytes
}

async function updateDriveFile(authClient, updateURL, filePath) {
  // get Google authentication headers
  const headers = await authClient.getRequestHeaders();

  // get file size and stream
  const fileSizeInBytes = getFileSize(filePath);
  const readStream = fs.createReadStream(filePath);
  // prnt(`SIZE: ${fileSizeInBytes}`)

  // prepare upload options
  const uploadOptions = {
    method: 'PATCH',
    headers: {...headers, 'Content-length': fileSizeInBytes},
    body: readStream,
    duplex: 'half',
  };

  // perform upload
  return await fetch(updateURL, uploadOptions)
    .then(data => {
      return data;
    })
    .catch(err => {
      return err;
    });
}

// Delete old files (depending on how big the upload is) to make space for new file
async function makeSpace(authClient, filePath, folderID) {
  // Size of file being uploaded
  const fileSize = getFileSize(filePath);
  // List all files in folder
  const folder = await listDrive(folderID);
  const fileList = folder.files;

  let freeSize = 0;
  let fileListToDelete = [];
  for (let i = 0; i < fileList.length; i++) {
    if (freeSize < fileSize) {
      freeSize += fileList[i].size;
      fileListToDelete.push(fileList[i]);
    } else {
      prnt(`Deleting ${fileListToDelete.length} files to make space...`);
      for (let j = 0; j < fileListToDelete.length; j++) {
        prnt(`Deleting old file: ${fileList[j].name}`);
        const deleteFile = `https://www.googleapis.com/drive/v3/files/${fileList[j].id}`;
        const deleteResult = await authClient.request({
          url: deleteFile,
          method: 'DELETE',
        });

        if (deleteResult.status >= 400) {
          prnt(`Error deleting file: ${fileList[j].name}`);
          const deleteResJson = await deleteResult.json();
          prnt(deleteResJson);
        }
      }
      break;
    }
  }
}

async function uploadFile(filePath) {
  const folderID = await getFolderID(process.env.GOOGLE_UPLOAD_FOLDER);

  const authClient = await getOAuth2Client();

  const createResult = await createDriveFile(authClient, folderID, filePath);
  const uploadURL = createResult.headers.location;
  if (createResult.status !== 200) {
    prnt('Error could not get upload path');
    process.exit(-1);
  }
  prnt(`Starting upload ...`);

  const updateResult = await updateDriveFile(authClient, uploadURL, filePath);
  const jsonData = await updateResult.json();
  if (updateResult.status !== 200) {
    // check if error is : storage quota reached
    if (jsonData.error.errors.find(e => e.reason === 'storageQuotaExceeded')) {
      prnt('Error: Storage quota reached');
      makeSpace(authClient, filePath, folderID);
      // Retry upload with recursive call
      uploadFile(filePath);
    }
  } else prnt(`Upload Complete ${updateResult.status}`);
}

async function oAuth2Upload(filePath, refreshToken) {
  const folderID = await getFolderID(process.env.GOOGLE_UPLOAD_FOLDER);
  const oAuth2Client = await getOAuth2Client(refreshToken);
  const createResult = await createDriveFile(oAuth2Client, folderID, filePath);
  const uploadURL = createResult.headers.location;
  if (createResult.status !== 200) {
    prnt('Error could not get upload path');
    process.exit(-1);
  }

  prnt('>> createResult', createResult);

  prnt(`Starting upload ...`);
  const updateResult = await updateDriveFile(oAuth2Client, uploadURL, filePath);
  prnt(`Upload Complete ${updateResult.status}`);
}

// List all files in a folder.  if folderName empty then list all folders instead
async function listDrive(folderID) {
  let authClient;

  authClient = await getOAuth2Client(process.env.GOOGLE_UPLOAD_REFRESH_TOKEN);
  const queryParms = [
    'includeTeamDriveItems=false',
    'supportsAllDrives=false',
    'pageSize=800',
    'orderBy=createdTime',
    // 'fields=files(*)',
    'fields=files(kind,mimeType,name,size,id,createdTime,sha256Checksum)',
    folderID
      ? `q="${folderID}"+in+parents+and+trashed=false`
      : `q=${encodeURI('mimeType="application/vnd.google-apps.folder"')}+and+trashed=false`,
  ];
  const listFile = `https://www.googleapis.com/drive/v3/files?${queryParms.join('&')}`;

  let result = {status: 0, files: []};

  let res = await authClient.request({url: listFile, method: 'GET'});

  if (res.status === 200) {
    result.status = res.status;
    result.files = res.data.files;

    // if first result is good loop through other pages and join the results together
    while (res.status === 200 && res.data.nextPageToken) {
      const moreFiles = `https://www.googleapis.com/drive/v3/files?${queryParms.join('&')}&pageToken=${
        res.data.nextPageToken
      }`;
      // prnt('## moreFilesURL')
      // prnt(moreFiles);
      res = await authClient.request({url: moreFiles, method: 'GET'});

      if (res.status === 200) {
        result.status = res.status;
        result.files = result.files.concat(res.data.files);
      } else {
        result.status = res.status;
      }
    }
  } else {
    result.status = res.status;
    result.files = [];
  }

  // prnt(result);
  return result;
}

async function getFolderID(folderName) {
  const folderResult = await listDrive('');
  if (folderResult.status !== 200) {
    prnt('Error  getting folder list');
    process.exit(-1);
  }

  const searchResult = folderResult.files.filter(item => item.name === folderName);
  if (searchResult.length === 1) {
    return searchResult[0].id;
  }

  return '';
}

async function getFileID(folderID, fileName) {
  const folderResult = await listDrive(folderID);
  if (folderResult.status !== 200) {
    prnt('Error getting file list');
    process.exit(-1);
  }

  const searchResult = folderResult.files.filter(item => item.name === fileName);
  if (searchResult.length === 1) {
    return searchResult[0].id;
  } else if (searchResult.length > 1) {
    prnt(`Multiple files with same name in folder: ${fileName}`);
    process.exit(-1);
  } else {
    prnt(`File does not exist in Google drive folder (${process.env.GOOGLE_UPLOAD_FOLDER}):\n${fileName}`);
    process.exit(-1);
  }

  return '';
}

function checkFileArg(fileArgNumber) {
  //const filePath = process.argv[fileArgNumber];
  const filePath = path.resolve(process.cwd(), process.argv[fileArgNumber]);
  const allowedDirectory = path.resolve(process.cwd(), 'uploads');

  if (!filePath.startsWith(allowedDirectory)) {
    prnt(`Invalid file path: ${filePath}`);
    process.exit(-1);
  }

  if (!fs.existsSync(filePath)) {
    prnt(`File does not exist: ${filePath}`);
    process.exit(-1);
  }
}

function checkEnvironment() {
  if (!process.env.GOOGLE_UPLOAD_FOLDER) {
    prnt(`Environment variable GOOGLE_UPLOAD_FOLDER not defined`);
    process.exit(-1);
  }

  if (!process.env.GOOGLE_UPLOAD_REFRESH_TOKEN) {
    prnt(`Environment variable GOOGLE_UPLOAD_REFRESH_TOKEN not defined`);
    process.exit(-1);
  }

  if (!process.env.GOOGLE_UPLOAD_OAUTH_KEY_B64) {
    prnt(`Environment variable GOOGLE_UPLOAD_OAUTH_KEY_B64 not defined`);
    process.exit(-1);
  }
}

async function commandList() {
  const folderName = process.env.GOOGLE_UPLOAD_FOLDER;
  prnt(`Listing files from folder: ${folderName}`);
  const folderID = await getFolderID(folderName);
  prnt(folderID);
  const result = await listDrive(folderID);
  prnt(result);
}

async function commandGetFileLink() {
  const folderName = process.env.GOOGLE_UPLOAD_FOLDER;
  const parsedPath = path.parse(process.argv[3]);
  const filename = parsedPath.base;

  const folderID = await getFolderID(folderName);
  const fileID = await getFileID(folderID, filename);

  prnt(`https://drive.google.com/file/d/${fileID}/view`);
}

// Method to grant permissions
function oAuthAuthorize() {
  const oAuth2Client = new OAuth2Client(keys.web.client_id, keys.web.client_secret, keys.web.redirect_uris[0]);

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/drive',
  });

  console.log(authorizeUrl);

  // Open an http server to accept the oauth callback. In this simple example, the
  // only request to our webserver is to /oauth2callback?code=<code>
  const server = http
    .createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/oauth2callback') > -1) {
          // acquire the code from the querystring, and close the web server.
          const qs = new url.URL(req.url, 'http://localhost:8080').searchParams;
          const code = qs.get('code');
          prnt(`>> Code: ${code}`);
          res.end('Authentication successful! Please return to the console.');

          await delay(2000);
          await getRefreshToken(code);
          // server.destroy();
          server.closeAllConnections();
          server.close();
        }
      } catch (e) {
        console.log(e);
        reject(e);
      }
    })
    .listen(8080, () => {
      // open the browser to the authorize url to start the workflow
      // open(authorizeUrl, { wait: false }).then((cp) => cp.unref());
      prnt('>>> Open in browser', authorizeUrl);
    });

  // destroyer(server);
  // if (server && server.close) server.close();
}

async function getRefreshToken(code) {
  const oAuth2Client = new OAuth2Client(keys.web.client_id, keys.web.client_secret, keys.web.redirect_uris[0]);

  const response = await oAuth2Client.getToken(code);
  const refreshToken = response.tokens.refresh_token;
  prnt(`>> Refresh Token: ${refreshToken}`);
}

getOAuthKeys();

if (process.argv.length == 3 && process.argv[2] === 'list') {
  checkEnvironment();
  commandList();
} else if (process.argv.length == 4 && process.argv[2] === 'getlink') {
  checkEnvironment();
  // checkFileArg(3);
  commandGetFileLink();
  // } else if (process.argv.length == 4 && process.argv[2] === 'upload') {
  //   checkEnvironment();
  //   checkFileArg(3);
  //   const filePath = process.argv[3];
  //   prnt('Uploading file: ' + filePath);
  //   uploadFile(filePath).catch(console.error);
}
// Oauth2 authorization
else if (process.argv.length === 3 && process.argv[2] === 'oauthorize') {
  oAuthAuthorize();
}
// After getting oauth2 code, use it to get refresh token
else if (process.argv.length === 4 && process.argv[2] === 'gettoken') {
  getRefreshToken(process.argv[3]);
}
// arg3 = file path, arg4 = refresh token
else if (process.argv.length === 4 && process.argv[2] === 'upload') {
  checkEnvironment();
  checkFileArg(3);
  const filePath = process.argv[3];
  prnt('Uploading file: ' + filePath);
  oAuth2Upload(filePath, process.env.GOOGLE_UPLOAD_REFRESH_TOKEN);
}
