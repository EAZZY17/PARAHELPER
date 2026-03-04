const medicalKnowledge = [
  // SHOCK
  {
    id: 'shock-signs',
    content: 'Signs and symptoms of shock: Altered level of consciousness, rapid weak pulse (tachycardia), rapid shallow breathing (tachypnea), pale cool clammy skin, delayed capillary refill greater than 2 seconds, hypotension (systolic BP less than 90mmHg), nausea and vomiting, anxiety and restlessness, thirst, weakness.',
    metadata: { type: 'medical', category: 'shock', role: 'all' }
  },
  {
    id: 'shock-treatment-pcp',
    content: 'PCP Shock Treatment Protocol: Ensure scene safety. Manage airway with BVM if needed. High flow oxygen 15L/min via NRB mask. Control external bleeding with direct pressure. Position patient supine, elevate legs if no spinal injury suspected. Keep patient warm with blankets. Establish IV access if within scope. Monitor vitals every 5 minutes. Rapid transport to nearest appropriate facility.',
    metadata: { type: 'protocol', category: 'shock', role: 'PCP' }
  },
  {
    id: 'shock-treatment-acp',
    content: 'ACP Shock Treatment Protocol: All PCP interventions plus: Establish IV access with large bore catheter (16-18G). Normal saline bolus 20mL/kg for hypovolemic shock. Consider vasopressors for distributive shock. Epinephrine 1:10,000 IV for anaphylactic shock 0.3-0.5mg. Advanced airway management including intubation if GCS less than 8. Continuous cardiac monitoring. Consider blood products if available for hemorrhagic shock.',
    metadata: { type: 'protocol', category: 'shock', role: 'ACP' }
  },

  // CARDIAC
  {
    id: 'cardiac-chest-pain',
    content: 'Chest Pain Protocol: OPQRST assessment - Onset, Provocation, Quality, Radiation, Severity, Time. Obtain 12-lead ECG within 10 minutes. Administer ASA 160-325mg chewed if no allergy or contraindication. Nitroglycerin 0.4mg sublingual if systolic BP greater than 100mmHg, may repeat every 5 minutes x3. High flow oxygen if SpO2 less than 94%. Establish IV access. Monitor for dysrhythmias. Consider STEMI activation if ST elevation noted.',
    metadata: { type: 'protocol', category: 'cardiac', role: 'all' }
  },
  {
    id: 'cardiac-stemi',
    content: 'STEMI Recognition: ST segment elevation of 1mm or more in 2 or more contiguous leads. Anterior STEMI: V1-V4 elevation. Inferior STEMI: II, III, aVF elevation. Lateral STEMI: I, aVL, V5, V6 elevation. Activate cath lab if within 90 minute PCI window. Aspirin, heparin per protocol. Do NOT delay transport for interventions. Target door-to-balloon time under 90 minutes.',
    metadata: { type: 'medical', category: 'cardiac', role: 'all' }
  },
  {
    id: 'cardiac-arrest-protocol',
    content: 'Cardiac Arrest Protocol: Confirm unresponsiveness and absence of pulse. Begin high-quality CPR immediately - 30:2 ratio, rate 100-120/min, depth 5-6cm. Apply AED/defibrillator as soon as available. Shockable rhythms (VF/pVT): Defibrillate 200J biphasic. Resume CPR immediately after shock for 2 minutes. Epinephrine 1mg IV/IO every 3-5 minutes. Amiodarone 300mg IV first dose, 150mg second dose for refractory VF/pVT.',
    metadata: { type: 'protocol', category: 'cardiac', role: 'ACP' }
  },

  // AIRWAY
  {
    id: 'airway-basic',
    content: 'Basic Airway Management (PCP): Head tilt chin lift for non-trauma. Jaw thrust for suspected spinal injury. Oropharyngeal airway (OPA) for unconscious patients with no gag reflex. Nasopharyngeal airway (NPA) for semi-conscious patients. Suction as needed. Bag valve mask (BVM) ventilation at 10-12 breaths/min for adults. High flow oxygen 15L/min via NRB mask for spontaneously breathing patients.',
    metadata: { type: 'protocol', category: 'airway', role: 'PCP' }
  },
  {
    id: 'airway-advanced',
    content: 'Advanced Airway Management (ACP): All basic interventions plus: Endotracheal intubation for GCS less than 8 or inability to protect airway. Confirm placement with waveform capnography (ETCO2 35-45mmHg). Supraglottic airway (King LT or i-gel) as backup. Rapid sequence intubation with sedation and paralytic agents. Surgical cricothyrotomy as last resort. Continuous ETCO2 monitoring post-intubation.',
    metadata: { type: 'protocol', category: 'airway', role: 'ACP' }
  },

  // DRUGS
  {
    id: 'drug-epinephrine',
    content: 'Epinephrine: Anaphylaxis - 0.3-0.5mg IM (1:1,000) into lateral thigh, may repeat every 5-15 minutes. Cardiac arrest - 1mg IV/IO (1:10,000) every 3-5 minutes. Pediatric anaphylaxis - 0.01mg/kg IM max 0.3mg. Pediatric cardiac arrest - 0.01mg/kg IV/IO max 1mg. Contraindications: None in cardiac arrest. Caution in elderly, cardiac disease. Side effects: tachycardia, hypertension, anxiety, tremor.',
    metadata: { type: 'drug', category: 'drugs', role: 'all' }
  },
  {
    id: 'drug-nitroglycerin',
    content: 'Nitroglycerin: 0.4mg sublingual tablet or spray for chest pain. May repeat every 5 minutes up to 3 doses. Contraindications: Systolic BP less than 100mmHg, heart rate less than 50 or greater than 100, right ventricular infarction (inferior STEMI), phosphodiesterase inhibitor use within 24-48 hours (Viagra/Cialis). Pediatric: Not indicated. Side effects: hypotension, headache, dizziness.',
    metadata: { type: 'drug', category: 'drugs', role: 'all' }
  },
  {
    id: 'drug-aspirin',
    content: 'Aspirin (ASA): 160-325mg chewed (not swallowed whole) for suspected cardiac chest pain. One-time dose. Contraindications: Known aspirin allergy, active GI bleeding, recent hemorrhagic stroke. Pediatric: Not recommended for children under 16 (Reye syndrome risk). Side effects: GI upset, bleeding risk.',
    metadata: { type: 'drug', category: 'drugs', role: 'all' }
  },
  {
    id: 'drug-naloxone',
    content: 'Naloxone (Narcan): Opioid overdose reversal. Adult: 0.4-2mg IV/IM/IN, may repeat every 2-3 minutes. Intranasal: 4mg in one nostril. Pediatric: 0.1mg/kg IV/IM/IN. Goal is to restore adequate respirations, not full consciousness. Contraindications: Known hypersensitivity. Caution: May precipitate acute withdrawal in opioid-dependent patients. Short half-life - monitor for re-sedation. Duration 30-90 minutes.',
    metadata: { type: 'drug', category: 'drugs', role: 'all' }
  },
  {
    id: 'drug-atropine',
    content: 'Atropine: Symptomatic bradycardia - 0.5mg IV every 3-5 minutes, max 3mg. Organophosphate poisoning - 2-4mg IV, repeat as needed. Pediatric: 0.02mg/kg IV min dose 0.1mg, max single dose 0.5mg child, 1mg adolescent. Contraindications: Glaucoma (relative). Not effective for infranodal blocks (Mobitz II, third degree). Side effects: tachycardia, dry mouth, urinary retention, mydriasis.',
    metadata: { type: 'drug', category: 'drugs', role: 'ACP' }
  },
  {
    id: 'drug-dextrose',
    content: 'Dextrose: Hypoglycemia (blood glucose less than 4 mmol/L with symptoms). Adult: D50W 25g (50mL) IV push. If no IV: glucagon 1mg IM. Pediatric: D25W 0.5-1g/kg IV. Neonate: D10W 2-4mL/kg IV. Oral glucose 15-20g if conscious and able to swallow. Recheck glucose every 5 minutes. Contraindications: None in true hypoglycemia.',
    metadata: { type: 'drug', category: 'drugs', role: 'all' }
  },

  // PEDIATRIC
  {
    id: 'pediatric-assessment',
    content: 'Pediatric Assessment Triangle (PAT): Appearance - Tone, interactivity, consolability, look/gaze, speech/cry (TICLS). Work of Breathing - Abnormal airway sounds, positioning, retractions, nasal flaring. Circulation - Pallor, mottling, cyanosis. Normal vitals by age: Newborn HR 120-160, RR 30-60. Infant HR 100-150, RR 25-50. Toddler HR 90-140, RR 20-30. School age HR 70-120, RR 15-25.',
    metadata: { type: 'medical', category: 'pediatric', role: 'all' }
  },
  {
    id: 'pediatric-vitals',
    content: 'Pediatric Vital Signs Reference: Newborn (0-1mo): HR 120-160, RR 30-60, BP 60-80 systolic. Infant (1-12mo): HR 100-150, RR 25-50, BP 70-90. Toddler (1-3yr): HR 90-140, RR 20-30, BP 80-100. Preschool (4-5yr): HR 80-120, RR 20-25, BP 80-110. School (6-12yr): HR 70-110, RR 15-20, BP 90-120. Adolescent (13+): HR 60-100, RR 12-20, BP 100-130.',
    metadata: { type: 'medical', category: 'pediatric', role: 'all' }
  },
  {
    id: 'pediatric-dosing',
    content: 'Pediatric Drug Dosing: Weight-based calculations critical. Use Broselow tape if weight unknown. Epinephrine anaphylaxis: 0.01mg/kg IM max 0.3mg. Epinephrine cardiac arrest: 0.01mg/kg IV max 1mg. Naloxone: 0.1mg/kg IV/IM/IN. Dextrose D25W: 0.5-1g/kg IV. Atropine: 0.02mg/kg min 0.1mg. Normal saline bolus: 20mL/kg. ALWAYS double-check pediatric doses. Use caution with decimal points.',
    metadata: { type: 'drug', category: 'pediatric', role: 'all' }
  },

  // STROKE
  {
    id: 'stroke-assessment',
    content: 'Stroke Assessment - FAST: Face drooping - ask patient to smile, note asymmetry. Arm drift - raise both arms, note if one drifts down. Speech difficulty - repeat a simple phrase, note slurring. Time - note exact time symptoms first observed, critical for treatment decisions. Cincinnati Stroke Scale positive if any one sign present. Los Angeles Stroke Screen for field assessment. Blood glucose must be checked to rule out hypoglycemia mimicking stroke.',
    metadata: { type: 'medical', category: 'stroke', role: 'all' }
  },
  {
    id: 'stroke-treatment',
    content: 'Stroke Treatment Protocol: Maintain airway and oxygenation. Keep SpO2 above 94%. Do NOT lower blood pressure in field unless systolic greater than 220. Establish IV access - do NOT give dextrose-containing fluids. Determine last known well time precisely. Rapid transport to stroke center. Pre-notify receiving facility. Keep NPO. Position head of stretcher at 30 degrees. Continuous cardiac monitoring.',
    metadata: { type: 'protocol', category: 'stroke', role: 'all' }
  },

  // DIABETIC
  {
    id: 'diabetic-hypoglycemia',
    content: 'Hypoglycemia Management: Blood glucose less than 4 mmol/L with altered mental status, diaphoresis, tremor, confusion, seizure, or unresponsiveness. Conscious patient: Oral glucose 15-20g (glucose tabs, juice, sugar). Unconscious or unable to swallow: Dextrose D50W 25g IV or Glucagon 1mg IM. Recheck glucose every 5 minutes. Do not release patient with glucose less than 5 mmol/L. Consider cause: insulin, oral hypoglycemics, missed meal, exercise.',
    metadata: { type: 'protocol', category: 'diabetic', role: 'all' }
  },

  // OVERDOSE
  {
    id: 'overdose-opioid',
    content: 'Opioid Overdose Recognition and Treatment: Signs: pinpoint pupils, respiratory depression (RR less than 12), decreased LOC, cyanosis, track marks. Treatment: Open airway, assist ventilations with BVM. Naloxone 0.4-2mg IV/IM/IN, repeat every 2-3 minutes. Intranasal: 4mg single nostril. Titrate to respiratory effort, not consciousness. Monitor for re-sedation (naloxone half-life shorter than most opioids). Be prepared for combative patient on reversal.',
    metadata: { type: 'protocol', category: 'overdose', role: 'all' }
  },

  // HOSPITALS
  {
    id: 'hospital-huntsville',
    content: 'Huntsville District Memorial Hospital: 12 minutes from Station 3, 20 minutes from Station 7. Trauma capable - can handle moderate trauma. Has CT scanner. Emergency department with 24/7 physician coverage. Helicopter pad available for transfers. Not a dedicated stroke center but can initiate tPA. Pediatric capability: basic stabilization.',
    metadata: { type: 'facility', category: 'hospitals', role: 'all' }
  },
  {
    id: 'hospital-bracebridge',
    content: 'South Muskoka Memorial Hospital (Bracebridge): 20 minutes from Station 7, 30 minutes from Station 1. Community hospital. Emergency department. No trauma designation. Limited surgical capability. No cardiac catheterization. Best for: low-acuity medical patients, stable injuries, minor emergencies.',
    metadata: { type: 'facility', category: 'hospitals', role: 'all' }
  },
  {
    id: 'hospital-barrie',
    content: 'Royal Victoria Regional Health Centre (Barrie RVH): 45 minutes from Station 3. Full trauma center. Cardiac catheterization lab (PCI capable). Stroke center with tPA and thrombectomy. Full surgical services. Pediatric department. ICU/CCU. Best for: STEMI, major trauma, stroke, pediatric emergencies, complex medical cases. Pre-notify for trauma activations.',
    metadata: { type: 'facility', category: 'hospitals', role: 'all' }
  },

  // SCENE SAFETY
  {
    id: 'scene-safety',
    content: 'Scene Safety Protocols: Always assess scene before entering. Hazards: traffic, fire, hazmat, violence, structural instability, electrical, water. If scene unsafe: stage and request appropriate resources (police, fire, hazmat). BSI/PPE before patient contact. Minimum: gloves and eye protection. Additional: gown, N95 for airborne precautions. Request police for: violent patients, weapons, domestic disputes, MVA with impairment suspected.',
    metadata: { type: 'protocol', category: 'safety', role: 'all' }
  },

  // TRAUMA
  {
    id: 'trauma-assessment',
    content: 'Trauma Assessment: Primary survey ABCDE - Airway with c-spine, Breathing, Circulation, Disability (neuro), Exposure. GCS scoring: Eye 1-4, Verbal 1-5, Motor 1-6 (total 3-15). Mechanism of injury assessment critical. High-risk mechanisms: fall greater than 6 meters, MVC greater than 60km/h, ejection, motorcycle crash, pedestrian struck. Secondary survey head-to-toe after primary issues managed.',
    metadata: { type: 'protocol', category: 'trauma', role: 'all' }
  }
];

module.exports = medicalKnowledge;
