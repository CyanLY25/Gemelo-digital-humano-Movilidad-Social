import math
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from backend.models.schemas import ModelMetrics, TopsisWeightsInput, TopsisRankingItem, RetrainLog

DEFAULT_MODELS_METRICS: Dict[str, Dict[str, Any]] = {
    "Random Forest": {
        "f1_score": 0.864,
        "auc_roc": 0.912,
        "latency_ms": 14.2,
        "explicability_score": 0.85,
        "brier_score": 0.112,
        "confusion_matrix": [[780, 45], [68, 107]],
    },
    "XGBoost": {
        "f1_score": 0.898,
        "auc_roc": 0.946,
        "latency_ms": 8.7,
        "explicability_score": 0.82,
        "brier_score": 0.089,
        "confusion_matrix": [[802, 23], [48, 127]],
    },
    "SVM RBF": {
        "f1_score": 0.812,
        "auc_roc": 0.854,
        "latency_ms": 32.1,
        "explicability_score": 0.65,
        "brier_score": 0.145,
        "confusion_matrix": [[745, 80], [85, 90]],
    },
    "CNN-LSTM Híbrido": {
        "f1_score": 0.879,
        "auc_roc": 0.928,
        "latency_ms": 44.5,
        "explicability_score": 0.58,
        "brier_score": 0.098,
        "confusion_matrix": [[788, 37], [56, 119]],
    },
    "LSTM-Autoencoder + RF": {
        "f1_score": 0.915,
        "auc_roc": 0.958,
        "latency_ms": 22.8,
        "explicability_score": 0.88,
        "brier_score": 0.072,
        "confusion_matrix": [[812, 13], [38, 137]],
    },
}

def generate_roc_curve(auc: float) -> Tuple[List[float], List[float]]:
    fpr = np.linspace(0, 1, 50).tolist()
    tpr = [min(1.0, math.pow(x, (1 - auc) / max(0.01, auc))) for x in fpr]
    return fpr, tpr

def get_all_models_metrics() -> List[ModelMetrics]:
    results = []
    for name, data in DEFAULT_MODELS_METRICS.items():
        fpr, tpr = generate_roc_curve(data["auc_roc"])
        results.append(
            ModelMetrics(
                model_name=name,
                f1_score=data["f1_score"],
                auc_roc=data["auc_roc"],
                latency_ms=data["latency_ms"],
                explicability_score=data["explicability_score"],
                brier_score=data["brier_score"],
                confusion_matrix=data["confusion_matrix"],
                roc_fpr=fpr,
                roc_tpr=tpr,
            )
        )
    return results

def compute_topsis_ranking(weights: TopsisWeightsInput) -> List[TopsisRankingItem]:
    models = list(DEFAULT_MODELS_METRICS.keys())
    raw_matrix = []
    for m in models:
        d = DEFAULT_MODELS_METRICS[m]
        raw_matrix.append([
            d["f1_score"],
            d["auc_roc"],
            d["latency_ms"],
            d["explicability_score"],
            d["brier_score"]
        ])
    
    matrix = np.array(raw_matrix, dtype=float)
    norm = np.linalg.norm(matrix, axis=0)
    norm_matrix = matrix / norm
    
    w_arr = np.array([
        weights.weight_f1,
        weights.weight_auc,
        weights.weight_latency,
        weights.weight_explicability,
        weights.weight_brier
    ])
    w_arr = w_arr / np.sum(w_arr)
    
    weighted_matrix = norm_matrix * w_arr
    
    ideal_best = np.array([
        np.max(weighted_matrix[:, 0]),
        np.max(weighted_matrix[:, 1]),
        np.min(weighted_matrix[:, 2]),
        np.max(weighted_matrix[:, 3]),
        np.min(weighted_matrix[:, 4]),
    ])
    
    ideal_worst = np.array([
        np.min(weighted_matrix[:, 0]),
        np.min(weighted_matrix[:, 1]),
        np.max(weighted_matrix[:, 2]),
        np.min(weighted_matrix[:, 3]),
        np.max(weighted_matrix[:, 4]),
    ])
    
    d_best = np.sqrt(np.sum((weighted_matrix - ideal_best)**2, axis=1))
    d_worst = np.sqrt(np.sum((weighted_matrix - ideal_worst)**2, axis=1))
    
    closeness = d_worst / (d_best + d_worst)
    
    rankings = []
    for idx, name in enumerate(models):
        rankings.append({
            "model_name": name,
            "closeness_score": round(float(closeness[idx]), 4)
        })
    
    rankings.sort(key=lambda x: x["closeness_score"], reverse=True)
    
    output = []
    for r_idx, item in enumerate(rankings):
        output.append(TopsisRankingItem(
            rank=r_idx + 1,
            model_name=item["model_name"],
            closeness_score=item["closeness_score"]
        ))
    return output

def simulate_retraining(epochs: int = 50, learning_rate: float = 0.001) -> List[RetrainLog]:
    logs = []
    loss = 0.65
    val_loss = 0.68
    f1 = 0.72
    for ep in range(1, epochs + 1):
        loss = max(0.08, loss * 0.94 + np.random.normal(0, 0.005))
        val_loss = max(0.11, val_loss * 0.945 + np.random.normal(0, 0.006))
        f1 = min(0.96, f1 + 0.005 + np.random.normal(0, 0.002))
        logs.append(RetrainLog(
            epoch=ep,
            loss=round(loss, 4),
            val_loss=round(val_loss, 4),
            f1=round(f1, 4)
        ))
    return logs
