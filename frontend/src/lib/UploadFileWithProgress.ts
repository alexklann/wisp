export function uploadFileWithProgress(
  file: File,
  token: string,
  onProgress: (percent: number) => void,
): Promise<{ id: string; url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.open("POST", `${import.meta.env.VITE_BACKEND_URL}/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    const formData = new FormData();
    formData.append("file", file);

    xhr.send(formData);
  });
}
