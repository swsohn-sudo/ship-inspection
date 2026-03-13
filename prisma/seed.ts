import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// 22개 섹션 × 325개 항목 (Safety Inspection Checklist xlsx 기반)
// 형식: [itemNo, sectionNo, description, riskScore]
// ─────────────────────────────────────────────────────────────
const SECTIONS: { no: number; nameEn: string }[] = [
  { no: 1,  nameEn: 'Gangway' },
  { no: 2,  nameEn: 'Certificate and Etc.' },
  { no: 3,  nameEn: 'Document (Deck)' },
  { no: 4,  nameEn: 'Bridge' },
  { no: 5,  nameEn: 'Outside of Accommodation' },
  { no: 6,  nameEn: 'Galley' },
  { no: 7,  nameEn: 'Living Quarter' },
  { no: 8,  nameEn: 'Emergency Equipment' },
  { no: 9,  nameEn: 'Boat Deck' },
  { no: 10, nameEn: 'Main Deck' },
  { no: 11, nameEn: "F'cle Deck" },
  { no: 12, nameEn: 'BSN Store and Bow Room' },
  { no: 13, nameEn: 'Cargo Space' },
  { no: 14, nameEn: 'Poop Deck' },
  { no: 15, nameEn: 'S/G RM, Workshop, Store' },
  { no: 16, nameEn: 'Document (Engine, ECR)' },
  { no: 17, nameEn: 'Engine Room (General)' },
  { no: 18, nameEn: 'Engine Room (M/E)' },
  { no: 19, nameEn: 'Engine Room (G/E)' },
  { no: 20, nameEn: 'Engine Room (Aux Machinery)' },
  { no: 21, nameEn: 'Purifier Room' },
  { no: 22, nameEn: 'Engine Room (Floor)' },
];

// [itemNo, sectionNo, description, riskScore]
type ItemRow = [string, number, string, number];

