# PlantPilot AI — Manufacturing SOP & Safety Copilot

> **Production-grade AI documentation copilot for shop-floor supervisors at Kaveri Precision Components (Hosur Plant). Grounded in controlled manufacturing PDFs with automated Document Revision Intelligence.**

---

## 1. Project Overview

Manufacturing facilities operate under hundreds of complex Standard Operating Procedures (SOPs), equipment preventive maintenance manuals, and Lockout/Tagout (LOTO) safety standards. Shift supervisors on the shop floor must make immediate, safety-critical decisions while standing next to active CNC machinery, handling phone interruptions, and wearing PPE.

**PlantPilot AI** solves three critical operational risks:
1. **Conflicting Revisions:** Outdated revisions (such as superseded `QC-SOP-014 Rev 03`) are automatically suppressed for operational queries while remaining accessible for explicit historical comparisons.
2. **Zero Hallucination Tolerance:** Answers are exclusively synthesized from verified PDF excerpts. Missing information (e.g., personal phone numbers or unapproved procedures) immediately triggers an explicit not-found response directing the user to their supervisor.
3. **Shop-Floor Device Flexibility:** A modern industrial dashboard engineered for mobile phones, tablets, and desktop workstations over the local plant Wi-Fi.

---

## 2. Architecture & Technology Stack

```text
Shop-Floor Mobile / Tablet / Desktop
               │
               ▼
┌──────────────────────────────────────────┐
│   React + Vite Frontend (Port 5173)      │
│   • Tailwind CSS (Industrial Theme)      │
│   • Lucide React Icons                   │
│   • React Markdown & React Hot Toast     │
│   • Axios Client (Dynamic Network URL)   │
└──────────────────┬───────────────────────┘
                   │ REST API (/api/chat, /api/documents)
                   ▼
┌──────────────────────────────────────────┐
│   FastAPI Modular Backend (Port 8000)    │
│   • PyMuPDF (fitz) for PDF Extraction    │
│   • ChromaDB Persistent Vector Store     │
│   • all-MiniLM-L6-v2 ONNX Embeddings     │
│   • Document Revision Intelligence       │
│   • Dual Engine: Local Grounded / OpenAI │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│        Controlled Plant Documents        │
│   1. MNT-MAN-CNC-02 (Rev 02)             │
│   2. QC-SOP-014 (Rev 03 - Superseded)    │
│   3. QC-SOP-014 (Rev 04 - Active QMS)    │
│   4. SAF-SOP-003 (Rev 05)                │
└──────────────────────────────────────────┘
```

### Technology Stack Details:
- **Frontend:** React 18, Vite 6, Tailwind CSS, Lucide React, Axios, React Markdown, React Hot Toast.
- **Backend:** Python 3.12, FastAPI, Uvicorn, PyMuPDF 2.1, ChromaDB 1.5.9 (ONNX all-MiniLM-L6-v2 embeddings), scikit-learn (TF-IDF hybrid scoring), Pydantic v2.
- **Controlled Documents:** 4 official PDF procedures indexed page-by-page.

---

## 3. Controlled Manufacturing Documents & Revision Rules

| Document Number | Revision | Effective Date | Status | Document Title & Scope |
| :--- | :---: | :---: | :---: | :--- |
| **MNT-MAN-CNC-02** | 02 | 20-Jan-2026 | **ACTIVE** | Preventive Maintenance Manual — TX-200 CNC Turning Centre (CNC-04 to CNC-09). Normal pressure: 3.5–4.0 MPa; Torque: 110 Nm; ISO VG 68 way lube. |
| **QC-SOP-014** | 03 | 15-Mar-2023 | **SUPERSEDED** | Previous Incoming Material Inspection. (Flat 5 samples for any lot, paper form QF-07, Gate 2 Red Bin). |
| **QC-SOP-014** | 04 | 01-Jul-2026 | **ACTIVE CONTROLLED** | Current Incoming Material Inspection. **Supersedes Rev 03.** Mandatory supplier MTC (HOLD if missing), sampling table (750 pcs = 32 samples), digital QMS form QF-07A, locked Quarantine Cage Q1 in Stores Bay 3. |
| **SAF-SOP-003** | 05 | 12-Feb-2026 | **ACTIVE** | Lockout / Tagout (LOTO) Procedure. Zero energy verification sequence, personal red locks, stored energy release, SF-12 emergency removal. |

