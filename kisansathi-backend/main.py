from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import json
import random
from database import client, db, users_collection, rover_collection, history_collection, fields_collection
from security import get_password_hash, verify_password, create_access_token, get_current_user_id

app = FastAPI(title="Kisansathi API")

# --- DATA MODELS ---
class UserCreate(BaseModel):
    name: str
    phone: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

class SocialLogin(BaseModel):
    provider: str
    email: str
    name: str

class ProfileUpdate(BaseModel):
    photo_base64: str

# NEW: How the Jetson Nano will format its scan data
class ScanData(BaseModel):
    image_url: str
    plant_name: str
    disease: str
    severity: str
    confidence: str
    medicine: str
    location: str

class Coordinate(BaseModel):
    latitude: float
    longitude: float

class FieldData(BaseModel):
    field_name: str
    path_coordinates: List[Coordinate]
    user_phone: Optional[str] = None

# --- AUTHENTICATION ROUTES ---
@app.get("/")
async def root():
    return {"message": "Kisansathi Backend is running!"}

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    existing_user = await users_collection.find_one({"phone": user.phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "name": user.name,
        "phone": user.phone,
        "password": hashed_password,
        "role": "farmer"
    }
    await users_collection.insert_one(user_dict)
    return {"message": "Farmer registered successfully!"}

@app.post("/login")
async def login_user(user: UserLogin):
    db_user = await users_collection.find_one({"phone": user.phone})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.phone})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "name": db_user["name"],
        "message": "Login successful"
    }

@app.post("/auth/social")
async def social_login(user: SocialLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        user_dict = {
            "name": user.name,
            "email": user.email,
            "provider": user.provider,
            "role": "farmer"
        }
        await users_collection.insert_one(user_dict)
        db_user = user_dict
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "name": db_user["name"],
        "message": f"Login with {user.provider} successful"
    }

# --- ROVER DATA ROUTES ---

