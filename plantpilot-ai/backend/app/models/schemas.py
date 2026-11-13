from typing import List, Optional
from pydantic import BaseModel, Field

class SourceReference(BaseModel):
    document_name: str
    document_number: str
    revision: int
    effective_date: str
    page_number: int
    section: Optional[str] = None
    score: float = 0.0
    category: str = "General"  # Maintenance, Quality, Safety
    is_superseded: bool = False
    superseded_by: Optional[str] = None
    filename: str = ""
    excerpt: str

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000, description="The supervisor question")
    experience_level: Optional[str] = Field(default="Fresher (0 Years)", description="Operator experience level (e.g. Fresher / 0 Years, 1-5+ Years, or custom)")

class ChatResponse(BaseModel):
    answer: str
    direct_answer: Optional[str] = None
    important_steps: List[str] = Field(default_factory=list)
    safety_warning: Optional[str] = None
    supported: bool = True
    is_general_knowledge: bool = False
    sources: List[SourceReference] = Field(default_factory=list)
    revision_notice: Optional[str] = None
    suggested_followups: List[str] = Field(default_factory=list)

class DocumentMetadata(BaseModel):
    document_number: str
    document_name: str
    revision: int
    effective_date: str
    total_pages: int
    category: str
    is_superseded: bool = False
    superseded_by: Optional[str] = None
    description: str
    filename: str
    file_size_kb: float

class HealthResponse(BaseModel):
    status: str
    plant: str
    location: str
    indexed_documents: int
    indexed_chunks: int
    revisions_managed: List[str]
    active_llm_mode: str

class HistoryItem(BaseModel):
    id: str
    question: str
    timestamp: str
    supported: bool
    direct_answer: Optional[str] = None
    primary_source: Optional[str] = None
    revision: Optional[int] = None
    experience_level: Optional[str] = None
