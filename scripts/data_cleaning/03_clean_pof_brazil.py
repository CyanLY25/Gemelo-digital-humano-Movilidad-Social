"""
Script 03: Limpieza y homologación del dataset POF Brasil 2018.
"""
import os
import pandas as pd
import numpy as np

def clean_pof_brazil(input_path: str, output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df = pd.read_csv(input_path)
    
    df['wage_raw'] = df['rendimento_bruto_reais'] * 0.20 * 12.0
    
    df['k_cog'] = df['iq_test']
    df['k_hum'] = df['escolaridade_filho']
    df['k_psi'] = df['grit']
    df['k_est'] = 1.0 - (df['distancia_trabalho_km'] / 25.0)
    df['k_est'] = df['k_est'].clip(lower=0.1, upper=1.0)
    
    df['k_soc'] = 0.20 + (df['k_hum'] * 0.035) - (df['favela_periferia'] * 0.15)
    df['k_soc'] = df['k_soc'].clip(lower=0.1, upper=1.0)
    
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] POF Brasil limpiado y guardado en {output_path}")

if __name__ == "__main__":
    clean_pof_brazil(
        "data/raw/raw_pof_brazil_2018.csv",
        "data/processed/dataset_pof_processed.csv"
    )