# 1. Jetson Nano sends data HERE
@app.post("/rover/scan", status_code=status.HTTP_201_CREATED)
async def receive_rover_scan(scan: ScanData):
    scan_dict = scan.dict()
    scan_dict["id"] = str(uuid.uuid4()) # Generate a unique ID for the app
    scan_dict["timestamp"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    scan_dict["type"] = "rover"
    
    # Save directly to the MongoDB 'scans' collection
    await rover_collection.insert_one(scan_dict)
    
    return {"message": "Scan data saved to database successfully!", "id": scan_dict["id"]}

# 2. React Native App fetches data from HERE
@app.get("/rover/scans")
async def get_rover_scans(user_id: str = Depends(get_current_user_id)):
    # Fetch all scans, sort by newest first, limit to the latest 50
    cursor = rover_collection.find().sort("timestamp", -1).limit(50)
    scans = await cursor.to_list(length=50)
    
    # MongoDB uses '_id' which isn't standard JSON, so we remove it before sending to the app
    for scan in scans:
        scan["_id"] = str(scan["_id"])
        
    return scans

# --- FIELD TRACKING ROUTES ---

@app.post("/field/save", status_code=status.HTTP_201_CREATED)
async def save_field_path(field: FieldData):
    field_dict = field.dict()
    field_dict["id"] = str(uuid.uuid4())
    field_dict["timestamp"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    await fields_collection.insert_one(field_dict)
    return {"message": "Field tracking data saved to database successfully!", "id": field_dict["id"]}

@app.get("/field/history/{phone}")
async def get_field_history(phone: str):
    cursor = fields_collection.find({"user_phone": phone}).sort("timestamp", -1)
    fields = await cursor.to_list(length=100)
    for field in fields:
        field["_id"] = str(field["_id"])
        
    return fields
    return fields

# --- TENSORFLOW DIAGNOSTICS ROUTES ---

@app.post("/analyze/disease", status_code=status.HTTP_200_OK)
async def analyze_disease(
    crop_name: str = Form(...), 
    disease_data: str = Form(...),
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    content = await image.read()
    
    # Accurate PlantVillage Class Mapping (alphabetical order)
    PLANT_CLASSES = [
        "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
        "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
        "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", 
        "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot", 
        "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
        "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
        "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight", 
        "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
        "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
        "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
        "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite",
        "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
        "Tomato___healthy", "background"
    ]

    try:
        import tensorflow as tf
        import numpy as np
        from io import BytesIO
        from PIL import Image
        
        # 1. Load TFLite Model (more robust for pre-trained weights)
        model_path = "plant-disease-repo/model/model.tflite"
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        input_shape = input_details[0]['shape'] # Usually [1, 200, 200, 3]
        
        # 2. Image Preprocessing
        img = Image.open(BytesIO(content)).convert('RGB').resize((input_shape[1], input_shape[2]))
        img_array = np.array(img).astype(np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # 3. Inference
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])
        
        class_idx = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0])) * 100
        predicted_class_name = PLANT_CLASSES[class_idx]
        
        # 4. Map to app knowledge base
        diseases = json.loads(disease_data)
        match = None
        
        # Keyword matching for better UX
        for d in diseases:
            clean_db_name = d["name"].lower().replace(" ", "_").replace("(", "").replace(")", "")
            clean_pred_name = predicted_class_name.lower().replace(" ", "_")
            if clean_db_name in clean_pred_name or clean_pred_name in clean_db_name:
                match = d
                break
        
        if not match:
            # Check for general crop match if specific disease doesn't match
            if crop_name.lower() in predicted_class_name.lower():
                # If we detected the right crop but a different disease, show the first available disease info but with model title
                match = diseases[0]
            
        result = {
            "disease": match["name"] if match else predicted_class_name.replace("___", ": ").replace("_", " "),
            "confidence": f"{confidence:.1f}",
            "medicine": match["medicine"] if match else "Check local agricultural stores for specific remedies.",
            "prevention": match["prevention"] if match else "Ensure proper soil moisture and airflow.",
            "symptomsDetected": match["symptoms"] if match else f"Detected signs of {predicted_class_name.split('___')[-1].replace('_', ' ')}."
        }
        
        # PERSIST TO HISTORY
        history_item = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "manual",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "crop_name": crop_name,
            "disease": result["disease"],
            "confidence": result["confidence"],
            "medicine": result["medicine"],
            "prevention": result["prevention"],
            "symptoms": result["symptomsDetected"]
        }
        await history_collection.insert_one(history_item)
        
        return result
        
    except Exception as e:
        print(f"Inference Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Plant diagnostic engine failed to analyze the image. Please ensure the plant is clearly visible and try again."
        )

# NEW: Unified History Endpoint
@app.get("/history/all")
async def get_all_history(user_id: str = Depends(get_current_user_id)):
    # 1. Fetch Manual Scans
    cursor_manual = history_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(50)
    manual_scans = await cursor_manual.to_list(length=50)
    for s in manual_scans: s["_id"] = str(s["_id"])
    
    # 2. Fetch Rover Scans
    cursor_rover = rover_collection.find().sort("timestamp", -1).limit(50)
    rover_scans = await cursor_rover.to_list(length=50)
    for s in rover_scans: s["_id"] = str(s["_id"])
    
    # 3. Combine and sort
    all_history = manual_scans + rover_scans
    all_history.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return all_history[:100]

# --- CLOUD PROFILE SYNC ---
@app.get("/user/profile")
async def get_user_profile(user_id: str = Depends(get_current_user_id)):
    user = await users_collection.find_one({"$or": [{"email": user_id}, {"phone": user_id}]})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "photo_base64": user.get("photo_base64")
    }

@app.put("/user/profile")
async def update_user_profile(profile: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    result = await users_collection.update_one(
        {"$or": [{"email": user_id}, {"phone": user_id}]},
        {"$set": {"photo_base64": profile.photo_base64}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {"message": "Profile updated successfully"}