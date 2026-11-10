from __future__ import annotations
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from .extractor import ExtractedChunk
from .embeddings import embedding_service
from ..core.config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    COLLECTION_NAME = "plant_sops"

    def __init__(self, persist_dir: Path):
        self.persist_dir = persist_dir
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))
        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"description": "PlantPilot AI SOP Vector Store"}
        )
        self.chunks_cache: Dict[str, ExtractedChunk] = {}
        self.tfidf_vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
        self.tfidf_matrix = None
        self.chunk_ids_order: List[str] = []

    def index_chunks(self, chunks: List[ExtractedChunk]):
        if not chunks:
            return

        self.chunks_cache = {c.chunk_id: c for c in chunks}
        self.chunk_ids_order = [c.chunk_id for c in chunks]

        # 1. Fit TF-IDF matrix for hybrid matching
        texts = [c.text for c in chunks]
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)

        # 2. Add or update in ChromaDB
        existing_ids = set(self.collection.get()["ids"])
        new_ids = [c.chunk_id for c in chunks]

        ids_to_add = []
        documents_to_add = []
        metadatas_to_add = []

        for c in chunks:
            ids_to_add.append(c.chunk_id)
            documents_to_add.append(c.text)
            metadatas_to_add.append({
                "document_number": c.document_number,
                "document_name": c.document_name,
                "revision": c.revision,
                "effective_date": c.effective_date,
                "page_number": c.page_number,
                "section": c.section,
                "category": c.category,
                "is_superseded": c.is_superseded,
                "superseded_by": c.superseded_by or "",
                "filename": c.filename
            })

        # Generate embeddings if service is available
        embeddings = None
        try:
            embeddings = embedding_service.embed_texts(documents_to_add)
            if not embeddings or len(embeddings) != len(documents_to_add):
                embeddings = None
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}. Chroma will use default.")
            embeddings = None

        try:
            if embeddings:
                self.collection.upsert(
                    ids=ids_to_add,
                    documents=documents_to_add,
                    metadatas=metadatas_to_add,
                    embeddings=embeddings
                )
            else:
                self.collection.upsert(
                    ids=ids_to_add,
                    documents=documents_to_add,
                    metadatas=metadatas_to_add
                )
        except Exception as e:
            logger.warning(f"ChromaDB ONNX upsert skipped/fallback ({e}); relying on high-precision TF-IDF cache.")

        logger.info(f"Successfully indexed {len(chunks)} chunks into ChromaDB and TF-IDF cache.")

    def search(self, query: str, top_k: int = 5) -> List[Tuple[ExtractedChunk, float]]:
        if not self.chunks_cache or self.tfidf_matrix is None:
            return []

        # 1. TF-IDF scoring
        q_vec = self.tfidf_vectorizer.transform([query])
        tfidf_scores = cosine_similarity(q_vec, self.tfidf_matrix).ravel()

        # 2. ChromaDB semantic vector search
        chroma_scores: Dict[str, float] = {}
        try:
            query_embedding = embedding_service.embed_query(query) if embedding_service.model else None
            if query_embedding:
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=min(top_k * 2, len(self.chunks_cache))
                )
            else:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=min(top_k * 2, len(self.chunks_cache))
                )

            if results and results["ids"] and results["ids"][0]:
                for doc_id, dist in zip(results["ids"][0], results["distances"][0]):
                    # Convert distance to similarity score
                    sim = max(0.0, 1.0 - (dist / 2.0))
                    chroma_scores[doc_id] = float(sim)
        except Exception as e:
            logger.warning(f"ChromaDB search warning: {e}")

        # 3. Hybrid fusion (weighted ensemble)
        hybrid_results: List[Tuple[ExtractedChunk, float]] = []
        for idx, chunk_id in enumerate(self.chunk_ids_order):
            chunk = self.chunks_cache[chunk_id]
            t_score = float(tfidf_scores[idx])
            c_score = chroma_scores.get(chunk_id, 0.0)

            # Combined score giving weight to both lexical precision and semantic similarity
            combined_score = (0.55 * t_score) + (0.45 * c_score)

            if combined_score > 0.02:
                hybrid_results.append((chunk, combined_score))

        # Sort by score descending
        hybrid_results.sort(key=lambda x: x[1], reverse=True)
        return hybrid_results[:top_k]

vector_store = VectorStore(persist_dir=settings.CHROMA_DIR)
