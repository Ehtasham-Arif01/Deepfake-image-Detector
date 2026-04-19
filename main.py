from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image, ImageChops, ImageEnhance
import torch.nn as nn
import io
import numpy as np
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ── Build model ──
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

# ── Image transform ──
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# ── ELA Analysis ──
def ela_analysis(image, quality=90):
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG', quality=quality)
    buffer.seek(0)
    compressed = Image.open(buffer)

    ela_image = ImageChops.difference(image, compressed)
    extrema = ela_image.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    if max_diff == 0:
        max_diff = 1

    scale = 255.0 / max_diff
    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)

    # Convert to numpy and get mean error
    ela_array = np.array(ela_image)
    ela_score = float(np.mean(ela_array)) / 255.0

    # High ELA score = more inconsistencies = more likely fake
    # Normalize: typical real images have low ELA (0.0-0.2)
    # Fake images tend to have higher ELA (0.2-0.5+)
    fake_probability = min(ela_score * 3.5, 1.0)
    return round(fake_probability, 4)

# ── Face detection ──
def detect_face(image):
    img_array = np.array(image)
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1,
                                           minNeighbors=5, minSize=(30, 30))
    return faces

# ── Crop face ──
def crop_face(image, faces):
    if len(faces) == 0:
        return image
    x, y, w, h = faces[0]
    margin = int(0.2 * w)
    x1 = max(0, x - margin)
    y1 = max(0, y - margin)
    x2 = min(image.width,  x + w + margin)
    y2 = min(image.height, y + h + margin)
    return image.crop((x1, y1, x2, y2))

# ── Model predict ──
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

    # ── ELA Score ──
    ela_fake_prob = ela_analysis(image)

    # ── Face Detection ──
    faces = detect_face(image)
    face_detected = len(faces) > 0

    if face_detected:
        # Crop and run face model
        face_image = crop_face(image, faces)
        face_score = predict(face_model, face_image)

        # Also run picture model on full image
        picture_score = predict(picture_model, image)

        # Combine: face model 60%, picture model 25%, ELA 15%
        real_probability = (face_score * 0.60) + (picture_score * 0.25) + ((1 - ela_fake_prob) * 0.15)

    else:
        # No face — use picture model + ELA only
        picture_score = predict(picture_model, image)
        face_score = None

        # Combine: picture model 70%, ELA 30%
        real_probability = (picture_score * 0.70) + ((1 - ela_fake_prob) * 0.30)

    # ── Final verdict ──
    if real_probability >= 0.65:
        label = "REAL"
        confidence = real_probability
    elif real_probability <= 0.35:
        label = "FAKE"
        confidence = 1 - real_probability
    else:
        label = "UNCERTAIN"
        confidence = abs(real_probability - 0.5) * 2

    return {
        "label": label,
        "confidence": round(confidence * 100, 2),
        "face_detected": face_detected,
        "face_score": round(face_score * 100, 2) if face_score is not None else None,
        "picture_score": round(picture_score * 100, 2),
        "ela_score": round(ela_fake_prob * 100, 2),
        "filename": file.filename
    }