import logging
from typing import List
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._init_model()

    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Loaded SentenceTransformer model: {self.model_name}")
        except Exception as e:
            logger.warning(f"Failed to load SentenceTransformer directly: {e}. Falling back to Chroma onnx or tfidf.")
            self.model = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if self.model:
            embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.tolist()
        return []

    def embed_query(self, query: str) -> List[float]:
        if self.model:
            embedding = self.model.encode([query], convert_to_numpy=True, normalize_embeddings=True)[0]
            return embedding.tolist()
        return []

embedding_service = EmbeddingService()
