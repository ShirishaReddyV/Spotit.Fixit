from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hashlib
import httpx
import math
from typing import Optional

app = FastAPI(title="SpotIt.FixIt AI & Security Core")

# Allow the React frontend to communicate with this Python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated Database of previously uploaded "Fixed" image hashes
# In production, this connects to your PostgreSQL database
KNOWN_IMAGE_HASHES = set([
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" # Example dummy hash
])

class NLPRequest(BaseModel):
    description: str

class DuplicateCheckRequest(BaseModel):
    lat: float
    lng: float
    category: Optional[str] = None
    radius_km: float = 0.15  # 150 metres default

def calculate_image_hash(image_bytes: bytes) -> str:
    """Calculates a SHA-256 cryptographic hash of the image to detect exact duplicates."""
    return hashlib.sha256(image_bytes).hexdigest()

@app.post("/api/security/verify-evidence")
async def verify_evidence(file: UploadFile = File(...)):
    """
    ANTI-CORRUPTION PROTOCOL:
    Scans government evidence uploads. If the exact same image is uploaded twice 
    to claim multiple grants, the system freezes the transaction.
    """
    contents = await file.read()
    img_hash = calculate_image_hash(contents)
    
    if img_hash in KNOWN_IMAGE_HASHES:
        raise HTTPException(
            status_code=403, 
            detail="FRAUD ALERT: Duplicate evidence detected. This image matches a previously closed ticket. Payment automated freeze initiated."
        )
    
    # If it's a new, unique image, add it to the database
    KNOWN_IMAGE_HASHES.add(img_hash)
    
    return {
        "status": "Verified",
        "hash_signature": img_hash[:10] + "...",
        "message": "Evidence is unique and accepted."
    }

@app.post("/api/ai/route-ticket")
async def route_ticket(request: NLPRequest):
    """
    AI NLP PROTOCOL:
    Reads the citizen's text description and automatically routes it to the correct MLA/Department.
    """
    text = request.description.lower()
    
    # Simple NLP Keyword extraction (Can be replaced with TensorFlow/PyTorch later)
    if any(word in text for word in ["dark", "light", "bulb", "electricity"]):
        return {"category": "Streetlight Outage", "department": "Power & Utilities", "priority": "Medium"}
    elif any(word in text for word in ["water", "pipe", "leak", "flood"]):
        return {"category": "Water Leak", "department": "Water Supply Dept", "priority": "High"}
    elif any(word in text for word in ["road", "pothole", "asphalt", "crater"]):
        return {"category": "Road Damage", "department": "Public Works", "priority": "Critical"}
    else:
        return {"category": "Unclassified Anomaly", "department": "General Routing", "priority": "Low"}


# ---------------------------------------------------------------------------
# DUPLICATE DETECTION ENGINE
# ---------------------------------------------------------------------------
JAVA_CORE_URL = "http://localhost:8080"

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@app.post("/api/ai/check-duplicate")
async def check_duplicate(request: DuplicateCheckRequest):
    """
    SMART DUPLICATE DETECTION:
    Fetches nearby open issues from the Java backend, scores each one by
    distance + category match, and returns the best candidate with a
    confidence score so the frontend can prompt the user to upvote instead.
    """
    try:
        params = {
            "lat": request.lat,
            "lng": request.lng,
            "radiusKm": request.radius_km,
        }
        if request.category:
            params["category"] = request.category

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{JAVA_CORE_URL}/api/issues/nearby", params=params)
            resp.raise_for_status()
            nearby: list = resp.json()
    except Exception as e:
        # If backend is unreachable, fail silently — don't block user
        return {"duplicate_found": False, "reason": f"backend_error: {e}"}

    if not nearby:
        return {"duplicate_found": False}

    # Score each nearby issue
    best = None
    best_score = 0.0
    for issue in nearby:
        dist_km = _haversine_km(request.lat, request.lng,
                                issue["latitude"], issue["longitude"])
        # Distance score: 1.0 at 0m, 0.0 at radius boundary
        dist_score = max(0.0, 1.0 - (dist_km / request.radius_km))
        # Category bonus: 0.4 extra if category matches exactly
        cat_score = 0.4 if request.category and issue.get("aiCategory") == request.category else 0.0
        score = dist_score + cat_score
        if score > best_score:
            best_score = score
            best = issue

    if best is None or best_score < 0.3:
        return {"duplicate_found": False}

    # Human-readable confidence band
    if best_score >= 1.2:
        confidence = "Very High"
    elif best_score >= 0.9:
        confidence = "High"
    elif best_score >= 0.6:
        confidence = "Medium"
    else:
        confidence = "Low"

    return {
        "duplicate_found": True,
        "confidence": confidence,
        "score": round(best_score, 3),
        "match": best,
    }