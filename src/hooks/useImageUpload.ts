import { useState } from "react";

export type UploadState = "idle" | "uploading" | "done" | "error";

export function useImageUpload() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File): Promise<string | null> {
    setUploadState("uploading");
    setProgress(0);
    setError(null);

    try {
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!metaRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();

      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setProgress(100);
      setUploadState("done");
      return `/api/storage${objectPath}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      setUploadState("error");
      return null;
    }
  }

  function reset() {
    setUploadState("idle");
    setProgress(0);
    setError(null);
  }

  return { uploadImage, uploadState, progress, error, reset };
}
