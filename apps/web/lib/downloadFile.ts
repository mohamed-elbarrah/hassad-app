import { getApiBaseUrl } from "@/lib/utils";

export async function downloadTaskFile(
  taskId: string,
  fileId: string,
  fileName: string,
): Promise<void> {
  const apiUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiUrl}/tasks/${taskId}/files/${fileId}/download`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
