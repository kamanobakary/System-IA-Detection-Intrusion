# IDS-IA : Système IA de Détection d'Intrusion

Un système complet de détection d'intrusions basé sur l'intelligence artificielle, destiné à un projet de master en cybersécurité. Combine un backend Python avec FastAPI et un frontend React moderne pour l'analyse du trafic réseau simulé.

## Caractéristiques principales

- **Génération de trafic réseau simulé** contenant du trafic normal et des attaques (scans de ports, brute-force SSH, DDoS UDP)
- **Modèle IA Isolation Forest** pour la détection automatique d'anomalies sans données étiquetées
- **Dashboard React moderne** avec design cybersécurité sombre
- **Visualisations en temps réel** : graphiques d'évolution, répartition des protocoles, alertes par sévérité
- **API REST complète** pour l'analyse et la consultation des données
- **Base de données SQLite** pour la persistence des résultats

## Architecture

```
project/
├── backend/
│   ├── main.py              # API FastAPI avec endpoints
│   ├── database.py          # Gestion SQLite
│   ├── data_generator.py    # Génération trafic simulé
│   ├── ml_model.py          # Modèle Isolation Forest
│   └── requirements.txt     # Dépendances Python
├── src/
│   ├── components/          # Composants React
│   ├── api/                 # Client API
│   ├── types/               # Types TypeScript
│   ├── App.tsx              # App principale
│   ├── main.tsx             # Entrée
│   └── index.css            # Styles globaux
├── package.json
├── tailwind.config.js
└── README.md
```

## Installation

### Prérequis

- **Node.js** 18+ (pour le frontend)
- **Python** 3.10+ (pour le backend)
- **npm** ou **yarn**

### Backend (Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# ou: venv\Scripts\activate  # Windows

pip install -r requirements.txt
python main.py
```

Le serveur FastAPI démarre sur `http://localhost:8000`

**Endpoints disponibles :**
- `POST /api/analyze` — Lance une analyse complète
- `GET /api/traffic` — Liste le trafic analysé
- `GET /api/alerts` — Liste les alertes générées
- `GET /api/statistics` — Statistiques globales
- `GET /api/health` — Vérification du serveur

### Frontend (React)

```bash
npm install
npm run dev
```

L'application React démarre sur `http://localhost:5173`

### Construction pour la production

```bash
npm run build
npm run preview
```

## Utilisation

### Mode connecté (Backend + Frontend)

1. Lancez le serveur Python dans un terminal
2. Lancez l'application React dans un autre terminal
3. Accédez à `http://localhost:5173`

### Mode démo (Frontend seul)

L'application fonctionne en **mode démo** si le backend n'est pas disponible :
- Données générées automatiquement
- Interface complètement fonctionnelle
- Parfait pour les démos ou tests

## Guide utilisateur

### Dashboard
Vue d'ensemble avec :
- **Cartes statistiques** : nombre de paquets, anomalies, alertes
- **Alertes Récentes** : tableau moderne avec les 5 dernières alertes (heure, IP source/destination, type, gravité, score IA)
- **Graphique temporel** : évolution du trafic sur 30 minutes
- **Répartition des protocoles** : TCP, UDP, ICMP
- **Tableau d'alertes** : dernières 8 alertes

### Trafic réseau
Table complète avec :
- Filtres par IP, protocole
- Statut normal/anomalie
- Score IA pour chaque paquet
- Pagination

### Alertes
Tableau détaillé avec :
- Sévérité (faible, moyen, élevé, critique)
- Type d'attaque (scan ports, brute-force, DDoS, anomalie)
- Description complète (dépliable)
- Recherche et filtrage

### Analyse IA
Interface pour lancer des analyses :
- Configuration du nombre de paquets normaux
- Configuration du nombre d'attaques
- Visualisation du pipeline de traitement
- Résultats détaillés

## Technologie : Isolation Forest

**Isolation Forest** est un algorithme d'apprentissage non supervisé particulièrement adapté aux anomalies réseau :

