import { Router, type IRouter } from "express";
import multer, { type FileFilterCallback } from "multer";
import mammoth from "mammoth";
import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Request } from "express";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith(".pdf") || ext.endsWith(".doc") || ext.endsWith(".docx")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only PDF, DOC, and DOCX files are accepted."));
    }
  },
});

function runPdfToText(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "pdftotext",
      ["-enc", "UTF-8", "-layout", pdfPath, "-"],
      { maxBuffer: 50 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const tmpPath = join(tmpdir(), `clario_${randomUUID()}.pdf`);
  try {
    await writeFile(tmpPath, buffer);
    return await runPdfToText(tmpPath);
  } finally {
    await unlink(tmpPath).catch(() => {/* ignore cleanup errors */});
  }
}

router.post("/extract-text", upload.single("file"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
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
        error: "No text could be extracted. The file may be image-only, scanned, or password-protected.",
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
    req.log.error({ err }, "Failed to extract text from file");
    res.status(500).json({ error: "Failed to extract text from the uploaded file." });
  }
});

export default router;
