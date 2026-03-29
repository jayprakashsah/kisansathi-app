import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models

# Image settings for all crops
IMG_SIZE = 224
BATCH_SIZE = 32

# Data preprocessing
train_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

# Point this directory to your massive 'PlantVillage' dataset folder
# containing subfolders for each crop's disease (e.g. Tomato_Blight, Potato_Late_Blight)
train_data = train_datagen.flow_from_directory(
    "dataset/",
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_data = train_datagen.flow_from_directory(
    "dataset/",
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# Load pretrained MobileNetV2 model architecture for ultra-fast mobile processing
base_model = MobileNetV2(input_shape=(224,224,3), include_top=False, weights='imagenet')
base_model.trainable = False

# Add custom dense layers tailored to our dynamic dynamic crop dataset
model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(train_data.num_classes, activation='softmax')
])

# Compile the neural network
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train the network against our specific crop datasets
model.fit(train_data, validation_data=val_data, epochs=5)

# Save compiled `.h5` model to the backend directory for FastAPI to ping globally
model.save("all_plant_disease_model.h5")
print("MobileNetV2 Agricultural AI Model compiled and written successfully!")