const ITEMS: ItemRow[] = [
  // ── Section 1: Gangway ──────────────────────────────────────
  ['1.1',  1, 'Are there any defects on the gangway? (Step, Frame, Platform, Shaft, Supporting rod, Roller, Stanchion, Handrail)', 8],
  ['1.2',  1, 'Is there any defect in the wire for the gangway? (Twist, kink, deformation, dia. reduction, sheaves, greasing)', 6],
  ['1.3',  1, 'Operating condition of gangway (davit, motor, limit switch, remote controller, controller box, etc.)', 6],
  ['1.4',  1, 'Securing device for gangway (lashing socket, lashing hook, etc.)', 6],
  ['1.5',  1, 'Is gangway installed and safety net rigged properly?', 4],
  ['1.6',  1, 'Are security posts displayed near the gangway?', 1],
  ['1.7',  1, 'Is it keep cleaning condition near gangway?', 1],
  ['1.8',  1, 'Is the duty crew keep continuously gangway watch?', 4],
  ['1.9',  1, 'Is the duty crew carry out checking visitors according to the relevant procedures? (ID card check, visitor log, visitor badge)', 9],
  ['1.10', 1, 'Accurate record of visitor log (No. of bags, visitor pass number, etc.).', 6],

  // ── Section 2: Document (Certificate) ───────────────────────
  ['2.1',  2, 'Are all vessel certificates valid and kept/managed by the Master? (Validity, contents)', 12],
  ['2.2',  2, 'Are the personnel certificates signed by the possessor? (Medical certificate, Passport, License, etc)', 2],
  ['2.3',  2, 'Are all ship\'s documents/format up to date?', 8],
  ['2.4',  2, 'Check crew working hours/rest hours records as per MLC requirements. (Rest hour record, correction, sign)', 6],
  ['2.5',  2, 'Check Seafarer\'s Employment Agreement. (keep original held by crew and copy held by MSTR, keep previous contracts together)', 2],
  ['2.6',  2, 'Check Payslip. (providing monthly pay slip and confirming signature).', 2],
  ['2.7',  2, 'Are all relevant documents provided to all crew in accordance with MLC? (check payment of wages, seafarers\' employment agreement, payslip, etc.)', 4],
  ['2.8',  2, 'Are postings related to MLC onboard? (P&I MLC Certificate-Reg 2.5/4.2, MLC certificate, onboard complaint guide, seafarers complaint procedure)', 4],
  ['2.9',  2, 'Familiarization of onboard complaint handling procedures.', 2],
  ['2.10', 2, 'Familiarization of duty for each responsible person such as Safety officer, Safety Representative, Health Officer, etc.', 4],
  ['2.11', 2, 'Are certificates for wire (gangway, pilot ladder, crane, etc.) available and installation date be marked?', 4],
  ['2.12', 2, 'Check the implementation status of the official document. (Training, execution)', 6],
  ['2.13', 2, 'Are the Master, C/E, Senior Officer familiar with the Risk assessment and management?', 4],
  ['2.14', 2, 'Are the Master, C/E, Senior Officer familiar with and managing Non-conformity management (Non-conformity management log, etc.)?', 4],
  ['2.15', 2, 'Is the Stopping work and response training carried out with satisfaction in accordance with the procedure?', 3],
  ['2.16', 2, 'Is the ship\'s crew familiar with the security patrol, duties, security level, threatening security?', 2],
  ['2.17', 2, 'ISPS drill and exercise', 4],

  // ── Section 3: Document (Deck) ──────────────────────────────
  ['3.1',  3, 'Is the latest PSC inspection and internal/external audit free of NC or deficiencies or, if not, are the pending items properly addressed?', 8],
  ['3.2',  3, 'Is the document related ship security managed properly as per procedure? (SSP, SSA, SSR, Joint ship-shore security exercise)', 6],
  ['3.3',  3, 'Are training and education kept in record and executed according to the procedure?', 9],
  ['3.4',  3, 'Is the deck log book recorded essential entries without omitting them? (Drill records, drill details in the deck log book)', 6],
  ['3.5',  3, 'Is the new joiner\'s essential familiarization guidance provided and educated for the new joiner?', 6],
  ['3.6',  3, 'Is the Master\'s review including the company\'s reply carried out in accordance with the ISM code? (Circulation to all crew)', 2],
  ['3.7',  3, 'Are reefer CNTRs monitored according to the procedures and is this recorded? (monitoring log, loading checklist, photo, etc)', 6],
  ['3.8',  3, 'Is the DG/OOG cargo managed according to the procedures? (Segregation, document, DG/OOG list, loading checklist, etc)', 8],
  ['3.9',  3, 'Are the vessel\'s stability and cargo safety reviewed according to the procedures? (Check to have any irregular stowage or overloaded)', 8],
  ['3.10', 3, 'Is the lashing gear inspected periodically in accordance with CSM? (Check Inspection/Maintenance Record of cargo lashing equipment)', 9],
  ['3.11', 3, 'Is the ship\'s crew familiar with the procedure of cargo hold bilge handling?', 4],
  ['3.12', 3, 'Is the ship\'s crew familiar with the ballast water handling?', 9],
  ['3.13', 3, 'Ballast tank level gauge calibration (record, calibrating period, level gauge condition)', 6],
  ['3.14', 3, 'Condition of BWTS. (working condition, alarm, etc.)', 9],
  ['3.15', 3, 'Are the Ballast Water Record Book filled in properly and completely? (Accurate entries)', 9],
  ['3.16', 3, 'Are officers familiar with KINS program? (Input data on PMS/Repair/Stock/Tally, NC/CA report)', 6],
  ['3.17', 3, 'Are the Garbage record book filled in properly and completely? (Accurate entries, No discharge of food waste within the 12NM from land)', 6],
  ['3.18', 3, 'Circulation and management of Mooring system & line management plan. (Management of Hawser rope certificates, Hawser Rope strength test)', 6],
  ['3.19', 3, 'Work safety procedure as per company policy. (work permit, Risk Assessment, inspection/maintenance plan, TBM, MSTR & C/E\'s approval)', 9],
  ['3.20', 3, 'Are the works by subcontractors followed procedure? (work permit, safety checklist)', 9],
  ['3.21', 3, 'Record of LSA&FFA maintenance log.', 16],

  // ── Section 4: Bridge ───────────────────────────────────────
  ['4.1',  4, 'Is the passage plan performed correctly and from berth to berth? (check passage plan including UKC, position fixing on chart, checklist)', 12],
  ['4.2',  4, 'Are the chart and publication performed correction up to date? (Lights list, Tide table, Sailing direction, IAMSAR Manual, MARPOL ANNEX V)', 9],
  ['4.3',  4, 'Are indicators in good condition? (have correction or not)', 4],
  ['4.4',  4, 'Is the damage control plan readily available onboard?', 4],
  ['4.5',  4, 'Is the night order book recorded and standing orders posted? (Master\'s order, take over item between D/O)', 2],
  ['4.6',  4, 'Is magnetic compass inspected regularly? (check lighting, bubble, deviation table)', 6],
  ['4.7',  4, 'Is the compass error checked as per the company\'s procedure?', 4],
  ['4.8',  4, 'Is the GMDSS equipment inspected periodically and in an apparent operational condition? (check the record, actual test by radio officer)', 12],
  ['4.9',  4, 'Is the daylight signal operable by the battery? (check the portable battery, operation at both ship sides, at least 3 signals)', 2],
  ['4.10', 4, 'Are the fire alarm and detection system in operational condition? (no fault/isolation, emergency power, alarm in 2 min, etc.)', 12],
  ['4.11', 4, 'Is the public address system in an operational condition? (announcement can be heard in living area and E/R)', 2],
  ['4.12', 4, 'Is the navigation equipment in good working condition? (AIS, Echo sounder, VDR, Course recorder, etc)', 6],
  ['4.13', 4, 'Is the deck officer familiar with ECDIS? (check certificate & familiarization record, safety information in use, setting, etc.)', 6],
  ['4.14', 4, 'Is the ECDIS in operational condition? (operation test, version of ENC, operation under emergency power)', 3],
  ['4.15', 4, 'Is the deck officer familiar with the operation of navigation/radio equipment? (ask to officer how to operate, test, maintain)', 6],
  ['4.16', 4, 'Is the lighting system panel in operational condition? (Navigation light panel: alarm test, pilot lamp, by emergency power)', 4],
  ['4.17', 4, 'Is navigational light in a good condition? (Matt black paint, required angles, no damage, NUC)', 8],
  ['4.18', 4, 'Test of security equipment (SSAS)', 2],
  ['4.19', 4, 'Is the fire door with the self-closing device in good condition? (check working condition, deform/hole, no holding back)', 6],
  ['4.20', 4, 'Is relevant equipment for lifesaving on the bridge in good condition? (immersion suit: zipper, sewing parts, type and size, TPA, etc.)', 9],
  ['4.21', 4, 'Condition of window wiper.', 4],
  ['4.22', 4, 'Arrangement and cleanliness of Nav. Equip locker.', 2],

  // ── Section 5: Outside of Accommodation ────────────────────
  ['5.1',  5, 'Is relevant equipment for lifesaving and search light on the wing bridge in good condition? (MOB: quick release, expiration date, light, etc.)', 9],
  ['5.2',  5, 'Condition of Flag. (flag status, flag hanging rope, etc).', 2],
  ['5.3',  5, 'Condition of Radar mast, Signal light tree post, air horn on top bridge.', 9],
  ['5.4',  5, 'Condition of each antenna and post.', 6],
  ['5.5',  5, 'Are the vessel\'s Garbage management procedures followed properly? (use a non-flammable garbage can, condition of garbage can, etc.)', 12],
  ['5.6',  5, 'Is the weather-tight door in good condition? (check packing, deform)', 12],
  ['5.7',  5, 'Is the restricted area controlled in accordance with the ship security plan? (warning notice, seal, locking condition, etc.)', 6],
  ['5.8',  5, 'Is relevant equipment for fire fighting in good condition? (fire box, fire hose/hydrant leakage, international shore connection, CO2 extinguisher, etc.)', 12],
  ['5.9',  5, 'Is there any obstructed object to use of FFE & LSA?', 4],
  ['5.10', 5, 'Is isolating valve in good condition? (moving, marking)', 12],
  ['5.11', 5, 'Are the pneumatic & electric working tools in good condition?', 2],
  ['5.12', 5, 'Is the provision/monorail crane in good condition? (wire condition, sheave, cargo block, limit switch, body structure, operation)', 12],
  ['5.13', 5, 'Condition of F.O hose Davit. (sheave, wire, hook, safety latch, limit switch)', 6],
  ['5.14', 5, 'Are emergency lights operable?', 4],
  ['5.15', 5, 'Condition of handrail, stairway step, vertical ladder.', 4],
  ['5.16', 5, 'Condition of bunker station. (Bunker transfer procedure drawing, pipe, manifold, oil coaming, emergency stop box, flange covers, spill kit)', 12],
  ['5.17', 5, 'Are safety symbols and marking clear and legible? (IMO symbol, S.W.L, open/close marking, etc)', 6],
  ['5.18', 5, 'Condition of floor, wall, drain pipe, etc.', 4],
  ['5.19', 5, 'Condition of Oxygen & acetylene store. (symbol, obstacles, etc.)', 4],

  // ── Section 6: Galley ───────────────────────────────────────
  ['6.1',  6, 'Is the galley and mess room in a clean and hygienic condition? (provision: condition of storage)', 6],
  ['6.2',  6, 'Conformance of expiry date marked at foodstuff.', 6],
  ['6.3',  6, 'Should wear uniform including sanitary suit and hat cleanly.', 1],
  ['6.4',  6, 'Check storage condition (Separate vegetable, meat, fish, etc., Separation from the floor, Arrangement of storage).', 4],
  ['6.5',  6, 'Condition of meat and vegetable room (temperature, cooling fan, controlling frost, etc.)', 4],
  ['6.6',  6, 'Condition of drinking water dispenser. (record of inspection tag)', 1],
  ['6.7',  6, 'Management of waste (covering and sealing, stink, cleanliness near waste storage bin, flies or any bugs, etc.)', 6],
  ['6.8',  6, 'Is the fire door with the self-closing device in good condition? (check working condition, deform/hole, no holding back)', 9],
  ['6.9',  6, 'Is relevant equipment for fire fighting in good condition? (portable extinguisher, galley fire extinguishing system)', 6],

  // ── Section 7: Living Quarter ────────────────────────────────
  ['7.1',  7, 'Does crew living area comply with MLC? (adequate artificial light, hot & cold water, suitable & sufficient toilet provision, noise level, etc.)', 2],
  ['7.2',  7, 'Is the fire alarm system operating without any fault? (detector test, audible/visible alarm, MCP)', 6],
  ['7.3',  7, 'Is the fire door with the self-closing device in good condition? (check working condition, deform/hole, no holding back)', 6],
  ['7.4',  7, 'Are watch keeping schedule, Muster list and appointment posted in prominent places?', 2],
  ['7.5',  7, 'Is the SOLAS training manual in the mess room, recreation room up to date? (update when change equipment)', 4],
  ['7.6',  7, 'Are the hospital and medicine/medical equipment in tidy, clean condition?', 4],
  ['7.7',  7, 'Management of AED. (Instruction, obstacle, etc.)', 1],
  ['7.8',  7, 'Are the fire integrity and installation of the compound in the cable duct in good condition?', 8],
  ['7.9',  7, 'Is relevant equipment for lifesaving in good condition? (life jacket, immersion suit, EEBD)', 6],
  ['7.10', 7, 'Is relevant equipment for fire fighting in good condition? (portable extinguisher)', 6],
  ['7.11', 7, 'Arrangement and cleanliness of locker (changing room, deck general store, cable trunk/duct).', 2],

  // ── Section 8: Emergency Equipment ──────────────────────────
  ['8.1',  8, 'Is the emergency generator worked in a good condition? (blackout test, ACB test, fuel quantity for 18 hours, all the start/stop buttons)', 16],
  ['8.2',  8, 'Does the crew familiar with operating procedures for the emergency generator?', 12],
  ['8.3',  8, 'Arrangement and management of Emergency G/E room. (light, louver vent, outlet pipe, quick closing V/V remote wire, telephone)', 9],
  ['8.4',  8, 'Is an emergency fire pump possible for two jets more than 10 meters? (Starting several times if possible, instructing the crew, check suction V/V)', 12],
  ['8.5',  8, 'Is the battery for GMDSS charged? (recharging, connecting cable, explosion-proof lamp)', 4],
  ['8.6',  8, 'Arrangement of battery room. (insulation, PPE, marking, safety sign)', 4],
  ['8.7',  8, 'Condition of fixed CO2 extinguisher system (Bottle contents, hydro test date, hose condition, insulation, safety outlet, etc.)', 8],
  ['8.8',  8, 'Arrangement and management of CO2 room. (lighting, tools, etc.)', 4],
  ['8.9',  8, 'Condition of cargo hold smoke detector. (panel, hose, suction pipe, filter, etc)', 6],
  ['8.10', 8, 'Is the onboard crew familiar with how to operate fixed CO2 extinguisher system?', 8],
  ['8.11', 8, 'Are the F.C.S. and Safety Equipment Locker management well? (Emergency shut off system, Light, Recharging materials, FMO, SCBA, etc.)', 9],
  ['8.12', 8, 'Is the fireman\'s outfits in good condition? (Separate stowage, bottle pressurized date and contents, belongings, mask, etc.)', 9],
  ['8.13', 8, 'Are safety symbols and marking clear and legible? (IMO symbol, S.W.L, open/close marking, etc)', 4],

  // ── Section 9: Boat Deck ─────────────────────────────────────
  ['9.1',  9, 'Is the liferaft in good condition? (HRU, Weak link, any obstruction above)', 4],
  ['9.2',  9, 'Lifeboat condition? (hull condition, marking/painting, window, crack, insulation, door, rudder, propeller)', 12],
  ['9.3',  9, 'Lifeboat equipment. (bottom plug, magnetic compass, tiller, search/nav light, reflection tape, validity & qty, safety belts, etc.)', 9],
  ['9.4',  9, 'Is the lifeboat davit in operational/good condition? (check crack, hole, excessive corrosion, working condition, limit switch, etc.)', 12],
  ['9.5',  9, 'Are the lifeboat winch and fall wire in good condition? (renew date marking of fall wire, winch brake, length of remote release wire)', 8],
  ['9.6',  9, 'Is the lifeboat engine started without fail? (engine trial full ahead/astern 3min, F.O level, check battery and charger)', 12],
  ['9.7',  9, 'Is the lifeboat secured properly as per the manufacturer\'s guide? (hook condition, FPD, no gap between davit horn and block)', 9],
  ['9.8',  9, 'Is the lifeboat possible to lower according to the requirement of SOLAS? (drill test, remote lowering, brake, emergency release)', 8],
  ['9.9',  9, 'Does the crew familiar with the lifeboat engine trial and his duty in emergency response?', 8],
  ['9.10', 9, 'Are emergency lights operable? (check light condition, embarkation station, L/B, L/R instruction, light post, etc)', 8],
  ['9.11', 9, 'Condition of Muster list. (PIC of LSA & FFE)', 4],
  ['9.12', 9, 'Are safety symbols and marking clear and legible? (IMO symbol, S.W.L, open/close marking, etc)', 4],
  ['9.13', 9, 'Marking condition of muster station for abandon ship.', 6],
  ['9.14', 9, 'Is there any obstructed object to access route to survival craft?', 4],
  ['9.15', 9, 'Is fire fighting drill carried out with satisfaction in accordance with the regulation? (checkpoint: report, hose connection, check of fire pump, etc.)', 6],
  ['9.16', 9, 'Is the abandon ship drill carried out with satisfaction in accordance with the regulation? (checkpoint: launch of lifeboat, etc.)', 6],
  ['9.17', 9, 'Is the enclosed space entry drill carried out with satisfaction in accordance with the regulation? (checkpoint: installation of gas detector, etc.)', 6],

  // ── Section 10: Main Deck ────────────────────────────────────
  ['10.1',  10, 'Are hull markings clear and legible? (Draft, Plimsoll, Load line, etc)', 6],
  ['10.2',  10, 'Is relevant equipment for lifesaving in good condition? (life ring, self-igniting light, marking, hanger, bracket, reflection tape, etc.)', 6],
  ['10.3',  10, 'Is relevant equipment for fire fighting in good condition? (Fire box, fire hose/hydrant leakage, nozzle, safety plan stowed, etc.)', 9],
  ['10.4',  10, 'Are the fire main lines and hydrant free of leakage and in a good condition? (check leakage, corrosion, hole, valve moving condition)', 12],
  ['10.5',  10, 'Condition of deck F.W, Air pipe line, etc. (leakage, corrosion)', 6],
  ['10.6',  10, 'Condition of Hatch coaming (corrosion, damage, etc.)', 12],
  ['10.7',  10, 'Condition of F.O. & Ballast tank air vent. (floating ball, rubber packing, coaming corrosion/hole, coaming plug)', 16],
  ['10.8',  10, 'Are ventilators in a good condition? (closing device moving/corrosion)', 12],
  ['10.9',  10, 'Are there any defects on the Pilot ladder? (Step, Rope, stanchions, condition of rope, securing, etc.)', 9],
  ['10.10', 10, 'Are the connection parts between the pilot ladder & platform in good condition without corrosion?', 6],
  ['10.11', 10, 'Are wires without corrosion and sufficiently greased?', 8],
  ['10.12', 10, 'Are safety symbols and marking clear and legible? (IMO symbol, Safety placard, S.W.L, etc)', 4],
  ['10.13', 10, 'Are safety and health signs clear and legible? (e.g., Falling hazard, Wearing PPE and etc)', 4],
  ['10.14', 10, 'Marking condition of muster station. (paint condition, size, rank, etc)', 6],
  ['10.15', 10, 'Are emergency lights operable? (check light condition, embarkation station, L/R instruction, light post, receptacle)', 4],
  ['10.16', 10, 'Is the restricted area controlled in accordance with the ship security plan? (warning notice, seal, locking condition, etc.)', 4],
  ['10.17', 10, 'Is the deck machinery greased properly?', 4],
  ['10.18', 10, 'Is there any oil leakage trace on the passageway? (nonslip condition, any obstacle objects)', 4],
  ['10.19', 10, 'Is the paint store displayed in tidy condition and arrangement properly? (explosion-proof light, ventilator, MSDS, insulation, etc.)', 6],
  ['10.20', 10, 'Is fixed extinguishing equipment in the paint store inspected regularly? (Operating test)', 9],
  ['10.21', 10, 'Condition of deck scupper plug.', 4],
  ['10.22', 10, 'Condition of sounding pipe & cap', 9],

  // ── Section 11: F'cle Deck ───────────────────────────────────
  ['11.1',  11, 'Are mooring lines in good condition and secured properly? (Check mooring line condition: cut/wear/abrasion, Rat guard, mooring tension, etc.)', 8],
  ['11.2',  11, 'Condition of Windlass (check brake lining, gear box and cover, bed plate, foundation bolt & nuts, supporting bolt, gear cover, etc.)', 9],
  ['11.3',  11, 'Condition of Mooring Winch (check brake lining, gear box and cover, sight glass, bedplate, foundation bolt & nuts, supporting bolt, gear cover, etc.)', 9],
  ['11.4',  11, 'Is the deck machinery greased properly?', 4],
  ['11.5',  11, 'Are the fair leader, roller, bollard in good condition?', 6],
  ['11.6',  11, 'Are air pipe vent & heads in a good condition? (check floating ball/disc, rubber packing, coaming corrosion/hole)', 6],
  ['11.7',  11, 'Are ventilators in a good condition? (check closing device moving/corrosion, coaming corrosion, vent pipe, vent cover hole)', 6],
  ['11.8',  11, 'Are hydraulic lines free of leakage and in a good condition? (hyd line, L.O box oil coaming)', 6],
  ['11.9',  11, 'Are small hatches in good condition? (weathertight, closing device, corrosion/hole, packing)', 9],
  ['11.10', 11, 'Is relevant equipment for fire fighting in good condition? (Fire box, fire hose/hydrant leakage, nozzle, etc.)', 9],
  ['11.11', 11, 'Is relevant equipment for lifesaving in good condition? (Life ring, Self-igniting light)', 4],
  ['11.12', 11, 'Are working lights operable? (check light condition)', 4],
  ['11.13', 11, 'Are navigational lights in good condition? (required angle, damage)', 4],
  ['11.14', 11, 'Is the restricted area controlled in accordance with the ship security plan? (warning notice, seal, locking condition, etc.)', 4],
  ['11.15', 11, 'Are safety symbols and marking clear and legible? (IMO symbol, Safety placard, S.W.L, etc)', 4],
  ['11.16', 11, 'Condition of foremast, rigging wire (wire, eye, etc.)', 6],

  // ── Section 12: BSN Store and Bow Room ──────────────────────
  ['12.1',  12, 'Is the BSN store displayed in tidy condition and arrangement properly?', 4],
  ['12.2',  12, 'Check any corrosion, damage, leakage.', 4],
  ['12.3',  12, 'Are the anchor pipe and chain locker in good condition? (corrosion/hole, manhole open)', 4],
  ['12.4',  12, 'Is the dewatering (bilge) system in operable condition? (V/V condition, sensor, pipe, eductor)', 3],
  ['12.5',  12, 'Is relevant equipment for lifesaving in good condition? (life jacket, immersion suit, L/R launching light, Embarkation ladder)', 9],
  ['12.6',  12, 'Are gauges and indicators in good condition? (gauge, source lamp, etc)', 4],
  ['12.7',  12, 'Are emergency lights in operational condition?', 4],
  ['12.8',  12, 'Is the Water/weather-tight door in good condition? (check packing, deform, corrosion, damage, etc)', 9],
  ['12.9',  12, 'Is the manhole in good condition? (corrosion, missing bolts, marking, etc)', 6],
  ['12.10', 12, 'Is the restricted area controlled in accordance with the ship security plan? (warning notice, seal, locking condition, etc.)', 4],
  ['12.11', 12, 'Management of Emergency Towing Booklet.', 2],
  ['12.12', 12, 'Are safety symbols and marking clear and legible?', 4],
  ['12.13', 12, 'Is there any defect on lifting devices (chain block, lever puller, lifting tools), wire sling & rope sling? (Twist, Kink, Wear, Corrosion)', 2],

  // ── Section 13: Cargo Space ──────────────────────────────────
  ['13.1',  13, 'Are cargo hold and outfittings free of excessive corrosion? (check cell guide, corner plate, pipeline)', 8],
  ['13.2',  13, 'Is relevant equipment for fire fighting in good condition? (fire hose, hose connection with cargo hold, CO2 outlet, etc)', 6],
  ['13.3',  13, 'Is the hold ventilation arrangement in operational condition? (check fan, duct, H/C louver vent, etc)', 9],
  ['13.4',  13, 'Are the lashing platforms, gangboard in a good condition?', 12],
  ['13.5',  13, 'Is the container lashing equipment (twist lock, base lock, turn buckle, lashing bar, loose gear, etc.) apparently operational?', 9],
  ['13.6',  13, 'Are container foundations (socket), lashing eyes free of excessive corrosion and deform?', 12],
  ['13.7',  13, 'Are the hatch covers in good condition and have no excessive corrosion? (flexible or stool pad, deform, corrosion, check each panel)', 12],
  ['13.8',  13, 'Is the lashing performed properly and in accordance with the CSM? (Use correct lashing gear in right position, lashing pattern)', 6],
  ['13.9',  13, 'Are the lashing gear storage bin and flat rack in good condition?', 4],
  ['13.10', 13, 'Are small hatches in good condition? (weathertight, closing device, corrosion/hole, packing)', 9],
  ['13.11', 13, 'Is the restricted area controlled in accordance with the ship security plan? (warning notice, seal, locking condition, etc.)', 4],
  ['13.12', 13, 'Are cross deck lights operable? (check light condition)', 6],
  ['13.13', 13, 'Are there any defects on access hatch/gratings? (Hinge, hook, etc)', 9],
  ['13.14', 13, 'Condition of vertical ladder, stairway', 4],
  ['13.15', 13, 'Condition of handrail, safety guard rail, stanchion', 9],
  ['13.16', 13, 'Are safety symbols and marking clear and legible?', 4],
  ['13.17', 13, 'Is the dewatering (bilge) system in operable condition? (hold bilge sensor, bilge well, eductor, V/V, etc)', 3],
  ['13.18', 13, 'Condition of Reefer receptacle.', 4],

  // ── Section 14: Poop Deck ────────────────────────────────────
  ['14.1',  14, 'Are mooring lines in good condition and secured properly? (Check mooring line condition: cut/wear/abrasion, Rat guard, mooring tension, etc.)', 8],
  ['14.2',  14, 'Condition of Mooring Winch (check brake lining, gear box and cover, sight glass, bedplate, foundation bolt & nuts, supporting bolt, gear cover, etc.)', 9],
  ['14.3',  14, 'Is the deck machinery greased properly?', 4],
  ['14.4',  14, 'Are the fair leader, roller, bollard in good condition?', 4],
  ['14.5',  14, 'Are air pipe vent & heads in a good condition? (check floating ball/disc, rubber packing, coaming corrosion/hole)', 6],
  ['14.6',  14, 'Are ventilators in a good condition? (check closing device moving/corrosion, coaming corrosion, vent pipe, vent cover hole)', 9],
  ['14.7',  14, 'Are hydraulic lines free of leakage and in a good condition? (hyd line, L.O box oil coaming)', 6],
  ['14.8',  14, 'Are small hatches in good condition? (weathertight, closing device, corrosion/hole, packing)', 9],
  ['14.9',  14, 'Is relevant equipment for lifesaving in good condition? (Life ring, Self-igniting light)', 4],
  ['14.10', 14, 'Is relevant equipment for fire fighting in good condition?', 4],
  ['14.11', 14, 'Are working lights operable? (check light condition)', 4],
  ['14.12', 14, 'Are navigational lights in good condition? (required angle, damage)', 4],
  ['14.13', 14, 'Condition of flag post, flag and etc.', 2],
  ['14.14', 14, 'Is the restricted area controlled in accordance with the ship security plan? (warning notice, seal, locking condition, etc.)', 4],
  ['14.15', 14, 'Are safety symbols and marking clear and legible? (Propeller warning, etc)', 4],

  // ── Section 15: S/G RM, Workshop, Store ─────────────────────
  ['15.1',  15, 'Is the emergency steering system in an apparent operational condition? (check whether operating automatically in case of main steering gear failure)', 8],
  ['15.2',  15, 'Does the ship\'s crew familiar with emergency steering?', 8],
  ['15.3',  15, 'Condition of telephone in S/G room. (telephone, booth, head set, light)', 9],
  ['15.4',  15, 'Are objects in the S/G room properly arranged and tidied up?', 6],
  ['15.5',  15, 'Is relevant equipment for fire fighting in good condition? (Fire hose reel, fire hose/hydrant leakage, nozzle, spanner, etc.)', 4],
  ['15.6',  15, 'Is there any obstructed object to use of LSA & FFE?', 4],
  ['15.7',  15, 'Are the commercial dangerous goods managed according to the procedure? (MSDS, PPE, handling equipment)', 4],
  ['15.8',  15, 'Is the fire door with the self-closing device in good condition? (check working condition, deform, no holding back)', 12],
  ['15.9',  15, 'Check for Oil leakage of S/G and cleanliness condition', 9],
  ['15.10', 15, 'Is the Water/weather-tight door in good condition? (check packing, deform, corrosion, damage, etc)', 9],
  ['15.11', 15, 'Are the working tools in good condition? (pneumatic & electric working tools, electric welding cable, gas welder, grinding tools)', 4],
  ['15.12', 15, 'Is there any defect on lifting devices (chain block, lever puller, lifting tools), wire sling & rope sling? (Twist, Kink, Wear, Corrosion)', 6],
  ['15.13', 15, 'Are the vessel\'s Garbage management procedures followed properly? (use a non-flammable garbage can, condition of garbage can, etc.)', 6],
  ['15.14', 15, 'Management of spare parts. (arrangement, heavy item, securing, etc.)', 8],
  ['15.15', 15, 'Are emergency lights in operational condition?', 4],

  // ── Section 16: Document (Engine, ECR) ──────────────────────
  ['16.1',  16, 'Are officers familiar with KINS program? (Input data on PMS/Repair/Stock/Tally, NC/CA report)', 9],
  ['16.2',  16, 'Are bunkering procedures available and in use? (check the record of bunkering plan and result, BDN, engine log book)', 12],
  ['16.3',  16, 'Is the bunker change-over procedure/guidance followed? (crew\'s familiarity for fuel oil change over)', 6],
  ['16.4',  16, 'Is the NOx record filled in up to date? (NOx technical file, engine parameters, validity of EIAPP)', 12],
  ['16.5',  16, 'Check record keeping of EGCS. (SECP, ETM, OMM, EGCS record book)', 9],
  ['16.6',  16, 'Is the engine log book filled in properly and completely? (Working language, sewage discharge log, machine running hours)', 6],
  ['16.7',  16, 'Is the Ozone-depleting substances record filled in up to date?', 2],
  ['16.8',  16, 'Is the Oil record book filled in properly and completely? (Accurate entries, incinerated residue, bilge quantity, L.O supplement, etc.)', 12],
  ['16.9',  16, 'Management of SOPEP (list of national operational contact, pollution prevention material table, appointment of C/E, company)', 4],
  ['16.10', 16, 'Is the SEEMP present and properly documented? (EEOI, EPL seal record, CoC)', 6],
  ['16.11', 16, 'Are watch keeping schedule, Muster list and appointment posted in ECR', 4],
  ['16.12', 16, 'Work safety procedure as per company policy (work permit, Risk Assessment, inspection/maintenance plan, TBM, MSTR & C/E\'s approval)', 9],
  ['16.13', 16, 'Are the works by subcontractors followed procedure?', 12],
  ['16.14', 16, 'Is the safety and health management log properly recorded?', 2],
  ['16.15', 16, 'Is the engine control room tidy, clean condition?', 4],
  ['16.16', 16, 'Are emergency lights in operational condition?', 4],
  ['16.17', 16, 'Does the ship\'s crew familiar with to use of a gas detector? (familiarization, calibration)', 6],
  ['16.18', 16, 'Are the maintained equipment calibrated? (Megger tester, Gas detector and etc)', 9],
  ['16.19', 16, 'Check condition of display unit, pilot/source lamp, gauge in ECR.', 4],
  ['16.20', 16, 'Is the non-conductive mat installed at proper location?', 2],
  ['16.21', 16, 'Are alarms in good operating condition? (F.O leakage alarm, bilge well level alarm, etc)', 4],

  // ── Section 17: Engine Room (General) ───────────────────────
  ['17.1',  17, 'Does the ship\'s crew familiar with engine room machinery? (operation, maintenance, any relevant record)', 9],
  ['17.2',  17, 'Are the vessel\'s Garbage management procedures followed properly? (use a non-flammable garbage can, condition of garbage can, etc.)', 6],
  ['17.3',  17, 'Is relevant equipment for lifesaving in good condition? (life jacket, immersion suit, EEBD)', 6],
  ['17.4',  17, 'Is relevant equipment for fire fighting in good condition? (fire hose reel, fire hose/hydrant leakage, nozzle, spanner, portable extinguisher)', 9],
  ['17.5',  17, 'Is the fixed spray system in good operating condition? (Water mist system, motor & valve operation, self inspection record)', 12],
  ['17.6',  17, 'Is the fire detector in operational condition? (Detector test, Audible/visible alarm)', 8],
  ['17.7',  17, 'Check Signal light column.', 9],
  ['17.8',  17, 'Is there any obstructed object to use of FFE & LSA?', 4],
  ['17.9',  17, 'Are gauges and indicators in good condition?', 8],
  ['17.10', 17, 'Is the fire door with the self-closing device in good condition? (check working condition, deform, no holding back)', 8],
  ['17.11', 17, 'Is insulation of DC24, AC220, 440V in the normal range?', 12],
  ['17.12', 17, 'Is personal protective equipment being used?', 8],
  ['17.13', 17, 'Is there any oil leakage trace or obstacle objects on the passageway?', 4],
  ['17.14', 17, 'Are safety symbols and marking clear and legible?', 4],
  ['17.15', 17, 'Is there any oil leakage in engine room and all necessary action has been done?', 16],
  ['17.16', 17, 'Condition of engine room hatch and skylight hatch. (corrosion, nuts, etc)', 6],
  ['17.17', 17, 'Arrangement of Aircon. room.', 4],
  ['17.18', 17, 'Condition of gauge and indicator in Aircon room', 4],
  ['17.19', 17, 'Arrangement of SOPEP store. (oil spill response items)', 4],
  ['17.20', 17, 'Arrangement of 2nd passage (void space).', 4],
  ['17.21', 17, 'Are emergency lights in operational condition?', 4],
  ['17.22', 17, 'Is the water-tight door of 2nd passage in good condition? (check packing, deform)', 6],
  ['17.23', 17, 'Check condition and management of MGPS, ICCP relating biofouling.', 4],
  ['17.24', 17, 'Check condition of pressure switch, transmitter and etc.', 4],
  ['17.25', 17, 'Check condition of weather-tight door (packing, deform)', 4],
  ['17.26', 17, 'Check condition of safety equipment (cover, protector, etc.)', 6],
  ['17.27', 17, 'Is the engine room funnel damper and ventilator able to fully close? (Ventilator/Funnel damper\'s closing condition, Manual closing)', 12],

  // ── Section 18: Engine Room (M/E) ───────────────────────────
  ['18.1',  18, 'Arrangement of Engine room near M/E. (oil trace, leakage, etc)', 6],
  ['18.2',  18, 'Is the insulation in place around hot surfaces and is the insulation in good condition? (No breakaway/omission, high-temperature pipe)', 6],
  ['18.3',  18, 'Are pipe lines in good condition? (check oil/water leak, F.O line, cooling line, etc.)', 9],
  ['18.4',  18, 'Are gauges and indicators in good condition? (local engine control station)', 6],
  ['18.5',  18, 'Condition of telephone in local engine control station.', 6],
  ['18.6',  18, 'Condition of E/R crane. (platform, wire, sheave, controller, hook, etc.)', 6],
  ['18.7',  18, 'Is the quick closing/shut-off valve in good operational condition? (working condition, air pressure, any prevent operation)', 6],
  ['18.8',  18, 'Are alarms in good operating condition? (F.O leakage alarm, M/E oil mist alarm, OMD high density, etc)', 6],

  // ── Section 19: Engine Room (G/E) ───────────────────────────
  ['19.1',  19, 'Arrangement of Engine room near G/E. (oil trace, leakage, etc)', 6],
  ['19.2',  19, 'Is the insulation in place around hot surfaces and is the insulation in good condition? (No breakaway/omission, high-temperature pipe)', 8],
  ['19.3',  19, 'Are pipe lines in good condition? (check oil/water leak)', 9],
  ['19.4',  19, 'Are gauges and indicators in good condition?', 6],
  ['19.5',  19, 'Is the generator engine quick closing valve remotely operable?', 3],

  // ── Section 20: Engine Room (Aux Machinery) ─────────────────
  ['20.1',  20, 'Is the insulation in place around hot surfaces and is the insulation in good condition? (No breakaway/omission, high-temperature pipe)', 8],
  ['20.2',  20, 'Is the non-conductive mat installed at proper location?', 4],
  ['20.3',  20, 'Is the boiler in an apparent operational condition? (boiler safety test — LL water level trip, flame fail, etc.)', 2],
  ['20.4',  20, 'Are pipe lines in good condition? (check oil/water leak, expansion joint, steam pipe, etc)', 9],
  ['20.5',  20, 'Are gauges and indicators in good condition?', 6],
  ['20.6',  20, 'Condition of incinerator. (operating condition, drain V/V, emergency stop, alarm, ash, etc.)', 3],
  ['20.7',  20, 'Check each pump condition.', 6],
  ['20.8',  20, 'Check condition of each valve.', 6],
  ['20.9',  20, 'Check condition of EGCS (corrosion, malfunction, etc.)', 6],
  ['20.10', 20, 'Is oil filtering equipment in good operational condition? (15 ppm alarm, auto-stop, outlet pipe inside cleaning, filter)', 8],
  ['20.11', 20, 'Is sewage treatment equipment in good operational condition? (level alarm, pump operation, crew\'s familiarity with operating procedure)', 12],
  ['20.12', 20, 'Check condition of BWTS. (operating condition, management of ANU chemical, etc.)', 8],

  // ── Section 21: Purifier Room ────────────────────────────────
  ['21.1',  21, 'Arrangement of Purifier room. (oil trace, leakage, coaming, etc)', 9],
  ['21.2',  21, 'Is the insulation in place around hot surfaces and is the insulation in good condition? (No breakaway/omission, high-temperature pipe)', 6],
  ['21.3',  21, 'Is the fire door with the self-closing device in good condition? (check working condition, deform, no holding back)', 9],
  ['21.4',  21, 'Are pipe lines in good condition? (check oil/water leak)', 9],
  ['21.5',  21, 'Are gauges and indicators in good condition?', 6],

  // ── Section 22: Engine Room (Floor) ─────────────────────────
  ['22.1',  22, 'Arrangement of Engine room floor (oil trace, leakage, corrosion, damage, etc)', 6],
  ['22.2',  22, 'Are pipe lines in good condition? (check oil/water leak)', 9],
  ['22.3',  22, 'Are gauges and indicators in good condition?', 6],
  ['22.4',  22, 'Is bilge quantity in engine room floor not excessive? (oil/water leakage of main/aux. machinery, no residual and oily rags)', 9],
  ['22.5',  22, 'Is there any dirty deposit or oil in the pipeline for discharging oily bilge?', 9],
  ['22.6',  22, 'Check condition of E/R bilge well oil, V/V, bilge pump and etc.', 12],
  ['22.7',  22, 'Is the emergency escape trunk in good condition? (Insulation condition, self-closing fire door, emergency light, the minimum clearance)', 8],
  ['22.8',  22, 'Have all oil sounding caps been closed? (check self-closing device, sounding pipe, cap condition)', 8],
];

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. 섹션 생성 ──
  console.log('  Creating 22 sections...');
  const sectionMap = new Map<number, string>(); // no → id

  for (const [idx, sec] of SECTIONS.entries()) {
    const section = await prisma.section.upsert({
      where: { no: sec.no },
      create: { no: sec.no, nameEn: sec.nameEn, order: idx + 1 },
      update: { nameEn: sec.nameEn, order: idx + 1 },
    });
    sectionMap.set(sec.no, section.id);
  }

  // ── 2. 항목 생성 ──
  console.log(`  Creating ${ITEMS.length} check items...`);
  let created = 0;
  let updated = 0;

  for (const [order, [itemNo, sectionNo, description, riskScore]] of ITEMS.entries()) {
    const sectionId = sectionMap.get(sectionNo);
    if (!sectionId) {
      console.warn(`  ⚠ Section ${sectionNo} not found for item ${itemNo}`);
      continue;
    }

    const existing = await prisma.checkItem.findUnique({
      where: { sectionId_itemNo: { sectionId, itemNo } },
    });

    if (existing) {
      await prisma.checkItem.update({
        where: { id: existing.id },
        data: { description, riskScore, order: order + 1 },
      });
      updated++;
    } else {
      await prisma.checkItem.create({
        data: { itemNo, sectionId, description, riskScore, order: order + 1 },
      });
      created++;
    }
  }

  console.log(`✅ Seed complete: ${created} created, ${updated} updated`);
  console.log(`   Sections: ${SECTIONS.length} | Items: ${ITEMS.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
