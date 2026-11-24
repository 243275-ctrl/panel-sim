import { describe, expect, it } from "vitest";
import { buildPdfFromJpeg } from "./export";

describe("PDF writer", () => {
  it("produces a structurally valid single-page PDF around a JPEG", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
    const pdf = buildPdfFromJpeg(jpeg, 800, 600);
    const text = new TextDecoder("latin1").decode(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Subtype /Image");
    expect(text).toContain("/Filter /DCTDecode");
    expect(text).toContain("/MediaBox [0 0 800 600]");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    // startxref must point at the xref table
    const m = text.match(/startxref\n(\d+)\n%%EOF/);
    expect(m).not.toBeNull();
    const at = Number(m![1]);
    expect(text.slice(at, at + 4)).toBe("xref");
    // every object offset resolves to "N 0 obj"
    const xref = text.slice(at).split("\n");
    for (let i = 1; i <= 5; i++) {
      const off = Number(xref[2 + i].slice(0, 10));
      expect(text.slice(off)).toMatch(new RegExp(`^${i} 0 obj`));
    }
    // image stream payload intact (skip the page-content stream before it)
    const streamAt =
      text.indexOf("stream\n", text.indexOf("/DCTDecode")) + "stream\n".length;
    expect(pdf[streamAt]).toBe(0xff);
    expect(pdf[streamAt + 1]).toBe(0xd8);
  });
});
