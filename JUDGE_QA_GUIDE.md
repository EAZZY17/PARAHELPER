# ParaHelper Judge Q&A Preparation Guide

**WIMTACH × EffectiveAI Hackathon | March 4, 2026**

*Updated from actual codebase — use this version for accuracy.*

---

## YOUR JUDGES — Know Your Audience

| Judge | Role | What They Care About | Watch Out For |
|-------|------|----------------------|---------------|
| **Terence Kuehn** | CEO, EffectiveAI | Business viability, security, scalability, cost, go-to-market | Will probe on real-world deployment, pricing model, competitive landscape |
| **JC Gilbert** | Chief, Muskoka Paramedic Services | Real paramedic pain points, daily workflow, practical usability | Will test if you actually understand the job — not just the tech |
| **Tenzin Jinpa** | AI Expert, Centennial College | Architecture, model choices, prompt engineering, innovation | Will drill into technical decisions — why this model, why this approach |

---

## SECTION 1: ARCHITECTURE & TECHNICAL QUESTIONS

### "Walk me through what happens when a paramedic sends a message."

**Your answer:**
"Every message goes through our agent pipeline. Here's the exact flow:

1. **Transcription Cleaner** (voice only): First, if it came through voice, we catch medical speech-to-text errors. We have a dictionary of ~30 medical misrecognitions — 'night row' becomes 'nitro,' 'a trophy' becomes 'atropine,' 'nar can' becomes 'Narcan.' We also normalize unit numbers (40XX format), badge numbers (S-XXXX), and station references. Then a second LLM pass does context-aware corrections for anything the dictionary missed.

2. **Form Detective**: Analyzes intent. Keyword matching runs first — fast and free — and we fall back to an LLM only if keywords are ambiguous. 'I backed into a pole' triggers Occurrence Report. 'Gave a bear to the kid' triggers Teddy Bear Tracking. Age under 12 auto-adds Teddy Bear. Can detect multiple forms at once.

3. **Extraction Agent**: Pulls structured data from natural language. Two layers: regex patterns for dates, times, locations, cities, severity — and an LLM for nuance. Outputs JSON with confidence scores (high/medium/low) per field. We extract from the full conversation — if they said the date in message 1 and location in message 3, we merge it all. For Teddy Bear and Occurrence we extract location from phrases like 'at X,' 'in X,' Highway 401, street addresses.

4. **Guardrail Agent**: Validates required fields, catches contradictions (e.g. 'no injuries' but description mentions 'bleeding'), and flags medical safety issues — dosages exceeding max thresholds, abnormal vitals.

5. **Conversation Agent**: Synthesizes everything — forms, guardrail results, knowledge queries, emotional state — and generates a natural response. If fields are missing, it asks for them conversationally. Detects crisis mode and switches to short, clinical responses. Also detects when the user says 'send it' or 'submit' — if the form passes guardrail, we auto-submit so they don't have to click the button.

6. **Summarizer Agent**: When conversation hits 15+ messages, compresses the oldest 10 into a 3–4 sentence summary, preserving critical medical data.

7. **Export Agent**: When a form is submitted, generates PDF (and XML for Teddy Bear), emails to Hillsidesplc@gmail.com, and the paramedic can download their copy."

*If pressed on latency:* "We front-load keyword detection before LLM calls. Pattern extraction runs in parallel with the LLM extractor. Typical message: 2–4 seconds."

---

### "Why did you choose this model over others?"

**Your answer:**
"We use **OpenRouter** so we can switch models without code changes. Our default is **Claude Sonnet 4.6** via OpenRouter — we also support Gemini when OpenRouter isn't configured.

**Why OpenRouter + Claude:**
- **Flexibility**: One API, any model. We can swap to Gemini, DeepSeek, or others per agent if needed.
- **Cost**: At 5–8 LLM calls per message, budget matters. Claude via OpenRouter fits our usage.
- **Quality**: Claude handles medical nuance and structured extraction well.
- **Embeddings**: We use Google text-embedding-004 (768 dims) via OpenRouter for ChromaDB — matches our vector store."

*If asked about Gemini specifically:* "We can run on Gemini Flash when OpenRouter isn't set — same pipeline, different model. The architecture is model-agnostic."

