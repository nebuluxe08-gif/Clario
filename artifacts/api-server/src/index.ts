import { Router, type IRouter } from "express";
import multer, { type FileFilterCallback } from "multer";
import mammoth from "mammoth";
import type { Request } from "express";
// @ts-ignore
import PDFParser from "pdf2json";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const name = file.originalname.toLowerCase();
    if (name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only PDF, DOC, and DOCX files are accepted."));
    }
  },
});

// Clean promise-based wrapper using your pre-installed pdf2json library
function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData?.parserError || "Failed to parse PDF content"));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText || "");
      } catch (err) {
        reject(err);
      }
    });

    try {
      pdfParser.parseBuffer(buffer);
    } catch (err) {
      reject(err);
    }
  });
}

router.post("/extract-text", upload.single("file"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded. Please attach a PDF or DOCX file." });
    return;
  }

  const filename = file.originalname.toLowerCase();

  try {
    let text = "";

    if (filename.endsWith(".pdf") || file.mimetype === "application/pdf") {
      text = await extractPdfText(file.buffer);
    } else if (
      filename.endsWith(".docx") ||
      filename.endsWith(".doc") ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value ?? "";
    } else {
      res.status(400).json({ error: "Unsupported file type. Please upload a PDF or DOCX file." });
      return;
    }

    const cleaned = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/\f/g, "\n\n")
      .trim();

    if (!cleaned) {
      res.status(422).json({
        error: "No readable text found. The file may be a scanned image, password-protected, or contain only graphics.",
      });
      return;
    }

    res.json({
      text: cleaned,
      filename: file.originalname,
      charCount: cleaned.length,
      wordCount: cleaned.split(/\s+/).filter(Boolean).length,
    });
  } catch (err) {
    if (req.log && typeof req.log.error === "function") {
      req.log.error({ err }, "Failed to extract text from file");
    } else {
      console.error("Failed to extract text from file", err);
    }
    res.status(500).json({ error: "Failed to extract text from the uploaded file. Please try a different file." });
  }
});

export default router;
