"""
Configuration for the CardioPredict AI backend.
All paths, settings, and feature definitions are centralized here.
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Data and model paths
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
DATASET_PATH = DATA_DIR / "heart.csv"
MODEL_PATH = MODELS_DIR / "heart_model.joblib"
METRICS_PATH = MODELS_DIR / "model_metrics.json"
FEATURE_CONFIG_PATH = MODELS_DIR / "feature_config.json"

# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Random seed for reproducibility
RANDOM_SEED = 42

# Test split ratio
TEST_SIZE = 0.2

# Target column name — inspected from the actual dataset
TARGET_COLUMN = "target"

# Target encoding: what 0 and 1 mean in the dataset
TARGET_LABELS = {
    0: "No Heart Disease",
    1: "Heart Disease Detected"
}

# CORS settings
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# Feature definitions for the UCI Heart Disease dataset
# These are derived from inspecting the actual dataset columns
FEATURE_DEFINITIONS = {
    "age": {
        "label": "Age",
        "type": "numerical",
        "description": "Age in years",
        "min": 1,
        "max": 120,
        "unit": "years"
    },
    "sex": {
        "label": "Sex",
        "type": "categorical",
        "description": "Biological sex",
        "categories": {0: "Female", 1: "Male"}
    },
    "cp": {
        "label": "Chest Pain Type",
        "type": "categorical",
        "description": "Type of chest pain experienced",
        "categories": {
            0: "Typical Angina",
            1: "Atypical Angina",
            2: "Non-Anginal Pain",
            3: "Asymptomatic"
        }
    },
    "trestbps": {
        "label": "Resting Blood Pressure",
        "type": "numerical",
        "description": "Resting blood pressure on admission (mm Hg)",
        "min": 50,
        "max": 250,
        "unit": "mm Hg"
    },
    "chol": {
        "label": "Serum Cholesterol",
        "type": "numerical",
        "description": "Serum cholesterol level (mg/dl)",
        "min": 50,
        "max": 600,
        "unit": "mg/dl"
    },
    "fbs": {
        "label": "Fasting Blood Sugar > 120 mg/dl",
        "type": "categorical",
        "description": "Whether fasting blood sugar is greater than 120 mg/dl",
        "categories": {0: "No (≤ 120 mg/dl)", 1: "Yes (> 120 mg/dl)"}
    },
    "restecg": {
        "label": "Resting ECG Results",
        "type": "categorical",
        "description": "Resting electrocardiographic results",
        "categories": {
            0: "Normal",
            1: "ST-T Wave Abnormality",
            2: "Left Ventricular Hypertrophy"
        }
    },
    "thalach": {
        "label": "Maximum Heart Rate Achieved",
        "type": "numerical",
        "description": "Maximum heart rate achieved during exercise test",
        "min": 50,
        "max": 250,
        "unit": "bpm"
    },
    "exang": {
        "label": "Exercise-Induced Angina",
        "type": "categorical",
        "description": "Whether exercise induced angina",
        "categories": {0: "No", 1: "Yes"}
    },
    "oldpeak": {
        "label": "ST Depression (Oldpeak)",
        "type": "numerical",
        "description": "ST depression induced by exercise relative to rest",
        "min": 0.0,
        "max": 10.0,
        "unit": "",
        "step": 0.1
    },
    "slope": {
        "label": "Slope of Peak Exercise ST Segment",
        "type": "categorical",
        "description": "Slope of the peak exercise ST segment",
        "categories": {
            0: "Upsloping",
            1: "Flat",
            2: "Downsloping"
        }
    },
    "ca": {
        "label": "Number of Major Vessels",
        "type": "categorical",
        "description": "Number of major vessels colored by fluoroscopy",
        "categories": {0: "0", 1: "1", 2: "2", 3: "3", 4: "4"}
    },
    "thal": {
        "label": "Thalassemia",
        "type": "categorical",
        "description": "Thalassemia blood disorder status",
        "categories": {
            0: "Normal",
            1: "Fixed Defect",
            2: "Reversible Defect"
        }
    }
}

# Features that are numerical vs categorical
NUMERICAL_FEATURES = [k for k, v in FEATURE_DEFINITIONS.items() if v["type"] == "numerical"]
CATEGORICAL_FEATURES = [k for k, v in FEATURE_DEFINITIONS.items() if v["type"] == "categorical"]
ALL_FEATURES = list(FEATURE_DEFINITIONS.keys())