1. **Construction** : crée 150 arbres de décision aléatoires
2. **Isolation** : les anomalies sont isolées en peu de divisions (rares et différentes)
3. **Score** : calcul selon la profondeur moyenne d'isolation (0 = normal, 1 = très anormal)
4. **Avantages** :
   - Pas besoin de données étiquetées
   - Rapide même sur grands datasets
   - Détecte automatiquement les comportements nouveaux

## Features dérivées pour la détection

Le modèle utilise 8 features pour maximum de précision :

- `src_port`, `dst_port` — Ports source et destination
- `bytes_sent`, `duration`, `packets` — Volume et timing
- `protocol_enc` — Protocole encodé (TCP=0, UDP=1, ICMP=2)
- `bytes_per_packet` — Volume par paquet
- `port_ratio` — Rapport src/dst port (détecte les scans)

## Heuristiques de classification

Après détection d'anomalie, le système classe le type d'attaque :

| Type | Conditions |
|------|-----------|
| **Port Scan** | Petit paquet, port bas, multiple connexions rapides |
| **Brute Force** | Port 22 (SSH), multiples connexions courtes |
| **DDoS** | UDP, volume énorme, beaucoup de paquets |
| **Anomalie** | Comportement suspect sans match spécifique |

## Résultats typiques

Après une analyse avec 200 paquets + 3 attaques :
- **312 paquets** analysés
- **38 anomalies** détectées (~12%)
- **25 alertes** générées
- **4 critiques** (immédiate intervention)

## Design

- **Palette sombre** : fond #0a0e1a, accents cyan/vert
- **Effet cyberpunk** : scanlines, glows, animations subtiles
- **Responsive** : desktop et tablette
- **Animations** : transitions fluides, feedback visuel clair

## Fichiers clés

### Backend
- **main.py** : API FastAPI avec 5 endpoints
- **ml_model.py** : Modèle Isolation Forest + heuristiques
- **data_generator.py** : Trafic réseau simulé réaliste
- **database.py** : Schéma SQLite et requêtes

### Frontend
- **App.tsx** : Logique principale, gestion d'état
- **Sidebar.tsx** : Navigation et statut du système
- **StatCards.tsx** : Cartes statistiques animées
- **TrafficChart.tsx** : Graphiques Recharts
- **AlertsTable.tsx** : Tableau alertes dépliable
- **TrafficTable.tsx** : Tableau trafic avec pagination
- **AnalysisPanel.tsx** : Interface d'analyse
- **api/index.ts** : Client API + données mock

## Extension du projet

### Ajouter une nouvelle détection
1. Modifier `ml_model.classify_alert()` dans `backend/ml_model.py`
2. Ajouter la nouvelle alerte type dans `src/types/index.ts`

### Intégrer des données réelles
1. Remplacer `data_generator.py` par un capture de trafic réel (tcpdump, zeek)
2. Parser le format dans `main.py` route `POST /api/analyze`

### Utiliser un autre modèle IA
1. Remplacer Isolation Forest par Random Forest, SVM, etc.
2. Maintenir l'interface `train_and_predict(records)` dans `ml_model.py`

## Ressources éducatives

- [Isolation Forest - Original Paper](https://cs.nju.edu.cn/zhouzh/zhouzh.files/publication/icdm08.pdf)
- [Scikit-learn Isolation Forest](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

## Remarques pour le master

Ce projet démontre :
- ✓ Compréhension des attaques réseau (scans, brute-force, DDoS)
- ✓ Implémentation d'un modèle ML pour la détection d'anomalies
- ✓ Architecture full-stack (Python backend + React frontend)
- ✓ Design moderne et interface utilisateur professionnelle
- ✓ Code bien commenté et structure claire

Adapté pour un portfolio en cybersécurité et intelligence artificielle.

## Licence

Projet éducatif — usage libre pour la formation et la démonstration.

---

**Auteur** : Projet Master Cybersécurité  
**Version** : 1.0.0  
**Date** : 2026
