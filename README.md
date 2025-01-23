
# PDF Information Extractor

A web application that allows users to upload PDF files and extract information such as names, phone numbers, and addresses using a Node.js backend and Hugging Face's Named Entity Recognition (NER) API.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- Upload PDF files for processing.
- Extracts names, phone numbers, and addresses from the uploaded PDFs.
- Displays extracted information in a user-friendly interface.
- Handles errors and provides feedback during processing.

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Multer, Axios
- **API**: Hugging Face NER API
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Hugging Face API token (for NER processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root of your project and add your Hugging Face API token:
     ```
     HUGGINGFACE_API_TOKEN=your_api_token_here
     ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000` to access the application.

3. Upload a PDF file using the provided form, and the extracted information will be displayed.

## API Endpoints

### POST `/process-pdf`

- **Description**: Uploads a PDF file and processes it to extract information.
- **Request**:
  - Form-data with a key named `file` containing the PDF file.
- **Response**:
  - JSON object containing extracted details (`name`, `phone`, `address`).

## Deployment

This application is deployed on Vercel. You can access the live application at:

[PDF Information Extractor](https://pdf-extract-frontend.vercel.app)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
