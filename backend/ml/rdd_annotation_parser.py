"""
RDD2022 Pascal VOC XML Annotation Parser and Feature Extractor.
Extracts tabular structural features from road damage bounding box annotations.
RDD Damage Classes:
- D00: Longitudinal Crack
- D10: Transverse Crack
- D20: Alligator Crack (Fatigue Crack)
- D40: Pothole
"""

import xml.etree.ElementTree as ET
from typing import Dict, Any, List
import numpy as np

DAMAGE_CODE_MAP = {
    "D00": "longitudinal_crack",
    "D10": "transverse_crack",
    "D20": "alligator_crack",
    "D40": "pothole",
}

FEATURE_COLUMNS = [
    "damage_count",
    "pothole_count",
    "alligator_crack_count",
    "longitudinal_crack_count",
    "transverse_crack_count",
    "total_bbox_area_ratio",
    "largest_bbox_area_ratio",
]

def parse_voc_xml(xml_content: str) -> Dict[str, Any]:
    """
    Parses Pascal VOC XML format from RDD2022 dataset.
    Returns extracted damage counts, bounding box areas, and normalized ratios.
    """
    root = ET.fromstring(xml_content)
    
    size_elem = root.find("size")
    width = 600
    height = 600
    if size_elem is not None:
        w_el = size_elem.find("width")
        h_el = size_elem.find("height")
        if w_el is not None and w_el.text:
            width = max(int(w_el.text), 1)
        if h_el is not None and h_el.text:
            height = max(int(h_el.text), 1)
            
    img_area = float(width * height)
    
    pothole_count = 0
    alligator_crack_count = 0
    longitudinal_crack_count = 0
    transverse_crack_count = 0
    bbox_areas = []
    
    for obj in root.findall("object"):
        name_elem = obj.find("name")
        if name_elem is None or not name_elem.text:
            continue
        cls_name = name_elem.text.strip()
        
        if cls_name == "D40" or "pothole" in cls_name.lower():
            pothole_count += 1
        elif cls_name == "D20" or "alligator" in cls_name.lower():
            alligator_crack_count += 1
        elif cls_name == "D00" or "longitudinal" in cls_name.lower():
            longitudinal_crack_count += 1
        elif cls_name == "D10" or "transverse" in cls_name.lower():
            transverse_crack_count += 1
            
        bndbox = obj.find("bndbox")
        if bndbox is not None:
            try:
                xmin = float(bndbox.find("xmin").text)
                ymin = float(bndbox.find("ymin").text)
                xmax = float(bndbox.find("xmax").text)
                ymax = float(bndbox.find("ymax").text)
                box_w = max(0.0, xmax - xmin)
                box_h = max(0.0, ymax - ymin)
                bbox_areas.append(box_w * box_h)
            except (TypeError, ValueError, AttributeError):
                pass
                
    total_damage_count = (
        pothole_count + alligator_crack_count + longitudinal_crack_count + transverse_crack_count
    )
    
    if bbox_areas:
        total_bbox_area = sum(bbox_areas)
        largest_bbox_area = max(bbox_areas)
    else:
        total_bbox_area = 0.0
        largest_bbox_area = 0.0
        
    total_bbox_area_ratio = min(1.0, total_bbox_area / img_area)
    largest_bbox_area_ratio = min(1.0, largest_bbox_area / img_area)
    
    return {
        "damage_count": total_damage_count,
        "pothole_count": pothole_count,
        "alligator_crack_count": alligator_crack_count,
        "longitudinal_crack_count": longitudinal_crack_count,
        "transverse_crack_count": transverse_crack_count,
        "total_bbox_area_ratio": round(total_bbox_area_ratio, 4),
        "largest_bbox_area_ratio": round(largest_bbox_area_ratio, 4),
        "img_width": width,
        "img_height": height,
    }

def heuristic_severity(features: Dict[str, Any]) -> str:
    """
    Computes a proxy severity label ('Low', 'Medium', 'High') from damage features.

    SCIENTIFIC INTEGRITY & LIMITATION NOTICE:
    These are PROXY labels generated via deterministic engineering heuristic rules,
    NOT ground-truth civil engineering inspection assessments. Real-world road structural
    integrity depends on sub-surface compaction, pavement thickness, water table ingress,
    and heavy axle traffic loading, which cannot be directly measured from surface bounding
    box annotations alone.

    Rule Logic:
    - High: Multiple severe structural defects (potholes >= 2, alligator cracks >= 2,
            or single largest bbox area ratio >= 0.12, or total bbox area ratio >= 0.20,
            or co-occurrence of at least 1 pothole and 1 alligator crack).
    - Medium: Moderate defect present (potholes >= 1, alligator crack >= 1,
              or total damage count >= 3, or largest bbox area ratio >= 0.05,
              or total bbox area ratio >= 0.08).
    - Low: Minor hairline superficial cracks (longitudinal/transverse) with minimal surface
           disruption (largest bbox area ratio < 0.05).
    """
    potholes = features.get("pothole_count", 0)
    alligator = features.get("alligator_crack_count", 0)
    total_count = features.get("damage_count", 0)
    largest_ratio = features.get("largest_bbox_area_ratio", 0.0)
    total_ratio = features.get("total_bbox_area_ratio", 0.0)
    
    if (
        potholes >= 2
        or alligator >= 2
        or largest_ratio >= 0.12
        or total_ratio >= 0.20
        or (potholes >= 1 and alligator >= 1)
    ):
        return "High"
    elif (
        potholes >= 1
        or alligator >= 1
        or total_count >= 3
        or largest_ratio >= 0.05
        or total_ratio >= 0.08
    ):
        return "Medium"
    else:
        return "Low"

# Backwards compatibility alias
compute_proxy_severity_label = heuristic_severity

