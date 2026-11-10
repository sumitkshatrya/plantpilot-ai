import re
from typing import List, Tuple, Dict, Any, Optional
from .extractor import ExtractedChunk

class RevisionManager:
    """
    Manages document revision intelligence, supersession rules,
    and historical vs operational query intent.
    """
    
    # Active latest revisions for controlled operations
    LATEST_CONTROLLED_REVISIONS = {
        "MNT-MAN-CNC-02": 2,
        "QC-SOP-014": 4,
        "SAF-SOP-003": 5
    }

    # Explicit supersession mapping
    SUPERSEDED_INFO = {
        ("QC-SOP-014", 3): {
            "superseded_by_rev": 4,
            "superseded_effective": "01-Jul-2026",
            "warning": (
                "⚠️ HISTORICAL DOCUMENT WARNING: QC-SOP-014 Revision 03 (Effective 15-Mar-2023) "
                "was explicitly SUPERSEDED on 01-Jul-2026 by Revision 04. "
                "This procedure is UNCONTROLLED and must NOT be used for current shop-floor operations. "
                "Verify the controlled copy in the QMS."
            )
        }
    }

    @classmethod
    def detect_intent(cls, question: str) -> Dict[str, Any]:
        q_lower = question.lower()
        
        # Check for historical intent
        historical_patterns = [
            r"\brev(?:ision)?\s*0?3\b",
            r"\bprevious\b",
            r"\bold\b",
            r"\bprior\b",
            r"\bhistorical\b",
            r"\bsuperseded\b",
            r"\bearlier\b",
            r"\bformerly\b",
            r"\bwhat did rev(?:ision)?\s*0?3 require\b"
        ]
        is_historical = any(re.search(pat, q_lower) for pat in historical_patterns)

        # Check for comparison intent
        comparison_patterns = [
            r"\bchange[ds]?\b",
            r"\bdiffer(?:ence|s)?\b",
            r"\bcompare(?:d)?\b",
            r"\bbetween\b",
            r"\bvs\b",
            r"\brev(?:ision)?\s*0?3\s*(?:and|to|vs)\s*rev(?:ision)?\s*0?4\b",
            r"\brev(?:ision)?\s*0?4\s*(?:and|to|vs)\s*rev(?:ision)?\s*0?3\b"
        ]
        is_comparison = any(re.search(pat, q_lower) for pat in comparison_patterns)

        # Extract specific revision requested if any
        target_rev_match = re.search(r"\brev(?:ision)?\s*0?(\d+)\b", q_lower)
        target_revision = int(target_rev_match.group(1)) if target_rev_match else None

        return {
            "is_historical": is_historical,
            "is_comparison": is_comparison,
            "target_revision": target_revision
        }

    @classmethod
    def filter_chunks(
        cls, 
        chunks_with_scores: List[Tuple[ExtractedChunk, float]], 
        question: str
    ) -> Tuple[List[Tuple[ExtractedChunk, float]], Optional[str]]:
        intent = cls.detect_intent(question)
        filtered: List[Tuple[ExtractedChunk, float]] = []
        revision_notice: Optional[str] = None

        if intent["is_comparison"]:
            # Keep both revisions, but organize them
            revision_notice = (
                "ℹ️ REVISION COMPARISON: This query contrasts historical Revision 03 (Effective 15-Mar-2023) "
                "with the current controlled Revision 04 (Effective 01-Jul-2026). "
                "Revision 04 is the active authority for all current manufacturing decisions."
            )
            return chunks_with_scores, revision_notice

        if intent["is_historical"]:
            # User specifically asked for historical revision
            for chunk, score in chunks_with_scores:
                filtered.append((chunk, score))
            
            revision_notice = (
                "⚠️ HISTORICAL DOCUMENT REFERENCE: QC-SOP-014 Revision 03 is superseded by Revision 04 "
                "(effective 01-Jul-2026). These historical excerpts are provided for reference only."
            )
            return filtered, revision_notice

        # Default: Operational query -> strictly prioritize latest active revisions
        has_filtered_out_older = False
        for chunk, score in chunks_with_scores:
            latest_rev = cls.LATEST_CONTROLLED_REVISIONS.get(chunk.document_number)
            if latest_rev is not None and chunk.revision < latest_rev:
                has_filtered_out_older = True
                continue  # Suppress superseded revision to prevent conflict
            filtered.append((chunk, score))

        if has_filtered_out_older:
            revision_notice = (
                "🛡️ Document Revision Intelligence: Outdated Revision 03 was automatically excluded "
                "to ensure operational instructions strictly reflect controlled Revision 04."
            )

        return filtered, revision_notice
