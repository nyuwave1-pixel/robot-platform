"use client";
/** 리포트 DOM → PNG / 여러 쪽 A4 PDF. 브라우저 렌더링을 캡처하므로 모든 언어의 글꼴이 그대로 보존된다. */
async function capture(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  return toCanvas(node, {
    pixelRatio: Math.min(2, 1600 / node.offsetWidth),
    backgroundColor: "#05070a",
    cacheBust: true,
    filter: (n) => !(n instanceof HTMLElement && n.dataset.noExport !== undefined),
  });
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function saveReportImage(node: HTMLElement, name: string): Promise<void> {
  const c = await capture(node);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) throw new Error("encode_failed");
  download(blob, `${name}.png`);
}

export async function saveReportPdf(node: HTMLElement, name: string): Promise<void> {
  const c = await capture(node);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pw = 210;
  const ph = 297;
  const pxPerPage = Math.floor((c.width * ph) / pw);
  for (let y = 0, page = 0; y < c.height; y += pxPerPage, page++) {
    const h = Math.min(pxPerPage, c.height - y);
    const slice = document.createElement("canvas");
    slice.width = c.width;
    slice.height = pxPerPage;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(c, 0, y, c.width, h, 0, 0, c.width, h);
    if (page) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, pw, ph);
  }
  download(pdf.output("blob"), `${name}.pdf`);
}
