/* eslint-disable no-undef */
import { Transaction, Category } from '../types';

// Types for Global Google Objects
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const driveService = {
  // Initialize the GAPI client
  initGapi: async (clientId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject("Google API script not loaded");
        return;
      }
      
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: '', // API Key is not strictly needed for this flow if we have Client ID and Token
            clientId: clientId,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  },

  // Initialize the Identity Service (Login Popup)
  initGis: (clientId: string, onTokenCallback: (response: any) => void) => {
    if (!window.google) return;
    
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        onTokenCallback(resp);
      },
    });
    gisInited = true;
  },

  // Trigger the login popup
  login: () => {
    if (tokenClient) {
      // Prompt the user to select an account.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  },

  // Find a file by name
  findFile: async (fileName: string): Promise<string | null> => {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name = '${fileName}' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });
      
      const files = response.result.files;
      if (files && files.length > 0) {
        return files[0].id;
      }
      return null;
    } catch (err) {
      console.error('Error finding file', err);
      throw err;
    }
  },

  // Create a new file with initial content
  createFile: async (fileName: string, content: string): Promise<string> => {
    const fileMetadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const accessToken = window.gapi.client.getToken().access_token;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });
    
    const data = await response.json();
    return data.id;
  },

  // Update an existing file
  updateFile: async (fileId: string, content: string): Promise<void> => {
     const metadata = {
        mimeType: 'application/json',
     };
     
     const form = new FormData();
     form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
     form.append('file', new Blob([content], { type: 'application/json' }));

     const accessToken = window.gapi.client.getToken().access_token;

     await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form,
     });
  },

  // Read file content
  readFile: async (fileId: string): Promise<any> => {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return response.result; // GAPI returns JSON object automatically if content-type matches
  },

  // High level sync function
  syncData: async (
      fileName: string, 
      data: { transactions: Transaction[], categories: Category[] }
  ): Promise<{ fileId: string }> => {
      // 1. Check if file exists
      let fileId = await driveService.findFile(fileName);
      const content = JSON.stringify(data, null, 2);

      if (fileId) {
          // 2. Update
          await driveService.updateFile(fileId, content);
      } else {
          // 3. Create
          fileId = await driveService.createFile(fileName, content);
      }
      return { fileId };
  }
};