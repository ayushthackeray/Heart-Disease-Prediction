"""
Model training script for CardioPredict AI.
Trains multiple classifiers, evaluates them with clinically meaningful metrics,
selects the best model, and saves the pipeline + metrics.
"""
import sys
import json
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import joblib

warnings.filterwarnings("ignore")

# Add parent directory to path for config
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import (
    DATASET_PATH, MODEL_PATH, METRICS_PATH, FEATURE_CONFIG_PATH,
    TARGET_COLUMN, TARGET_LABELS, RANDOM_SEED, TEST_SIZE,
    NUMERICAL_FEATURES, CATEGORICAL_FEATURES, ALL_FEATURES,
    FEATURE_DEFINITIONS
)


def load_and_inspect_data():
    """Load the dataset and perform initial inspection."""
    if not DATASET_PATH.exists():
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print(f"Please place the heart disease CSV file at: {DATASET_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATASET_PATH)
    print("=" * 70)
    print("CARDIOPREDICT AI — MODEL TRAINING")
    print("=" * 70)

    print(f"\n📊 Dataset Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"📋 Columns: {list(df.columns)}")
    print(f"🎯 Target Column: '{TARGET_COLUMN}'")
    print(f"\n📈 Target Distribution:")
    for val, label in TARGET_LABELS.items():
        count = (df[TARGET_COLUMN] == val).sum()
        pct = count / len(df) * 100
        print(f"   {val} ({label}): {count} ({pct:.1f}%)")

    print(f"\n🔍 Missing Values:")
    missing = df.isnull().sum()
    if missing.sum() == 0:
        print("   None found — dataset is complete.")
    else:
        for col in missing[missing > 0].index:
            print(f"   {col}: {missing[col]} missing")

    duplicates = df.duplicated().sum()
    print(f"\n📋 Duplicate Rows: {duplicates}")
    if duplicates > 0:
        print(f"   Removing {duplicates} duplicate row(s)...")
        df = df.drop_duplicates().reset_index(drop=True)
        print(f"   New shape: {df.shape[0]} rows × {df.shape[1]} columns")

    print(f"\n📊 Data Types:")
    for col in df.columns:
        print(f"   {col}: {df[col].dtype}")

    return df


def preprocess_and_split(df):
    """Split data into train/test, preventing data leakage."""
    X = df[ALL_FEATURES]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=y
    )

    print(f"\n✂️  Data Split (stratified, seed={RANDOM_SEED}):")
    print(f"   Training set: {X_train.shape[0]} samples")
    print(f"   Testing set:  {X_test.shape[0]} samples")
    print(f"   Training target distribution: {dict(y_train.value_counts())}")
    print(f"   Testing target distribution:  {dict(y_test.value_counts())}")

    return X_train, X_test, y_train, y_test


def build_preprocessor():
    """Build a sklearn ColumnTransformer for preprocessing.
    Fitted only on training data to prevent data leakage."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", "passthrough", CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor


def get_models():
    """Define the candidate classification models."""
    return {
        "Logistic Regression": LogisticRegression(
            random_state=RANDOM_SEED, max_iter=1000, solver="lbfgs"
        ),
        "Decision Tree": DecisionTreeClassifier(
            random_state=RANDOM_SEED, max_depth=5
        ),
        "Random Forest": RandomForestClassifier(
            random_state=RANDOM_SEED, n_estimators=100, max_depth=10
        ),
        "SVM": SVC(
            random_state=RANDOM_SEED, kernel="rbf", probability=True
        ),
        "KNN": KNeighborsClassifier(n_neighbors=7)
    }


def evaluate_model(pipeline, X_test, y_test, model_name):
    """Evaluate a model and return metrics dictionary."""
    y_pred = pipeline.predict(X_test)
    y_proba = None

    if hasattr(pipeline, "predict_proba"):
        y_proba = pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    roc_auc = None
    if y_proba is not None:
        roc_auc = roc_auc_score(y_test, y_proba)

    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "model_name": model_name,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "confusion_matrix": cm
    }
    return metrics


def get_feature_importance(pipeline, model_name):
    """Extract feature importance for supported models."""
    model = pipeline.named_steps["classifier"]
    preprocessor = pipeline.named_steps["preprocessor"]

    feature_names = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        return dict(zip(feature_names, [round(float(x), 4) for x in importances]))
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_[0])
        return dict(zip(feature_names, [round(float(x), 4) for x in importances]))

    return None


def train_and_evaluate():
    """Main training workflow."""
    # Phase 1-2: Load and inspect data
    df = load_and_inspect_data()

    # Phase 3: Preprocess and split
    X_train, X_test, y_train, y_test = preprocess_and_split(df)

    # Build preprocessor
    preprocessor = build_preprocessor()

    # Phase 4: Train and evaluate models
    models = get_models()
    all_metrics = []
    best_model = None
    best_pipeline = None
    best_score = -1
    best_feature_importance = None

    print("\n" + "=" * 70)
    print("MODEL TRAINING & EVALUATION")
    print("=" * 70)

    for name, model in models.items():
        print(f"\n🔄 Training: {name}...")

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", model)
        ])

        # Fit on training data only
        pipeline.fit(X_train, y_train)

        # Cross-validation on training data
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="recall")
        mean_cv_recall = cv_scores.mean()

        # Evaluate on test data
        metrics = evaluate_model(pipeline, X_test, y_test, name)
        metrics["cv_recall_mean"] = round(float(mean_cv_recall), 4)
        metrics["cv_recall_std"] = round(float(cv_scores.std()), 4)
        all_metrics.append(metrics)

        print(f"   Accuracy:  {metrics['accuracy']:.4f}")
        print(f"   Precision: {metrics['precision']:.4f}")
        print(f"   Recall:    {metrics['recall']:.4f}")
        print(f"   F1 Score:  {metrics['f1_score']:.4f}")
        if metrics['roc_auc'] is not None:
            print(f"   ROC-AUC:   {metrics['roc_auc']:.4f}")
        print(f"   CV Recall: {mean_cv_recall:.4f} ± {cv_scores.std():.4f}")
        print(f"   Confusion Matrix: {metrics['confusion_matrix']}")

        # Selection criteria: prioritize recall (clinical sensitivity),
        # then F1 to balance with precision.
        # Using a composite score: 0.6 * recall + 0.4 * f1
        composite_score = 0.6 * metrics["recall"] + 0.4 * metrics["f1_score"]
        if composite_score > best_score:
            best_score = composite_score
            best_model = name
            best_pipeline = pipeline
            best_feature_importance = get_feature_importance(pipeline, name)

    # Phase 5: Save best model
    print("\n" + "=" * 70)
    print(f"🏆 SELECTED MODEL: {best_model}")
    print(f"   Selection criteria: Composite (0.6×Recall + 0.4×F1)")
    print(f"   Composite score: {best_score:.4f}")
    print("=" * 70)

    # Save model pipeline
    joblib.dump(best_pipeline, MODEL_PATH)
    print(f"\n💾 Model saved to: {MODEL_PATH}")

    # Prepare and save metrics
    best_metrics = next(m for m in all_metrics if m["model_name"] == best_model)

    # Dataset stats for dashboard
    dataset_stats = {
        "total_records": len(df),
        "num_features": len(ALL_FEATURES),
        "training_size": len(X_train),
        "testing_size": len(X_test),
        "target_distribution": {
            str(k): int(v) for k, v in df[TARGET_COLUMN].value_counts().items()
        },
        "age_distribution": {
            "min": int(df["age"].min()),
            "max": int(df["age"].max()),
            "mean": round(float(df["age"].mean()), 1),
            "std": round(float(df["age"].std()), 1)
        },
        "chol_distribution": {
            "min": int(df["chol"].min()),
            "max": int(df["chol"].max()),
            "mean": round(float(df["chol"].mean()), 1),
            "std": round(float(df["chol"].std()), 1)
        },
        "trestbps_distribution": {
            "min": int(df["trestbps"].min()),
            "max": int(df["trestbps"].max()),
            "mean": round(float(df["trestbps"].mean()), 1),
            "std": round(float(df["trestbps"].std()), 1)
        },
        # Age histogram bins
        "age_histogram": _compute_histogram(df["age"], bins=10),
        "chol_histogram": _compute_histogram(df["chol"], bins=10),
        "trestbps_histogram": _compute_histogram(df["trestbps"], bins=10),
    }

    result = {
        "selected_model": best_model,
        "selection_criteria": "Composite score (0.6×Recall + 0.4×F1) — prioritizing clinical sensitivity",
        "best_metrics": best_metrics,
        "all_models": all_metrics,
        "feature_importance": best_feature_importance,
        "dataset_stats": dataset_stats,
        "disclaimer": (
            "This model is an educational project and has NOT been clinically validated. "
            "Do not use predictions for medical decisions."
        )
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(f"📊 Metrics saved to: {METRICS_PATH}")

    # Save feature config for API
    feature_config = {
        "features": FEATURE_DEFINITIONS,
        "feature_order": ALL_FEATURES,
        "target_column": TARGET_COLUMN,
        "target_labels": {str(k): v for k, v in TARGET_LABELS.items()},
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
    }
    with open(FEATURE_CONFIG_PATH, "w") as f:
        json.dump(feature_config, f, indent=2)
    print(f"📋 Feature config saved to: {FEATURE_CONFIG_PATH}")

    print("\n✅ Training complete! You can now start the FastAPI backend.")
    return result


def _compute_histogram(series, bins=10):
    """Compute histogram data for a pandas series."""
    counts, bin_edges = np.histogram(series.dropna(), bins=bins)
    histogram = []
    for i in range(len(counts)):
        histogram.append({
            "bin": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}",
            "count": int(counts[i])
        })
    return histogram


if __name__ == "__main__":
    train_and_evaluate()