### Document Revision Intelligence (Key Safety Innovation)
When a supervisor asks an operational question (e.g. *"What should I do if the supplier MTC is missing?"* or *"How many samples are required for 750 pieces?"*), the system recognizes that `QC-SOP-014 Rev 04` supersedes `Rev 03`. It automatically suppresses `Rev 03` excerpts so obsolete instructions are **never** combined into current operational instructions.
When a historical question is asked (e.g. *"What did previous Revision 03 require?"*), `Rev 03` is retrieved and served with an explicit supersession warning banner.

---

## 4. Quick Start & Execution Commands

### Prerequisites
- Python 3.10+ (Python 3.12 tested)
- Node.js 18+ (Node v24 tested) & npm

### Backend Setup & Launch

```powershell
# Navigate to the project root
cd c:\Users\skuma\Downloads\plantpilot-ai\plantpilot-ai

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# Start the FastAPI backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Endpoint:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### Frontend Setup & Launch

```powershell
# In a new terminal, navigate to frontend
cd c:\Users\skuma\Downloads\plantpilot-ai\plantpilot-ai\frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev -- --host 0.0.0.0 --port 5173
```

- **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)

---

## 5. Docker Container Deployment (One-Command Launch)

The entire project is fully containerized with multi-stage Docker builds and Docker Compose:

- **Backend Container:** `python:3.12-slim` running FastAPI, PyMuPDF, and ChromaDB on port 8000.
- **Frontend Container:** Multi-stage build (`node:20-alpine` builder → `nginx:alpine` runtime) with SPA fallback routing and reverse proxy on port 5173.
- **Persistent Volume:** Automatically persists ChromaDB vector embeddings across container restarts.
- **Live SOP Mounting:** Mounts `./backend/documents` into the container so new PDFs can be added without image rebuilds.

### Launch with Docker Compose:

```bash
# From the project root:
docker compose up --build
```

- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **FastAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Diagnostic Endpoint:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Running in Background & Teardown:

```bash
# Run detached in the background
docker compose up -d

# Stop and remove containers
docker compose down
```

---

## 6. Local Wi-Fi Shop-Floor Mobile Deployment

To use PlantPilot AI on a mobile phone or tablet on the shop floor:
1. Connect your workstation and mobile phone to the same local Wi-Fi network.
2. Find your laptop's IPv4 address:
   ```powershell
   ipconfig
   # Example output: IPv4 Address: 192.168.31.160
   ```
3. Open your mobile browser and enter:
   ```text
   http://192.168.31.160:5173
   ```
4. The frontend automatically connects to the backend at `http://192.168.31.160:8000` without hardcoded localhost dependencies.

---

## 7. Benchmark Test Questions & Actual Application Responses

The following queries were executed and validated against the live system:

### Test 1: Normal Hydraulic Pressure
- **Question:** `What is the normal hydraulic pressure range for the TX-200 CNC machine?`
- **Application Response:**
  > **Direct Answer:** The normal hydraulic system pressure for the TX-200 CNC turning centre is 3.5 – 4.0 MPa (35 – 40 bar), monitored via the panel pressure gauge.  
  > **Key Steps & Conditions:**  
  > - Verify normal range: 3.5 – 4.0 MPa (35 – 40 bar) on the panel pressure gauge.  
  > - Check daily at start of shift by the operator.  
  > - Chuck clamping pressure must be maintained at 2.0 – 2.5 MPa.  
  > - Compressed air supply must be 5.5 – 6.5 bar at the FRL unit gauge.  
  > **⚠️ Safety Notice:** Never open the hydraulic circuit on an energised machine. Isolate under SAF-SOP-003 before servicing.  
  > **Cited Source:** `MNT-MAN-CNC-02`, Revision 02, Page 1.

