"""
Task 6: Priority Engine Sensitivity Analysis.
Assesses robustness of the multi-criteria repair priority triage formula:
  Priority Score = (w_sev * S) + (w_traf * T) + (w_rain * R) + (w_imp * I)
Baseline weights:
  w_sev = 0.50, w_traf = 0.20, w_rain = 0.10, w_imp = 0.20 (Sum = 1.00)

Methodology:
  Perturbs each weight by +/- 20%, renormalizes all weights to sum to 1.0,
  and measures on seeded road damage reports:
    1. Spearman Rank Correlation (rank order preservation)
    2. Percentage of reports that shift operational triage band (High / Medium / Lower)

Outputs:
  - backend/ml/reports/priority_sensitivity.json
  - backend/ml/reports/priority_sensitivity.png
"""

import os
import json
import sqlite3
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from backend.app.services.priority_service import (
    calculate_priority_score,
    SEVERITY_SCALE,
    ROAD_CATEGORY_SCALE
)

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "roadsense.db")
os.makedirs(REPORTS_DIR, exist_ok=True)

BASELINE_WEIGHTS = {
    "severity": 0.50,
    "traffic": 0.20,
    "rainfall": 0.10,
    "road_importance": 0.20
}

def load_reports_for_sensitivity() -> pd.DataFrame:
    """Loads seeded reports from SQLite database or generates representative sample."""
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            df = pd.read_sql_query(
                "SELECT id, title, predicted_severity, traffic_level, rainfall_exposure, road_importance, road_category FROM reports",
                conn
            )
            conn.close()
            if not df.empty:
                print(f"[Sensitivity] Loaded {len(df)} reports from {DB_PATH}")
                return df
        except Exception as e:
            print(f"[Sensitivity] SQLite query error: {e}")

    # Fallback representative dataset matching seed_data distribution
    print("[Sensitivity] Using standard representative seed report distributions")
    data = []
    severities = ["Low", "Medium", "High"]
    categories = list(ROAD_CATEGORY_SCALE.keys())
    for i in range(50):
        data.append({
            "id": i + 1,
            "title": f"Report Sample #{i+1}",
            "predicted_severity": severities[i % 3],
            "traffic_level": (i % 5) + 1,
            "rainfall_exposure": float(30 + (i * 7) % 300),
            "road_importance": (i % 5) + 1,
            "road_category": categories[i % len(categories)]
        })
    return pd.DataFrame(data)


def compute_custom_priority(row: pd.Series, weights: Dict[str, float]) -> Tuple[float, str]:
    # Extract components identical to priority_service.py
    sev = row.get("predicted_severity")
    s_score = SEVERITY_SCALE.get(sev, 2.5)

    traf = row.get("traffic_level")
    t_score = float(traf) if traf is not None and 1 <= traf <= 5 else 2.5

    rain = row.get("rainfall_exposure")
    if rain is not None:
        if rain <= 50.0:
            r_score = 1.0
        elif rain <= 120.0:
            r_score = 2.5
        elif rain <= 250.0:
            r_score = 4.0
        else:
            r_score = 5.0
    else:
        r_score = 2.0

    imp = row.get("road_importance")
    cat = row.get("road_category")
    if imp is not None and 1 <= imp <= 5:
        i_score = float(imp)
    elif cat and cat in ROAD_CATEGORY_SCALE:
        i_score = ROAD_CATEGORY_SCALE[cat]
    else:
        i_score = 2.5

    raw_score = (
        weights["severity"] * s_score +
        weights["traffic"] * t_score +
        weights["rainfall"] * r_score +
        weights["road_importance"] * i_score
    )
    final_score = round(max(0.0, min(5.0, raw_score)), 2)

    if final_score >= 3.80:
        band = "High"
    elif final_score >= 2.50:
        band = "Medium"
    else:
        band = "Lower"

    return final_score, band


