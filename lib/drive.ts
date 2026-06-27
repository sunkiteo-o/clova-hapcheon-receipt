import { getToken } from "./gapi";

export interface DriveUploadResult {
  id: string;
  imageUrl: string;  // =IMAGE() 용 공개 URL
  viewUrl: string;   // 사람이 보는 링크
}

export async function uploadToDrive(
  imageBuffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<DriveUploadResult> {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("DRIVE_FOLDER_ID 환경변수 누락");

  const token = await getToken();

  // Multipart upload (metadata + binary)
  const boundary = "drive_boundary_" + Date.now().toString(36);
  const metadata = JSON.stringify({ name: filename, parents: [folderId] });

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(metadata, "utf-8"),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    imageBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Drive 업로드 실패 ${uploadRes.status}: ${text}`);
  }

  const { id } = (await uploadRes.json()) as { id: string };

  // 누구나 읽기 가능하도록 공개
  const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  if (!permRes.ok) {
    const text = await permRes.text();
    throw new Error(`Drive 권한 설정 실패 ${permRes.status}: ${text}`);
  }

  return {
    id,
    imageUrl: `https://drive.google.com/thumbnail?id=${id}`,
    viewUrl: `https://drive.google.com/file/d/${id}/view`,
  };
}
