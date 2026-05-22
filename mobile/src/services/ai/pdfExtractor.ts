/**
 * PDF Extractor for React Native
 *
 * Strategy:
 *  1. User picks a file via react-native-document-picker → gets a local URI.
 *  2. We read the file as base64 using react-native-blob-util.
 *  3. We pass the base64 to a hidden WebView that runs PDF.js in the browser.
 *  4. The WebView posts back the extracted text via onMessage.
 *
 * This file exports the WebView HTML (inject into a hidden <WebView>) and
 * the helper functions that drive the flow from the hook.
 *
 * Dependencies:
 *   npm install react-native-document-picker react-native-blob-util
 */

import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export interface PDFPickResult {
  uri: string;
  name: string;
  size: number;
}

/**
 * Opens the OS file picker filtered to PDFs.
 * Returns null if the user cancels.
 */
export async function pickPDF(): Promise<PDFPickResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return null;

    const file = result.assets[0];

    return {
      uri: file.uri,
      name: file.name,
      size: file.size ?? 0,
    };
  } catch (e) {
    throw e;
  }
}

/**
 * Reads a local PDF file and returns its content as a base64 string.
 * The base64 is injected into the hidden WebView for PDF.js extraction.
 */
export async function readPDFAsBase64(uri: string): Promise<string> {
  const file = new File(uri);

  const base64 = await file.base64();

  return base64;
}

/**
 * HTML to inject into a hidden <WebView>.
 * It loads PDF.js, accepts a base64 PDF via injectedJavaScript,
 * extracts all text, and posts it back with window.ReactNativeWebView.postMessage().
 *
 * Usage in component:
 *   <WebView
 *     source={{ html: getPDFExtractorHTML() }}
 *     injectedJavaScript={`window.pdfBase64="${base64}"; extractPDF();`}
 *     onMessage={(e) => handleExtractedText(e.nativeEvent.data)}
 *     style={{ width: 0, height: 0 }}
 *   />
 */
export function getPDFExtractorHTML(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  window.extractPDF = async function() {
    try {
      const raw = atob(window.pdfBase64);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

      const pdf = await pdfjsLib.getDocument({ data: arr }).promise;
      const totalPages = pdf.numPages;
      let fullText = '';

      for (let p = 1; p <= totalPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\\n';

        // Report progress
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'progress',
          page: p,
          total: totalPages,
          percent: Math.round((p / totalPages) * 100),
        }));
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'done',
        text: fullText,
        totalPages,
      }));
    } catch (err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        message: err.message,
      }));
    }
  };
</script>
</body>
</html>
  `.trim();
}

export type PDFExtractMessage =
  | { type: 'progress'; page: number; total: number; percent: number }
  | { type: 'done'; text: string; totalPages: number }
  | { type: 'error'; message: string };

/**
 * Parses a postMessage payload from the WebView extractor.
 */
export function parsePDFMessage(raw: string): PDFExtractMessage | null {
  try {
    return JSON.parse(raw) as PDFExtractMessage;
  } catch {
    return null;
  }
}
