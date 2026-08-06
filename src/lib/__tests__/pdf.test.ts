import { describe, expect, it } from 'vitest';
import { buildPdfBlob } from '../pdf';

// A 1x1 red JPEG, base64-encoded -- buildPdfBlob only needs .width/.height/
// .toDataURL() from what it's given, so a plain object stands in for a real
// HTMLCanvasElement (no DOM/canvas polyfill needed for this unit test).
const TINY_JPEG_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

function fakeCanvas(w = 1, h = 1) {
  return {
    width: w,
    height: h,
    toDataURL: () => TINY_JPEG_DATA_URL,
  } as unknown as HTMLCanvasElement;
}

describe('buildPdfBlob', () => {
  it('produces a valid application/pdf Blob with a %PDF-1.4 header and matching xref count', async () => {
    const blob = buildPdfBlob([fakeCanvas(), fakeCanvas()]);
    expect(blob.type).toBe('application/pdf');
    const text = await blob.text();
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('%%EOF');
    // 2 pages -> objects 1(catalog) 2(pages) + 3 per page (page/content/image) x2 = 8 objects (1-8), so xref covers 0-8 = 9 entries
    expect(text).toContain('xref\n0 9\n');
    expect(text).toContain('/Count 2');
  });

  it('handles a single page', async () => {
    const blob = buildPdfBlob([fakeCanvas(10, 20)]);
    const text = await blob.text();
    expect(text).toContain('/Count 1');
    expect(text).toContain('/Width 10 /Height 20');
  });
});
