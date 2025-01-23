import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Port configuration for production (Render, etc.)
PORT = int(os.environ.get('PORT', 5000))

@app.route('/extract_pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    pdf_file = request.files['file']
    
    # Ensure uploads directory exists (change path if using external storage)
    os.makedirs('uploads', exist_ok=True)
    
    # Save the uploaded PDF
    pdf_path = os.path.join('uploads', pdf_file.filename)
    pdf_file.save(pdf_path)
    
    try:
        # Extract text from PDF
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += page.extract_text() or ""
        
        return jsonify({"text": full_text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up the uploaded file after processing (ensure permissions on cloud storage)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

if __name__ == '__main__':
    # Disable debug mode for production
    app.run(host='0.0.0.0', port=PORT, debug=False)
