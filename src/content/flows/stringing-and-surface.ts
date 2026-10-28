import type { DiagnosticFlowInput } from "@/lib/schema";
import { seedVerification } from "../shared";
import { materialQuestion, withNext } from "./common-questions";

type NextInput = DiagnosticFlowInput["questions"][number]["options"][number]["next"];

/** After the temperature question: zits are done, surface problems check flow, strings check retraction. */
const afterTemp: NextInput = {
  branch: [
    { when: { answer: "look", in: ["zits"] }, goto: "result" },
    { when: { answer: "look", in: ["blobs-everywhere", "rough-fuzzy"] }, goto: "flow-change" },
  ],
  otherwise: "retraction",
};

export const stringingAndSurface: DiagnosticFlowInput = {
  id: "stringing-and-surface",
  version: 2,
  title: "Stringing, blobs and surface quality",
  summary: "Separates wet filament, temperature, retraction, travel, seam and flow problems behind stringing, zits and rough surfaces.",
  category: "stringing-and-surface-quality",
  symptomSlugs: ["over-extrusion", "stringing", "blobs-and-zits", "bubbling-or-rough-surface"],
  start: "look",
  questions: [
    {
      id: "look",
      prompt: "What does the problem look like?",
      why: "Strings, zits and rough walls each have a different most-common cause.",
      options: [
        { id: "fine-strings", image: "ill-stringing", label: "Fine hairs or wisps between separate parts", next: "popping", evidence: { retraction: 2, "too-hot": 2, "wet-filament": 1, travel: 1 } },
        { id: "thick-strings", image: "ill-opt-thick-strings", label: "Thicker strands or drips", next: "popping", evidence: { retraction: 3, "too-hot": 2 } },
        { id: "zits", image: "ill-blobs-and-zits", label: "Small bumps or zits on the surface", next: "zit-where", evidence: { seam: 3, "over-extrusion": 1 } },
        { id: "rough-fuzzy", image: "ill-bubbling-or-rough-surface", label: "Rough, fuzzy or bubbly walls", next: "popping", evidence: { "wet-filament": 3, "over-extrusion": 1 } },
        { id: "blobs-everywhere", image: "ill-over-extrusion", label: "Excess plastic and blobs all over the part", next: "popping", evidence: { "over-extrusion": 3 } },
      ],
    },
    {
      id: "zit-where",
      prompt: "Where are the zits?",
      why: "Zits lined up in one place come from where each layer starts. Zits elsewhere come from pressure changes or moisture.",
      options: [
        { id: "seam-line", label: "In a vertical line where each layer starts", next: "popping", evidence: { seam: 3 } },
        { id: "corners", label: "On corners and edges", next: "popping", evidence: { "pressure-control": 3, seam: 1 } },
        { id: "scattered", label: "Scattered all over the surface", next: "popping", evidence: { "wet-filament": 2, retraction: 1, seam: -1 } },
      ],
    },
    {
      id: "popping",
      prompt: "While it prints, do you hear popping or crackling, or see steam from the nozzle?",
      why: "Water in the filament boils in the hotend. It is one of the most common causes of stringing and rough walls, and no setting will fix it.",
      options: [
        { id: "yes", label: "Yes", next: "material", evidence: { "wet-filament": 5 } },
        { id: "no", label: "No", next: "material", evidence: { "wet-filament": -1 } },
        { id: "unsure", label: "I'm not sure", next: "material", uncertain: true },
      ],
    },
    withNext(materialQuestion, "nozzle-temp"),
    {
      id: "nozzle-temp",
      prompt: "Where is your nozzle temperature compared with the filament's recommended range?",
      why: "Hotter plastic is runnier and oozes more while the nozzle travels.",
      help: "The recommended range is printed on the spool label or the manufacturer's data sheet.",
      options: [
        { id: "top", label: "At the top of the range, or above it", next: afterTemp, evidence: { "too-hot": 3 } },
        { id: "middle", label: "In the middle", next: afterTemp, evidence: { "too-hot": -1 } },
        { id: "low", label: "At the low end", next: afterTemp, evidence: { "too-hot": -2 } },
        { id: "unsure", label: "I don't know", next: afterTemp, uncertain: true },
      ],
    },
    {
      id: "retraction",
      prompt: "Have you changed the retraction settings from the printer's standard slicer profile?",
      why: "Retraction suited to one printer rarely suits another. Direct-drive and Bowden extruders need very different values.",
      options: [
        { id: "stock", label: "No, I use the manufacturer's profile", next: "extruder-type", evidence: { retraction: -1, travel: 1 } },
        { id: "reduced", label: "Yes, I reduced or turned off retraction", next: "extruder-type", evidence: { retraction: 3 } },
        { id: "custom", label: "I use a custom or downloaded profile", next: "extruder-type", evidence: { retraction: 2, travel: 1 } },
        { id: "unsure", label: "I'm not sure", next: "extruder-type", evidence: { retraction: 1 }, uncertain: true },
      ],
    },
    {
      id: "extruder-type",
      prompt: "Is the extruder on the print head, or does a tube carry filament to it?",
      why: "Bowden printers need longer retraction because the filament can compress in the tube.",
      autoAnswer: { fact: "printer.extruder", map: { direct: "direct", bowden: "bowden" } },
      options: [
        { id: "direct", label: "On the print head (direct drive)", next: "result", facts: { "printer.extruder": "direct" } },
        { id: "bowden", label: "A tube carries filament from the frame (Bowden)", next: "result", facts: { "printer.extruder": "bowden" } },
        { id: "unsure", label: "I'm not sure", next: "result", uncertain: true },
      ],
    },
    {
      id: "flow-change",
      prompt: "Have you changed the flow rate, or started a new brand or spool of filament?",
      why: "Filament diameter and flow vary between brands. A small excess of plastic shows up as blobs and rough walls.",
      options: [
        { id: "flow-raised", label: "I raised the flow, or changed profile", next: "result", evidence: { "over-extrusion": 3 } },
        { id: "new-filament", label: "New brand or spool", next: "result", evidence: { "over-extrusion": 2, "wet-filament": 1 } },
        { id: "no", label: "No changes", next: "result", evidence: { "over-extrusion": -1 } },
      ],
    },
  ],
  rules: [
    {
      id: "bowden-retraction",
      when: { all: [{ fact: "printer.extruder", in: ["bowden"] }, { answer: "retraction", in: ["reduced", "custom"] }] },
      evidence: { retraction: 1 },
      reason: "Bowden printers need longer retraction than direct-drive printers, so reduced or borrowed settings often string.",
    },
    {
      id: "hygroscopic-material",
      when: { all: [{ fact: "filament", in: ["petg", "tpu", "nylon-pc"] }, { answer: "look", in: ["fine-strings", "thick-strings", "rough-fuzzy"] }] },
      evidence: { "wet-filament": 1 },
      reason: "PETG, TPU, nylon and PC absorb moisture quickly, which makes stringing and rough walls more likely.",
    },
  ],
  outcomes: [
    {
      id: "wet-filament",
      title: "The filament has absorbed moisture",
      summary: "Water in the filament boils in the nozzle, causing strings, bubbles and rough walls.",
      explanation: "Most filaments absorb water from the air. In the hotend the water turns to steam, which makes popping sounds, bubbles, a fuzzy or rough surface and extra stringing. PETG, TPU, nylon and PC are especially prone, but PLA is affected too.",
      checks: [
        "Dry the filament at the temperature its manufacturer recommends.",
        "Store spools sealed with desiccant between prints.",
        "Compare with a freshly opened spool if you have one.",
      ],
      guideSlugs: ["dry-filament"],
    },
    {
      id: "too-hot",
      title: "The nozzle is hotter than this filament needs",
      summary: "Runny plastic oozes from the nozzle during travel moves.",
      explanation: "Printing at the top of a material's range improves layer bonding but makes the plastic runnier, so it drips during travel moves. It is a common cause of stringing with PETG.",
      checks: [
        "Lower the nozzle temperature in 5 °C steps, staying within the filament's range.",
        "Print a temperature tower to find the lowest temperature that still bonds well.",
      ],
    },
    {
      id: "retraction",
      slicerSettings: ["retraction", "wipe"],
      title: "Retraction is not set right for this printer",
      summary: "Too little retraction leaves pressure in the nozzle during travel moves.",
      explanation: "Retraction pulls filament back slightly before a travel move to relieve pressure in the nozzle. Too little leaves plastic oozing out. Too much can cause jams. Direct-drive printers usually need much shorter retraction than Bowden printers, so settings copied from one type rarely suit the other.",
      checks: [
        "Start from the printer manufacturer's slicer profile.",
        "Print a retraction test and change the distance in small steps.",
        "Change one setting at a time so you can see what helped.",
      ],
      guideSlugs: ["tune-retraction"],
    },
    {
      id: "travel",
      slicerSettings: ["avoid-crossing"],
      title: "Travel moves cross open space",
      summary: "The nozzle crosses gaps where it could stay inside the part.",
      explanation: "Even with good retraction, a little plastic can leave the nozzle when it crosses open space. Slicer options that keep travel moves inside the part, faster travel and wiping before travel all reduce it.",
      checks: [
        "Turn on the slicer option that avoids crossing outer walls during travel.",
        "Increase travel speed if your printer's profile allows it.",
        "Enable wipe on retraction, if your slicer has it.",
      ],
      guideSlugs: ["tune-retraction"],
    },
    {
      id: "seam",
      slicerSettings: ["seam", "wipe"],
      title: "Zits are forming at the layer seam",
      summary: "Each layer starts and ends in the same place, leaving a small bump.",
      explanation: "Every perimeter has a start and end point. A small excess of plastic is left there, and when the points line up they form a visible seam of zits.",
      checks: [
        "Move the seam to the rear or to the sharpest corner in the slicer.",
        "Try your slicer's seam smoothing options, such as wipe or scarf seams, if available.",
        "Check pressure or linear advance is calibrated if your firmware supports it.",
      ],
    },
    {
      id: "pressure-control",
      slicerSettings: ["pressure-advance"],
      title: "Nozzle pressure is not managed at corners",
      summary: "Pressure builds at corners and edges where the print head slows down.",
      explanation: "When the print head slows for a corner, pressure left in the nozzle pushes out extra plastic. Firmware features such as Klipper's pressure advance and Marlin's linear advance compensate for this once they are calibrated.",
      checks: [
        "Check whether your firmware supports pressure or linear advance, and calibrate it with the recommended test.",
        "Use the manufacturer's calibration routine if the printer has one built in.",
      ],
    },
    {
      id: "over-extrusion",
      slicerSettings: ["flow"],
      title: "Too much plastic is being extruded",
      summary: "Excess plastic makes blobs and rough, ridged walls.",
      explanation: "A flow rate set too high, a filament thicker than its nominal diameter, or a profile meant for a different filament puts out slightly more plastic than the part needs. The excess shows as blobs, rough top surfaces and walls that are too thick.",
      checks: [
        "Return the flow rate to the profile default and test again.",
        "Measure the filament diameter in several places with calipers.",
        "Run your slicer's flow calibration test.",
      ],
    },
  ],
  insufficient: {
    title: "We need to narrow it down",
    explanation: "Several causes fit equally well. Two quick tests separate them.",
    checks: [
      "Dry the filament, or try a freshly opened spool, and print the same part again.",
      "Print a temperature tower to see how stringing changes with temperature.",
    ],
  },
  sourceIds: ["editorial", "klipper-config", "marlin-docs"],
  verification: seedVerification(),
};
