from __future__ import annotations
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional
import fitz

@dataclass
class ExtractedChunk:
    chunk_id: str
    text: str
    filename: str
    document_name: str
    document_number: str
    revision: int
    effective_date: str
    page_number: int
    section: str
    category: str
    is_superseded: bool
    superseded_by: Optional[str]

class PDFDocumentExtractor:
    DOC_TITLES = {
        "MNT-MAN-CNC-02": "Preventive Maintenance Manual - TX-200 CNC Turning Centre",
        "QC-SOP-014": "Incoming Material Inspection - Standard Operating Procedure",
        "SAF-SOP-003": "Lockout / Tagout (LOTO) - Safety Procedure"
    }

    CATEGORIES = {
        "MNT": "Maintenance",
        "QC": "Quality",
        "SAF": "Safety"
    }

    @classmethod
    def parse_metadata(cls, filename: str, first_page_text: str) -> Dict[str, Any]:
        doc_no_match = re.search(r"(MNT-MAN-CNC-02|QC-SOP-014|SAF-SOP-003)", filename)
        doc_number = doc_no_match.group(1) if doc_no_match else "UNKNOWN-DOC"
        
        rev_match = re.search(r"Rev(?:ision)?\s*0?(\d+)", first_page_text, re.IGNORECASE)
        revision = int(rev_match.group(1)) if rev_match else 0
        if revision == 0:
            filename_rev = re.search(r"Rev0?(\d+)", filename, re.IGNORECASE)
            if filename_rev:
                revision = int(filename_rev.group(1))
                
        eff_match = re.search(r"Effective Date\s+([^\n]+)", first_page_text, re.IGNORECASE)
        effective_date = eff_match.group(1).strip() if eff_match else "Unknown"

        prefix = doc_number.split("-")[0]
        category = cls.CATEGORIES.get(prefix, "General")
        doc_name = cls.DOC_TITLES.get(doc_number, filename)

        # Supersession detection
        is_superseded = False
        superseded_by = None
        if doc_number == "QC-SOP-014" and revision < 4:
            is_superseded = True
            superseded_by = "QC-SOP-014 Revision 04 (Effective 01-Jul-2026)"

        return {
            "document_number": doc_number,
            "revision": revision,
            "effective_date": effective_date,
            "document_name": doc_name,
            "category": category,
            "is_superseded": is_superseded,
            "superseded_by": superseded_by
        }

    @classmethod
    def extract_sections(cls, text: str) -> str:
        matches = re.findall(r"(?:^|\n)(\d+\.\s+[^\n]+)", text)
        if matches:
            return "; ".join([m.strip() for m in matches[:3]])
        return "General Procedure"

    @classmethod
    def load_documents(cls, docs_dir: Path) -> List[ExtractedChunk]:
        chunks: List[ExtractedChunk] = []
        pdf_paths = sorted(docs_dir.glob("*.pdf"))

        if not pdf_paths:
            raise FileNotFoundError(f"No PDF files found in directory: {docs_dir}")

        for path in pdf_paths:
            doc = fitz.open(path)
            first_page_text = doc[0].get_text() if len(doc) > 0 else ""
            meta = cls.parse_metadata(path.name, first_page_text)

            for page_idx, page in enumerate(doc):
                page_number = page_idx + 1
                raw_text = page.get_text("text")
                clean_text = re.sub(r"[ \t]+", " ", raw_text)
                clean_text = re.sub(r"\n{3,}", "\n\n", clean_text).strip()

                if not clean_text:
                    continue

                section = cls.extract_sections(clean_text)
                chunk_id = f"{meta['document_number']}_R{meta['revision']}_P{page_number}"

                chunks.append(ExtractedChunk(
                    chunk_id=chunk_id,
                    text=clean_text,
                    filename=path.name,
                    document_name=meta["document_name"],
                    document_number=meta["document_number"],
                    revision=meta["revision"],
                    effective_date=meta["effective_date"],
                    page_number=page_number,
                    section=section,
                    category=meta["category"],
                    is_superseded=meta["is_superseded"],
                    superseded_by=meta["superseded_by"]
                ))
            doc.close()

        return chunks
