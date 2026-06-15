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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "soukglobale");
      const res = await fetch("https://api.cloudinary.com/v1_1/dvjnppif6/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setProgress(100);
        setUploadState("done");
        return data.secure_url;
      }
      throw new Error(data.error?.message || "Upload failed");
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
