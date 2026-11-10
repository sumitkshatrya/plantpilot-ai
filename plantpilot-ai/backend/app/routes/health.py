import os
from fastapi import APIRouter
from ..core.config import settings
from ..rag.vector_store import vector_store
from ..models.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def check_health():
    api_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
    llm_mode = f"OpenAI ({settings.OPENAI_MODEL})" if api_key and len(api_key.strip()) > 10 else "Grounded Local Mode (No API Key Required)"

    return HealthResponse(
        status="operational",
        plant=settings.PLANT_NAME,
        location=settings.PLANT_LOCATION,
        indexed_documents=4,
        indexed_chunks=len(vector_store.chunks_cache),
        revisions_managed=[
            "MNT-MAN-CNC-02 Rev 02 (Active)",
            "QC-SOP-014 Rev 03 (Superseded)",
            "QC-SOP-014 Rev 04 (Active Controlled)",
            "SAF-SOP-003 Rev 05 (Active)"
        ],
        active_llm_mode=llm_mode
    )
