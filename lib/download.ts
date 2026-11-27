/** UTF-8 byte order mark (U+FEFF): makes Excel read accents correctly. */
const UTF8_BOM = String.fromCharCode(0xfeff);

/** Offers `content` to the browser as a downloaded text file. */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([UTF8_BOM, content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
