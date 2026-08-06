// Self-contained PDF writer: embeds each canvas page as a JPEG in a minimal,
// spec-correct PDF. No external library, no CDN, works offline and in any CSP.
// Mechanical port of sruthiscribe's index.html buildPdfBlob() (~3876-3934).
const A4W = 595.28, A4H = 841.89;

export function buildPdfBlob(pages: HTMLCanvasElement[]): Blob {
  const parts: Array<Uint8Array> = [];
  const offsets: number[] = [];
  let pos = 0;

  function push(s: string | Uint8Array) {
    if (typeof s === 'string') {
      const b = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
      parts.push(b);
      pos += b.length;
    } else {
      parts.push(s);
      pos += s.length;
    }
  }
  function obj(n: number, body: string) {
    offsets[n] = pos;
    push(n + ' 0 obj\n' + body + '\nendobj\n');
  }

  push('%PDF-1.4\n%âãÏÓ\n');

  const kids: string[] = [];
  let next = 3; // 1=catalog, 2=pages tree
  const imgObjs: Array<{ page: number; cont: number; img: number; cv: HTMLCanvasElement }> = [];
  pages.forEach((cv) => {
    const pageN = next++, contN = next++, imgN = next++;
    kids.push(pageN + ' 0 R');
    imgObjs.push({ page: pageN, cont: contN, img: imgN, cv });
  });

  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages.length + ' >>');

  imgObjs.forEach((o) => {
    obj(
      o.page,
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + A4W + ' ' + A4H + '] ' +
        '/Resources << /XObject << /Im0 ' + o.img + ' 0 R >> >> /Contents ' + o.cont + ' 0 R >>',
    );
    const stream = 'q ' + A4W + ' 0 0 ' + A4H + ' 0 0 cm /Im0 Do Q';
    obj(o.cont, '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
    const dataUrl = o.cv.toDataURL('image/jpeg', 0.92);
    const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const bin = atob(b64);
    const jpg = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) jpg[i] = bin.charCodeAt(i);
    offsets[o.img] = pos;
    push(
      o.img + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + o.cv.width +
        ' /Height ' + o.cv.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 ' +
        '/Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n',
    );
    push(jpg);
    push('\nendstream\nendobj\n');
  });

  const xrefPos = pos;
  const total = next; // objects 1..next-1
  let xref = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
  for (let n = 1; n < total; n++) {
    xref += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  }
  push(xref);
  push('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF');

  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}
