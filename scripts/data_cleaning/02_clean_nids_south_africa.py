"""
Script 02: Limpieza y homologación del dataset NIDS Sudáfrica Wave 5.
"""
import os
import pandas as pd
import numpy as np

def clean_nids_south_africa(input_path: str, output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df = pd.read_csv(input_path)
    
    df['wage_raw'] = df['raw_monthly_rand'] * 0.055 * 12.0
    
    df['k_cog'] = df['iq_score_raw']
    df['k_hum'] = df['child_edu_yrs']
    df['k_psi'] = df['grit_scale']
    df['k_est'] = 1.0 - (df['travel_dist_km'] / 30.0)
    df['k_est'] = df['k_est'].clip(lower=0.1, upper=1.0)
    
    df['k_soc'] = 0.15 + (df['k_hum'] * 0.03) + (1.0 - df['township_flag']) * 0.25
    df['k_soc'] = df['k_soc'].clip(lower=0.1, upper=1.0)
    
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] NIDS Sudáfrica limpiado y guardado en {output_path}")

if __name__ == "__main__":
    clean_nids_south_africa(
        "data/raw/raw_nids_south_africa_wave5.csv",
        "data/processed/dataset_nids_processed.csv"
    )
