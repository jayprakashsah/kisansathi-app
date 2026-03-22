import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load the variables from the .env file
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

# Create the MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)

# Connect to the specific database (MongoDB will create 'kisansathi_db' automatically)
db = client.kisansathi_db

# Define our collections (like tables)
users_collection = db.users
rover_collection = db.rover_data