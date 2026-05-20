import os
import pandas as pd
import numpy as np
import json
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from supabase import createClient, Client
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="RentAI Recommendation Engine")

# --- CONFIGURACIÓN DE SUPABASE ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeWarning("Faltan variables de entorno de Supabase")

supabase: Client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# --- LÓGICA DEL ALGORITMO (BASADA EN TU CUADERNILLO) ---

def score_financiero(u1, u2):
    start = max(u1.get('min_budget', 0), u2.get('min_budget', 0))
    end = min(u1.get('max_budget', 0), u2.get('max_budget', 0))
    if start <= end:
        return 1.0
    distancia = start - end
    return max(0, 1 - (distancia / 500000))

def score_conductal(u1, u2):
    diff_clean = abs(u1.get('cleanliness_level', 5) - u2.get('cleanliness_level', 5))
    diff_social = abs(u1.get('social_level', 5) - u2.get('social_level', 5))
    return (np.exp(-0.15 * diff_clean) + np.exp(-0.15 * diff_social)) / 2

def similarity_jaccard(list1, list2):
    if not list1 or not list2: return 0
    s1, s2 = set(list1), set(list2)
    return len(s1 & s2) / len(s1 | s2)

def verificar_exclusion_bilateral(u1, u2):
    # Reglas de exclusión (JSONB)
    ex1 = u1.get('exclusion_rules', {})
    ex2 = u2.get('exclusion_rules', {})
    tags1 = u1.get('lifestyle_tags', [])
    tags2 = u2.get('lifestyle_tags', [])
    
    if ex1.get('no_smokers') and "Fumador" in tags2: return False
    if ex2.get('no_smokers') and "Fumador" in tags1: return False
    if not ex1.get('pets_accepted') and "Mascotas" in tags2: return False
    if not ex2.get('pets_accepted') and "Mascotas" in tags1: return False
    
    return True

def process_recommendations():
    # 1. Descargar perfiles de Supabase
    response = supabase.table("profiles").select("*").execute()
    profiles = response.data
    if not profiles: return
    
    df = pd.DataFrame(profiles)
    
    # 2. Preprocesamiento (Supabase devuelve JSON real, no necesita parsers complejos)
    # Solo aseguramos que las bios no sean nulas para el NLP
    df['bio'] = df['bio'].fillna('')
    
    # 3. Capa Semántica (NLP)
    tfidf = TfidfVectorizer(stop_words=['soy', 'busco', 'una', 'con', 'que', 'en'])
    tfidf_matrix = tfidf.fit_transform(df['bio'])
    
    all_recommendations = []
    
    # 4. Cálculo Masivo
    for i, u1 in df.iterrows():
        user_scores = []
        for j, u2 in df.iterrows():
            if i == j: continue
            
            # 0. Exclusión
            if not verificar_exclusion_bilateral(u1, u2): continue
            
            # 1. Financiero
            s_fin = score_financiero(u1, u2)
            # 2. Conductal
            s_cond = score_conductal(u1, u2)
            # 3. Afinidad
            s_tag = similarity_jaccard(u1.get('lifestyle_tags', []), u2.get('lifestyle_tags', []))
            s_int = similarity_jaccard(u1.get('interests', []), u2.get('interests', []))
            s_afin = (s_tag * 0.7) + (s_int * 0.3)
            # 4. Semántico
            sim_sem = cosine_similarity(tfidf_matrix[i], tfidf_matrix[j])[0][0]
            
            # Ponderación basada en importancia_weights (JSONB)
            w = u1.get('importance_weights', {})
            total_w = sum(w.values()) if w and sum(w.values()) > 0 else 1
            
            score_final = (
                (s_fin * w.get('budget', 0.25)) +
                (s_cond * w.get('personality', 0.25)) +
                (s_afin * w.get('lifestyle', 0.25)) +
                (sim_sem * w.get('interests', 0.25))
            ) / total_w
            
            user_scores.append({
                "user_id": u1['id'],
                "recommended_user_id": u2['id'],
                "match_score": float(round(score_final * 100, 2))
            })
        
        # 5. Filtrar Top 20 para este usuario
        top_20 = sorted(user_scores, key=lambda x: x['match_score'], reverse=True)[:20]
        all_recommendations.extend(top_20)

    # 6. Actualizar Supabase (Batch update)
    # Primero borramos las recomendaciones actuales para evitar duplicados
    # Nota: En una app real podrías hacer un upsert más inteligente
    if all_recommendations:
        # Borrar todas (estrategia de refresco total)
        supabase.table("recommendations").delete().neq("match_score", -1).execute()
        # Insertar nuevas
        supabase.table("recommendations").insert(all_recommendations).execute()

@app.post("/sync")
async def sync_engine(background_tasks: BackgroundTasks):
    """
    Endpoint para disparar el cálculo.
    Se puede llamar desde un Webhook de Supabase o manualmente.
    """
    background_tasks.add_task(process_recommendations)
    return {"status": "Calculation started in background"}

@app.get("/")
def health_check():
    return {"status": "Engine is running", "wired": "active"}