---

### "How does the Extraction Agent handle ambiguous medical language?"

**Your answer:**
"Two layers. First, deterministic pattern matching — regex for dates, times, locations, severity, city names (including Muskoka area: Huntsville, Barrie, Bracebridge, etc.). Fast and reliable.

Second, the LLM handles nuance — 'gave two of nitro' → nitroglycerin dosing; 'the kid was about five' → recipient_age: 5. Both layers merge; pattern extraction wins when it has a value. Every field gets a confidence score — the form panel color-codes green/yellow/red so the paramedic sees what to verify."

---

### "What happens if the AI extracts something wrong?"

**Your answer:**
"Three layers. First, confidence scoring — yellow or red flags fields to check. Second, the Guardrail Agent catches contradictions — 'no injuries' but description mentions bleeding; 2-year-old listed as bystander. Third, the form panel shows every field before send. Submit is blocked until guardrail passes. We also have medical safety checks — if a dosage exceeds known max (e.g. epi above 1mg adult), we flag a critical alert."

---

### "How do you handle voice recognition errors with medical terminology?"

**Your answer:**
"The Transcription Cleaner is the first step. We have a dictionary of ~30 medical corrections — drug names (nitro, atropine, naloxone), abbreviations (BVM, NRB, GCS, STEMI, SpO2), and EMS patterns. Unit numbers get normalized to 40XX, badge to S-XXXX. Then an LLM pass handles anything the dictionary missed, with a medical-specific prompt. Voice runs in-browser via Web Speech API — no extra server for STT."

---

### "How does Crisis Mode work?"

**Your answer:**
"We monitor for 13 crisis keywords — 'unresponsive,' 'not breathing,' 'cardiac arrest,' 'CPR,' 'code blue,' 'asystole,' 'v-fib,' and others. When triggered, we switch to Stress Mode: short, clinical responses only — two sentences max. The UI shows a red pulsing 'CRISIS MODE' badge. We also track high-acuity call count — 4+ crisis calls in under 2 hours triggers a fatigue alert suggesting a hydration check."

---

### "What about pediatric patients?"

**Your answer:**
"Pediatric mode activates when we detect a child under 12, baby, infant, or toddler. When active: the Knowledge Agent uses weight-based dosing, we auto-suggest Teddy Bear Tracking, and the Guardrail applies pediatric safety thresholds (e.g. epi max 0.3mg). A 'Pediatric Mode Active' alert appears."

---

## SECTION 2: LOGIN, AUTH & WEATHER

### "How does login work?"

**Your answer:**
"Badge-only — no PIN. The paramedic enters their badge ID (e.g. S-5591). We look them up in MongoDB, issue a JWT (12h), create a session, and generate a personalized login briefing. The briefing includes their station, unit, partner, compliance status, and **real-time weather** from OpenWeather — we map their station to a city (Station 7 → Huntsville, Station 3 → Barrie) and fetch current conditions. If there's ice or snow, we mention it. Weather also shows in the TopBar and refreshes every 15 minutes."

---

### "Where does the weather data come from?"

**Your answer:**
"OpenWeather API. We map stations to cities — Station 1 through 7 to Bracebridge, Orillia, Barrie, Midland, Collingwood, Gravenhurst, Huntsville. The login briefing and the live TopBar widget both use it. We detect ice risk from temp + humidity and freezing precipitation."

---

## SECTION 3: FORM SUBMISSION & AUTO-SEND

### "Does the paramedic have to click Send?"

**Your answer:**
"No. When they say 'send it,' 'submit,' 'go ahead,' or 'mail it' and the form passes guardrail, we **auto-submit**. No manual click. They still get the success message and can download their PDF copy. If guardrail fails, we show exactly what's missing so they can fix it."

---

### "Where do completed forms go?"

**Your answer:**
"All forms are emailed to **Hillsidesplc@gmail.com** as per the challenge. We send PDF and XML for Teddy Bear, PDF for Occurrence and inventories, DOCX for Status Report. The paramedic gets a 'Download your copy' option after submit. SendGrid handles delivery."

---

