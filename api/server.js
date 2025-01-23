const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
require("dotenv").config(); // To load environment variables from a .env file

const app = express();
app.use(cors());
app.use(helmet()); // Adds security headers

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50MB (adjust as needed)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Hugging Face NER API endpoint and API token from environment variables
const HUGGINGFACE_NER_URL =
  "https://api-inference.huggingface.co/models/dbmdz/electra-large-discriminator-finetuned-conll03-english";
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// Function to extract details from NER response
function extractDetailsFromNER(nerResponse, originalText) {
  // (Same logic as before for extracting name, phone, address, etc.)
}

// Preprocess text into sections
function preprocessText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Call Hugging Face for NER processing
async function callHuggingFaceForSections(textSections) {
  const results = [];
  for (const section of textSections) {
    try {
      const nerResponse = await callHuggingFaceNER(section);
      results.push(...nerResponse);
    } catch (error) {
      console.error(`NER failed for section: ${section}`, error);
    }
  }
  return results;
}

// Call Hugging Face NER API
async function callHuggingFaceNER(extractedText) {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await axios.post(
        HUGGINGFACE_NER_URL,
        { inputs: extractedText },
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("NER Response:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      if (
        error.response?.data?.error?.includes("currently loading") &&
        retries < maxRetries
      ) {
        const estimatedTime = error.response?.data?.estimated_time || 10;
        console.log(
          `Model is loading. Retrying in ${estimatedTime.toFixed(2)} seconds...`
        );
        retries++;
        await new Promise((resolve) =>
          setTimeout(resolve, estimatedTime * 1000)
        );
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached. Model is still loading.");
}

// API endpoint to process the uploaded PDF
app.post("/process-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Create FormData for Python microservice
    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));

    // Extract text from Python service
    const pythonResponse = await axios.post(
      "http://localhost:5000/extract_pdf",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    const extractedText = pythonResponse.data.text;

    // Preprocess the text into sections
    const textSections = preprocessText(extractedText);

    // Process each section with Hugging Face NER
    const allNERResults = await callHuggingFaceForSections(textSections);

    // Extract details from NER results
    const details = extractDetailsFromNER(allNERResults, extractedText);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Send extracted details as JSON response
    res.json(details);
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// Port configuration using environment variables
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
