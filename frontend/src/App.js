import { useState, useRef } from "react";

const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080810;
    font-family: 'Syne', sans-serif;
    color: #e8e8f0;
    min-height: 100vh;
  }

  .bg-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(108,99,255,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(108,99,255,0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .bg-glow {
    position: fixed;
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .container {
    position: relative;
    z-index: 1;
    max-width: 560px;
    margin: 0 auto;
    padding: 48px 24px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  .badge {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: #6c63ff;
    border: 1px solid rgba(108,99,255,0.4);
    padding: 4px 12px;
    border-radius: 2px;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .title {
    font-size: 2.8rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    background: linear-gradient(135deg, #ffffff 0%, #a0a0c0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
  }

  .subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: #666680;
    letter-spacing: 0.05em;
  }

  .upload-zone {
    width: 100%;
    border: 1px solid rgba(108,99,255,0.3);
    border-radius: 4px;
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    background: rgba(108,99,255,0.04);
    transition: all 0.3s ease;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
  }

  .upload-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(108,99,255,0.08) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .upload-zone:hover {
    border-color: rgba(108,99,255,0.6);
    background: rgba(108,99,255,0.08);
  }

  .upload-zone:hover::before { opacity: 1; }

  .upload-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
    display: block;
  }

  .upload-text {
    font-size: 0.95rem;
    color: #9090b0;
    margin-bottom: 4px;
  }

  .upload-hint {
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    color: #44445a;
    letter-spacing: 0.05em;
  }

  .preview-img {
    max-width: 100%;
    max-height: 280px;
    border-radius: 2px;
    display: block;
    margin: 0 auto;
  }

  .detect-btn {
    width: 100%;
    padding: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }

  .detect-btn.active {
    background: #6c63ff;
    color: white;
  }

  .detect-btn.active:hover {
    background: #7c73ff;
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(108,99,255,0.4);
  }

  .detect-btn.active:active {
    transform: translateY(0);
  }

  .detect-btn.disabled {
    background: #1a1a28;
    color: #44445a;
    cursor: not-allowed;
  }

  .detect-btn.loading {
    background: #3a3560;
    color: #9090c0;
    cursor: wait;
  }

  .result-card {
    width: 100%;
    border-radius: 4px;
    overflow: hidden;
    animation: slideUp 0.4s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .result-header {
    padding: 32px 24px;
    text-align: center;
    position: relative;
  }

  .result-header.real {
    background: linear-gradient(135deg, #0a1f0a 0%, #0f1a0f 100%);
    border: 1px solid rgba(74,197,80,0.3);
  }

  .result-header.fake {
    background: linear-gradient(135deg, #1f0a0a 0%, #1a0f0f 100%);
    border: 1px solid rgba(244,67,54,0.3);
  }

  .result-header.uncertain {
    background: linear-gradient(135deg, #1f180a 0%, #1a150f 100%);
    border: 1px solid rgba(255,152,0,0.3);
  }

  .verdict-label {
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 8px;
    opacity: 0.6;
  }

  .verdict-text {
    font-size: 3.5rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 16px;
  }

  .verdict-text.real  { color: #4ac550; }
  .verdict-text.fake  { color: #f44336; }
  .verdict-text.uncertain { color: #ff9800; }

  .confidence-ring {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    color: #9090b0;
  }

  .confidence-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #e8e8f0;
  }

  .face-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
    padding: 5px 12px;
    border-radius: 2px;
    margin-top: 16px;
  }

  .face-badge.detected {
    background: rgba(74,197,80,0.1);
    border: 1px solid rgba(74,197,80,0.3);
    color: #4ac550;
  }

  .face-badge.not-detected {
    background: rgba(244,67,54,0.1);
    border: 1px solid rgba(244,67,54,0.3);
    color: #f44336;
  }

  .breakdown {
    background: #0d0d18;
    border: 1px solid #1a1a2e;
    border-top: none;
    padding: 24px;
  }

  .breakdown-title {
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: #44445a;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .score-row {
    margin-bottom: 16px;
  }

  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .score-label {
    font-size: 0.85rem;
    color: #9090b0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .score-value {
    font-family: 'Space Mono', monospace;
    font-size: 0.8rem;
    color: #e8e8f0;
  }

  .score-track {
    height: 4px;
    background: #1a1a2e;
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .filename {
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    color: #33334a;
    text-align: center;
    padding: 12px 24px;
    background: #0d0d18;
    border: 1px solid #1a1a2e;
    border-top: 1px solid #111120;
    letter-spacing: 0.05em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-section {
    width: 100%;
    margin-top: 48px;
  }

  .history-title {
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: #44445a;
    text-transform: uppercase;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .clear-btn {
    background: none;
    border: 1px solid #1a1a2e;
    color: #44445a;
    font-family: 'Space Mono', monospace;
    font-size: 0.6rem;
    padding: 3px 8px;
    cursor: pointer;
    letter-spacing: 0.1em;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    border-color: #f44336;
    color: #f44336;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #0d0d18;
    border: 1px solid #1a1a2e;
    border-radius: 2px;
    margin-bottom: 8px;
    transition: border-color 0.2s;
  }

  .history-item:hover { border-color: #2a2a3e; }

  .history-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .history-info { flex: 1; min-width: 0; }

  .history-name {
    font-size: 0.82rem;
    color: #9090b0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
  }

  .history-meta {
    font-family: 'Space Mono', monospace;
    font-size: 0.65rem;
    color: #33334a;
  }

  .history-verdict {
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
`;
document.head.appendChild(style);

function ScoreBar({ label, emoji, score }) {
  const color = score >= 50 ? "#4ac550" : "#f44336";
  return (
    <div className="score-row">
      <div className="score-header">
        <span className="score-label">{emoji} {label}</span>
        <span className="score-value">{score}%</span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export default function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDetect = async () => {
    if (!image || loading) return;
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
      setHistory(prev => [{
        ...data,
        timestamp: new Date().toLocaleTimeString(),
        preview: preview
      }, ...prev.slice(0, 9)]);
    } catch {
      alert("Cannot connect to backend. Make sure FastAPI is running.");
    }
    setLoading(false);
  };

  const labelClass = result?.label?.toLowerCase() || '';

  return (
    <>
      <div className="bg-grid" />
      <div className="bg-glow" />
      <div className="container">

        {/* Header */}
        <div className="header">
          <div className="badge">AI Forensics Tool</div>
          <h1 className="title">Deepfake<br />Detector</h1>
          <p className="subtitle">FACE MODEL · PICTURE MODEL · ELA ANALYSIS</p>
        </div>

        {/* Upload Zone */}
        <div
          className="upload-zone"
          style={{ borderColor: dragOver ? 'rgba(108,99,255,0.8)' : undefined }}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <img src={preview} alt="preview" className="preview-img" />
          ) : (
            <>
              <span className="upload-icon">⬆</span>
              <p className="upload-text">Drop image or click to upload</p>
              <p className="upload-hint">JPG · PNG · WEBP · GIF</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*"
            style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {/* Detect Button */}
        <button
          className={`detect-btn ${loading ? 'loading' : image ? 'active' : 'disabled'}`}
          onClick={handleDetect}
          disabled={!image || loading}
        >
          {loading ? '[ ANALYZING... ]' : image ? '[ RUN ANALYSIS ]' : '[ SELECT IMAGE FIRST ]'}
        </button>

        {/* Result */}
        {result && (
          <div className="result-card">
            <div className={`result-header ${labelClass}`}>
              <p className="verdict-label">Analysis Result</p>
              <p className={`verdict-text ${labelClass}`}>{result.label}</p>
              <div className="confidence-ring">
                <span>Confidence</span>
                <span className="confidence-value">{result.confidence}%</span>
              </div>
              <br />
              <span className={`face-badge ${result.face_detected ? 'detected' : 'not-detected'}`}>
                {result.face_detected ? '● FACE DETECTED' : '○ NO FACE DETECTED'}
              </span>
            </div>

            <div className="breakdown">
              <p className="breakdown-title">Analysis Breakdown</p>

              {result.face_score !== null && result.face_score !== undefined && (
                <ScoreBar label="Face Model" emoji="🧠" score={result.face_score} />
              )}
              <ScoreBar label="Picture Model" emoji="🖼️" score={result.picture_score} />
              <ScoreBar label="ELA Analysis" emoji="🔬"
                score={Math.round((1 - result.ela_score / 100) * 100)} />
            </div>

            <div className="filename">{result.filename}</div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-title">
              <span>Recent Analyses</span>
              <button className="clear-btn" onClick={() => setHistory([])}>CLEAR</button>
            </div>
            {history.map((item, i) => (
              <div className="history-item" key={i}>
                <div className="history-dot" style={{
                  background: item.label === 'REAL' ? '#4ac550' :
                              item.label === 'FAKE' ? '#f44336' : '#ff9800'
                }} />
                <div className="history-info">
                  <p className="history-name">{item.filename}</p>
                  <p className="history-meta">{item.timestamp} · {item.confidence}% confidence</p>
                </div>
                <span className="history-verdict" style={{
                  color: item.label === 'REAL' ? '#4ac550' :
                         item.label === 'FAKE' ? '#f44336' : '#ff9800'
                }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}