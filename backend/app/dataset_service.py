"""
Dataset service — provides dataset information for the API.
"""
import pandas as pd
from typing import Optional, Dict, Any

from .config import DATASET_PATH, TARGET_COLUMN, TARGET_LABELS, ALL_FEATURES


class DatasetService:
    """Service for providing dataset information."""

    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._loaded = False

    def load(self) -> bool:
        """Load the dataset. Returns True if successful."""
        try:
            if not DATASET_PATH.exists():
                print(f"⚠️  Dataset not found at {DATASET_PATH}")
                return False
            self._df = pd.read_csv(DATASET_PATH)
            # Remove duplicates as done in training
            self._df = self._df.drop_duplicates().reset_index(drop=True)
            self._loaded = True
            print(f"✅ Dataset loaded: {self._df.shape[0]} rows × {self._df.shape[1]} columns")
            return True
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            return False

    @property
    def is_loaded(self) -> bool:
        return self._loaded and self._df is not None

    def get_info(self) -> Dict[str, Any]:
        """Return dataset schema and summary."""
        if not self.is_loaded:
            return {"error": "Dataset not loaded"}

        return {
            "total_records": len(self._df),
            "num_features": len(ALL_FEATURES),
            "feature_names": ALL_FEATURES,
            "target_column": TARGET_COLUMN,
            "target_labels": {str(k): v for k, v in TARGET_LABELS.items()},
            "numerical_features": [
                col for col in ALL_FEATURES
                if self._df[col].dtype in ["float64", "int64"] and self._df[col].nunique() > 5
            ],
            "categorical_features": [
                col for col in ALL_FEATURES
                if self._df[col].nunique() <= 5
            ],
            "column_dtypes": {col: str(self._df[col].dtype) for col in self._df.columns},
            "missing_values": {col: int(self._df[col].isnull().sum()) for col in self._df.columns},
        }


# Global singleton instance
dataset_service = DatasetService()
