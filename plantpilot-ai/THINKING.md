# THINKING.md — Product Reasoning & Engineering Reflection

## 1. Understand the User

### Primary User Persona: Shift QC / Maintenance Supervisor
- **Name / Role:** Shift Supervisor at Kaveri Precision Components, Hosur Plant (Tamil Nadu).
- **Physical Environment:** Standing on the concrete shop floor next to operating CNC turning centers (CNC-04 through CNC-09), wearing safety glasses, ear protection, and steel-toe boots. Ambient noise is high (~80–85 dB).
- **Hardware Context:** Accessing the system via a shared mobile phone or tablet on the shop-floor Wi-Fi network, often with one hand while holding a caliper or work order.
- **Pain Points Today:**
  - Finding the relevant page in physical, oil-stained paper binders takes 10–15 minutes of machine downtime.
  - Printed paper SOPs are frequently outdated. A supervisor might follow a superseded revision without realizing a new controlled standard was released.
  - Operators ask rapid questions: *"Can we accept this lot with 1 minor scratch?"*, *"What torque do I set on the chuck bolts?"*, *"Why is AL-104 on?"*. A wrong answer creates scrapped batches, ruined tools, or serious operator injury.
- **Success Criteria:**
  - Instant direct answer in less than 2 seconds.
  - Clear citation: Document Number, Revision, Effective Date, and Page Number.
  - Zero hallucinated procedures.
  - Definite warning if an outdated document is referenced.

---

## 2. Supervisor Journey

1. **Trigger:** A delivery of 750 raw forged shafts arrives at the incoming bay without a supplier Material Test Certificate (MTC), or CNC-06 halts with an alarm.
2. **Access:** The supervisor pulls out their smartphone, connects to the local shop-floor network, and opens `http://192.168.31.160:5173`.
3. **Query:** They type or tap a benchmark prompt: *"What should I do if the supplier MTC is missing?"*.
4. **Processing:**
   - The question is converted to semantic embeddings using ChromaDB and TF-IDF hybrid scoring.
   - The **Document Revision Intelligence** engine detects that `QC-SOP-014 Rev 04` supersedes `Rev 03` and filters out obsolete instructions.
5. **Response Display:**
   - **Direct Answer:** *"Put the received lot on HOLD immediately. The lot must not be inspected or accepted until the mandatory Material Test Certificate (MTC) is received."*
   - **Mandatory Sequence:** 4 numbered operational steps.
   - **Cited Source Card:** `QC-SOP-014`, Rev 04, Page 2.
6. **Action:** The supervisor marks the lot on HOLD in the QMS app using digital form QF-07A, averting an uncertified material batch from entering production.

---

## 3. AI Challenge (Skeptical Product Manager & Plant Lead Critique)

During design review, a simulated critique was conducted between a skeptical plant lead and the RAG architect:

### Condensed Conversation Excerpts:
> **Skeptical Plant Lead:** *"We have two versions of QC-SOP-014 in the file cabinet: Rev 03 from 2023 and Rev 04 from last month. Rev 03 says take 5 samples for any lot and throw bad ones in the Red Bin near Gate 2. Rev 04 says draw from a table, require an MTC, and lock bad parts in Quarantine Cage Q1. If your AI blends those two or gives the old procedure, our customer rejects the whole shipment and audits us. How do you prevent that?"*
>
> **RAG Architect:** *"A naive vector database treats both PDFs as equal text chunks and might retrieve both. We implemented Document Revision Intelligence: our extractor parses revision numbers and effective dates. For operational queries, the retriever strictly scopes to the highest active revision for that document number, completely hiding Rev 03 unless the supervisor explicitly asks for historical context."*
>
> **Skeptical Plant Lead:** *"What if an operator asks for the Plant Head's private phone number during a night shift emergency? Will your AI make up a number?"*
>
> **RAG Architect:** *"No. We have an explicit relevance threshold and guardrail against personal contact requests. If the required information is not in the text, it says 'I could not find this information in the available plant documents' and directs the supervisor to official escalation paths."*

### What I Agreed With:
- **Revision precedence is non-negotiable:** In manufacturing, conflicting revisions cannot coexist in an operational response.
- **Clickable citations:** A supervisor must be able to tap a button and see the actual original PDF page.
- **Strict safety refusals:** The assistant must never guess at safety limits or emergency phone numbers.

### What I Disagreed With / Deferred:
- **Full QMS workflow integration:** An AI search tool should not autonomously approve or reject lots in SAP/QMS. It remains an advisory, evidence-grounded copilot. Human supervisors remain the sole operational authority.

---

## 4. Key Improvement Added: Document Revision Intelligence

### Why It Matters:
Manufacturing documents share identical document numbers across revisions. In our dataset:
- `QC-SOP-014 Rev 03` (15-Mar-2023)
- `QC-SOP-014 Rev 04` (01-Jul-2026)

The differences are severe:
| Parameter | Rev 03 (Superseded) | Rev 04 (Current Controlled) |
| :--- | :--- | :--- |
| **Sampling Size** | Flat 5 samples for any lot | Lot-size table (750 pcs = 32 samples) |
| **Supplier MTC** | "If available" (optional) | **Mandatory** (Missing = HOLD) |
| **Inspection Tool** | Vernier caliper | Calibrated digital caliper + CMM |
| **Documentation** | Paper form QF-07 | Digital form QF-07A in QMS app |
| **Rejection Action**| Red Bin near Gate 2 | Locked Quarantine Cage Q1, Bay 3 |

### Implementation:
`backend/app/rag/revision_manager.py` implements scoped revision intelligence:
1. Detects query intent: checks if the supervisor explicitly typed `Rev 03`, `previous`, `old`, or `superseded`.
2. For operational questions: suppresses Rev 03 from the candidate pool, preventing conflicting answers.
3. For historical/comparison questions: retrieves both, flags Rev 03 with an amber banner, and clearly explains that Rev 04 governs current operations.

---

## 5. Final Reflection & Production Roadmap

### Biggest Engineering Challenge:
Ensuring instant retrieval and grounded structured output without depending on slow external LLM APIs. This was solved by building a **hybrid retrieval pipeline**:
- ChromaDB persistent vector storage with local ONNX embeddings (`all-MiniLM-L6-v2`).
- Scikit-learn TF-IDF sublinear scoring for exact technical codes (`AL-104`, `110 Nm`, `3.5 - 4.0 MPa`, `BH-220`).
- Local grounded extractive synthesis engine that formats direct answers, steps, and safety warnings without requiring an active internet connection.

### Questions for the Customer (Kaveri Precision Components):
1. Does the plant maintain an authoritative API endpoint (e.g. Siemens Teamcenter or SAP PLM) for real-time document release status?
2. Which languages (e.g., Tamil, Kannada, Hindi) do shift operators speak on the floor? Should multilingual voice queries be supported?
3. Are there scanned engineering drawings with geometrical dimensioning and tolerancing (GD&T) that require computer vision / OCR?

### What to Build Next:
1. **Multilingual Audio Input:** Speech-to-text for operators with oily gloves.
2. **QMS QR Code Scanning:** Scan a machine tag to automatically scope queries to that equipment's manual.
3. **Role-Based Access Control (RBAC):** Restrict engineering change proposals and confidential drawings.