def run_priority_sensitivity_analysis() -> Dict[str, Any]:
    print("=" * 70)
    print("RoadSense AI: Priority Engine Sensitivity Analysis (+/- 20% Weight Perturbations)")
    print("=" * 70)

    df = load_reports_for_sensitivity()
    n_reports = len(df)

    # 1. Compute baseline scores and ranks
    baseline_scores = []
    baseline_bands = []
    for _, row in df.iterrows():
        score, band = compute_custom_priority(row, BASELINE_WEIGHTS)
        baseline_scores.append(score)
        baseline_bands.append(band)

    baseline_ranks = pd.Series(baseline_scores).rank(ascending=False, method="average")

    results = {
        "reports_analyzed": n_reports,
        "baseline_weights": BASELINE_WEIGHTS,
        "calibration_note": (
            "Baseline weights are currently assigned using municipal engineering domain heuristics. "
            "In production deployment, weights would be calibrated with civil engineering stakeholders "
            "using formal Multi-Criteria Decision Analysis such as the Analytic Hierarchy Process (AHP)."
        ),
        "perturbations": {}
    }

    perturbation_scenarios = []

    # 2. Perturb each weight by +/- 20%
    for factor in ["severity", "traffic", "rainfall", "road_importance"]:
        for direction, factor_multiplier in [("+20%", 1.20), ("-20%", 0.80)]:
            scenario_name = f"{factor}_{direction}"

            # Create perturbed unnormalized weights
            w_pert = dict(BASELINE_WEIGHTS)
            w_pert[factor] = w_pert[factor] * factor_multiplier

            # Renormalize to sum to 1.0
            sum_w = sum(w_pert.values())
            w_norm = {k: round(v / sum_w, 4) for k, v in w_pert.items()}

            pert_scores = []
            pert_bands = []
            for _, row in df.iterrows():
                score, band = compute_custom_priority(row, w_norm)
                pert_scores.append(score)
                pert_bands.append(band)

            pert_ranks = pd.Series(pert_scores).rank(ascending=False, method="average")

            # Compute Spearman rank correlation
            corr, _ = spearmanr(baseline_ranks, pert_ranks)
            corr = float(corr)

            # Compute % changing triage band
            band_changes = sum(1 for b, p in zip(baseline_bands, pert_bands) if b != p)
            change_pct = round((band_changes / n_reports) * 100, 2)

            results["perturbations"][scenario_name] = {
                "factor_perturbed": factor,
                "perturbation_percent": direction,
                "renormalized_weights": w_norm,
                "spearman_rank_correlation": round(corr, 4),
                "band_change_count": band_changes,
                "band_change_percentage": change_pct
            }

            perturbation_scenarios.append({
                "scenario": f"{factor.replace('_', ' ').capitalize()} ({direction})",
                "correlation": corr,
                "band_change_pct": change_pct
            })

            print(f"Scenario: {scenario_name:24s} | Spearman Corr: {corr:.4f} | Band Shift: {change_pct:5.2f}% ({band_changes}/{n_reports})")

    # 3. Save JSON Report
    out_json = os.path.join(REPORTS_DIR, "priority_sensitivity.json")
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[Complete] Successfully saved sensitivity metrics to: {out_json}")

    # 4. Generate Sensitivity Visualization Chart
    chart_df = pd.DataFrame(perturbation_scenarios)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Subplot 1: Spearman Rank Correlation
    colors_corr = ["#2563eb" if c >= 0.95 else "#f59e0b" for c in chart_df["correlation"]]
    ax1.barh(chart_df["scenario"], chart_df["correlation"], color=colors_corr, height=0.55)
    ax1.set_xlim(0.85, 1.01)
    ax1.set_xlabel("Spearman Rank Correlation with Baseline", fontsize=10, fontweight="bold")
    ax1.set_title("Rank Preservation Under +/- 20% Weight Variation\n(Higher is more stable)", fontsize=11, fontweight="bold")
    ax1.grid(axis="x", linestyle=":", alpha=0.6)
    for i, v in enumerate(chart_df["correlation"]):
        ax1.text(v + 0.002, i, f"{v:.4f}", va="center", fontsize=9, fontweight="bold")

    # Subplot 2: Triage Band Shift Percentage
    colors_shift = ["#ef4444" if s > 10 else "#059669" for s in chart_df["band_change_pct"]]
    ax2.barh(chart_df["scenario"], chart_df["band_change_pct"], color=colors_shift, height=0.55)
    ax2.set_xlabel("% of Reports Changing Triage Band", fontsize=10, fontweight="bold")
    ax2.set_title("Operational Triage Band Shift Rate\n(Lower indicates greater triage stability)", fontsize=11, fontweight="bold")
    ax2.grid(axis="x", linestyle=":", alpha=0.6)
    for i, v in enumerate(chart_df["band_change_pct"]):
        ax2.text(v + 0.3, i, f"{v:.1f}%", va="center", fontsize=9, fontweight="bold")

    plt.tight_layout()
    chart_png = os.path.join(REPORTS_DIR, "priority_sensitivity.png")
    plt.savefig(chart_png, dpi=300)
    plt.close()
    print(f"Saved priority sensitivity chart to: {chart_png}")

    return results

if __name__ == "__main__":
    from typing import Tuple
    run_priority_sensitivity_analysis()
