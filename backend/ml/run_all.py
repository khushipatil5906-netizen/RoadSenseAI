"""
RoadSense AI: End-to-End ML Pipeline Orchestrator.
Executes the rigorous ML pipeline tasks in sequential order (Seed=42):
  1. Task 1: Dataset Preparation, Heuristic Proxy Labeling & Feature Ablation
  2. Task 2: Multi-Model Benchmark, 5-Fold Stratified CV, Hyperparameter Tuning & SHAP
  3. Task 3: Hand-Labeled Validation Tooling & Status Check
  4. Task 4: Computer Vision Detector Evaluation & Train/Serve Mismatch Analysis
  5. Task 6: Repair Priority Formula Sensitivity Analysis
"""

import sys
import os
import time

def run_step(step_name: str, func):
    print("\n" + "=" * 76)
    print(f"  EXECUTING: {step_name}")
    print("=" * 76)
    t0 = time.time()
    try:
        func()
        duration = time.time() - t0
        print(f"--> [SUCCESS] {step_name} completed in {duration:.2f}s")
    except Exception as e:
        print(f"--> [FAILED] {step_name}: {e}")
        raise e

def main():
    print("============================================================================")
    print("  RoadSense AI — End-to-End ML Pipeline & Scientific Evaluation Suite")
    print("  Random State: 42 (Reproducible Splits, Cross-Validation, & Permutations)")
    print("============================================================================")

    # 1. Dataset preparation & ablation
    from backend.ml.prepare_dataset import prepare_and_save_data
    from backend.ml.ablation import run_ablation_study
    run_step("Task 1: Prepare RDD2022 Tabular Dataset", prepare_and_save_data)
    run_step("Task 1: Feature & Feature-Group Ablation Study", run_ablation_study)

    # 2. Model comparison, CV, tuning, SHAP
    from backend.ml.compare_models import run_model_comparison
    run_step("Task 2: Model Comparison, 5-Fold CV, Tuning & SHAP", run_model_comparison)

    # 3. Validation set sampling & evaluation tooling
    from backend.ml.make_validation_sample import make_validation_sample
    from backend.ml.evaluate_validation import evaluate_validation_set
    run_step("Task 3: Make Hand-Labeled Validation Sample", make_validation_sample)
    run_step("Task 3: Evaluate Hand-Labeled Validation Set", evaluate_validation_set)

    # 4. Detector evaluation
    from backend.ml.evaluate_detector import run_detector_evaluation
    run_step("Task 4: Detector Validation & Train/Serve Mismatch", run_detector_evaluation)

    # 5. Priority engine sensitivity
    from backend.ml.priority_sensitivity import run_priority_sensitivity_analysis
    run_step("Task 6: Priority Engine Sensitivity Analysis", run_priority_sensitivity_analysis)

    print("\n" + "=" * 76)
    print("  ALL ML PIPELINE SCRIPTS EXECUTED SUCCESSFULLY")
    print("  Outputs and charts saved to: backend/ml/reports/")
    print("============================================================================")

if __name__ == "__main__":
    main()