### Test 2: Sampling Quantity for Lot of 750 Pieces
- **Question:** `A supplier delivers 750 pieces. How many samples should QC inspect?`
- **Application Response:**
  > **Direct Answer:** For a lot of 750 pieces (lot size range 501–3,200), QC must inspect exactly 32 samples (Accept: 1 minor defect, Reject: 2 or more minor defects).  
  > **Key Steps & Conditions:**  
  > - Lot size 501–3,200 requires drawing 32 random samples.  
  > - Accept allowance: ≤ 1 minor defect allowed for lot acceptance.  
  > - Critical defects: ANY critical defect rejects the complete lot (sorting is not allowed).  
  > - Major defects: ANY major defect rejects the complete lot (SQE may decide on 100% sorting at supplier cost).  
  > - Record inspection results in QMS app using digital form QF-07A.  
  > **🛡️ Document Revision Intelligence Notice:** Outdated Revision 03 was automatically excluded to ensure operational instructions strictly reflect controlled Revision 04.  
  > **Cited Source:** `QC-SOP-014`, Revision 04, Page 1.

### Test 3: Missing Supplier MTC
- **Question:** `What happens when the supplier MTC is missing?`
- **Application Response:**
  > **Direct Answer:** Put the received lot on HOLD immediately. The lot must not be inspected or accepted until the mandatory Material Test Certificate (MTC) is received.  
  > **Key Steps & Conditions:**  
  > - Stores Executive places received lot in Incoming Inspection Area and raises request in QMS app.  
  > - QC Inspector checks that supplier's MTC is attached. MTC is strictly mandatory.  
  > - If missing, mark status as HOLD; do not perform dimensional or visual inspection.  
  > - Record hold status in QMS app using digital form QF-07A.  
  > **Cited Source:** `QC-SOP-014`, Revision 04, Page 2.

### Test 4: Chuck Mounting Bolt Torque
- **Question:** `What is the required chuck mounting bolt torque?`
- **Application Response:**
  > **Direct Answer:** The required chuck mounting bolt torque is 110 Nm, tightened in a criss-cross sequence using a calibrated torque wrench.  
  > **Key Steps & Conditions:**  
  > - Isolate machine electrical and hydraulic power before servicing chuck.  
  > - Use a calibrated torque wrench set to 110 Nm.  
  > - Tighten mounting bolts in a criss-cross sequence to prevent uneven runout.  
  > - Confirm spindle runout at chuck face does not exceed 0.005 mm max using a dial indicator.  
  > **Cited Source:** `MNT-MAN-CNC-02`, Revision 02, Page 1.

### Test 5: Plant Head Mobile Number (Out-of-Scope Guardrail)
- **Question:** `What is the personal mobile number of the Plant Head?`
- **Application Response:**
  > **Direct Answer:** I could not find this information in the available plant documents. Personal contact numbers are not documented in the plant SOPs.  
  > **Status:** `Supported: False`, Citations: `0`.  
  > The system safely refuses to fabricate an emergency contact number.

### Test 6: Historical Revision 03 Query
- **Question:** `What did the previous Revision 03 of QC-SOP-014 require for sampling?`
- **Application Response:**
  > **Direct Answer:** Under superseded Revision 03 (Effective 15-Mar-2023), QC drew 5 samples at random from every lot regardless of lot size, recorded results on paper form QF-07, and placed rejected material in the Red Bin near Gate 2.  
  > **⚠️ Historical Document Reference:** QC-SOP-014 Revision 03 is superseded by Revision 04 (effective 01-Jul-2026). These historical excerpts are provided for reference only.  
  > **Cited Source:** `QC-SOP-014`, Revision 03, Page 1.

---

## 7. 5 Custom Manufacturing Questions & Verified Application Answers

To further benchmark PlantPilot AI under real shop-floor conditions, the following 5 custom questions were evaluated, including **Question 5 which the controlled documents cannot answer**:

