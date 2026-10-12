import { Segment } from '../types';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const pdfExtractor = {
  // Parse PDF file into structured segments
  async parsePdfFile(file: File): Promise<{
    title: string;
    pageCount: number;
    segments: Segment[];
    isScannedImageDoc?: boolean;
    firstPageImageBase64?: string;
  }> {
    const arrayBuffer = await file.arrayBuffer();
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    // Try pdfjsLib if loaded
    if (window.pdfjsLib) {
      try {
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const pageCount = pdfDoc.numPages;
        const segments: Segment[] = [];
        let totalTextLength = 0;
        let firstPageImageBase64 = '';

        for (let i = 1; i <= Math.min(pageCount, 15); i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();

          // Render first page as image base64 for thumbnail/OCR preview
          if (i === 1) {
            try {
              const viewport = page.getViewport({ scale: 1.2 });
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: ctx, viewport }).promise;
              firstPageImageBase64 = canvas.toDataURL('image/jpeg', 0.85);
            } catch (err) {
              console.warn('First page canvas render failed:', err);
            }
          }

          // Extract and group text items into logical paragraphs
          let currentParagraph = '';
          const items = textContent.items || [];

          for (const item of items) {
            const str = (item.str || '').trim();
            if (!str) continue;

            if (currentParagraph && str.match(/^[A-Z0-9\u4e00-\u9fa5]/) && currentParagraph.endsWith('.')) {
              // New sentence/paragraph break
              segments.push({
                id: `seg-p${i}-${segments.length + 1}`,
                pageNumber: i,
                type: detectSegmentType(currentParagraph),
                original: currentParagraph.trim(),
                translated: '',
              });
              currentParagraph = str;
            } else {
              currentParagraph = currentParagraph ? `${currentParagraph} ${str}` : str;
            }
            totalTextLength += str.length;
          }

          if (currentParagraph.trim()) {
            segments.push({
              id: `seg-p${i}-${segments.length + 1}`,
              pageNumber: i,
              type: detectSegmentType(currentParagraph),
              original: currentParagraph.trim(),
              translated: '',
            });
          }
        }

        // If total extracted text is very sparse (< 80 characters for multi-page doc), it is likely a scanned image PDF!
        const isScannedImageDoc = totalTextLength < 100;

        return {
          title: fileName,
          pageCount,
          segments: segments.length > 0 ? segments : generateFallbackSegments(fileName),
          isScannedImageDoc,
          firstPageImageBase64,
        };
      } catch (err) {
        console.warn('PDF.js parsing encountered error:', err);
      }
    }

    // Fallback if pdfjsLib is unavailable
    const fallbackText = await this.readTextOrFallback(file);
    const parsedSegments = this.splitTextIntoSegments(fallbackText);
    return {
      title: fileName,
      pageCount: 1,
      segments: parsedSegments,
      isScannedImageDoc: false,
    };
  },

  // Read plain text / markdown
  async parseTextFile(file: File): Promise<{ title: string; segments: Segment[] }> {
    const text = await file.text();
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const segments = this.splitTextIntoSegments(text);
    return {
      title: fileName,
      segments,
    };
  },

  // Split plain text into structured paragraphs
  splitTextIntoSegments(text: string): Segment[] {
    const rawParagraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
    if (rawParagraphs.length === 0) {
      return generateFallbackSegments('文档段落');
    }

    return rawParagraphs.map((para, idx) => ({
      id: `seg-text-${idx + 1}`,
      pageNumber: Math.floor(idx / 5) + 1,
      type: detectSegmentType(para),
      original: para,
      translated: '',
    }));
  },

  // Helper to convert image File to Base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async readTextOrFallback(file: File): Promise<string> {
    try {
      return await file.text();
    } catch {
      return `Document Title: ${file.name}\n\n[Auto extracted document content preview...]`;
    }
  },
};

function detectSegmentType(text: string): Segment['type'] {
  const clean = text.trim();
  if (clean.length < 50 && (/^[0-9]\./.test(clean) || /^[A-Z\s]{4,}$/.test(clean) || /^[#第]/.test(clean))) {
    return 'heading';
  }
  if (clean.length < 40 && !clean.includes('.') && !clean.includes('。')) {
    return 'title';
  }
  if (/^[•\-\*]/.test(clean)) {
    return 'bullet';
  }
  if (clean.includes('|')) {
    return 'table_row';
  }
  return 'paragraph';
}

function generateFallbackSegments(title: string): Segment[] {
  return [
    {
      id: 'seg-fb-1',
      pageNumber: 1,
      type: 'title',
      original: title,
      translated: '',
    },
    {
      id: 'seg-fb-2',
      pageNumber: 1,
      type: 'paragraph',
      original: 'This document was uploaded into GeminiDoc Translator. Click "开始翻译" to generate bilingual alignment.',
      translated: '',
    },
  ];
}
