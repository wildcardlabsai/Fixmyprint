import type { DiagnosticFlowInput } from "@/lib/schema";
import { seedVerification } from "../shared";
import { levelling, materialQuestion } from "./common-questions";

export const warpingAndDimensions: DiagnosticFlowInput = {
  id: "warping-and-dimensions",
  version: 2,
  title: "Warping, cracking and dimensional problems",
  summary: "Separates shrinkage, drafts, adhesion, first layer squish, cooling and calibration problems that change the shape or size of a print.",
  category: "warping-and-dimensions",
  symptomSlugs: ["warping", "elephants-foot", "layer-separation", "wrong-dimensions"],
  start: "seeing",
  questions: [
    {
      id: "seeing",
      prompt: "What are you seeing?",
      why: "Lifting, flaring, cracking and size errors have different causes, so we start by separating them.",
      options: [
        { id: "corners-lift", image: "ill-warping", label: "Corners or edges curl up from the bed", next: "lift-look", evidence: { contraction: 3, adhesion: 2 } },
        { id: "elephant-foot", image: "ill-elephants-foot", label: "The bottom layers flare out wider than the rest", next: "first-layer-look", evidence: { "first-layer-squish": 3, "bed-too-hot": 2 } },
        { id: "cracks", image: "ill-layer-separation", label: "Cracks or splits between layers", next: "material", evidence: { "cold-layers": 3, contraction: 2 } },
        { id: "wrong-size", image: "ill-wrong-dimensions", label: "Parts come out the wrong size", next: "size-pattern", evidence: {} },
      ],
    },
    {
      id: "lift-look",
      prompt: "Which picture looks most like your print?",
      why: "Where the lifting happens points to the cause. Every corner lifting evenly is the part shrinking; one side only suggests a draft or an uneven first layer on that side.",
      help: "Look at the part from the side, at eye level with the bed. A corner that has lifted shows a gap you can slide paper under.",
      options: [
        { id: "all-corners", image: "ill-opt-warp-all-corners", label: "Every corner lifts by about the same amount", next: "lift-when", evidence: { contraction: 2 } },
        { id: "one-side", image: "ill-opt-warp-one-side", label: "Only one side or one corner lifts", next: "lift-when", evidence: { drafts: 2, adhesion: 1 } },
        { id: "long-edges", image: "ill-opt-warp-long-edges", label: "The long edges bow up in the middle", next: "lift-when", evidence: { contraction: 2 } },
        { id: "slight", image: "ill-opt-warp-flat", label: "It looks almost flat; the lift is very slight", next: "lift-when", evidence: { adhesion: 1 } },
      ],
    },
    {
      id: "lift-when",
      prompt: "When does the lifting start?",
      why: "Lifting in the first few layers means the first layer is not holding. Lifting later means the part is pulling itself up as it cools.",
      options: [
        { id: "early", label: "Within the first few layers", next: "surface", evidence: { adhesion: 3 } },
        { id: "later", label: "Later, as the part gets taller", next: "surface", evidence: { contraction: 2, drafts: 1 } },
        { id: "unsure", label: "I'm not sure", next: "surface", uncertain: true },
      ],
    },
    {
      id: "surface",
      prompt: "What is the build plate's surface?",
      why: "Some surface and material pairs hold better than others, and glass in particular needs to be very clean to hold.",
      autoAnswer: { fact: "printer.bedSurface", map: { "smooth-pei": "smooth-pei", "textured-pei": "textured-pei", glass: "glass" } },
      options: [
        { id: "smooth-pei", label: "Smooth PEI", next: "material" },
        { id: "textured-pei", label: "Textured PEI", next: "material" },
        { id: "glass", label: "Glass", next: "material", evidence: { adhesion: 1 } },
        { id: "other", label: "Something else, or I'm not sure", next: "material", uncertain: true },
      ],
    },
    {
      ...materialQuestion,
      options: materialQuestion.options.map((o) => ({
        ...o,
        next: { branch: [{ when: { answer: "seeing", in: ["cracks"] }, goto: "cooling" }], otherwise: "environment" },
      })),
    },
    {
      id: "environment",
      prompt: "Where is the printer, and is it enclosed?",
      why: "Moving air and a cold room cool the part unevenly, which pulls corners up.",
      autoAnswer: { fact: "printer.enclosure", map: { enclosed: "enclosed" } },
      options: [
        { id: "enclosed", label: "Inside an enclosure with the doors closed", next: "brim", evidence: { drafts: -2 } },
        { id: "open-still", label: "Open, in a room with still air", next: "brim", evidence: { contraction: 1 } },
        { id: "open-draft", label: "Open, near a window, fan, air conditioning or door", next: "brim", evidence: { drafts: 4 } },
      ],
    },
    {
      id: "brim",
      prompt: "How well does the first layer stick before the lifting starts?",
      why: "If the first layer never sticks properly, that has to be fixed first. If it sticks and then lifts, the part is shrinking.",
      options: [
        { id: "good-no-brim", label: "It sticks well, and I'm not using a brim", next: "result", evidence: { contraction: 2, adhesion: -1 } },
        { id: "good-with-brim", label: "It sticks well, and it still lifts with a brim", next: "result", evidence: { contraction: 2 } },
        { id: "poor", label: "It never sticks very well", next: "result", evidence: { adhesion: 4 } },
      ],
    },
    {
      id: "cooling",
      prompt: "How high is the part cooling fan for this material?",
      why: "Layers bond while they are hot. Strong cooling, especially on ABS, ASA, nylon and PC, can stop them fusing.",
      options: [
        { id: "high", label: "High, or 100%", next: "nozzle-temp", evidence: { "cold-layers": 3 } },
        { id: "low", label: "Low or off", next: "nozzle-temp", evidence: { "cold-layers": -1 } },
        { id: "unsure", label: "I'm not sure", next: "nozzle-temp", uncertain: true },
      ],
    },
    {
      id: "nozzle-temp",
      prompt: "Where is your nozzle temperature compared with the filament's recommended range?",
      why: "Plastic printed too cool does not fuse well with the layer below.",
      options: [
        { id: "low", label: "At the low end, or below", next: "result", evidence: { "cold-layers": 2 } },
        { id: "middle", label: "In the middle", next: "result" },
        { id: "high", label: "At the high end", next: "result", evidence: { "cold-layers": -1 } },
      ],
    },
    {
      id: "first-layer-look",
      prompt: "How does the first layer look on its own?",
      why: "Elephant's foot is usually the first layer being squashed too much, or the lower layers staying soft on a hot bed.",
      options: [
        { id: "very-squished", label: "Very flat and wide, almost see-through", next: "bed-hot", evidence: { "first-layer-squish": 3 } },
        { id: "normal", label: "Normal", next: "bed-hot", evidence: { "first-layer-squish": -1, "bed-too-hot": 1 } },
      ],
    },
    {
      id: "bed-hot",
      prompt: "Is the bed at the top of the material's range, or above it?",
      why: "A very hot bed keeps the bottom layers soft, and the weight of the part above squashes them outwards.",
      options: [
        { id: "yes", label: "Yes", next: "result", evidence: { "bed-too-hot": 3 } },
        { id: "no", label: "No", next: "result", evidence: { "bed-too-hot": -2 } },
        { id: "unsure", label: "I'm not sure", next: "result", uncertain: true },
      ],
    },
    {
      id: "size-pattern",
      prompt: "How is the size wrong?",
      why: "Holes printing small is normal for FDM and is handled in design. Errors on one axis point to mechanics.",
      help: "Measure a simple test cube with calipers, along X, Y and Z separately.",
      options: [
        { id: "holes-small", label: "Holes are too small, but outside dimensions are about right", next: "result", evidence: { "hole-shrink": 4 } },
        { id: "all-scaled", label: "Everything is too big or too small by a similar percentage", next: "result", evidence: { "material-shrink": 3, "axis-calibration": 1 } },
        { id: "one-axis", label: "Only one axis is wrong", next: "result", evidence: { "axis-calibration": 4 } },
        { id: "slightly-big", label: "Outside dimensions are slightly too big on every side", next: "result", evidence: { "over-extrusion": 3 } },
      ],
    },
  ],
  rules: [
    {
      id: "shrinking-material-open",
      when: {
        all: [
          { fact: "filament", in: ["abs-asa", "nylon-pc"] },
          { any: [{ fact: "printer.enclosure", in: ["open"] }, { answer: "environment", in: ["open-still", "open-draft"] }] },
        ],
      },
      evidence: { contraction: 2 },
      reason: "ABS, ASA, nylon and PC shrink a lot as they cool; without an enclosure, warping is expected.",
    },
    {
      id: "shrinking-material-cracks",
      when: { all: [{ fact: "filament", in: ["abs-asa", "nylon-pc"] }, { answer: "seeing", in: ["cracks"] }] },
      evidence: { "cold-layers": 1, contraction: 1 },
      reason: "These materials need warm surroundings to keep layers bonding; cracking on tall parts is common without an enclosure.",
    },
  ],
  outcomes: [
    {
      id: "contraction",
      slicerSettings: ["brim"],
      title: "The part is shrinking as it cools",
      summary: "Cooling plastic contracts and pulls corners and edges up.",
      explanation: "Each layer shrinks a little as it cools. The stress builds as the part gets taller and is strongest at corners and along long straight edges. ABS, ASA, nylon and PC shrink much more than PLA or PETG.",
      checks: [
        "Add a 5–10 mm brim.",
        "Reduce part cooling, especially for the first layers.",
        "Use an enclosure for ABS, ASA, nylon and PC.",
        "Round off sharp corners in the design where possible.",
      ],
      guideSlugs: ["reduce-warping"],
    },
    {
      id: "drafts",
      title: "Drafts are cooling one side of the print",
      summary: "Moving air makes one side contract before the other.",
      explanation: "Air from a window, fan or air conditioning unit cools the side of the part it reaches first, so that side shrinks first and lifts.",
      checks: ["Move the printer away from the air source or shield it.", "Use an enclosure or cover."],
      guideSlugs: ["reduce-warping"],
    },
    {
      id: "adhesion",
      slicerSettings: ["brim", "first-layer-speed"],
      title: "The first layer is not bonding well enough",
      summary: "The part lifts because it was never firmly stuck down.",
      explanation: "Any warping force will lift a part that is only lightly attached. Fix the first layer before changing anything else.",
      checks: ["Clean the build surface with dish soap and water or isopropyl alcohol.", "Check the first layer height."],
      guideSlugs: ["clean-the-build-plate", "level-the-bed"],
      escalation: "Work through the “First layer will not stick” diagnosis first.",
    },
    {
      id: "first-layer-squish",
      slicerSettings: ["elephant-foot"],
      title: "The first layer is squashed too much",
      summary: "The nozzle is slightly too close on the first layer, so it spreads wider than the walls above it.",
      explanation: "A little squish helps adhesion. Too much spreads the first layer outwards, giving a flared base.",
      checks: [
        { text: "Raise the Z offset slightly (0.02–0.05 mm at a time).", when: levelling.adjustableOffset },
        { text: "Manual levelling: re-level with a slightly larger gap at each corner.", when: levelling.manual },
        { text: "Nozzle-sensing printers: clean the nozzle tip and rerun the automatic calibration; the slicer's compensation setting handles any remaining flare.", when: levelling.nozzleSensing },
        "Use the slicer's elephant's foot compensation setting if it has one.",
      ],
      guideSlugs: ["set-the-z-offset"],
    },
    {
      id: "bed-too-hot",
      title: "The bed is keeping the lower layers too soft",
      summary: "A hot bed lets the weight of the print squash the bottom layers outwards.",
      explanation: "At the top of a material's bed temperature range, the lower layers stay soft enough to bulge outwards under the layers above.",
      checks: ["Lower the bed temperature by 5 °C at a time, watching adhesion.", "Use the slicer's elephant's foot compensation if available."],
    },
    {
      id: "cold-layers",
      title: "Layers are cooling too quickly to bond",
      summary: "Each layer cools too much before the next is laid on top.",
      explanation: "Layers fuse while they are hot. Strong cooling, a low nozzle temperature or cold surroundings stop them bonding, which shows as cracks, often on tall parts.",
      checks: [
        "Reduce the part cooling fan for this material.",
        "Raise the nozzle temperature in 5 °C steps within the filament's range.",
        "Print ABS, ASA, nylon and PC in an enclosure.",
      ],
      guideSlugs: ["reduce-warping"],
    },
    {
      id: "hole-shrink",
      title: "Holes print slightly small: this is normal",
      summary: "FDM printing makes holes slightly smaller than designed.",
      explanation: "Plastic is laid down as rounded lines, and the inner edge of a curve gets slightly more plastic than the outer edge, so holes come out smaller. Designers allow clearance for this.",
      checks: [
        "Add clearance to holes in your design, often 0.1–0.3 mm on the diameter, and test.",
        "Use your slicer's hole or XY compensation setting if it has one.",
      ],
    },
    {
      id: "material-shrink",
      title: "The material shrinks as it cools",
      summary: "Some materials consistently print slightly smaller than designed.",
      explanation: "All plastics contract as they cool, some by a noticeable percentage. If every dimension is off by a similar percentage, the material's shrinkage is the likely cause.",
      checks: ["Print a calibration cube and calculate the percentage difference.", "Use the slicer's shrinkage compensation for that filament profile."],
    },
    {
      id: "axis-calibration",
      title: "One axis is not moving the correct distance",
      summary: "A loose belt, slipping pulley or incorrect firmware setting affects that axis.",
      explanation: "If only one axis is wrong, its movement is the likely problem: a slack belt, a pulley slipping on its motor shaft, or an incorrect steps-per-millimetre or rotation distance setting.",
      checks: [
        "Check belt tension and pulley grub screws for that axis.",
        "Check whether the firmware's steps or rotation distance has been changed.",
      ],
      guideSlugs: ["check-belt-tension"],
      safety: ["power-off-before-work"],
    },
    {
      id: "over-extrusion",
      slicerSettings: ["flow"],
      title: "Too much plastic is making walls slightly thick",
      summary: "Extra plastic widens every outer wall.",
      explanation: "A flow rate set slightly high makes outer walls wider than designed, so outside dimensions grow on every side.",
      checks: ["Run the slicer's flow calibration.", "Measure the filament diameter and check it matches the profile."],
    },
  ],
  insufficient: {
    title: "We need a measurement",
    explanation: "A simple calibration print will show what is happening.",
    checks: ["Print a 20 mm calibration cube and measure X, Y and Z.", "Note the material and whether the printer is enclosed, then try again."],
  },
  sourceIds: ["editorial"],
  verification: seedVerification(),
};
