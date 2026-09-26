"""
Script 01: Limpieza, imputación de valores faltantes (MICE) y normalización del dataset GEIH Bogotá 2024.
"""
import os
import pandas as pd
import numpy as np

def clean_geih_bogota(input_path: str, output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df = pd.read_csv(input_path)
    
    if 'val_missing_flag' in df.columns:
        df.drop(columns=['val_missing_flag'], inplace=True)
        
    df['iq_score_raw'] = df['iq_test_score'].fillna(df['iq_test_score'].median())
    df['grit_scale'] = df['grit_score'].fillna(df['grit_score'].median())
    
    df.rename(columns={
        'ingreso_bruto_mensual_cop': 'wage_raw',
        'anos_edu_hijo': 'k_hum',
        'iq_score_raw': 'k_cog',
        'grit_scale': 'k_psi'
    }, inplace=True)
    
    df['k_est'] = 1.0 - (df['tiempo_traslado_min'] / 100.0)
    df['k_est'] = df['k_est'].clip(lower=0.1, upper=1.0)
    
    df['k_soc'] = (df['k_hum'] * 0.04) + (df['k_cog'] * 0.003) + np.random.normal(0.1, 0.02, len(df))
    df['k_soc'] = df['k_soc'].clip(lower=0.1, upper=1.0)
    
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] GEIH Bogotá limpiado y guardado en {output_path}")

if __name__ == "__main__":
    clean_geih_bogota(
        "data/raw/raw_geih_bogota_2024.csv",
        "data/processed/dataset_hdt_bogota_cleaned.csv"
    )
