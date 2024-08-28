from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import os
import cv2
import numpy as np
from PIL import Image

# YOLOv5 Imports
from models.common import DetectMultiBackend
from utils.torch_utils import select_device
from utils.general import non_max_suppression, scale_coords
from utils.datasets import LoadImages

app = Flask(__name__)
CORS(app)

# Load YOLOv5 model
device = select_device('')
model = DetectMultiBackend('yolov5s.pt', device=device)  # Replace 'yolov5s.pt' with your YOLOv5 model file
stride, names, pt = model.stride, model.names, model.pt

# Load BERT model and tokenizer
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
bert_model = BertForSequenceClassification.from_pretrained('bert-base-uncased')

detected_objects = []

def detect_color(image, bbox):
    """Detects the dominant color within a bounding box in the image."""
    x1, y1, x2, y2 = map(int, bbox)
    cropped_img = image[y1:y2, x1:x2]
    avg_color = np.mean(cropped_img, axis=(0, 1)).astype(int)
    color_name = f"RGB({avg_color[0]}, {avg_color[1]}, {avg_color[2]})"
    return color_name

@app.route('/chat', methods=['POST'])
def chat():
    global detected_objects
    response = ""

    if 'image' in request.files:
        # Handle image upload for YOLOv5
        image = request.files['image']
        img_path = os.path.join('uploads', image.filename)
        image.save(img_path)
        img = cv2.imread(img_path)

        # Run YOLOv5 detection on the image
        dataset = LoadImages(img_path, img_size=640, stride=stride)
        detected_objects = []
        for path, img, im0s, vid_cap in dataset:
            img = torch.from_numpy(img).to(device)
            img = img.float()  # uint8 to fp16/32
            img /= 255.0       # 0 - 255 to 0.0 - 1.0
            if img.ndimension() == 3:
                img = img.unsqueeze(0)

            pred = model(img, augment=False, visualize=False)  # Adjust parameters as needed
            pred = non_max_suppression(pred, 0.25, 0.45, classes=None, agnostic=False)

            for i, det in enumerate(pred):  # detections per image
                if len(det):
                    det[:, :4] = scale_coords(img.shape[2:], det[:, :4], im0s.shape).round()
                    for *xyxy, conf, cls in reversed(det):
                        color = detect_color(im0s, xyxy)  # Detect color of the object
                        detected_objects.append({
                            "object": names[int(cls)],
                            "color": color,
                        })

        response = f"I detected the following objects: {', '.join([obj['object'] for obj in detected_objects])}"
    
    elif 'message' in request.json:
        user_input = request.json.get('message')

        # Check if the user is asking about the color of a detected object
        if 'color' in user_input and len(detected_objects) > 0:
            for obj in detected_objects:
                if obj['object'] in user_input.lower():
                    response = f"The color of the {obj['object']} is {obj['color']}."
                    break
            else:
                response = "I'm not sure about the color."

        else:
            # Use BERT for general text input
            inputs = tokenizer(user_input, return_tensors="pt", padding=True, truncation=True, max_length=128)
            outputs = bert_model(**inputs)
            logits = outputs.logits
            prediction = torch.argmax(logits, dim=-1).item()

            response = f"You said: {user_input}. Prediction class: {prediction}"

    return jsonify({"response": response})

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True)
