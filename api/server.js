const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const helmet = require("helmet");

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://pdf-extract-api-2hqu.onrender.com",
      "https://pdf-extract-3251.onrender.com",
    ], // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet()); // Adds security headers

// Configure multer for file uploads using memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 50MB
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
  const details = {
    name: "",
    phone: "",
    address: "",
    street: "",
    floor: "",
    city: "",
    state: "",
    country: "",
  };

  if (!nerResponse || !Array.isArray(nerResponse)) {
    console.error("Invalid NER response:", nerResponse);
    throw new Error("NER response is invalid or missing required fields.");
  }

  // Extract name from NER response
  const nameEntities = nerResponse.filter(
    (entity) => entity.entity_group === "PER" && entity.score > 0.7
  );

  if (nameEntities.length > 0) {
    const nameWords = nameEntities.map((entity) =>
      entity.word
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ")
    );
    details.name = nameWords.join(" ").trim();
  }

  // Phone number extraction with formatting
  const phonePatterns = [
    /\+?(\d{1,3})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}/,
  ];

  for (const pattern of phonePatterns) {
    const phoneMatch = originalText.match(pattern);
    if (phoneMatch) {
      let phoneNumber = phoneMatch[0].replace(/[^0-9+\(\)\-\s]/g, "");
      phoneNumber = phoneNumber.replace(
        /(\d{1,3})(\d{3})(\d{4})/,
        "+$1 ($2) $3-$4"
      );
      details.phone = phoneNumber;
      break;
    }
  }

  // Address extraction
  const addressRegex = /Address\s*[:\s]*([\w\s,\.0-9]+)(?=\nRole|$)/i;
  const addressMatch = originalText.match(addressRegex);

  if (addressMatch) {
    details.address = addressMatch[1].trim();

    const streetPattern = /(\d{1,5}\s[\w\s]+)/;
    const floorPattern = /(\d+)(st|nd|rd|th)\sFloor/;
    const cityStateCountryPattern =
      /([A-Za-z\s]+),\s([A-Z]{2})\s(\d{5}(-\d{4})?),\s([A-Za-z\s]+)/;

    const streetMatch = details.address.match(streetPattern);
    const floorMatch = details.address.match(floorPattern);
    const cityStateCountryMatch = details.address.match(
      cityStateCountryPattern
    );

    if (streetMatch) {
      details.street = streetMatch[1].trim();
    }
    if (floorMatch) {
      details.floor = floorMatch[0].trim();
    }
    if (cityStateCountryMatch) {
      details.city = cityStateCountryMatch[1].trim();
      details.state = cityStateCountryMatch[2].trim();
      details.country = cityStateCountryMatch[5].trim();
    }
  }

  return details;
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

// Call Hugging Face NER API with retry logic
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
        const estimatedTime = error.response?.data?.estimated_time || 54; // Default to 54 seconds if not provided
        console.log(
          `Model is loading. Retrying in ${estimatedTime.toFixed(2)} seconds...`
        );

        // Instead of throwing an error, return a message
        if (retries === 0) {
          return {
            loading: true,
            message: `The model is currently loading. Please wait ${estimatedTime} seconds and try again.`,
          };
        }

        retries++;
        await new Promise((resolve) =>
          setTimeout(resolve, estimatedTime * 1000)
        );
      } else {
        throw error; // Rethrow the error for handling in the route
      }
    }
  }
  throw new Error("Max retries reached. Model is still loading.");
}

// API endpoint to process the uploaded PDF
app.post("/process-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Extract text from Python service using the buffer directly
  const formData = new FormData();
  formData.append("file", req.file.buffer, {
    filename: req.file.originalname,
  }); // Use buffer directly

  try {
    // Use Axios to post the form data to the Python service
    const pythonResponse = await axios.post(
      "https://pdf-extract-3251.onrender.com/extract_pdf",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    const extractedText = pythonResponse.data.text; // Define extractedText here

    // Preprocess the text into sections
    const textSections = preprocessText(extractedText);

    // Process each section with Hugging Face NER
    const allNERResults = await callHuggingFaceForSections(textSections);

    // Check if the response indicates loading
    if (allNERResults.loading) {
      return res.status(503).json({
        error: allNERResults.message,
      });
    }

    // Extract details from NER results
    const details = extractDetailsFromNER(allNERResults, extractedText); // Use extractedText here

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
