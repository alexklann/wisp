export default async function downloadImage(url: string, filename: string) {
  try {
    if (!url || !filename) return;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");

    const blob = await response.blob();
    const localUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = localUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(localUrl);
  } catch (error) {
    console.error("Failed to download image:", error);
  }
}
