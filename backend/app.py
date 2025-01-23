import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import logging

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)

# Port configuration for production (Render, etc.)
PORT = int(os.environ.get('PORT', 5000))

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route('/extract_pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_file = request.files['file']

    # Use a temporary directory for saving the uploaded PDF
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save the uploaded file in the temporary directory
            pdf_path = os.path.join(temp_dir, pdf_file.filename)
            pdf_file.save(pdf_path)

            # Extract text from PDF
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
            
            return jsonify({"text": full_text})

        except Exception as e:
            logging.error(f"Error processing PDF: {str(e)}")
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Disable debug mode for production
    app.run(host='0.0.0.0', port=PORT, debug=False)
