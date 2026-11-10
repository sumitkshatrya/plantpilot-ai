from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from pathlib import Path
import fitz

from ..core.config import settings
from ..models.schemas import DocumentMetadata
from ..rag.extractor import PDFDocumentExtractor
from ..rag.pipeline import rag_pipeline
from ..rag.vector_store import vector_store

router = APIRouter(prefix="/api/documents", tags=["Documents"])

DESCRIPTIONS = {
    "MNT-MAN-CNC-02": "Preventive maintenance tasks, normal operating pressures, chuck torque and alarms for TX-200 CNC Turning Centres (CNC-04 to CNC-09).",
    "QC-SOP-014": "Incoming raw materials and bought-out components sampling, inspection, dimensions, defect classes and quarantine rules.",
    "SAF-SOP-003": "Mandatory isolation of electrical, hydraulic, and pneumatic energy sources before maintenance to prevent unexpected start-up."
}

@router.get("", response_model=List[DocumentMetadata])
def list_documents():
    docs: List[DocumentMetadata] = []
    pdf_paths = sorted(settings.DOCUMENTS_DIR.glob("*.pdf"))

    for path in pdf_paths:
        try:
            doc = fitz.open(path)
            total_pages = len(doc)
            first_page = doc[0].get_text() if total_pages > 0 else ""
            meta = PDFDocumentExtractor.parse_metadata(path.name, first_page)
            doc.close()

            docs.append(DocumentMetadata(
                document_number=meta["document_number"],
                document_name=meta["document_name"],
                revision=meta["revision"],
                effective_date=meta["effective_date"],
                total_pages=total_pages,
                category=meta["category"],
                is_superseded=meta["is_superseded"],
                superseded_by=meta["superseded_by"],
                description=DESCRIPTIONS.get(meta["document_number"], "Controlled manufacturing documentation."),
                filename=path.name,
                file_size_kb=round(path.stat().st_size / 1024, 1)
            ))
        except Exception as e:
            continue

    return docs

@router.post("/reindex")
def reindex_documents():
    try:
        chunks = PDFDocumentExtractor.load_documents(settings.DOCUMENTS_DIR)
        vector_store.index_chunks(chunks)
        rag_pipeline.indexed = True
        return {"status": "reindexed", "indexed_chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindexing failed: {str(e)}")

import urllib.parse
import re
from typing import Optional

@router.get("/raw/{filename}")
def get_raw_pdf(filename: str, rev: Optional[str] = None):
    # 1. Direct path check
    decoded_filename = urllib.parse.unquote(filename)
    file_path = settings.DOCUMENTS_DIR / decoded_filename
    if file_path.exists() and file_path.is_file():
        return FileResponse(
            path=str(file_path),
            media_type="application/pdf",
            filename=file_path.name,
            headers={"Content-Disposition": f"inline; filename=\"{file_path.name}\""}
        )

    # 2. Case-insensitive exact match
    for p in settings.DOCUMENTS_DIR.glob("*.pdf"):
        if p.name.lower() == decoded_filename.lower():
            return FileResponse(
                path=str(p),
                media_type="application/pdf",
                filename=p.name,
                headers={"Content-Disposition": f"inline; filename=\"{p.name}\""}
            )

    # 3. Fuzzy match by document number and revision
    doc_match = re.search(r"(MNT-MAN-CNC-02|QC-SOP-014|SAF-SOP-003)", decoded_filename, re.IGNORECASE)
    if doc_match:
        doc_no = doc_match.group(1).upper()
        matching_files = list(settings.DOCUMENTS_DIR.glob(f"{doc_no}*.pdf"))
        
        if matching_files:
            # Check if revision is specified in query param or filename
            req_rev = None
            if rev:
                rev_num_match = re.search(r"(\d+)", str(rev))
                if rev_num_match:
                    req_rev = int(rev_num_match.group(1))

            if req_rev is None:
                rev_in_name = re.search(r"Rev(?:ision)?\s*0?(\d+)", decoded_filename, re.IGNORECASE)
                if rev_in_name:
                    req_rev = int(rev_in_name.group(1))

            if req_rev is not None:
                for mf in matching_files:
                    if f"Rev0{req_rev}" in mf.name or f"Rev{req_rev}" in mf.name:
                        return FileResponse(
                            path=str(mf),
                            media_type="application/pdf",
                            filename=mf.name,
                            headers={"Content-Disposition": f"inline; filename=\"{mf.name}\""}
                        )

            # Default to the highest/latest revision for this document
            latest_file = sorted(matching_files, key=lambda f: f.name, reverse=True)[0]
            return FileResponse(
                path=str(latest_file),
                media_type="application/pdf",
                filename=latest_file.name,
                headers={"Content-Disposition": f"inline; filename=\"{latest_file.name}\""}
            )

    raise HTTPException(status_code=404, detail="Requested PDF document not found.")
