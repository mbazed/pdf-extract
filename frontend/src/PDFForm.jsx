import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Spinner from "./components/Spinner";

const PDFForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // State to hold the selected file

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file.name); // Set the name of the selected file
    setLoading(true);
    setError("");

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await axios.post(
        "https://pdf-extract-api-2hqu.onrender.com/process-pdf",
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data);
      setFormData(response.data); // Set extracted data

      // Optionally clear the file input and reset form data
      event.target.value = null; // Clear the file input
      setSelectedFile(null); // Reset the selected file
    } catch (err) {
      setError(
        `Error processing PDF: ${err.response?.data?.error || err.message}`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            PDF Information Extractor
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload a PDF to extract information.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload PDF</Label>
              <div className="flex items-center justify-between">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden" // Hide the default input
                />
                <Button
                  onClick={() => document.getElementById("file").click()} // Trigger file input click
                  className="bg-black text-white"
                >
                  Browse
                </Button>
                <span className="text-gray-600">{selectedFile || "No file selected"}</span> {/* Display selected file name */}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Extracted name will appear here"
                readOnly // Make it read-only since it's extracted
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Extracted phone number will appear here"
                readOnly // Make it read-only since it's extracted
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Extracted address will appear here"
                readOnly // Make it read-only since it's extracted
              />
            </div>

            {loading && (
              <div className="flex justify-center">
                <Spinner /> {/* Display the spinner while loading */}
              </div>
            )}

            {error && (
              <div className="text-center text-red-600 font-semibold">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFForm;
