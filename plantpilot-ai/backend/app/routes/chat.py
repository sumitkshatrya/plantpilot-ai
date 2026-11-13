from fastapi import APIRouter, HTTPException
from typing import List

from ..models.schemas import ChatRequest, ChatResponse, HistoryItem
from ..services.qa_service import qa_service

router = APIRouter(prefix="/api", tags=["Chat"])

@router.post("/chat", response_model=ChatResponse)
def ask_question(payload: ChatRequest):
    try:
        return qa_service.answer_question(payload.question, payload.experience_level)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")

@router.get("/history", response_model=List[HistoryItem])
def get_recent_history():
    return qa_service.get_history()

@router.delete("/history")
def clear_history():
    qa_service.clear_history()
    return {"status": "cleared"}
