"""
Extended Pytest Suite for RoadSense AI ML Pipeline.
Validates:
  1. Feature extraction on mock VOC XML
  2. Heuristic severity boundary logic
  3. Model loading, valid class outputs, and probability distribution summing to ~1
  4. SHAP explain_prediction returning contributions for all 7 features
  5. Computer vision detector returning normalized bounding boxes in [0, 1]
  6. Model comparison JSON schema validation
"""

import os
import io
import json
import numpy as np
import pytest
from PIL import Image
import joblib

from backend.ml.rdd_annotation_parser import (
    parse_voc_xml,
    heuristic_severity,
    FEATURE_COLUMNS
)
from backend.ml.compare_models import explain_prediction
from backend.ml.image_detector import analyze_road_image

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "reports")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "saved_models")

def test_voc_xml_feature_extraction():
    """Validates feature extraction on a synthetic Pascal VOC XML annotation."""
    mock_xml = """<annotation>
        <size>
            <width>600</width>
            <height>600</height>
        </size>
        <object>
            <name>D40</name>
            <bndbox>
                <xmin>100</xmin>
                <ymin>100</ymin>
                <xmax>200</xmax>
                <ymax>200</ymax>
            </bndbox>
        </object>
        <object>
            <name>D00</name>
            <bndbox>
                <xmin>300</xmin>
                <ymin>300</ymin>
                <xmax>350</xmax>
                <ymax>500</ymax>
            </bndbox>
        </object>
    </annotation>"""
    features = parse_voc_xml(mock_xml)
    assert features["pothole_count"] == 1
    assert features["longitudinal_crack_count"] == 1
    assert features["alligator_crack_count"] == 0
    assert features["transverse_crack_count"] == 0
    assert features["damage_count"] == 2
    assert 0.0 < features["total_bbox_area_ratio"] <= 1.0
    assert 0.0 < features["largest_bbox_area_ratio"] <= 1.0
    assert features["img_width"] == 600
    assert features["img_height"] == 600

def test_heuristic_severity_boundary_cases():
    """Validates boundary decision rules of the heuristic_severity function."""
    # 1. High severity triggers
    high_potholes = {"pothole_count": 2, "damage_count": 2}
    assert heuristic_severity(high_potholes) == "High"

    high_alligator = {"alligator_crack_count": 2, "damage_count": 2}
    assert heuristic_severity(high_alligator) == "High"

    high_large_box = {"largest_bbox_area_ratio": 0.12, "damage_count": 1}
    assert heuristic_severity(high_large_box) == "High"

    high_total_ratio = {"total_bbox_area_ratio": 0.20, "damage_count": 2}
    assert heuristic_severity(high_total_ratio) == "High"

    high_co_occur = {"pothole_count": 1, "alligator_crack_count": 1, "damage_count": 2}
    assert heuristic_severity(high_co_occur) == "High"

    # 2. Medium severity triggers
    med_single_pothole = {"pothole_count": 1, "damage_count": 1, "largest_bbox_area_ratio": 0.04}
    assert heuristic_severity(med_single_pothole) == "Medium"

    med_multi_cracks = {"damage_count": 3, "longitudinal_crack_count": 2, "transverse_crack_count": 1}
    assert heuristic_severity(med_multi_cracks) == "Medium"

    med_area_threshold = {"largest_bbox_area_ratio": 0.05, "damage_count": 1}
    assert heuristic_severity(med_area_threshold) == "Medium"

    # 3. Low severity cases
    low_single_crack = {
        "pothole_count": 0,
        "alligator_crack_count": 0,
        "longitudinal_crack_count": 1,
        "damage_count": 1,
        "largest_bbox_area_ratio": 0.02,
        "total_bbox_area_ratio": 0.02
    }
    assert heuristic_severity(low_single_crack) == "Low"

def test_model_loads_and_predict_probabilities():
    """Validates saved model artifact, prediction classes, and probability normalization."""
    model_path = os.path.join(MODELS_DIR, "severity_rf_model.joblib")
    assert os.path.exists(model_path), f"Saved model not found at {model_path}"
    model = joblib.load(model_path)

    import pandas as pd
    sample_feat = {
        "damage_count": 2,
        "pothole_count": 1,
        "alligator_crack_count": 0,
        "longitudinal_crack_count": 1,
        "transverse_crack_count": 0,
        "total_bbox_area_ratio": 0.08,
        "largest_bbox_area_ratio": 0.06
    }
    X = pd.DataFrame([[sample_feat[col] for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)

    pred = model.predict(X)[0]
    assert pred in ["Low", "Medium", "High"]

    probs = model.predict_proba(X)[0]
    assert len(probs) == 3
    assert np.isclose(float(np.sum(probs)), 1.0, atol=1e-3)
    assert all(0.0 <= p <= 1.0 for p in probs)

def test_explain_prediction_returns_all_features():
    """Validates SHAP explain_prediction returns contribution for all 7 features."""
    sample_feat = {
        "damage_count": 3,
        "pothole_count": 2,
        "alligator_crack_count": 1,
        "longitudinal_crack_count": 0,
        "transverse_crack_count": 0,
        "total_bbox_area_ratio": 0.22,
        "largest_bbox_area_ratio": 0.15
    }
    shap_dict = explain_prediction(sample_feat)
    assert isinstance(shap_dict, dict)
    assert len(shap_dict) == 7
    for col in FEATURE_COLUMNS:
        assert col in shap_dict
        assert isinstance(shap_dict[col], (int, float))

def test_detector_returns_normalized_boxes():
    """Validates image_detector returns normalized bounding box coordinates bounded in [0, 1]."""
    # Create synthetic test image
    img = Image.new("RGB", (250, 250), color=(120, 120, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    result = analyze_road_image(img_bytes)
    assert "detections" in result
    assert "features" in result

    for d in result["detections"]:
        n_box = d.get("normalized_box", [])
        assert len(n_box) == 4
        ymin, xmin, ymax, xmax = n_box
        assert 0.0 <= ymin <= 1.0
        assert 0.0 <= xmin <= 1.0
        assert 0.0 <= ymax <= 1.0
        assert 0.0 <= xmax <= 1.0

def test_comparison_json_schema_exists():
    """Validates model_comparison.json exists and adheres to expected benchmark schema."""
    comp_path = os.path.join(REPORTS_DIR, "model_comparison.json")
    assert os.path.exists(comp_path), f"Comparison file missing: {comp_path}"

    with open(comp_path, "r") as f:
        comp = json.load(f)

    expected_models = [
        "Dummy (Most Frequent)",
        "Rule-Only Baseline",
        "Logistic Regression",
        "Decision Tree",
        "Random Forest (Pre-tuning)",
        "Gradient Boosting",
        "Random Forest (Tuned)",
        "feature_importances"
    ]
    for m in expected_models:
        assert m in comp, f"Missing model '{m}' in comparison report"

    rf_tuned = comp["Random Forest (Tuned)"]
    assert "test_agreement_accuracy" in rf_tuned
    assert "test_macro_f1" in rf_tuned
    assert "best_hyperparameters" in rf_tuned
