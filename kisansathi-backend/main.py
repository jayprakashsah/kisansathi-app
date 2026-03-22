from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from database import client, db, users_collection
from security import get_password_hash, verify_password, create_access_token

app = FastAPI(title="Kisansathi API")

# --- DATA MODELS ---
class UserCreate(BaseModel):
    name: str
    phone: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

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

# --- ROVER DATA ROUTES ---

# 1. Jetson Nano sends data HERE
@app.post("/rover/scan", status_code=status.HTTP_201_CREATED)
async def receive_rover_scan(scan: ScanData):
    scan_dict = scan.dict()
    scan_dict["id"] = str(uuid.uuid4()) # Generate a unique ID for the app
    scan_dict["timestamp"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    # Save directly to the MongoDB 'scans' collection
    await db.scans.insert_one(scan_dict)
    
    return {"message": "Scan data saved to database successfully!", "id": scan_dict["id"]}

# 2. React Native App fetches data from HERE
@app.get("/rover/scans")
async def get_rover_scans():
    # Fetch all scans, sort by newest first, limit to the latest 50
    cursor = db.scans.find().sort("timestamp", -1).limit(50)
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
    
    await db.fields.insert_one(field_dict)
    return {"message": "Field tracking data saved to database successfully!", "id": field_dict["id"]}

@app.get("/field/history/{phone}")
async def get_field_history(phone: str):
    cursor = db.fields.find({"user_phone": phone}).sort("timestamp", -1)
    fields = await cursor.to_list(length=100)
    for field in fields:
        field["_id"] = str(field["_id"])
    return fields