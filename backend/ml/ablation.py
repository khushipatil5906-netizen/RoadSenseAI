"""
Feature and Feature-Group Ablation Study for RoadSense AI.
Evaluates the marginal contribution of each structural feature and feature group
by systematically removing them and retraining the Random Forest classifier.
Outputs:
  - backend/ml/reports/ablation.json
  - backend/ml/reports/ablation.png
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from backend.ml.rdd_annotation_parser import FEATURE_COLUMNS
from backend.ml.prepare_dataset import prepare_and_save_data, DATA_DIR

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

FEATURE_GROUPS = {
    "counts_group": [
        "damage_count",
        "pothole_count",
        "alligator_crack_count",
        "longitudinal_crack_count",
        "transverse_crack_count",
    ],
    "area_ratios_group": [
        "total_bbox_area_ratio",
        "largest_bbox_area_ratio",
    ],
}

def get_base_rf():
    return RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced"
    )

def run_ablation_study() -> dict:
    train_path = os.path.join(DATA_DIR, "train.csv")
    test_path = os.path.join(DATA_DIR, "test.csv")

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("[Ablation] Dataset not found, preparing...")
        prepare_and_save_data()

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    y_train = train_df["severity"]
    y_test = test_df["severity"]

    # 1. Full model baseline
    base_rf = get_base_rf()
    base_rf.fit(train_df[FEATURE_COLUMNS], y_train)
    y_pred = base_rf.predict(test_df[FEATURE_COLUMNS])

    base_acc = float(accuracy_score(y_test, y_pred))
    _, _, base_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
    base_f1 = float(base_f1)

    print(f"[Ablation] Full Model Baseline:")
    print(f"  Agreement Accuracy: {base_acc*100:.2f}% | Macro F1: {base_f1:.4f}")

    results = {
        "baseline": {
            "features_used": FEATURE_COLUMNS,
            "feature_count": len(FEATURE_COLUMNS),
            "agreement_accuracy": round(base_acc, 4),
            "macro_f1": round(base_f1, 4),
        },
        "individual_ablations": {},
        "group_ablations": {}
    }

    # 2. Individual feature ablation
    for feat in FEATURE_COLUMNS:
        remaining = [f for f in FEATURE_COLUMNS if f != feat]
        rf = get_base_rf()
        rf.fit(train_df[remaining], y_train)
        pred = rf.predict(test_df[remaining])

        acc = float(accuracy_score(y_test, pred))
        _, _, f1, _ = precision_recall_fscore_support(y_test, pred, average="macro", zero_division=0)
        f1 = float(f1)

        acc_drop = round(base_acc - acc, 4)
        f1_drop = round(base_f1 - f1, 4)

        results["individual_ablations"][feat] = {
            "removed_feature": feat,
            "remaining_features": remaining,
            "agreement_accuracy": round(acc, 4),
            "macro_f1": round(f1, 4),
            "accuracy_drop": acc_drop,
            "macro_f1_drop": f1_drop,
        }
        print(f"  Ablated '{feat}': Acc={acc*100:.2f}% (Drop: {acc_drop*100:+.2f}%), F1={f1:.4f} (Drop: {f1_drop:+.4f})")

    # 3. Feature group ablation
    for group_name, feats in FEATURE_GROUPS.items():
        remaining = [f for f in FEATURE_COLUMNS if f not in feats]
        rf = get_base_rf()
        rf.fit(train_df[remaining], y_train)
        pred = rf.predict(test_df[remaining])

        acc = float(accuracy_score(y_test, pred))
        _, _, f1, _ = precision_recall_fscore_support(y_test, pred, average="macro", zero_division=0)
        f1 = float(f1)

        acc_drop = round(base_acc - acc, 4)
        f1_drop = round(base_f1 - f1, 4)

        results["group_ablations"][group_name] = {
            "removed_group": group_name,
            "removed_features": feats,
            "remaining_features": remaining,
            "agreement_accuracy": round(acc, 4),
            "macro_f1": round(f1, 4),
            "accuracy_drop": acc_drop,
            "macro_f1_drop": f1_drop,
        }
        print(f"  Ablated Group '{group_name}': Acc={acc*100:.2f}% (Drop: {acc_drop*100:+.2f}%), F1={f1:.4f} (Drop: {f1_drop:+.4f})")

    # Save JSON report
    json_path = os.path.join(REPORTS_DIR, "ablation.json")
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[Ablation] Saved report to {json_path}")

    # Generate professional chart
    labels = []
    acc_drops = []
    f1_drops = []

    for feat, data in results["individual_ablations"].items():
        labels.append(f"- {feat.replace('_', ' ')}")
        acc_drops.append(data["accuracy_drop"] * 100)
        f1_drops.append(data["macro_f1_drop"] * 100)

    for group, data in results["group_ablations"].items():
        labels.append(f"GROUP: - {group.replace('_', ' ')}")
        acc_drops.append(data["accuracy_drop"] * 100)
        f1_drops.append(data["macro_f1_drop"] * 100)

    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(labels))
    width = 0.35

    rects1 = ax.barh(x - width/2, acc_drops, width, label="Accuracy Drop (%)", color="#2563eb")
    rects2 = ax.barh(x + width/2, f1_drops, width, label="Macro-F1 Drop (%)", color="#059669")

    ax.set_xlabel("Metric Drop Relative to Full Model (%)", fontsize=11, fontweight="bold")
    ax.set_title("Feature & Group Ablation Study (Random Forest, Seed=42)\nHeld-Out Test Split (N=240)", fontsize=13, fontweight="bold")
    ax.set_yticks(x)
    ax.set_yticklabels(labels, fontsize=9)
    ax.invert_yaxis()
    ax.legend(loc="lower right", fontsize=10)
    ax.axvline(0, color="gray", linestyle="--", linewidth=0.8)
    ax.grid(axis="x", linestyle=":", alpha=0.6)

    plt.tight_layout()
    png_path = os.path.join(REPORTS_DIR, "ablation.png")
    plt.savefig(png_path, dpi=300)
    plt.close()
    print(f"[Ablation] Saved ablation chart to {png_path}")

    return results

if __name__ == "__main__":
    run_ablation_study()
