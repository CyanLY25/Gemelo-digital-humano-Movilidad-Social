"""
Script 04: Consolidación, feature engineering y etiquetado de la variable objetivo (Trampa de Pobreza) listo para el entrenamiento ML.
"""
import os
import pandas as pd
import numpy as np

def generate_final_training_dataset(output_path: str, n_samples: int = 1000):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    np.random.seed(42)
    
    agent_ids = [f"HDT_{i:04d}" for i in range(n_samples)]
    origin_q = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.2, 0.2, 0.2, 0.2, 0.2])
    
    k_cog = np.clip(np.random.normal(88.0 + origin_q * 4.5, 8.0, n_samples), 65.0, 145.0)
    k_hum = np.clip(np.random.normal(7.0 + origin_q * 1.8, 2.0, n_samples), 0.0, 22.0)
    k_soc = np.clip(np.random.normal(0.20 + origin_q * 0.12, 0.10, n_samples), 0.05, 0.98)
    k_psi = np.clip(np.random.normal(0.35 + origin_q * 0.08, 0.12, n_samples), 0.10, 0.98)
    k_est = np.clip(np.random.normal(0.25 + origin_q * 0.14, 0.15, n_samples), 0.05, 0.95)
    
    log_w = (
        8.5
        + 0.095 * k_hum
        + 0.006 * (k_cog - 100.0)
        + np.log(1 + k_soc * 15) * 0.07
        + k_psi * 0.12
        - (1.0 - k_est) * 0.32
        + (origin_q - 3) * 0.22
        + np.random.normal(0, 0.25, n_samples)
    )
    final_wage = np.exp(log_w)
    
    poverty_trap = np.where((origin_q == 1) & (final_wage < 18000), 1, 0)
    
    df_final = pd.DataFrame({
        "agent_id": agent_ids,
        "origin_quintile": origin_q,
        "k_cog": np.round(k_cog, 2),
        "k_hum": np.round(k_hum, 2),
        "k_soc": np.round(k_soc, 4),
        "k_psi": np.round(k_psi, 4),
        "k_est": np.round(k_est, 4),
        "final_wage": np.round(final_wage, 2),
        "target_poverty_trap": poverty_trap
    })
    
    df_final.to_csv(output_path, index=False)
    print(f"[SUCCESS] Dataset final listo para entrenamiento guardado en {output_path} ({len(df_final)} filas)")

if __name__ == "__main__":
    generate_final_training_dataset("data/processed/dataset_hdt_5capitals_final_training.csv", n_samples=1000)
