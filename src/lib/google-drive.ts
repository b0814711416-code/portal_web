import { google } from "googleapis";
import { Readable } from "node:stream";

function getAuth() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export async function ensureFolder(
  name: string,
  parentId: string
): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: "files(id)",
  });
  if (res.data.files?.length) return res.data.files[0].id!;

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return folder.data.id!;
}

export async function uploadFileToDrive(
  fileData: Buffer | Readable,
  fileName: string,
  mimeType: string,
  academicYear: number,
  categoryName: string
): Promise<{ fileId: string; viewLink: string; downloadLink: string }> {
  const drive = getDrive();
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  const yearFolderId = await ensureFolder(String(academicYear), rootFolderId);
  const categoryFolderId = await ensureFolder(categoryName, yearFolderId);

  const body = Buffer.isBuffer(fileData) ? Readable.from(fileData) : fileData;

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [categoryFolderId],
    },
    media: {
      mimeType,
      body,
    },
    fields: "id,webViewLink,webContentLink",
  });

  await drive.permissions.create({
    fileId: file.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: file.data.id!,
    viewLink: file.data.webViewLink!,
    downloadLink: file.data.webContentLink!,
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({ fileId });
}
