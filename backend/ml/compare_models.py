"""
Model Comparison, 5-Fold Cross-Validation, Hyperparameter Tuning & Explainability Script.
Evaluates 6 models on RDD2022 tabular defect features:
  1. DummyClassifier (Most Frequent)
  2. Rule-Only Heuristic Baseline
  3. Logistic Regression (StandardScaler + Multinomial)
  4. Decision Tree Classifier
  5. Random Forest Classifier (Baseline & Tuned)
  6. Gradient Boosting Classifier

Generates:
  - backend/ml/reports/model_comparison.json
  - backend/ml/reports/model_comparison_table.png
  - backend/ml/reports/confusion_matrices.png
  - backend/ml/reports/learning_curve.png
  - backend/ml/reports/feature_importance.png (Permutation vs Gini)
  - backend/ml/reports/shap_summary.png
  - explain_prediction(features) -> dict
"""

import os
import json
import joblib
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, GridSearchCV, learning_curve
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix
)
from sklearn.inspection import permutation_importance
import shap

from backend.ml.rdd_annotation_parser import FEATURE_COLUMNS
from backend.ml.prepare_dataset import (
    RuleOnlyClassifier,
    heuristic_severity,
    prepare_and_save_data,
    DATA_DIR
)

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Global explainer cache for inference service
_GLOBAL_EXPLAINER = None
_GLOBAL_MODEL = None

def get_explainer_and_model():
    global _GLOBAL_EXPLAINER, _GLOBAL_MODEL
    if _GLOBAL_EXPLAINER is None:
        model_path = os.path.join(MODELS_DIR, "severity_rf_model.joblib")
        if os.path.exists(model_path):
            _GLOBAL_MODEL = joblib.load(model_path)
            _GLOBAL_EXPLAINER = shap.TreeExplainer(_GLOBAL_MODEL)
    return _GLOBAL_EXPLAINER, _GLOBAL_MODEL

def explain_prediction(features: Dict[str, Any], model=None, explainer=None) -> Dict[str, float]:
    """
    Computes per-feature SHAP contributions for a single input feature dictionary.
    Returns:
      Dict mapping each of the 7 features to its contribution toward the predicted class.
    """
    if explainer is None or model is None:
        explainer, model = get_explainer_and_model()

    if explainer is None or model is None:
        # Fallback if model artifact not available
        return {col: 0.0 for col in FEATURE_COLUMNS}

    row = [float(features.get(col, 0.0)) for col in FEATURE_COLUMNS]
    df_single = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    # Predict class
    pred_class = model.predict(df_single)[0]
    class_idx = list(model.classes_).index(pred_class)

    # Compute SHAP values
    shap_vals = explainer.shap_values(df_single)
    # Handling 3D array (n_samples, n_features, n_classes) or list of 2D arrays
    if isinstance(shap_vals, np.ndarray) and shap_vals.ndim == 3:
        vals = shap_vals[0, :, class_idx]
    elif isinstance(shap_vals, list):
        vals = shap_vals[class_idx][0]
    else:
        vals = shap_vals[0]

    contributions = {}
    for col, v in zip(FEATURE_COLUMNS, vals):
        contributions[col] = round(float(v), 4)

    return contributions