### "What do the PDFs look like?"

**Your answer:**
"We match the challenge reference layouts. Teddy Bear has the dark header 'TEDDY BEAR COMFORT PROGRAM,' EMS branding, sections for Date & Time, Primary Medic, Second Medic, Teddy Bear Recipient (age, gender, type, location). Occurrence has 'EMS Occurrence Report' with incident documentation. Both print-ready for the recipient."

---

## SECTION 4: PARAMEDIC-SPECIFIC QUESTIONS (JC Gilbert)

### "Do paramedics actually have time to use this during a call?"

**Your answer:**
"We're voice-first for exactly that reason. They speak while treating — we extract in the background. They're not filling a form; they're doing their job. Review happens after — at the hospital or restocking — glance at yellow flags, hit send. Or say 'send it' and we submit automatically. Crisis mode keeps responses to two sentences when they're under pressure."

---

### "How does this handle a real shift with multiple calls?"

**Your answer:**
"Session-based. Phase detection shifts between Before Call, During Call, After Call, and Between Calls from what they say — 'responding' → Before, 'on scene' → During, 'back at station' → Between. Multiple forms can be active (Occurrence + Teddy Bear). The Summarizer compresses old messages every 15+ exchanges. Shift Summary at end of shift gives a full recap."

---

### "Why Teddy Bear tracking?"

**Your answer:**
"It's in the challenge, and it's a perfect example of documentation that falls through the cracks. Giving a comfort item is a compassionate moment — the form is an afterthought. With ParaHelper, 'we gave a teddy bear to the kid' auto-triggers the form, prefills date, badge, unit, and asks age, gender, recipient type. Location extraction works — if they say 'at Scarborough General' we capture it. Takes seconds instead of hunting for a paper form later."

---

### "Can a paramedic ask for help with non-form things?"

**Your answer:**
"Yes. Medical knowledge via ChromaDB RAG — dosage questions, protocols. Admin tasks — uniform order, vacation, overtime, missed meal, shift swap — we collect details conversationally and email the supervisor. Hospital routing with Mapbox and real-time traffic. Status checks from the database. We also detect emotional state — if they say 'lost the patient,' we acknowledge first before any paperwork."

---

## SECTION 5: COMMERCIALIZATION (Terence Kuehn)

### "How would this scale?"

**Your answer:**
"Multi-tenant ready. Each paramedic has their own session, forms, history. MongoDB: users, conversations, operations. At ~$0.50–1 per shift in API costs, 100 paramedics is roughly $3–6K/month. Render-ready with render.yaml; could move to AWS/GCP for production scaling."

---

### "What about data privacy and PHIPA?"

**Your answer:**
"We don't store patient names or health card numbers — forms capture incident details, not identity. Data flows through our backend; we'd use a PHIPA-compliant LLM endpoint for production. Export Agent creates locked PDFs with timestamps for audit. Guardrail has a domain lock — rejects non-clinical queries. For production: encryption at rest, compliant LLM hosting, audit logging."

---

### "What's the competitive landscape?"

**Your answer:**
"Most EMS tools are manual data entry — paper or ePCR like Zoll/ESO. ParaHelper is conversation-driven: talk, form fills itself. No one else does voice-to-form with confidence scoring and guardrail validation for EMS. Nuance DAX is for physicians in exam rooms — we're built for moving ambulances, crisis mode, phase detection. Our multi-agent pipeline — each task has a specialist — is the differentiator."

---

### "Pricing model?"

**Your answer:**
"Per-seat monthly. Core ($15–25/paramedic): form filling, voice, PDF/email. Pro ($35–50): Knowledge Agent, hospital routing, admin tasks, shift summaries. Enterprise: self-hosted LLM, ePCR integration, custom forms. Labor savings from documentation time (30–45 min/shift) more than cover the cost."

---

## SECTION 6: TECHNICAL DEEP-DIVE (Tenzin Jinpa)

### "How do you handle prompt engineering?"

**Your answer:**
"Task-specific prompts. Extraction: schema-aware, strict JSON, temperature 0.1. Conversation: personality, paramedic context, forms, guardrails, emotional state, temperature 0.8. Form Detective: minimal classification, temperature 0. Principle: extraction = cold and precise; conversation = warm and natural."

