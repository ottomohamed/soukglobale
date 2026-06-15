import { useState } from "react";

export function useCloudinaryUpload() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadState("uploading");
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
        setUploadState("done");
        return data.secure_url;
      }
      setUploadState("error");
      return null;
    } catch (err) {
      setUploadState("error");
      return null;
    }
  };

  return { uploadImage, uploadState };
}
