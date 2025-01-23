import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const PDFForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:3000/process-pdf",
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data);
      setFormData(response.data);
    } catch (err) {
      setError(
        `Error processing PDF: ${err.response?.data?.message || err.message}`
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>PDF Information Extractor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Upload PDF</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Extracted name will appear here"
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
              />
            </div>

            {loading && (
              <div className="text-center text-blue-600">Processing PDF...</div>
            )}

            {error && <div className="text-center text-red-600">{error}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFForm;