---

### "What's the RAG implementation?"

**Your answer:**
"ChromaDB, text-embedding-004 (768 dims) via OpenRouter. Knowledge base: EMS protocols, drug formularies, dosage guidelines. Query → embed → top 5 similarity search → context to LLM. Role-scoped: ACP gets full access, PCP filtered. Fallback: if ChromaDB is down, we still answer from LLM knowledge with 'confirm against your protocols.'"

---

### "How do you prevent dangerous medical advice?"

**Your answer:**
"Domain lock in Guardrail — rejects non-healthcare. Dosage thresholds for 7 drugs (epi, atropine, nitro, naloxone, dextrose, aspirin, amiodarone). Vital sign monitoring for 7 types (HR, BP, RR, SpO2, GCS, temp, glucose). Role scoping. Every medical response ends with 'confirm against your protocols.' We never diagnose."

---

### "Map vs form location — how do you avoid opening the map when they're answering a location question?"

**Your answer:**
"We have a heuristic: if a form has missing location/city and the message is short (under 80 chars), we treat it as a form field answer, not a map request. Map only opens for explicit route/directions phrases like 'directions to' or 'how do I get to.'"

---

## SECTION 7: QUICK-FIRE REFERENCE CARD

| Stat | Value |
|------|-------|
| **LLM** | Claude Sonnet 4.6 via OpenRouter (or Gemini if no OpenRouter) |
| **Embeddings** | text-embedding-004, 768 dims |
| **Agent modules** | 9 (Transcription, Form Detective, Extraction, Guardrail, Conversation, Summarizer, Export, Knowledge, Admin) |
| **Forms** | 6 (Occurrence, Teddy Bear, Shift, Status, Vehicle, Equipment) |
| **Form recipient** | Hillsidesplc@gmail.com |
| **Medical corrections** | ~30 in dictionary |
| **Crisis keywords** | 13 |
| **Emotional states** | 3 (tough, positive, neutral) |
| **Admin tasks** | 5 (uniform, vacation, overtime, missed meal, shift swap) |
| **Drug safety checks** | 7 drugs with max dosage |
| **Vital monitoring** | 7 vital types |
| **Summarizer trigger** | 15+ messages |
| **Weather** | OpenWeather, station→city mapping, 15min refresh |
| **Auth** | Badge-only, JWT 12h |
| **Export formats** | PDF, XML (Teddy Bear), DOCX (Status) |
| **Database** | MongoDB (users, conversations, operations) |
| **Vector store** | ChromaDB |
| **Map/routing** | Mapbox, driving-traffic |
| **Deployment** | Render (render.yaml) |

---

## SECTION 8: CURVEBALL QUESTIONS

### "What if the internet goes down?"
"Form data is in browser state and MongoDB. Partially filled form stays visible. Voice STT runs in-browser. LLM calls would fail, but pattern extraction could run locally. On reconnect, we sync."

### "Could a paramedic misuse it?"
"Guardrail domain lock, contradiction checks, audit trail. Every message and export logged with paramedic ID and timestamp. Supervisor dashboards would flag unusual patterns in production."

### "Why not just use ChatGPT with voice?"
"ChatGPT doesn't know our form schemas, can't auto-fill structured documents, doesn't validate EMS guardrails, can't email PDFs to dispatch, and doesn't maintain session state across a 12-hour shift. ParaHelper is purpose-built — every component from the medical dictionary to the export pipeline is domain-specific."

### "What was the hardest technical challenge?"
"Extraction across multiple messages — date in message 1, location in 3, description in 5. We pass the last 12 messages as context and merge incrementally. Another: not opening the map when 'Vaughan' is a form answer. We use a heuristic on message length and missing form fields."

---

## CLOSING STATEMENT

**"ParaHelper isn't just a form filler — it's the first AI that treats paramedics the way they deserve. They're out there saving lives, and we're making sure the paperwork never slows them down. Every feature — voice-first, auto-send, real weather, crisis mode — comes back to one principle: the paramedic's hands should be on the patient, not on a keyboard. ParaHelper handles the rest."**
