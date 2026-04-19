from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import torch.nn as nn
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def build_model(weights_path):
    model = models.efficientnet_b0(weights=None)
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(1280, 256),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(256, 1),
        nn.Sigmoid()
    )
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.to(device)
    model.eval()
    return model

face_model    = build_model('deepfake_detector_v2.pth')
picture_model = build_model('picture_model.pth')
print("Both models loaded!")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def predict(model, image):
    tensor = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(tensor)
    return output.item()

@app.get("/")
def root():
    return {"message": "Deepfake Detector API is running"}

@app.post("/api/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')

    # Get scores from both models
    face_score    = predict(face_model, image)
    picture_score = predict(picture_model, image)

    # Each model votes independently
    face_label    = "REAL" if face_score >= 0.5 else "FAKE"
    picture_label = "REAL" if picture_score >= 0.5 else "FAKE"

    # Both agree → use average confidence
    if face_label == picture_label:
        label = face_label
        if label == "REAL":
            confidence = (face_score + picture_score) / 2
        else:
            confidence = ((1 - face_score) + (1 - picture_score)) / 2

    else:
        # Disagree → trust face model since it has higher accuracy (88% vs 92%)
        # but lower confidence means uncertain
        label = face_label
        if label == "REAL":
            confidence = face_score * 0.7
        else:
            confidence = (1 - face_score) * 0.7

    return {
        "label": label,
        "confidence": round(confidence * 100, 2),
        "face_score": round(face_score * 100, 2),
        "picture_score": round(picture_score * 100, 2),
        "filename": file.filename
    }