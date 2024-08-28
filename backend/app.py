from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification, GPT2Tokenizer, GPT2LMHeadModel
import os
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
bert_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
bert_model = BertForSequenceClassification.from_pretrained('bert-base-uncased')

# Load GPT-2 model and tokenizer
gpt2_tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
gpt2_model = GPT2LMHeadModel.from_pretrained('gpt2')

@app.route('/chat', methods=['POST'])
def chat():
    response = ""
    detected_objects = []

    if 'image' in request.files:
        # Handle image upload for YOLOv5
        image = request.files['image']
        img_path = os.path.join('uploads', image.filename)
        image.save(img_path)

        # Run YOLOv5 detection on the image
        dataset = LoadImages(img_path, img_size=640, stride=stride)
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
                        detected_objects.append({
                            "object": names[int(cls)],
                            "color": "unknown",  # Placeholder for color detection logic
                        })

        response = f"I detected the following objects: {', '.join([obj['object'] for obj in detected_objects])}"
    
    elif 'message' in request.json:
        user_input = request.json.get('message')

        # Simple rule-based system to answer questions about detected objects
        if 'color' in user_input and len(detected_objects) > 0:
            for obj in detected_objects:
                if obj['object'] in user_input:
                    response = f"The color of the {obj['object']} is {obj['color']}."
                    break
            else:
                response = "I'm not sure about the color."

        else:
            # BERT for intent classification
            inputs = bert_tokenizer(user_input, return_tensors="pt", padding=True, truncation=True, max_length=128)
            outputs = bert_model(**inputs)
            logits = outputs.logits
            prediction = torch.argmax(logits, dim=-1).item()

            # GPT-2 for response generation
            gpt2_input = gpt2_tokenizer.encode(f"User intent: {prediction}. User said: {user_input}", return_tensors="pt")
            gpt2_output = gpt2_model.generate(gpt2_input, max_length=150, num_return_sequences=1, pad_token_id=gpt2_tokenizer.eos_token_id)
            gpt2_response = gpt2_tokenizer.decode(gpt2_output[0], skip_special_tokens=True)

            response = gpt2_response

    return jsonify({"response": response})

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(debug=True)
