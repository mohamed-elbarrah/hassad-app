export async function downloadTaskFile(
  taskId: string,
  fileId: string,
  fileName: string,
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(
    `${apiUrl}/v1/tasks/${taskId}/files/${fileId}/download`,
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
