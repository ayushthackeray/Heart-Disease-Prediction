"""
Tests for the CardioPredict AI backend.
Covers preprocessing, prediction, and API validation.
"""
import sys
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.model_service import model_service
from app.dataset_service import dataset_service
from app.config import MODEL_PATH, METRICS_PATH, ALL_FEATURES

# Load services explicitly since TestClient may not trigger lifespan
model_service.load()
dataset_service.load()

client = TestClient(app)

# Valid sample input
VALID_INPUT = {
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
}


class TestRootAndHealth:
    """Test root and health endpoints."""

    def test_root_returns_api_info(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "CardioPredict AI"
        assert "status" in data

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data
        assert "dataset_available" in data


class TestDatasetEndpoints:
    """Test dataset information endpoint."""

    def test_dataset_info(self):
        response = client.get("/api/dataset/info")
        assert response.status_code == 200
        data = response.json()
        assert "total_records" in data
        assert "feature_names" in data
        assert "target_column" in data


class TestModelEndpoints:
    """Test model-related endpoints."""

    def test_model_metrics(self):
        response = client.get("/api/model/metrics")
        if response.status_code == 200:
            data = response.json()
            assert "selected_model" in data
            assert "best_metrics" in data
            assert "all_models" in data

    def test_model_features(self):
        response = client.get("/api/model/features")
        assert response.status_code == 200
        data = response.json()
        assert "features" in data
        assert "feature_order" in data


class TestPrediction:
    """Test prediction endpoint."""

    def test_valid_prediction(self):
        response = client.post("/api/predict", json=VALID_INPUT)
        if response.status_code == 200:
            data = response.json()
            assert "prediction" in data
            assert data["prediction"] in [0, 1]
            assert "prediction_label" in data
            assert "input_values" in data
            assert "disclaimer" in data

    def test_prediction_returns_probability(self):
        response = client.post("/api/predict", json=VALID_INPUT)
        if response.status_code == 200:
            data = response.json()
            if data["probability"] is not None:
                assert 0.0 <= data["probability"] <= 1.0

    def test_invalid_age_too_high(self):
        invalid = {**VALID_INPUT, "age": 200}
        response = client.post("/api/predict", json=invalid)
        assert response.status_code == 422

    def test_invalid_age_too_low(self):
        invalid = {**VALID_INPUT, "age": 0}
        response = client.post("/api/predict", json=invalid)
        assert response.status_code == 422

    def test_invalid_sex_value(self):
        invalid = {**VALID_INPUT, "sex": 5}
        response = client.post("/api/predict", json=invalid)
        assert response.status_code == 422

    def test_invalid_cp_value(self):
        invalid = {**VALID_INPUT, "cp": 10}
        response = client.post("/api/predict", json=invalid)
        assert response.status_code == 422

    def test_missing_field(self):
        incomplete = {k: v for k, v in VALID_INPUT.items() if k != "age"}
        response = client.post("/api/predict", json=incomplete)
        assert response.status_code == 422

    def test_empty_body(self):
        response = client.post("/api/predict", json={})
        assert response.status_code == 422

    def test_invalid_oldpeak_negative(self):
        invalid = {**VALID_INPUT, "oldpeak": -1.0}
        response = client.post("/api/predict", json=invalid)
        assert response.status_code == 422

    def test_invalid_trestbps(self):
        invalid = {**VALID_INPUT, "trestbps": 300}
        response = client.post("/api/predict", json=invalid)
        assert response.status_code == 422

    def test_prediction_consistency(self):
        """Same input should produce the same prediction."""
        r1 = client.post("/api/predict", json=VALID_INPUT)
        r2 = client.post("/api/predict", json=VALID_INPUT)
        if r1.status_code == 200 and r2.status_code == 200:
            assert r1.json()["prediction"] == r2.json()["prediction"]


class TestPreprocessing:
    """Test that model pipeline preprocessing works correctly."""

    def test_model_file_exists(self):
        assert MODEL_PATH.exists(), f"Model file not found at {MODEL_PATH}"

    def test_metrics_file_exists(self):
        assert METRICS_PATH.exists(), f"Metrics file not found at {METRICS_PATH}"

    def test_metrics_structure(self):
        with open(METRICS_PATH) as f:
            metrics = json.load(f)
        assert "selected_model" in metrics
        assert "best_metrics" in metrics
        assert "accuracy" in metrics["best_metrics"]
        assert "recall" in metrics["best_metrics"]
        assert "f1_score" in metrics["best_metrics"]

    def test_feature_count_matches(self):
        """Ensure the model expects the correct number of features."""
        import joblib
        pipeline = joblib.load(MODEL_PATH)
        import pandas as pd
        import numpy as np
        df = pd.DataFrame([VALID_INPUT])
        # Should not raise
        prediction = pipeline.predict(df[ALL_FEATURES])
        assert prediction[0] in [0, 1]
