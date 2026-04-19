import { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/detect", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      alert("Error connecting to backend. Make sure FastAPI is running.");
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "white",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "Arial, sans-serif", padding: "20px" }}>

      <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
        🔍 Deepfake Detector
      </h1>
      <p style={{ color: "#aaa", marginBottom: "30px" }}>
        Upload an image to check if it is real or AI-generated
      </p>

      {/* Upload Box */}
      <div style={{ border: "2px dashed #444", borderRadius: "12px",
        padding: "30px", textAlign: "center", width: "100%", maxWidth: "480px",
        marginBottom: "20px", cursor: "pointer", background: "#1a1a1a" }}
        onClick={() => document.getElementById('fileInput').click()}>
        {preview ? (
          <img src={preview} alt="preview" style={{ maxWidth: "100%",
            maxHeight: "280px", borderRadius: "8px" }} />
        ) : (
          <div>
            <div style={{ fontSize: "3rem" }}>📁</div>
            <p style={{ color: "#aaa" }}>Click to upload an image</p>
          </div>
        )}
        <input id="fileInput" type="file" accept="image/*"
          style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* Detect Button */}
      <button onClick={handleDetect} disabled={!image || loading}
        style={{ background: image ? "#6c63ff" : "#333", color: "white",
          border: "none", padding: "12px 40px", borderRadius: "8px",
          fontSize: "1rem", cursor: image ? "pointer" : "not-allowed",
          marginBottom: "24px" }}>
        {loading ? "Analyzing..." : "Detect"}
      </button>

      {/* Result */}
      {result && (
        <div style={{ background: result.label === "REAL" ? "#0f2f0f" : "#2f0f0f",
          border: `2px solid ${result.label === "REAL" ? "#4caf50" : "#f44336"}`,
          borderRadius: "12px", padding: "24px", textAlign: "center",
          width: "100%", maxWidth: "480px" }}>
          <div style={{ fontSize: "3rem" }}>
            {result.label === "REAL" ? "✅" : "❌"}
          </div>
          <h2 style={{ color: result.label === "REAL" ? "#4caf50" : "#f44336",
            fontSize: "2rem", margin: "8px 0" }}>
            {result.label}
          </h2>
          <p style={{ color: "#ccc", fontSize: "1.1rem" }}>
            Confidence: <strong>{result.confidence}%</strong>
          </p>
          <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "8px" }}>
            {result.filename}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
