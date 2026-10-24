"""
CardioPredict AI — FastAPI Backend
Heart Disease Risk Prediction System

This is an educational machine learning project and is NOT a medical diagnostic tool.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import FRONTEND_ORIGIN, FEATURE_DEFINITIONS, ALL_FEATURES, TARGET_LABELS
from .schemas import (
    PredictionInput, PredictionResponse, HealthResponse,
    DatasetInfoResponse, ErrorResponse
)
from .model_service import model_service
from .dataset_service import dataset_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and dataset once at startup."""
    print("\n🚀 Starting CardioPredict AI Backend...")
    model_service.load()
    dataset_service.load()
    yield
    print("\n👋 Shutting down CardioPredict AI Backend...")


app = FastAPI(
    title="CardioPredict AI",
    description=(
        "Heart Disease Risk Prediction API. "
        "This is an educational ML project — not a medical diagnostic tool."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — only allow configured frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """API health information."""
    return {
        "name": "CardioPredict AI",
        "version": "1.0.0",
        "description": "Heart Disease Risk Prediction API",
        "status": "running",
        "disclaimer": (
            "This is an educational machine learning project and is not a medical diagnostic tool."
        )
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Backend and model readiness status."""
    model_loaded = model_service.is_loaded
    dataset_available = dataset_service.is_loaded

    if model_loaded and dataset_available:
        status = "healthy"
        message = "All systems operational."
    elif not model_loaded:
        status = "degraded"
        message = (
            "Model is not loaded. Run 'python scripts/train_model.py' from the backend directory "
            "to train and save the model."
        )
    else:
        status = "degraded"
        message = "Dataset is not available."

    return HealthResponse(
        status=status,
        model_loaded=model_loaded,
        dataset_available=dataset_available,
        message=message,
    )


@app.get("/api/dataset/info", tags=["Dataset"])
async def dataset_info():
    """Dataset schema and summary information."""
    if not dataset_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Dataset not available. Ensure heart.csv is in the data/ directory."
        )
    return dataset_service.get_info()


@app.get("/api/model/metrics", tags=["Model"])
async def model_metrics():
    """Saved model evaluation metrics."""
    metrics = model_service.get_metrics()
    if metrics is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model metrics not available. Run 'python scripts/train_model.py' "
                "to train the model and generate metrics."
            )
        )
    return metrics


@app.get("/api/model/features", tags=["Model"])
async def model_features():
    """Return the feature schema and allowed input values needed by the frontend."""
    config = model_service.get_feature_config()
    if config is not None:
        return config

    # Fallback to config definitions
    return {
        "features": {k: {
            "label": v["label"],
            "type": v["type"],
            "description": v["description"],
            "categories": v.get("categories"),
            "min": v.get("min"),
            "max": v.get("max"),
            "unit": v.get("unit", ""),
            "step": v.get("step"),
        } for k, v in FEATURE_DEFINITIONS.items()},
        "feature_order": ALL_FEATURES,
        "target_labels": {str(k): v for k, v in TARGET_LABELS.items()},
    }


@app.post("/api/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(input_data: PredictionInput):
    """Validate input and return the model's prediction.

    Returns the prediction from the trained model. This is NOT a clinical diagnosis.
    """
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model is not loaded. The prediction service is unavailable. "
                "Run 'python scripts/train_model.py' to train the model."
            )
        )

    try:
        input_dict = input_data.model_dump()
        result = model_service.predict(input_dict)

        return PredictionResponse(
            prediction=result["prediction"],
            prediction_label=result["prediction_label"],
            probability=result["probability"],
            input_values=input_dict,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while processing the prediction."
        )