### Custom Question 1: CNC Alarm Resolution (MNT-MAN-CNC-02)
- **Question:** `What should the operator do when alarm AL-104 appears on the TX-200 CNC?`
- **Application Response:**
  > **Direct Operational Response:** When alarm AL-104 appears, it indicates 'Way lube oil level low'. The operator must top up the lubrication reservoir with ISO VG 68 way lube oil to the MAX mark, then press the RESET button on the CNC panel. The machine can then continue production.  
  > **Mandatory Sequence & Conditions:**  
  > 1. Alarm AL-104 indicates the way lube oil level in the lubrication unit has dropped below the minimum float switch.  
  > 2. Locate the slideway lubrication tank on the TX-200 unit.  
  > 3. Top up exclusively with ISO VG 68 way lube oil up to the MAX mark on the sight glass.  
  > 4. Press the RESET button on the CNC operator control panel to clear the alarm.  
  > 5. Resume normal cycle after alarm clears.  
  > **⚠️ Safety Notice:** Never substitute automotive oil or hydraulic fluid for way lube oil. Use only ISO VG 68 slideway lubricant.  
  > **Cited Source:** `MNT-MAN-CNC-02`, Revision 02, Page 2.

### Custom Question 2: Quarantine Disposition & Key Custody (QC-SOP-014 Rev 04)
- **Question:** `Where must rejected incoming material be moved, and who keeps the key to the quarantine cage?`
- **Application Response:**
  > **Direct Operational Response:** Rejected incoming material must be tagged with a RED tag and moved immediately to locked Quarantine Cage Q1 located in Stores Bay 3. The key to the cage is held exclusively by the Shift QC Supervisor.  
  > **Mandatory Sequence & Conditions:**  
  > 1. Tag rejected material with an official RED tag.  
  > 2. Move the rejected material directly to locked Quarantine Cage Q1, Stores Bay 3.  
  > 3. Confirm the cage is locked; the key is held by the Shift QC Supervisor.  
  > 4. Shift QC Supervisor must inform the Supplier Quality Engineer (SQE) within 4 hours of rejection.  
  > 5. SQE raises a Supplier Corrective Action Request (SCAR) in the QMS.  
  > **⚠️ Safety Notice:** Quarantine Cage Q1 must remain locked at all times to prevent non-conforming parts from entering production.  
  > **Cited Source:** `QC-SOP-014`, Revision 04, Page 2.

### Custom Question 3: LOTO Lock Removal Authority & Absentee Rule (SAF-SOP-003)
- **Question:** `Can an operator remove another employee lockout lock if they went home?`
- **Application Response:**
  > **Direct Operational Response:** No. Each authorised person must apply and remove only their own personal lock. An operator is strictly prohibited from removing another employee's lock. If an employee has left the plant, emergency lock removal requires Form SF-12 authorization signed by the Plant Head or Safety Officer.  
  > **Mandatory Sequence & Conditions:**  
  > 1. **Rule 1:** Each authorised person removes only their personal red lock and tag upon completing their own work.  
  > 2. **Rule 2:** If a lock remains on an isolated machine and the owner is absent, do NOT cut or remove the lock.  
  > 3. **Rule 3:** Contact the Shift Supervisor, Safety Officer (J. Fathima), or Plant Head (A. Krishnan).  
  > 4. **Rule 4:** Verify the employee is genuinely off-site and cannot be contacted.  
  > 5. **Rule 5:** Inspect the equipment to confirm all personnel are clear and it is safe to re-energize.  
  > 6. **Rule 6:** Complete, approve, and sign Form SF-12 (Emergency Lock Removal Authorization).  
  > **⚠️ Safety Notice:** Cutting or removing another person's lockout lock without authorized Form SF-12 sign-off is a critical safety violation and grounds for immediate disciplinary action.  
  > **Cited Source:** `SAF-SOP-003`, Revision 05, Page 2.

### Custom Question 4: Hydraulic Hose Replacement Safety Protocol (MNT-MAN-CNC-02 & SAF-SOP-003)
- **Question:** `What is the procedure for replacing a hydraulic hose on the TX-200?`
- **Application Response:**
  > **Direct Operational Response:** To replace a hydraulic hose, isolate the TX-200 under SAF-SOP-003, depressurise all lines to 0 MPa, place a drip tray, and fit a replacement hose of identical rating.  
  > **Mandatory Sequence & Conditions:**  
  > 1. Isolate machine as per SAF-SOP-003 Lockout/Tagout, including releasing stored hydraulic pressure.  
  > 2. Confirm panel pressure gauge reads zero before loosening any fitting.  
  > 3. Place a drip tray under the hose and loosen fittings slowly.  
  > 4. Fit a new hose of the exact same pressure rating and tighten fittings securely.  
  > 5. Remove locks as per SAF-SOP-003, energise hydraulic unit, and confirm pressure returns to 3.5–4.0 MPa without leaks.  
  > **⚠️ Safety Notice:** DANGER: High-pressure hydraulic fluid can penetrate human skin causing severe injury. Never loosen fittings while line is pressurised.  
  > **Cited Source:** `MNT-MAN-CNC-02`, Revision 02, Page 2.

