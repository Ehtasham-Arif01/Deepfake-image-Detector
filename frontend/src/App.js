import { useState } from "react";

function ScoreBar({ label, emoji, score, invert = false }) {
  const value = invert ? 100 - score : score;
  const color = value >= 50 ? "#4caf50" : "#f44336";
  return (
    <div style={{ marginBottom: "12px", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ color: "#ccc", fontSize: "0.9rem" }}>{emoji} {label}</span>
        <span style={{ color: "#ccc", fontSize: "0.9rem" }}>{score}%</span>
      </div>
      <div style={{ background: "#333", borderRadius: "4px", height: "8px" }}>
        <div style={{ background: color, width: `${value}%`,
          height: "100%", borderRadius: "4px", transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

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

  const getColor = (label) => {
    if (label === "REAL") return "#4caf50";
    if (label === "FAKE") return "#f44336";
    return "#ff9800";
  };

  const getEmoji = (label) => {
    if (label === "REAL") return "✅";
    if (label === "FAKE") return "❌";
    return "⚠️";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "white",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "Arial, sans-serif", padding: "20px" }}>

      <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>🔍 Deepfake Detector</h1>
      <p style={{ color: "#aaa", marginBottom: "8px", textAlign: "center" }}>
        Triple analysis — Face Model + Picture Model + ELA
      </p>

      {/* Upload Box */}
      <div style={{ border: "2px dashed #444", borderRadius: "12px",
        padding: "30px", textAlign: "center", width: "100%", maxWidth: "480px",
        marginBottom: "20px", cursor: "pointer", background: "#1a1a1a" }}
        onClick={() => document.getElementById('fileInput').click()}>
        {preview ? (
          <img src={preview} alt="preview" style={{ maxWidth: "100%",
            maxHeight: "260px", borderRadius: "8px" }} />
        ) : (
          <div>
            <div style={{ fontSize: "3rem" }}>📁</div>
            <p style={{ color: "#aaa" }}>Click to upload an image</p>
            <p style={{ color: "#666", fontSize: "0.8rem" }}>JPG, PNG, WEBP supported</p>
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
          marginBottom: "24px", transition: "background 0.3s" }}>
        {loading ? "⏳ Analyzing..." : "🔍 Detect"}
      </button>

      {/* Result */}
      {result && (
        <div style={{ background: "#1a1a1a", border: `2px solid ${getColor(result.label)}`,
          borderRadius: "12px", padding: "24px", textAlign: "center",
          width: "100%", maxWidth: "480px" }}>

          {/* Verdict */}
          <div style={{ fontSize: "3rem" }}>{getEmoji(result.label)}</div>
          <h2 style={{ color: getColor(result.label), fontSize: "2rem", margin: "8px 0" }}>
            {result.label}
          </h2>
          <p style={{ color: "#ccc", fontSize: "1.1rem", marginBottom: "8px" }}>
            Confidence: <strong>{result.confidence}%</strong>
          </p>

          {/* Face detected badge */}
          <div style={{ display: "inline-block", background: result.face_detected ? "#1a3a1a" : "#3a1a1a",
            border: `1px solid ${result.face_detected ? "#4caf50" : "#f44336"}`,
            borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem",
            color: result.face_detected ? "#4caf50" : "#f44336", marginBottom: "20px" }}>
            {result.face_detected ? "👤 Face Detected" : "🖼️ No Face Detected"}
          </div>

          <hr style={{ border: "1px solid #333", marginBottom: "16px" }} />

          {/* Score bars */}
          <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "12px" }}>
            Analysis Breakdown
          </p>

          {result.face_score !== null && (
            <ScoreBar label="Face Model" emoji="🧠"
              score={result.face_score} />
          )}

          <ScoreBar label="Picture Model" emoji="🖼️"
            score={result.picture_score} />

          <ScoreBar label="ELA (Manipulation)" emoji="🔬"
            score={result.ela_score} invert={true} />

          <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "16px" }}>
            {result.filename}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;