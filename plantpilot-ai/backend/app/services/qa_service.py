from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from ..rag.pipeline import rag_pipeline
from ..models.schemas import ChatResponse, HistoryItem

class QAService:
    def __init__(self):
        self._history: List[HistoryItem] = []

    def answer_question(self, question: str, experience_level: Optional[str] = None) -> ChatResponse:
        # 1. Query RAG pipeline with experience context
        exp = (experience_level or "Fresher (0 Years)").strip()
        response = rag_pipeline.query(question.strip(), experience_level=exp)

        # 2. Record to history
        hist_item = HistoryItem(
            id=str(uuid.uuid4())[:8],
            question=question.strip(),
            timestamp=datetime.now().strftime("%H:%M · %d %b"),
            supported=response.supported,
            direct_answer=response.direct_answer,
            primary_source=response.sources[0].document_number if response.sources else ("General AI" if response.is_general_knowledge else None),
            revision=response.sources[0].revision if response.sources else None,
            experience_level=exp
        )
        self._history.insert(0, hist_item)
        if len(self._history) > 30:
            self._history.pop()

        return response

    def get_history(self) -> List[HistoryItem]:
        return self._history

    def clear_history(self):
        self._history.clear()

qa_service = QAService()
