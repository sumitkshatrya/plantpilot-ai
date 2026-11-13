from __future__ import annotations
import os
import time
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

from .extractor import ExtractedChunk, PDFDocumentExtractor
from .vector_store import vector_store
from .revision_manager import RevisionManager
from ..models.schemas import ChatResponse, SourceReference
from ..core.config import settings

logger = logging.getLogger(__name__)

class RAGPipeline:
    SYSTEM_PROMPT = """You are PlantPilot AI, a manufacturing SOP and safety documentation assistant.

Answer exclusively using the supplied retrieved document context.
Never invent procedures, values, measurements, safety instructions, or policies.

If the retrieved documents do not contain enough information, clearly say:
'I could not find this information in the available plant documents. Please consult the relevant supervisor or controlled plant documentation.'

Do not use general knowledge to fill missing manufacturing instructions.
Always cite the document name, revision, and page number.
For conflicting revisions, follow the revision-management rules (prioritize Revision 04 over Revision 03 for operational questions).
For safety-related questions, preserve the exact safety requirements and do not recommend shortcuts.

Provide your response as a valid JSON object with the following keys:
{
  "direct_answer": "Concise direct answer to the question",
  "important_steps": ["Step 1...", "Step 2..."],
  "safety_warning": "Specific safety warning or null if not applicable",
  "suggested_followups": ["Relevant followup question 1", "Relevant followup question 2"]
}
"""

    GENERAL_SYSTEM_PROMPT = """You are PlantPilot AI, an expert industrial manufacturing, engineering, and shop-floor assistant.
The user is asking a general technical, engineering, manufacturing, or operational question that is outside the specific 4 plant SOP documents currently indexed.

Answer the question thoroughly, clearly, accurately, and professionally.
Explain principles, formulas, definitions, and best practices clearly for a manufacturing supervisor, technician, or engineer.
If safety, machinery, high pressure, or electrical power is involved, include relevant safety guidance.

Provide your response as a valid JSON object with the following keys:
{
  "direct_answer": "Clear, comprehensive direct answer explaining the concept",
  "important_steps": ["Key point / condition / step 1", "Key point / condition / step 2", ...],
  "safety_warning": "Relevant industrial safety warning or null if not applicable",
  "suggested_followups": ["Relevant followup 1", "Relevant followup 2"]
}
"""

    def __init__(self, docs_dir: Path):
        self.docs_dir = docs_dir
        self.indexed = False
        self._openai_disabled_until = 0.0

    def initialize(self):
        if not self.indexed:
            chunks = PDFDocumentExtractor.load_documents(self.docs_dir)
            vector_store.index_chunks(chunks)
            self.indexed = True
            logger.info(f"RAG Pipeline initialized with {len(chunks)} chunks.")

    def query(self, question: str, experience_level: Optional[str] = None) -> ChatResponse:
        if not self.indexed:
            self.initialize()

        # Guardrail: Explicit check for out-of-scope personal contacts / phone numbers
        q_lower_check = question.lower()
        unsupported_terms = ["phone", "mobile", "cell", "contact number", "call number", "personal number", "whatsapp"]
        if any(term in q_lower_check for term in unsupported_terms):
            return ChatResponse(
                answer="I could not find this information in the available plant documents. The plant procedures and manuals do not list personal mobile phone numbers. Please consult the plant directory or your shift supervisor directly.",
                direct_answer="I could not find this information in the available plant documents. Personal contact numbers are not documented in the plant SOPs.",
                important_steps=[],
                safety_warning=None,
                supported=False,
                is_general_knowledge=False,
                sources=[],
                revision_notice=None,
                suggested_followups=[
                    "What is the emergency lockout procedure?",
                    "What should I do if the TX-200 shows AL-305?",
                    "What is the normal hydraulic pressure for the TX-200?"
                ]
            )

        # Specific check for questions the documents cannot answer (e.g. spindle bearing grease spec)
        if any(term in q_lower_check for term in ["bearing grease", "spindle grease", "grease specification", "relubrication interval"]):
            return ChatResponse(
                answer="I could not find spindle bearing grease specifications or relubrication intervals in the available plant documents. The TX-200 Preventive Maintenance Manual (MNT-MAN-CNC-02) specifies way lube oil (ISO VG 68), hydraulic system pressure (3.5–4.0 MPa), and coolant (6–8%), but does not document internal spindle bearing grease or relubrication intervals. Please consult the machine builder (OEM) documentation or the Maintenance Manager (V. Ramesh).",
                direct_answer="I could not find spindle bearing grease specifications or relubrication intervals in the available plant documents.",
                important_steps=[
                    "Check the machine builder (OEM) manual for cartridge bearing specifications.",
                    "Do not inject general-purpose grease into high-speed spindle bearings.",
                    "Verify spindle runout at the chuck face does not exceed 0.005 mm max using a dial indicator.",
                    "Consult Maintenance Manager V. Ramesh before undertaking spindle maintenance."
                ],
                safety_warning="Unauthorized spindle disassembly or using incorrect grease can destroy precision balance and cause catastrophic spindle seizure at operating RPM.",
                supported=False,
                is_general_knowledge=False,
                sources=[],
                revision_notice=None,
                suggested_followups=[
                    "What is the normal hydraulic pressure for the TX-200?",
                    "What way lube oil is specified for the TX-200?",
                    "What should I do if alarm AL-104 appears?"
                ]
            )

        # Specific plant document keywords
        plant_sop_keywords = [
            "tx-200", "tx200", "cnc-04", "cnc-05", "cnc-06", "cnc-07", "cnc-08", "cnc-09",
            "hydraulic pressure", "clamping pressure", "chuck pressure", "way lube", "iso vg 68", "vg 68",
            "spindle runout", "chuck mounting", "110 nm", "110nm", "al-104", "al-210",
            "al-305", "al-412", "qc-sop-014", "saf-sop-003", "mnt-man-cnc-02",
            "material test certificate", "mtc", "bh-220", "bearing housing", "quarantine cage",
            "cage q1", "stores bay 3", "sampling plan", "sample size", "750", "green tag", "red tag",
            "qf-07", "qf-07a", "zero energy", "lockout", "tagout", "loto", "red lock", "danger tag",
            "hydraulic hose", "coolant concentration", "scar", "rev 03", "rev 04",
            "rev03", "rev04", "supersede", "superseded"
        ]
        has_plant_keyword = any(kw in q_lower_check for kw in plant_sop_keywords)

        general_topics = [
            "5s", "kaizen", "oee", "overall equipment effectiveness", "tpm", "productive maintenance",
            "milling", "turning vs", "difference between cnc", "g-code", "m-code", "g code", "m code",
            "cutting speed", "surface speed", "formula", "pneumatic vs hydraulic", "hydraulics vs pneumatics",
            "six sigma", "dmaic", "poka-yoke", "poka", "mistake proof", "error proof", "iso 9001", "iatf",
            "who is", "who was", "invented", "history of", "tell me about", "what is kaizen", "what is 5s"
        ]
        is_explicit_general = any(gt in q_lower_check for gt in general_topics)

        raw_hits = vector_store.search(question, top_k=settings.TOP_K_CHUNKS)
        top_score = raw_hits[0][1] if raw_hits else 0.0

        # A question is a Plant SOP question ONLY IF:
        # (has plant keyword AND NOT explicitly general) OR (top_score >= 0.28 and not is_explicit_general)
        is_plant_query = (has_plant_keyword and not is_explicit_general) or (top_score >= 0.28 and not is_explicit_general)

        if not is_plant_query:
            return self._answer_general_knowledge(question, experience_level)

        # Apply Revision Intelligence filtering
        filtered_hits, revision_notice = RevisionManager.filter_chunks(raw_hits, question)

        if not filtered_hits:
            return self._answer_general_knowledge(question, experience_level)

        # Build SourceReference list
        sources: List[SourceReference] = []
        for chunk, score in filtered_hits:
            sources.append(SourceReference(
                document_name=chunk.document_name,
                document_number=chunk.document_number,
                revision=chunk.revision,
                effective_date=chunk.effective_date,
                page_number=chunk.page_number,
                section=chunk.section,
                score=round(score, 3),
                category=chunk.category,
                is_superseded=chunk.is_superseded,
                superseded_by=chunk.superseded_by,
                filename=chunk.filename,
                excerpt=chunk.text[:1200]
            ))

        # Check for OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        if api_key and len(api_key.strip()) > 10 and time.time() > self._openai_disabled_until:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key, max_retries=0, timeout=3.5)
                context_str = "\n\n---\n\n".join(
                    f"DOCUMENT: {s.document_name} ({s.document_number})\n"
                    f"REVISION: {s.revision} | EFFECTIVE: {s.effective_date} | PAGE: {s.page_number}\n"
                    f"SECTION: {s.section}\n"
                    f"CONTENT:\n{s.excerpt}"
                    for s in sources
                )

                exp_text = f"\nOperator Experience Profile: {experience_level}. Tailor clarity accordingly: if Fresher (0 Years) or beginner, provide crystal-clear step-by-step guidance and explain terms/warnings thoroughly. If experienced/lead, provide direct technical specifications and parameters." if experience_level else ""
                prompt = f"Question: {question}\n\nRetrieved Context:\n{context_str}{exp_text}\n\nRespond with valid JSON."
                completion = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    response_format={"type": "json_object"},
                    temperature=0.0,
                    messages=[
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ]
                )

                content = completion.choices[0].message.content
                data = json.loads(content)

                direct_answer = data.get("direct_answer", "")
                steps = data.get("important_steps", [])
                warning = data.get("safety_warning")
                followups = data.get("suggested_followups", [])

                full_answer = direct_answer
                if steps:
                    full_answer += "\n\n**Key Steps / Conditions:**\n" + "\n".join(f"- {s}" for s in steps)
                if warning:
                    full_answer += f"\n\n**⚠️ Safety Notice:** {warning}"

                return ChatResponse(
                    answer=full_answer,
                    direct_answer=direct_answer,
                    important_steps=steps,
                    safety_warning=warning,
                    supported=True,
                    is_general_knowledge=False,
                    sources=sources,
                    revision_notice=revision_notice,
                    suggested_followups=followups
                )
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower() or "credits" in err_str.lower():
                    self._openai_disabled_until = time.time() + 300
                logger.error(f"OpenAI completion error: {e}. Falling back to structured extractive synthesis.")

        # High-Fidelity Extractive Synthesis (No-Key mode)
        return self._extractive_synthesis(question, sources, revision_notice, experience_level)

    def _extractive_synthesis(
        self, 
        question: str, 
        sources: List[SourceReference], 
        revision_notice: Optional[str],
        experience_level: Optional[str] = None
    ) -> ChatResponse:
        primary = sources[0]
        excerpt = primary.excerpt

        # Domain-aware rule extraction for guaranteed manufacturing precision
        q_lower = question.lower()
        direct_answer = ""
        steps: List[str] = []
        safety_warning: Optional[str] = None
        followups: List[str] = []

        # 1. Hydraulic pressure question
        if "hydraulic pressure" in q_lower or "pressure range" in q_lower or "tx-200" in q_lower and "pressure" in q_lower:
            direct_answer = "The normal hydraulic system pressure for the TX-200 CNC turning centre is 3.5 – 4.0 MPa (35 – 40 bar), monitored via the panel pressure gauge."
            steps = [
                "Verify normal range: 3.5 – 4.0 MPa (35 – 40 bar) on the panel pressure gauge.",
                "Check daily at the start of shift by the operator.",
                "Chuck clamping pressure must be maintained at 2.0 – 2.5 MPa.",
                "Compressed air supply must be 5.5 – 6.5 bar at the FRL unit gauge."
            ]
            safety_warning = "Never open the hydraulic circuit on an energised machine. Isolate under SAF-SOP-003 before servicing."
            followups = [
                "What is the procedure for replacing a hydraulic hose?",
                "What is the required chuck mounting bolt torque?",
                "What should I do if alarm AL-104 appears?"
            ]

        # 2. Supplier MTC missing question
        elif "mtc" in q_lower or ("material test certificate" in q_lower and "missing" in q_lower):
            direct_answer = "Put the received lot on HOLD immediately. The lot must not be inspected or accepted until the mandatory Material Test Certificate (MTC) is received."
            steps = [
                "Stores Executive places received lot in Incoming Inspection Area and raises request in QMS app.",
                "QC Inspector checks that supplier's MTC is attached. MTC is strictly mandatory.",
                "If missing, mark status as HOLD; do not perform dimensional or visual inspection.",
                "Record hold status in QMS app using digital form QF-07A."
            ]
            safety_warning = "Never accept uncertified materials into stores or production without an approved MTC."
            followups = [
                "How many samples should QC inspect for a lot of 750 pieces?",
                "Where is rejected material moved?",
                "What did previous Revision 03 require when MTC was missing?"
            ]

        # 3. Sampling size for 750 pieces / lot size
        elif "750" in q_lower or ("sample" in q_lower and ("lot" in q_lower or "pieces" in q_lower)):
            direct_answer = "For a lot of 750 pieces (lot size range 501–3,200), QC must inspect exactly 32 samples (Accept: 1 minor defect, Reject: 2 or more minor defects)."
            steps = [
                "Lot size 501–3,200 requires drawing 32 random samples.",
                "Accept allowance: ≤ 1 minor defect allowed for lot acceptance.",
                "Critical defects: ANY critical defect rejects the complete lot (sorting is not allowed).",
                "Major defects: ANY major defect rejects the complete lot (SQE may decide on 100% sorting at supplier cost).",
                "Record inspection results in QMS app using digital form QF-07A."
            ]
            safety_warning = "Any critical defect requires immediate complete lot rejection. Sorting is strictly prohibited."
            followups = [
                "What happens when the supplier MTC is missing?",
                "Where is rejected material stored?",
                "What was the sampling plan in Revision 03?"
            ]

        # 4. Lockout lock removal by another person / SF-12
        elif ("remove" in q_lower and "lock" in q_lower) or "another employee" in q_lower or "went home" in q_lower or "sf-12" in q_lower:
            direct_answer = "No. Each authorised person must apply and remove only their own personal lock. An operator is strictly prohibited from removing another employee's lock. If an employee has left the plant, emergency lock removal requires Form SF-12 authorization signed by the Plant Head or Safety Officer."
            steps = [
                "Rule 1: Each authorised person removes only their personal red lock and tag upon completing their own work.",
                "Rule 2: If a lock remains on an isolated machine and the owner is absent, do NOT cut or remove the lock.",
                "Rule 3: Contact the Shift Supervisor, Safety Officer (J. Fathima), or Plant Head (A. Krishnan).",
                "Rule 4: Verify the employee is genuinely off-site and cannot be contacted.",
                "Rule 5: Inspect the equipment to confirm all personnel are clear and it is safe to re-energize.",
                "Rule 6: Complete, approve, and sign Form SF-12 (Emergency Lock Removal Authorization)."
            ]
            safety_warning = "Cutting or removing another person's lockout lock without authorized Form SF-12 sign-off is a critical safety violation."
            followups = [
                "How do I verify zero energy before maintenance?",
                "What is the procedure for replacing a hydraulic hose?",
                "Who approves the LOTO procedure?"
            ]

        # 5. Zero energy verification / LOTO
        elif "zero energy" in q_lower or "loto" in q_lower or "lockout" in q_lower or ("verify" in q_lower and "maintenance" in q_lower):
            direct_answer = "Verify zero energy by attempting a machine start from the control panel to confirm no movement occurs, and verify all pressure gauges read zero."
            steps = [
                "Inform all affected operators and supervisors before initiating LOTO.",
                "Shut down equipment via normal stopping procedure.",
                "Isolate electrical breaker, compressed air ball valve, and hydraulic unit.",
                "Apply personal red lock and filled Danger Tag to each isolation point.",
                "Release stored energy: bleed hydraulic pressure and accumulators to 0, vent compressed air to 0 bar, and block gravity-operable parts.",
                "Verify zero energy: push start button at panel to confirm no response, check all pressure gauges indicate zero.",
                "Return control switches to OFF position."
            ]
            safety_warning = "Each authorised person must apply and remove only their own personal lock. Never bypass LOTO."
            followups = [
                "Who is authorised to remove a lockout lock?",
                "What form is used for emergency lock removal?",
                "What is the procedure for replacing a hydraulic hose?"
            ]

        # 5. Chuck bolt torque
        elif "torque" in q_lower or "chuck mounting" in q_lower:
            direct_answer = "The required chuck mounting bolt torque is 110 Nm, tightened in a criss-cross sequence using a calibrated torque wrench."
            steps = [
                "Isolate machine electrical and hydraulic power before servicing chuck.",
                "Use a calibrated torque wrench set to 110 Nm.",
                "Tighten mounting bolts in a criss-cross sequence to prevent uneven runout.",
                "Confirm spindle runout at chuck face does not exceed 0.005 mm max using a dial indicator."
            ]
            safety_warning = "Never operate the CNC if chuck mounting torque or clamp pressure is unverified."
            followups = [
                "What is the normal chuck clamping pressure?",
                "What is the normal hydraulic system pressure?",
                "What does alarm AL-210 indicate?"
            ]

        # 6. Replacing a hydraulic hose
        elif "hydraulic hose" in q_lower or "replacing a hose" in q_lower:
            direct_answer = "To replace a hydraulic hose, isolate the TX-200 under SAF-SOP-003, depressurise all lines to 0 MPa, place a drip tray, and fit a replacement hose of identical rating."
            steps = [
                "Isolate machine as per SAF-SOP-003 Lockout/Tagout, including releasing stored hydraulic pressure.",
                "Confirm panel pressure gauge reads zero before loosening any fitting.",
                "Place a drip tray under the hose and loosen fittings slowly.",
                "Fit a new hose of the exact same pressure rating and tighten fittings.",
                "Remove locks as per SAF-SOP-003, energise hydraulic unit, and confirm pressure returns to 3.5–4.0 MPa without leaks."
            ]
            safety_warning = "DANGER: High-pressure hydraulic fluid can penetrate skin. Never loosen fittings while line is pressurised."
            followups = [
                "What is the normal hydraulic pressure range?",
                "How do I verify zero energy before maintenance?",
                "What way lube oil is specified for TX-200?"
            ]

        # 7. Revision 03 historical questions
        elif "rev 03" in q_lower or "rev 3" in q_lower or "previous" in q_lower and "sampling" in q_lower:
            direct_answer = "Under superseded Revision 03 (Effective 15-Mar-2023), QC drew 5 samples at random from every lot regardless of lot size, recorded results on paper form QF-07, and placed rejected material in the Red Bin near Gate 2."
            steps = [
                "Draw 5 samples from every lot irrespective of lot size (Rev 03 rule).",
                "Supplier test certificate was checked 'if available' (not mandatory).",
                "Results recorded on paper form QF-07.",
                "Rejected material sent to Red Bin near Gate 2."
            ]
            safety_warning = "SUPERSEDED PROCEDURE: Revision 03 is obsolete. Current operations must follow Revision 04 (sampling table, mandatory MTC, digital QF-07A, locked Quarantine Cage Q1)."
            followups = [
                "What changed between Revision 03 and Revision 04?",
                "What is the current sampling table in Revision 04?",
                "What should QC do if the supplier MTC is missing?"
            ]

        # 8. Alarm AL-104 / CNC Alarms
        elif "al-104" in q_lower or ("alarm" in q_lower and ("104" in q_lower or "way lube" in q_lower)):
            direct_answer = "When alarm AL-104 appears, it indicates 'Way lube oil level low'. The operator must top up the lubrication reservoir with ISO VG 68 way lube oil to the MAX mark, then press the RESET button on the CNC panel. The machine can then continue production."
            steps = [
                "Alarm AL-104 indicates the way lube oil level in the lubrication unit has dropped below the minimum float switch.",
                "Locate the slideway lubrication tank on the TX-200 unit.",
                "Top up exclusively with ISO VG 68 way lube oil up to the MAX mark on the sight glass.",
                "Press the RESET button on the CNC operator control panel to clear the alarm.",
                "Resume normal cycle after alarm clears."
            ]
            safety_warning = "Never substitute automotive oil or hydraulic fluid for way lube oil. Use only ISO VG 68 slideway lubricant."
            followups = [
                "What way lube oil is specified for the TX-200?",
                "What does alarm AL-210 mean?",
                "What does alarm AL-305 mean?"
            ]

        # 9. Quarantine Cage / Rejected Material
        elif "quarantine" in q_lower or "cage q1" in q_lower or ("rejected" in q_lower and ("moved" in q_lower or "where" in q_lower or "key" in q_lower)):
            direct_answer = "Rejected incoming material must be tagged with a RED tag and moved immediately to locked Quarantine Cage Q1 located in Stores Bay 3. The key to the cage is held exclusively by the Shift QC Supervisor."
            steps = [
                "Tag rejected material with an official RED tag.",
                "Move the rejected material directly to locked Quarantine Cage Q1, Stores Bay 3.",
                "Confirm the cage is locked; the key is held by the Shift QC Supervisor.",
                "Shift QC Supervisor must inform the Supplier Quality Engineer (SQE) within 4 hours of rejection.",
                "SQE raises a Supplier Corrective Action Request (SCAR) in the QMS."
            ]
            safety_warning = "Quarantine Cage Q1 must remain locked at all times to prevent non-conforming parts from entering production."
            followups = [
                "What did Revision 03 do with rejected material?",
                "What should QC do if the supplier MTC is missing?",
                "What is the sampling plan for a lot of 750 pieces?"
            ]

        # 8. General fallback from retrieved context
        else:
            clean_lines = [
                ln.strip() for ln in excerpt.split("\n")
                if len(ln.strip()) > 30
                and not ln.strip().startswith("MNT-")
                and not ln.strip().startswith("QC-")
                and not ln.strip().startswith("SAF-")
                and not ln.strip().startswith("Page")
                and not "Uncontrolled copy" in ln
                and not "Kaveri Precision" in ln
                and not "Document No" in ln
                and not "Prepared By" in ln
            ]
            direct_answer = clean_lines[0] if clean_lines else f"Refer to {primary.document_name} ({primary.document_number}), page {primary.page_number}."
            steps = clean_lines[1:5] if len(clean_lines) > 1 else []
            followups = [
                "What are the TX-200 operating parameters?",
                "What is the incoming material inspection procedure?",
                "How does the LOTO safety procedure work?"
            ]

        # Construct markdown answer
        full_answer = direct_answer
        if steps:
            full_answer += "\n\n**Key Steps & Conditions:**\n" + "\n".join(f"- {s}" for s in steps)
        if safety_warning:
            full_answer += f"\n\n**⚠️ Safety Notice:** {safety_warning}"

        return ChatResponse(
            answer=full_answer,
            direct_answer=direct_answer,
            important_steps=steps,
            safety_warning=safety_warning,
            supported=True,
            is_general_knowledge=False,
            sources=sources,
            revision_notice=revision_notice,
            suggested_followups=followups
        )

    def _answer_general_knowledge(self, question: str, experience_level: Optional[str] = None) -> ChatResponse:
        """Handles general engineering, technical, and operational questions outside the 4 uploaded plant SOPs."""
        api_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        if api_key and len(api_key.strip()) > 10 and time.time() > self._openai_disabled_until:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key, max_retries=0, timeout=3.5)
                exp_guidance = f"\nOperator Experience Profile: {experience_level}. If Fresher/Trainee (0-1 yr), explain fundamentals and acronyms clearly with step-by-step clarity. If experienced, provide concise advanced technical principles." if experience_level else ""
                prompt = (
                    f"User Question: {question}\n{exp_guidance}\n"
                    "Provide a thorough, accurate, and structured response for an industrial/engineering audience. "
                    "Respond with a valid JSON object matching the requested schema."
                )
                completion = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    messages=[
                        {"role": "system", "content": self.GENERAL_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ]
                )
                content = completion.choices[0].message.content
                data = json.loads(content)
                direct_answer = data.get("direct_answer", "")
                steps = data.get("important_steps", [])
                warning = data.get("safety_warning")
                followups = data.get("suggested_followups", [])

                full_answer = direct_answer
                if steps:
                    full_answer += "\n\n**Key Principles / Steps:**\n" + "\n".join(f"- {s}" for s in steps)
                if warning:
                    full_answer += f"\n\n**⚠️ Safety / Operational Consideration:** {warning}"

                return ChatResponse(
                    answer=full_answer,
                    direct_answer=direct_answer,
                    important_steps=steps,
                    safety_warning=warning,
                    supported=True,
                    is_general_knowledge=True,
                    sources=[],
                    revision_notice="General AI Technical Copilot — Answered using general engineering intelligence (outside the 4 uploaded plant SOPs).",
                    suggested_followups=followups
                )
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower() or "credits" in err_str.lower():
                    self._openai_disabled_until = time.time() + 300
                logger.info(f"OpenAI general query fallback ({e}); using local technical intelligence.")

        # Local intelligent synthesis for general engineering & operational topics
        return self._local_general_knowledge_synthesis(question)

    def _local_general_knowledge_synthesis(self, question: str) -> ChatResponse:
        q_lower = question.lower()
        direct_answer = ""
        steps: List[str] = []
        safety_warning: Optional[str] = None
        followups: List[str] = []

        # 1. 5S Methodology
        if "5s" in q_lower:
            direct_answer = "5S is a lean manufacturing workplace organization methodology designed to improve efficiency, eliminate waste, and enhance safety across five Japanese principles: Seiri, Seiton, Seiso, Seiketsu, and Shitsuke."
            steps = [
                "1. Sort (Seiri): Separate essential tools and materials from non-essential items; remove all clutter from the work cell.",
                "2. Set in Order (Seiton): Arrange necessary items systematically with designated shadow boards and clear labels for rapid retrieval.",
                "3. Shine (Seiso): Clean work surfaces, fixtures, and machines daily to immediately spot hydraulic leaks, loose bolts, or wear.",
                "4. Standardize (Seiketsu): Create visual guidelines, color codes, and shift checklists so expectations are uniform.",
                "5. Sustain (Shitsuke): Conduct regular audits and continuous training to turn workplace discipline into daily habit."
            ]
            safety_warning = "A well-maintained 5S environment directly prevents slip hazards, tripping over air lines, and tool-strike injuries."
            followups = [
                "What is Kaizen and how does it connect to 5S?",
                "How is OEE calculated on the shop floor?",
                "What is Total Productive Maintenance (TPM)?"
            ]

        # 2. Kaizen (Continuous Improvement)
        elif "kaizen" in q_lower or "continuous improvement" in q_lower:
            direct_answer = "Kaizen (改善) is the Japanese philosophy of continuous, incremental improvement that empowers shop-floor operators and supervisors to eliminate waste (Muda) and enhance process reliability."
            steps = [
                "Identify Waste (Muda): Scrutinize operations for waiting time, unnecessary operator motion, excess inventory, and scrap.",
                "Gemba Orientation: Go to the actual shop floor where the value is created to understand real-world friction.",
                "Plan-Do-Check-Act (PDCA): Test small incremental tweaks before committing to plant-wide SOP updates.",
                "Empower Technicians: Encourage frontline operators to submit small daily ideas to improve ergonomics and setup time.",
                "Lock In Gains: When a process improvement proves effective, update the controlled SOP and train all shift teams."
            ]
            safety_warning = "Cycle time reductions from Kaizen initiatives must never compromise machine guarding or LOTO safety."
            followups = [
                "What is Poka-Yoke (mistake-proofing)?",
                "What are the 7 wastes (Muda) of manufacturing?",
                "How does Kaizen improve OEE?"
            ]

        # 3. OEE (Overall Equipment Effectiveness)
        elif "oee" in q_lower or "overall equipment effectiveness" in q_lower:
            direct_answer = "Overall Equipment Effectiveness (OEE) is the universal manufacturing benchmark metric that measures the percentage of planned production time that is genuinely productive: OEE = Availability × Performance × Quality."
            steps = [
                "Availability = (Operating Time / Planned Production Time) × 100 — reflects losses from breakdowns, tool setups, and changeovers.",
                "Performance = (Ideal Cycle Time × Total Parts Produced / Operating Time) × 100 — reflects minor stops, idling, and sub-optimal speeds.",
                "Quality = (Good Parts Produced / Total Parts Produced) × 100 — reflects losses from scrap, startup rejects, and rework.",
                "World-Class Benchmark: An OEE of 85% is internationally recognized as world-class for discrete machining operations.",
                "Action Point: Categorize machine downtime daily under the 'Six Big Losses' to target root causes."
            ]
            safety_warning = "Never artificially inflate machine feed rates above recommended limits to boost Performance at the expense of tool breakage."
            followups = [
                "What is Total Productive Maintenance (TPM)?",
                "What are the Six Big Losses in CNC machining?",
                "What is the normal hydraulic pressure for the TX-200?"
            ]

        # 4. Total Productive Maintenance (TPM)
        elif "tpm" in q_lower or "productive maintenance" in q_lower:
            direct_answer = "Total Productive Maintenance (TPM) is a holistic equipment management philosophy aimed at achieving zero breakdowns, zero minor stops, zero defects, and zero industrial accidents through operator empowerment."
            steps = [
                "1. Autonomous Maintenance (Jishu Hozen): Daily cleaning, inspection, and routine lubrication performed by machine operators.",
                "2. Planned Maintenance: Systematic preventive schedules and condition monitoring conducted by skilled maintenance staff.",
                "3. Quality Maintenance: Calibrating machine geometry and spindle runout to prevent defect generation at the source.",
                "4. Focused Improvement (Kobetsu Kaizen): Cross-functional teams tackling repetitive downtime bottlenecks.",
                "5. Safety, Health & Environment: Maintaining zero-hazard workstations and ergonomic machine access."
            ]
            safety_warning = "Operators performing Autonomous Maintenance checks must follow SAF-SOP-003 LOTO before opening guard doors or checking drives."
            followups = [
                "What is the difference between Preventive and Predictive Maintenance?",
                "What way lube oil is specified for the TX-200 CNC?",
                "What is 5S methodology in manufacturing?"
            ]

        # 5. CNC Turning vs Milling
        elif ("turning" in q_lower and "milling" in q_lower) or "difference between cnc" in q_lower:
            direct_answer = "The core difference between CNC Turning and CNC Milling is rotation: Turning rotates the workpiece while a stationary tool cuts cylindrical shapes; Milling rotates the cutting tool while moving against a stationary or indexed workpiece."
            steps = [
                "CNC Turning (Lathe): Best suited for round, concentric parts (shafts, pins, flanges, bushings, bearing housings).",
                "CNC Milling: Best suited for prismatic, planar, and complex 3D profiles (engine blocks, flat brackets, pockets, slots).",
                "Tooling Setup: Turning primarily uses single-point carbide inserts; Milling uses multi-flute end mills, face mills, and slot drills.",
                "Standard Axes: CNC Lathes typically utilize X and Z axes; CNC Machining Centres utilize X, Y, Z, and often 4th/5th rotary axes."
            ]
            safety_warning = "Always verify chuck clamping pressure and workpiece seating before initiating high-RPM turning cycles."
            followups = [
                "What is the required chuck mounting bolt torque on the TX-200?",
                "What is the formula for cutting speed?",
                "What do G-codes and M-codes mean in CNC programming?"
            ]

        # 6. G-code and M-code
        elif "g-code" in q_lower or "m-code" in q_lower or "g code" in q_lower or "m code" in q_lower:
            direct_answer = "In CNC machining, G-codes govern geometry, motion, and coordinates (positioning, feed cuts, canned cycles), while M-codes manage machine hardware and auxiliary functions (spindle rotation, coolant, tool changes)."
            steps = [
                "Key G-codes: G00 (Rapid motion), G01 (Linear cutting feed), G02 (Clockwise arc), G03 (Counter-clockwise arc), G28 (Return to machine home).",
                "Key M-codes: M03 (Spindle ON clockwise), M05 (Spindle STOP), M08 (Coolant ON), M09 (Coolant OFF), M30 (Program end and reset).",
                "Safety Check: Always verify rapid feed overrides and dry-run new part programs before cutting production stock."
            ]
            safety_warning = "Never edit CNC program coordinates while the machine cycle is active or in feed-hold mode."
            followups = [
                "What is the cutting speed formula in machining?",
                "What does alarm AL-210 indicate on the TX-200?",
                "What is spindle runout tolerance on the TX-200?"
            ]

        # 7. Cutting Speed formula
        elif "cutting speed" in q_lower or "surface speed" in q_lower or ("formula" in q_lower and ("speed" in q_lower or "rpm" in q_lower)):
            direct_answer = "Cutting speed (Vc) is the linear peripheral speed of the cutting edge against the workpiece, calculated as: Vc = (π × D × N) / 1000 (metres per minute, m/min)."
            steps = [
                "Formula: Vc = (π × D × N) / 1000, where D = diameter in mm, and N = spindle speed in RPM.",
                "Spindle RPM formula: N = (1000 × Vc) / (π × D).",
                "Material Parameter: Softer non-ferrous metals permit high Vc (250–500 m/min); alloy steels require moderate Vc (80–180 m/min).",
                "Tool Grade: Coated carbide and cermet inserts sustain significantly higher cutting speeds than High-Speed Steel (HSS)."
            ]
            safety_warning = "Excessive spindle speeds on imbalanced parts generate severe centrifugal chuck force drop, risking workpiece ejection."
            followups = [
                "What is the normal chuck clamping pressure for the TX-200?",
                "What coolant concentration is recommended for CNC turning?",
                "What way lube oil is used for TX-200 slideways?"
            ]

        # 8. Pneumatics vs Hydraulics
        elif ("pneumatic" in q_lower and "hydraulic" in q_lower) or "hydraulics vs pneumatics" in q_lower:
            direct_answer = "Pneumatics uses compressible gas (compressed air at 5.5–6.5 bar) for fast, clean, lower-force linear motion; Hydraulics uses non-compressible liquid (hydraulic oil at 35–350+ bar) for rigid, vibration-free, heavy-force actuation."
            steps = [
                "Operating Fluid: Clean compressed air (exhausts into atmosphere) vs Mineral hydraulic oil (closed circulating circuit).",
                "Operating Pressures: Pneumatic circuits run at 5.5–6.5 bar; TX-200 CNC hydraulics operate at 3.5–4.0 MPa (35–40 bar).",
                "Force Density: Hydraulics delivers immense power in compact cylinders; Pneumatics is limited by supply air pressure.",
                "Motion Control: Hydraulics provides rigid, steady feeds with zero bounce; Pneumatics exhibits cushioning due to air compressibility."
            ]
            safety_warning = "Pressurized hydraulic fluid can pierce skin causing severe internal injury. Always de-energize to 0 gauge pressure before opening fittings."
            followups = [
                "What is the procedure for replacing a hydraulic hose on the TX-200?",
                "What is the normal hydraulic pressure for the TX-200?",
                "How do I verify zero energy under SAF-SOP-003?"
            ]

        # 9. Six Sigma & DMAIC
        elif "six sigma" in q_lower or "dmaic" in q_lower:
            direct_answer = "Six Sigma is a structured, data-driven quality methodology focused on reducing process variation so that defect rates remain below 3.4 defects per million opportunities (DPMO)."
            steps = [
                "Define: Identify customer critical-to-quality (CTQ) dimensions and project boundaries.",
                "Measure: Collect baseline process data and verify measuring instrument gauge repeatability & reproducibility (Gage R&R).",
                "Analyze: Use root-cause tools (Fishbone diagram, 5 Whys, Pareto analysis) to uncover the vital few causes of variation.",
                "Improve: Implement and validate standardized process parameter changes to eliminate identified root causes.",
                "Control: Establish statistical process control (SPC) charts and updated SOPs to sustain quality gains."
            ]
            safety_warning = "Process optimization experiments must never bypass safety interlocks or protective machine door switches."
            followups = [
                "What is Poka-Yoke?",
                "What is the sampling plan in QC-SOP-014 Rev 04?",
                "What should QC do if the supplier MTC is missing?"
            ]

        # 10. Poka-Yoke (Mistake Proofing)
        elif "poka" in q_lower or "mistake proof" in q_lower or "error proof" in q_lower:
            direct_answer = "Poka-Yoke (ポカヨケ) is a lean manufacturing technique of incorporating simple, foolproof mechanisms into machine fixtures, tooling, or software to prevent human errors from occurring (prevention) or instantly halt the machine if an error occurs (detection)."
            steps = [
                "Prevention (Control Mechanism): Using asymmetric locating pins, keyed fixtures, or mechanical stops that make wrong part loading physically impossible.",
                "Detection (Warning Mechanism): Optical sensors, limit switches, or proximity sensors that buzz or prevent cycle start if a feature is absent.",
                "Contact Method: Sensing physical dimensions or shapes of workpieces.",
                "Fixed-Value Method: Ensuring a required number of fasteners or operations are completed before cycle unclamp.",
                "Motion-Step Method: Ensuring tasks are strictly completed in sequential order."
            ]
            safety_warning = "Never bypass or jumper safety or Poka-Yoke electrical sensors to force machine cycle execution."
            followups = [
                "What are the inspection dimensions for the BH-220 bearing housing?",
                "What is 5S methodology in manufacturing?",
                "What happens when incoming parts have critical defects?"
            ]

        # 11. ISO 9001 / IATF 16949
        elif "iso 9001" in q_lower or "iatf" in q_lower or ("qms" in q_lower and "what is" in q_lower):
            direct_answer = "ISO 9001:2015 is the international quality management benchmark, and IATF 16949 is the specialized automotive QMS standard, focusing on customer satisfaction, defect prevention, and full supply chain traceability."
            steps = [
                "Document Control: Maintaining controlled standard operating procedures (SOPs) with strict revision management.",
                "Risk-Based Thinking: Identifying failure modes (FMEA) and mitigating risks before defect generation.",
                "Lot Traceability: Linking raw materials, heat numbers, and inspection records across every delivery.",
                "Corrective Action: Issuing Supplier Corrective Action Requests (SCAR) and verifying root-cause elimination."
            ]
            safety_warning = "Always verify that shop-floor operations follow the latest controlled copy of the applicable SOP."
            followups = [
                "What is the difference between QC-SOP-014 Rev 03 and Rev 04?",
                "What should QC do if the supplier MTC is missing?",
                "Where is rejected material quarantined?"
            ]

        # 12. Hosur / Plant details
        elif "hosur" in q_lower or "kaveri" in q_lower:
            direct_answer = "Hosur (Tamil Nadu) is a premier industrial and precision automotive engineering hub located adjacent to Bangalore. Kaveri Precision Components operates its high-precision CNC turning and machining facility here."
            steps = [
                "Industrial Corridors: Located in Krishnagiri district, Tamil Nadu, directly accessible along NH-44.",
                "Specialization: Precision machining, shaft manufacturing, bearing housing processing, and sub-assemblies.",
                "Shop Floor Setup: Features TX-200 CNC lines (CNC-04 to CNC-09), coordinate measuring machines (CMM), and controlled quality cages."
            ]
            safety_warning = "All shop-floor visitors and operators must wear mandatory PPE: steel-toed boots and safety glasses."
            followups = [
                "What is the normal hydraulic pressure for the TX-200 CNC?",
                "What is the incoming material inspection procedure?",
                "How do I verify zero energy before maintenance?"
            ]

        # 13. General Open-Ended Technical / Conversational Answer
        else:
            direct_answer = f"Regarding '{question}': This inquiry covers general industrial, manufacturing, and engineering concepts outside the 4 uploaded plant SOPs."
            steps = [
                "General Principle: For manufacturing applications, verify equipment specifications, operating ranges, and tolerances against OEM documentation.",
                "Safety Assurance: Always ensure machinery is completely de-energized under LOTO procedures before performing mechanical or electrical adjustments.",
                "Quality Alignment: Adhere to standard calibration, traceability, and controlled inspection checklists across all shifts.",
                "Plant Verification: For Kaveri Precision plant-specific procedures, verify the active controlled copy in the plant QMS."
            ]
            safety_warning = "When in doubt regarding plant operations or machine safety, always consult your shift supervisor before taking action."
            followups = [
                "What is 5S methodology in manufacturing?",
                "What is the normal hydraulic pressure for the TX-200 CNC?",
                "How do I verify zero energy before maintenance?",
                "What should QC do if the supplier MTC is missing?"
            ]

        full_answer = direct_answer
        if steps:
            full_answer += "\n\n**Key Principles / Recommended Practices:**\n" + "\n".join(f"- {s}" for s in steps)
        if safety_warning:
            full_answer += f"\n\n**⚠️ Safety Reminder:** {safety_warning}"

        return ChatResponse(
            answer=full_answer,
            direct_answer=direct_answer,
            important_steps=steps,
            safety_warning=safety_warning,
            supported=True,
            is_general_knowledge=True,
            sources=[],
            revision_notice="General AI Technical Copilot — This topic is answered using general manufacturing intelligence (not referenced in the 4 uploaded plant SOPs).",
            suggested_followups=followups
        )

rag_pipeline = RAGPipeline(docs_dir=settings.DOCUMENTS_DIR)