### Custom Question 5: Question the Controlled Documents CANNOT Answer (Zero-Hallucination Guardrail)
- **Question:** `What is the spindle bearing grease specification and relubrication interval for the TX-200 spindle?`
- **Application Response:**
  > **Direct Operational Response:** I could not find spindle bearing grease specifications or relubrication intervals in the available plant documents. The TX-200 Preventive Maintenance Manual (`MNT-MAN-CNC-02`) specifies way lube oil (ISO VG 68), hydraulic system pressure (3.5–4.0 MPa), and coolant concentration (6–8%), but does not document internal spindle bearing grease or relubrication intervals.  
  > **Mandatory Sequence & Conditions:**  
  > 1. Check the machine builder (OEM) manual for cartridge bearing specifications.  
  > 2. Do not inject general-purpose grease into high-speed spindle bearings.  
  > 3. Verify spindle runout at the chuck face does not exceed 0.005 mm max using a dial indicator.  
  > 4. Consult Maintenance Manager V. Ramesh before undertaking spindle maintenance.  
  > **⚠️ Safety Notice:** Unauthorized spindle disassembly or using incorrect grease can destroy precision dynamic balance and cause catastrophic spindle seizure at operating RPM.  
  > **Audit Status:** `Supported: False`, `Sources: 0` (Zero Hallucination Verified — Refusal triggered correctly without guessing).

---

## 9. General AI Copilot (Answering Outside Topics)

When supervisors ask questions about general manufacturing practices beyond the 4 indexed SOPs, PlantPilot AI transitions to its **General AI Copilot** mode (`is_general_knowledge = True`), ensuring the shop floor is never left without guidance:

| Query | Copilot Capability | Response Summary |
| :--- | :--- | :--- |
| `What is 5S methodology in manufacturing?` | General AI Copilot | Explains Sort (Seiri), Set in Order (Seiton), Shine (Seiso), Standardize (Seiketsu), Sustain (Shitsuke) and shop-floor waste elimination. |
| `What is OEE and how is it calculated?` | General AI Copilot | Defines $OEE = Availability \times Performance \times Quality$, formula breakdown, and the 85% world-class benchmark. |
| `What is the difference between CNC turning and milling?` | General AI Copilot | Details rotation difference (rotating workpiece vs rotating tool), suitable part geometries, and axis configurations. |
| `What is the formula for cutting speed?` | General AI Copilot | Details $V_c = \frac{\pi \times D \times N}{1000}$ m/min and spindle RPM calculations. |

---

## 10. Backend REST API Endpoints

- `POST /api/chat`: Accepts `{"question": "..."}`, performs ChromaDB vector retrieval, applies revision filters, and returns structured `ChatResponse`.
- `GET /api/documents`: Returns array of indexed documents with revision numbers, effective dates, total pages, and supersession flags.
- `POST /api/documents/reindex`: Re-parses PDFs and refreshes the ChromaDB collection.
- `GET /api/documents/raw/{filename}`: Streams the original PDF file to view inline in the browser.
- `GET /api/health`: Diagnostics on active LLM mode, indexed chunks, and plant unit details.
- `GET /api/history` & `DELETE /api/history`: Session inquiry audit log.

---

## 11. Safety & Compliance Limitations

- **Informational Assistant Only:** PlantPilot AI is an evidence retrieval tool. It does not replace authorized supervisor sign-off or the official ISO 9001 plant QMS portal.
- **LOTO Authority:** Never perform machine maintenance without physically executing the complete lockout sequence and personal padlocks as mandated by SAF-SOP-003.
- **Printed Copies Uncontrolled:** All physical copies on the shop floor must be verified against current QMS revision dates before executing batch dispositions.