def run_model_comparison() -> Dict[str, Any]:
    print("=" * 70)
    print("RoadSense AI: Rigorous Model Comparison & Hyperparameter Tuning")
    print("Setting random_state=42 across all splits, models, and CV.")
    print("=" * 70)

    train_path = os.path.join(DATA_DIR, "train.csv")
    test_path = os.path.join(DATA_DIR, "test.csv")

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("Data files missing, generating fresh dataset...")
        prepare_and_save_data()

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["severity"]
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["severity"]

    classes = ["Low", "Medium", "High"]

    # 1. Define candidate models
    models = {
        "Dummy (Most Frequent)": DummyClassifier(strategy="most_frequent", random_state=42),
        "Rule-Only Baseline": RuleOnlyClassifier(),
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, random_state=42))
        ]),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest (Pre-tuning)": RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            class_weight="balanced"
        ),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42)
    }

    # 2. 5-Fold Stratified Cross-Validation on Training Split
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    comparison_results = {}
    fitted_models = {}

    print("\n--- 5-Fold Stratified Cross-Validation on Training Set ---")
    for name, model in models.items():
        fold_accs = []
        fold_f1s = []

        for train_idx, val_idx in cv.split(X_train, y_train):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]

            # Fit fold
            if name != "Rule-Only Baseline":
                model.fit(X_tr, y_tr)
                y_val_pred = model.predict(X_val)
            else:
                y_val_pred = model.predict(X_val)

            fold_accs.append(accuracy_score(y_val, y_val_pred))
            _, _, f1_macro, _ = precision_recall_fscore_support(
                y_val, y_val_pred, average="macro", zero_division=0
            )
            fold_f1s.append(f1_macro)

        cv_acc_mean = float(np.mean(fold_accs))
        cv_acc_std = float(np.std(fold_accs))
        cv_f1_mean = float(np.mean(fold_f1s))
        cv_f1_std = float(np.std(fold_f1s))

        # Train on full training split and evaluate on held-out test split
        if name != "Rule-Only Baseline":
            model.fit(X_train, y_train)
        y_test_pred = model.predict(X_test)
        fitted_models[name] = model

        test_acc = float(accuracy_score(y_test, y_test_pred))
        prec_m, rec_m, f1_m, _ = precision_recall_fscore_support(
            y_test, y_test_pred, average="macro", zero_division=0
        )
        prec_w, rec_w, f1_w, _ = precision_recall_fscore_support(
            y_test, y_test_pred, average="weighted", zero_division=0
        )

        cm = confusion_matrix(y_test, y_test_pred, labels=classes).tolist()

        per_class = {}
        for cls in classes:
            p, r, f, s = precision_recall_fscore_support(
                y_test == cls, y_test_pred == cls, average="binary", zero_division=0
            )
            per_class[cls] = {
                "precision": round(float(p), 4),
                "recall": round(float(r), 4),
                "f1": round(float(f), 4),
                "support": int((y_test == cls).sum())
            }

        comparison_results[name] = {
            "cv_accuracy_mean": round(cv_acc_mean, 4),
            "cv_accuracy_std": round(cv_acc_std, 4),
            "cv_macro_f1_mean": round(cv_f1_mean, 4),
            "cv_macro_f1_std": round(cv_f1_std, 4),
            "test_agreement_accuracy": round(test_acc, 4),
            "test_macro_f1": round(float(f1_m), 4),
            "test_weighted_f1": round(float(f1_w), 4),
            "test_macro_precision": round(float(prec_m), 4),
            "test_macro_recall": round(float(rec_m), 4),
            "per_class": per_class,
            "confusion_matrix": cm
        }

        print(f"{name:26s} | CV Acc: {cv_acc_mean*100:5.2f}% +/- {cv_acc_std*100:4.2f}% | "
              f"CV F1: {cv_f1_mean:6.4f} +/- {cv_f1_std:6.4f} | "
              f"Test Acc: {test_acc*100:5.2f}% | Test F1: {f1_m:6.4f}")

    # 3. GridSearchCV for Random Forest
    print("\n--- Hyperparameter Tuning: GridSearchCV for Random Forest ---")
    param_grid = {
        "n_estimators": [50, 100, 200],
        "max_depth": [4, 6, 8, 12],
        "min_samples_leaf": [1, 2, 4]
    }
    rf_base = RandomForestClassifier(random_state=42, class_weight="balanced")
    grid_search = GridSearchCV(
        rf_base,
        param_grid=param_grid,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        scoring="f1_macro",
        n_jobs=-1
    )
    grid_search.fit(X_train, y_train)

    best_rf = grid_search.best_estimator_
    best_params = grid_search.best_params_
    best_cv_score = float(grid_search.best_score_)

    y_test_tuned = best_rf.predict(X_test)
    tuned_acc = float(accuracy_score(y_test, y_test_tuned))
    _, _, tuned_f1, _ = precision_recall_fscore_support(
        y_test, y_test_tuned, average="macro", zero_division=0
    )
    tuned_f1 = float(tuned_f1)
    tuned_cm = confusion_matrix(y_test, y_test_tuned, labels=classes).tolist()

    pre_tuning_acc = comparison_results["Random Forest (Pre-tuning)"]["test_agreement_accuracy"]
    pre_tuning_f1 = comparison_results["Random Forest (Pre-tuning)"]["test_macro_f1"]

    print(f"Best Hyperparameters: {best_params}")
    print(f"Best CV Macro-F1:     {best_cv_score:.4f}")
    print(f"Pre-tuning Test Acc:  {pre_tuning_acc*100:.2f}% | Macro-F1: {pre_tuning_f1:.4f}")
    print(f"Post-tuning Test Acc: {tuned_acc*100:.2f}% | Macro-F1: {tuned_f1:.4f}")

    comparison_results["Random Forest (Tuned)"] = {
        "best_hyperparameters": best_params,
        "best_cv_macro_f1": round(best_cv_score, 4),
        "test_agreement_accuracy": round(tuned_acc, 4),
        "test_macro_f1": round(tuned_f1, 4),
        "confusion_matrix": tuned_cm
    }

    # 4. Check if tuned RF is not worse than current saved model
    current_model_path = os.path.join(MODELS_DIR, "severity_rf_model.joblib")
    current_meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    should_replace = True

    if os.path.exists(current_meta_path):
        try:
            with open(current_meta_path, "r") as f:
                cur_meta = json.load(f)
            cur_acc = cur_meta.get("metrics", {}).get("accuracy", 0.0)
            cur_f1 = cur_meta.get("metrics", {}).get("f1_macro", 0.0)
            if tuned_acc < cur_acc and tuned_f1 < cur_f1:
                should_replace = False
                print(f"[Model Registry] Tuned RF ({tuned_acc*100:.2f}%) is below current model ({cur_acc*100:.2f}%). Keeping current.")
        except Exception as e:
            print(f"[Model Registry] Could not read existing metadata: {e}")

    active_model = best_rf if should_replace else fitted_models["Random Forest (Pre-tuning)"]
    if should_replace:
        print("[Model Registry] Tuned RF is equal or superior to current model. Updating production artifact.")
        joblib.dump(best_rf, current_model_path)

        # Update metadata
        timestamp = datetime.now(timezone.utc).isoformat()
        per_class_tuned = {}
        for cls in classes:
            p, r, f, s = precision_recall_fscore_support(
                y_test == cls, y_test_tuned == cls, average="binary", zero_division=0
            )
            per_class_tuned[cls] = {
                "precision": round(float(p), 4),
                "recall": round(float(r), 4),
                "f1_score": round(float(f), 4),
                "support": int((y_test == cls).sum())
            }

        feat_importances = dict(
            sorted(
                zip(FEATURE_COLUMNS, [round(float(x), 4) for x in best_rf.feature_importances_]),
                key=lambda x: x[1],
                reverse=True
            )
        )

        prec_m, rec_m, _, _ = precision_recall_fscore_support(
            y_test, y_test_tuned, average="macro", zero_division=0
        )
        prec_w, rec_w, f1_w, _ = precision_recall_fscore_support(
            y_test, y_test_tuned, average="weighted", zero_division=0
        )

        metadata = {
            "model_name": "RoadSense Severity Random Forest Classifier (Tuned)",
            "model_version": "v1.3.0-rf-tuned",
            "algorithm": "RandomForestClassifier",
            "dataset_source": "RDD2022 (Road Damage Detection Challenge 2022, Seki Lab / Figshare DOI: 10.6084/m9.figshare.21431547)",
            "label_source": "Deterministic heuristic engineering rules based on defect counts and area ratios (proxy labels, not ground truth)",
            "dataset_samples": {
                "total": len(train_df) + len(test_df),
                "train": len(train_df),
                "test": len(test_df),
            },
            "feature_schema": FEATURE_COLUMNS,
            "feature_importances": feat_importances,
            "supported_classes": classes,
            "metrics": {
                "accuracy": round(tuned_acc, 4),
                "agreement_with_heuristic_labels": round(tuned_acc, 4),
                "label_source": "Deterministic heuristic engineering rules based on defect counts and area ratios (proxy labels, not ground truth)",
                "baseline_accuracy": round(comparison_results["Dummy (Most Frequent)"]["test_agreement_accuracy"], 4),
                "rule_only_baseline_accuracy": round(comparison_results["Rule-Only Baseline"]["test_agreement_accuracy"], 4),
                "f1_macro": round(tuned_f1, 4),
                "f1_weighted": round(float(f1_w), 4),
                "precision_macro": round(float(prec_m), 4),
                "recall_macro": round(float(rec_m), 4),
                "per_class": per_class_tuned,
                "confusion_matrix": tuned_cm,
                "confusion_matrix_labels": classes
            },
            "model_artifact": "severity_rf_model.joblib",
            "training_date": timestamp,
            "last_validation_date": timestamp,
            "validation_status": "VALIDATED_PROXY",
            "hyperparameters": best_params,
            "limitations": [
                "Proxy Labels: Severity classes are computed from deterministic heuristic rules, not certified civil engineering ground truth.",
                "Injected Label Noise: Approximately 5% adjacent-border noise was injected during dataset preparation to simulate real-world rater hesitation.",
                "Detector Not Field-Validated: Computer vision defect localization uses edge/morphological heuristics; localization IoU is not validated against certified human bounding boxes.",
                "Dataset Subset: Model is trained on a 1,200-sample tabular representation derived from RDD2022 distributions rather than the full multi-national raw image dataset.",
                "Decision Support Only: RoadSense outputs provide triage guidance to municipal engineers and must not replace on-site physical structural inspections."
            ]
        }
        with open(current_meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

    # 5. Permutation Importance vs Gini Importance
    print("\n--- Computing Permutation & Gini Feature Importance ---")
    perm_result = permutation_importance(
        active_model, X_test, y_test, n_repeats=20, random_state=42, scoring="f1_macro"
    )
    perm_means = perm_result.importances_mean
    gini_means = active_model.feature_importances_

    importance_df = pd.DataFrame({
        "feature": [f.replace("_", " ") for f in FEATURE_COLUMNS],
        "raw_feature": FEATURE_COLUMNS,
        "gini_importance": [round(float(g), 4) for g in gini_means],
        "permutation_importance": [round(float(p), 4) for p in perm_means]
    }).sort_values("permutation_importance", ascending=False)

    comparison_results["feature_importances"] = {
        "gini": dict(zip(FEATURE_COLUMNS, [round(float(x), 4) for x in gini_means])),
        "permutation": dict(zip(FEATURE_COLUMNS, [round(float(x), 4) for x in perm_means]))
    }

    # Plot Feature Importance (Side by side bar chart)
    fig, ax = plt.subplots(figsize=(10, 5))
    x_pos = np.arange(len(importance_df))
    bar_width = 0.38

    ax.bar(x_pos - bar_width/2, importance_df["gini_importance"], width=bar_width, label="Gini Impurity Importance", color="#2563eb")
    ax.bar(x_pos + bar_width/2, importance_df["permutation_importance"], width=bar_width, label="Permutation Importance (n=20, Test Set)", color="#059669")
    ax.set_xticks(x_pos)
    ax.set_xticklabels(importance_df["feature"], rotation=25, ha="right", fontsize=9)
    ax.set_ylabel("Importance Score", fontsize=10, fontweight="bold")
    ax.set_title("Random Forest Feature Importance: Gini vs Permutation (Seed=42)", fontsize=12, fontweight="bold")
    ax.legend(loc="upper right", fontsize=10)
    ax.grid(axis="y", linestyle=":", alpha=0.6)
    plt.tight_layout()
    feat_png = os.path.join(REPORTS_DIR, "feature_importance.png")
    plt.savefig(feat_png, dpi=300)
    plt.close()
    print(f"Saved feature importance chart to: {feat_png}")

    # 6. Learning Curve for Random Forest
    print("\n--- Generating Learning Curve for Random Forest ---")
    train_sizes, train_scores, val_scores = learning_curve(
        active_model,
        X_train,
        y_train,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
        scoring="f1_macro",
        train_sizes=np.linspace(0.2, 1.0, 5),
        random_state=42,
        n_jobs=-1
    )
    train_mean = np.mean(train_scores, axis=1)
    train_std = np.std(train_scores, axis=1)
    val_mean = np.mean(val_scores, axis=1)
    val_std = np.std(val_scores, axis=1)

    plt.figure(figsize=(8, 5))
    plt.plot(train_sizes, train_mean, "o-", color="#2563eb", label="Training Macro-F1")
    plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.15, color="#2563eb")
    plt.plot(train_sizes, val_mean, "s-", color="#059669", label="5-Fold Cross-Validation Macro-F1")
    plt.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.15, color="#059669")
    plt.title("Learning Curve: Random Forest Severity Classifier", fontsize=12, fontweight="bold")
    plt.xlabel("Training Set Size (Samples)", fontsize=10)
    plt.ylabel("Macro F1-Score", fontsize=10)
    plt.legend(loc="lower right", fontsize=10)
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    lc_png = os.path.join(REPORTS_DIR, "learning_curve.png")
    plt.savefig(lc_png, dpi=300)
    plt.close()
    print(f"Saved learning curve to: {lc_png}")

    # 7. Confusion Matrices Subplot
    print("\n--- Generating Confusion Matrices Subplot ---")
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))
    axes = axes.flatten()
    model_names_for_cm = [
        "Dummy (Most Frequent)",
        "Rule-Only Baseline",
        "Logistic Regression",
        "Decision Tree",
        "Random Forest (Pre-tuning)",
        "Gradient Boosting"
    ]
    for idx, m_name in enumerate(model_names_for_cm):
        ax = axes[idx]
        mat = np.array(comparison_results[m_name]["confusion_matrix"])
        sns.heatmap(mat, annot=True, fmt="d", cmap="Blues", cbar=False,
                    xticklabels=classes, yticklabels=classes, ax=ax)
        acc_val = comparison_results[m_name]["test_agreement_accuracy"] * 100
        ax.set_title(f"{m_name}\n(Agreement Acc: {acc_val:.1f}%)", fontsize=10, fontweight="bold")
        ax.set_xlabel("Predicted Label", fontsize=8)
        ax.set_ylabel("Heuristic Proxy Label", fontsize=8)

    plt.tight_layout()
    cm_png = os.path.join(REPORTS_DIR, "confusion_matrices.png")
    plt.savefig(cm_png, dpi=300)
    plt.close()
    print(f"Saved confusion matrices to: {cm_png}")

    # 8. Comparison Table PNG
    print("\n--- Generating Model Comparison Table PNG ---")
    fig, ax = plt.subplots(figsize=(11, 4))
    ax.axis("off")
    table_data = [
        ["Model Architecture", "5-Fold CV Acc", "5-Fold CV F1", "Test Agreement Acc", "Test Macro-F1"]
    ]
    for m_name in model_names_for_cm:
        res = comparison_results[m_name]
        cv_acc_str = f"{res['cv_accuracy_mean']*100:.2f}% ± {res['cv_accuracy_std']*100:.2f}%"
        cv_f1_str = f"{res['cv_macro_f1_mean']:.4f} ± {res['cv_macro_f1_std']:.4f}"
        test_acc_str = f"{res['test_agreement_accuracy']*100:.2f}%"
        test_f1_str = f"{res['test_macro_f1']:.4f}"
        table_data.append([m_name, cv_acc_str, cv_f1_str, test_acc_str, test_f1_str])

    # Add Tuned RF row
    table_data.append([
        "Random Forest (Tuned RF)",
        f"{best_cv_score:.4f} (GridSearch)",
        f"{best_cv_score:.4f}",
        f"{tuned_acc*100:.2f}%",
        f"{tuned_f1:.4f}"
    ])

    table = ax.table(
        cellText=table_data,
        cellLoc="center",
        loc="center",
        colWidths=[0.32, 0.22, 0.22, 0.20, 0.18]
    )
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.2, 1.6)

    # Header styling
    for c in range(5):
        cell = table[0, c]
        cell.set_facecolor("#1e293b")
        cell.get_text().set_color("white")
        cell.get_text().set_weight("bold")

    plt.title("RoadSense AI: Multi-Model Evaluation Benchmark (Stratified 80/20 Split, Seed=42)", fontsize=11, fontweight="bold", pad=20)
    table_png = os.path.join(REPORTS_DIR, "model_comparison_table.png")
    plt.savefig(table_png, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved comparison table to: {table_png}")

    # 9. SHAP TreeExplainer & Summary Plot
    print("\n--- Generating SHAP TreeExplainer & Summary Plot ---")
    explainer = shap.TreeExplainer(active_model)
    shap_values = explainer.shap_values(X_test)

    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, feature_names=FEATURE_COLUMNS, show=False)
    plt.title("SHAP TreeExplainer Multi-Class Summary Plot (Test Split)", fontsize=11, fontweight="bold")
    plt.tight_layout()
    shap_png = os.path.join(REPORTS_DIR, "shap_summary.png")
    plt.savefig(shap_png, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Saved SHAP summary plot to: {shap_png}")

    # 10. Save JSON report
    report_json_path = os.path.join(REPORTS_DIR, "model_comparison.json")
    with open(report_json_path, "w") as f:
        json.dump(comparison_results, f, indent=2)
    print(f"\n[Complete] Successfully saved comparison metadata to: {report_json_path}")

    return comparison_results

if __name__ == "__main__":
    run_model_comparison()
