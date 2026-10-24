"""
Model service — loads the trained pipeline and makes predictions.
The model is loaded once at startup, not retrained on every request.
"""
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, Any

from .config import (
    MODEL_PATH, METRICS_PATH, FEATURE_CONFIG_PATH,
    ALL_FEATURES, TARGET_LABELS
)


class ModelService:
    """Singleton-style service for model loading and prediction."""

    def __init__(self):
        self.pipeline = None
        self.metrics: Optional[Dict] = None
        self.feature_config: Optional[Dict] = None
        self._loaded = False

    def load(self) -> bool:
        """Load the trained model pipeline and metrics. Returns True if successful."""
        try:
            if not MODEL_PATH.exists():
                print(f"⚠️  Model file not found at {MODEL_PATH}")
                print("   Run 'python scripts/train_model.py' first to train the model.")
                return False

            self.pipeline = joblib.load(MODEL_PATH)
            self._loaded = True
            print(f"✅ Model loaded from {MODEL_PATH}")

            if METRICS_PATH.exists():
                with open(METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
                print(f"✅ Metrics loaded from {METRICS_PATH}")

            if FEATURE_CONFIG_PATH.exists():
                with open(FEATURE_CONFIG_PATH, "r") as f:
                    self.feature_config = json.load(f)
                print(f"✅ Feature config loaded from {FEATURE_CONFIG_PATH}")

            return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self._loaded = False
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded and self.pipeline is not None

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a prediction using the loaded pipeline.

        Args:
            input_data: Dictionary of feature values.

        Returns:
            Dictionary with prediction, label, and probability.

        Raises:
            RuntimeError: If model is not loaded.
            ValueError: If input features are invalid.
        """
        if not self.is_loaded:
            raise RuntimeError(
                "Model is not loaded. Run 'python scripts/train_model.py' to train the model first."
            )

        # Build DataFrame with correct feature order
        input_df = pd.DataFrame([{f: input_data[f] for f in ALL_FEATURES}])

        # Get prediction
        prediction = int(self.pipeline.predict(input_df)[0])
        prediction_label = TARGET_LABELS.get(prediction, f"Class {prediction}")

        # Get probability if model supports it
        probability = None
        if hasattr(self.pipeline, "predict_proba"):
            try:
                proba = self.pipeline.predict_proba(input_df)[0]
                # Probability of positive class (heart disease)
                probability = round(float(proba[1]), 4)
            except Exception:
                probability = None

        return {
            "prediction": prediction,
            "prediction_label": prediction_label,
            "probability": probability,
        }

    def get_metrics(self) -> Optional[Dict]:
        """Return saved model metrics."""
        return self.metrics

    def get_feature_config(self) -> Optional[Dict]:
        """Return feature configuration."""
        return self.feature_config


# Global singleton instance
model_service = ModelService()
