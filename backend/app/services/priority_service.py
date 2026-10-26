"""
Transparent Repair Priority Scoring Engine for RoadSense AI.
Formula:
  priority_score =
    0.50 * severity_score +
    0.20 * traffic_score +
    0.10 * rainfall_score +
    0.20 * road_importance_score

All components normalized to a 0.0 - 5.0 scale before weighting.
Configurable weights and documented operational triage bands.
"""

from typing import Dict, Any, Optional, Tuple

SEVERITY_SCALE = {
    "Low": 1.0,
    "Medium": 3.0,
    "High": 5.0,
}

ROAD_CATEGORY_SCALE = {
    "Highway/Expressway": 5.0,
    "Major Arterial": 4.0,
    "Secondary Arterial": 3.0,
    "Local/Collector": 2.0,
    "Alley/Access Road": 1.0,
}

def calculate_priority_score(
    severity: Optional[str],
    traffic_level: Optional[int],
    rainfall_exposure: Optional[float],
    road_importance: Optional[int],
    road_category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculates normalized repair priority score and operational triage band.
    Flags missing factors as provisional instead of fabricating measurements.
    """
    missing_warnings = []
    is_provisional = False

    # 1. Severity component (50% weight)
    if severity and severity in SEVERITY_SCALE:
        severity_score = SEVERITY_SCALE[severity]
    else:
        severity_score = 2.5
        is_provisional = True
        missing_warnings.append("Damage severity is pending or unverified; default median proxy (2.5) used.")

    # 2. Traffic component (20% weight)
    if traffic_level is not None and 1 <= traffic_level <= 5:
        traffic_score = float(traffic_level)
    else:
        traffic_score = 2.5
        is_provisional = True
        missing_warnings.append("Traffic volume not specified; estimated baseline traffic score (2.5) applied.")

    # 3. Rainfall exposure component (10% weight)
    # If rainfall is provided as mm/month:
    if rainfall_exposure is not None:
        if rainfall_exposure <= 50.0:
            rainfall_score = 1.0
        elif rainfall_exposure <= 120.0:
            rainfall_score = 2.5
        elif rainfall_exposure <= 250.0:
            rainfall_score = 4.0
        else:
            rainfall_score = 5.0
    else:
        rainfall_score = 2.0
        is_provisional = True
        missing_warnings.append("Local precipitation data unavailable; conservative regional baseline (2.0) applied.")

    # 4. Road importance component (20% weight)
    if road_importance is not None and 1 <= road_importance <= 5:
        importance_score = float(road_importance)
    elif road_category and road_category in ROAD_CATEGORY_SCALE:
        importance_score = ROAD_CATEGORY_SCALE[road_category]
    else:
        importance_score = 2.5
        is_provisional = True
        missing_warnings.append("Road transit hierarchy unspecified; default collector level (2.5) assumed.")

    # Weights
    w_sev = 0.50
    w_traf = 0.20
    w_rain = 0.10
    w_imp = 0.20

    raw_score = (
        (w_sev * severity_score) +
        (w_traf * traffic_score) +
        (w_rain * rainfall_score) +
        (w_imp * importance_score)
    )
    final_score = round(max(0.0, min(5.0, raw_score)), 2)

    # Operational triage band
    if final_score >= 3.80:
        priority_band = "High"
    elif final_score >= 2.50:
        priority_band = "Medium"
    else:
        priority_band = "Lower"

    breakdown = {
        "formula": "0.50 * severity + 0.20 * traffic + 0.10 * rainfall + 0.20 * road_importance",
        "components": {
            "severity": {
                "raw_value": severity or "Unknown",
                "normalized_score": round(severity_score, 2),
                "weight": w_sev,
                "weighted_contribution": round(w_sev * severity_score, 2)
            },
            "traffic": {
                "raw_value": traffic_level if traffic_level is not None else "Missing",
                "normalized_score": round(traffic_score, 2),
                "weight": w_traf,
                "weighted_contribution": round(w_traf * traffic_score, 2)
            },
            "rainfall": {
                "raw_value": f"{rainfall_exposure} mm" if rainfall_exposure is not None else "Missing",
                "normalized_score": round(rainfall_score, 2),
                "weight": w_rain,
                "weighted_contribution": round(w_rain * rainfall_score, 2)
            },
            "road_importance": {
                "raw_value": road_importance if road_importance is not None else (road_category or "Missing"),
                "normalized_score": round(importance_score, 2),
                "weight": w_imp,
                "weighted_contribution": round(w_imp * importance_score, 2)
            }
        },
        "is_provisional": is_provisional,
        "warnings": missing_warnings,
        "disclaimer": "Priority scores provide operational triage recommendations and must not replace human engineering inspection or safety clearance."
    }

    return {
        "priority_score": final_score,
        "priority_band": priority_band,
        "breakdown": breakdown,
        "is_provisional": is_provisional,
    }
