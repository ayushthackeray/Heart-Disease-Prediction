"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List


class PredictionInput(BaseModel):
    """Input schema for heart disease prediction.
    Validates all 13 features from the UCI Heart Disease dataset."""

    age: int = Field(..., ge=1, le=120, description="Age in years")
    sex: int = Field(..., ge=0, le=1, description="Sex (0=Female, 1=Male)")
    cp: int = Field(..., ge=0, le=3, description="Chest pain type (0-3)")
    trestbps: int = Field(..., ge=50, le=250, description="Resting blood pressure (mm Hg)")
    chol: int = Field(..., ge=50, le=600, description="Serum cholesterol (mg/dl)")
    fbs: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120 mg/dl (0=No, 1=Yes)")
    restecg: int = Field(..., ge=0, le=2, description="Resting ECG results (0-2)")
    thalach: int = Field(..., ge=50, le=250, description="Maximum heart rate achieved (bpm)")
    exang: int = Field(..., ge=0, le=1, description="Exercise induced angina (0=No, 1=Yes)")
    oldpeak: float = Field(..., ge=0.0, le=10.0, description="ST depression induced by exercise")
    slope: int = Field(..., ge=0, le=2, description="Slope of peak exercise ST segment (0-2)")
    ca: int = Field(..., ge=0, le=4, description="Number of major vessels (0-4)")
    thal: int = Field(..., ge=0, le=2, description="Thalassemia (0-2)")

    model_config = {"json_schema_extra": {
        "examples": [{
            "age": 55,
            "sex": 1,
            "cp": 0,
            "trestbps": 140,
            "chol": 250,
            "fbs": 0,
            "restecg": 1,
            "thalach": 150,
            "exang": 0,
            "oldpeak": 1.5,
            "slope": 1,
            "ca": 0,
            "thal": 2
        }]
    }}


class PredictionResponse(BaseModel):
    """Response schema for prediction results."""
    prediction: int
    prediction_label: str
    probability: Optional[float] = None
    probability_note: str = (
        "This probability is a model estimate and may not reflect actual clinical risk. "
        "It has not been calibrated or validated for clinical use."
    )
    input_values: Dict[str, Any]
    disclaimer: str = (
        "This application is an educational machine learning project and is not a medical "
        "diagnostic tool. Predictions may be inaccurate and should not be used to make "
        "medical decisions. Consult a qualified healthcare professional for medical assessment. "
        "If you have symptoms of a heart attack, seek emergency medical care immediately."
    )


class HealthResponse(BaseModel):
    """Response schema for health check."""
    status: str
    model_loaded: bool
    dataset_available: bool
    message: str


class DatasetInfoResponse(BaseModel):
    """Response schema for dataset information."""
    total_records: int
    num_features: int
    feature_names: List[str]
    target_column: str
    target_labels: Dict[str, str]
    numerical_features: List[str]
    categorical_features: List[str]


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
