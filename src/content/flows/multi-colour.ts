import type { DiagnosticFlowInput } from "@/lib/schema";
import { seedVerification } from "../shared";

export const multiColour: DiagnosticFlowInput = {
  id: "multi-colour",
  version: 1,
  title: "Multi-colour and filament changer problems",
  summary: "Works through loading failures, unloading failures, colour bleed and filament breaks on AMS, MMU and similar units.",
  category: "multi-colour",
  symptomSlugs: ["filament-changer-load-failure", "colour-bleed"],
  start: "problem",
  safety: ["moving-parts"],
  questions: [
    {
      id: "problem",
      prompt: "What is happening?",
      why: "Loading, unloading, colour mixing and breakage each have different causes.",
      options: [
        { id: "wont-load", label: "Filament will not feed into the print head", next: "where-stops" },
        { id: "wont-unload", label: "Filament will not pull back out of the print head", next: "result", evidence: { "tip-shape": 4, "tube-path": 1 } },
        { id: "colour-bleed", label: "The previous colour shows in the next one", next: "result", evidence: { purge: 5 } },
        { id: "breaks", label: "Filament snaps inside the unit or tubes", next: "result", evidence: { brittle: 4, "tube-path": 1 } },
      ],
    },
    {
      id: "where-stops",
      prompt: "Where does the filament stop?",
      why: "The point where it stops tells us which part of the path to check.",
      options: [
        { id: "at-unit", label: "It does not leave the unit", next: "result", evidence: { "spool-feed": 4 } },
        { id: "in-tube", label: "Somewhere in the tubes", next: "result", evidence: { "tube-path": 4 } },
        { id: "at-head", label: "It reaches the print head but will not go in", next: "result", evidence: { "tip-shape": 3, sensor: 2 } },
      ],
    },
  ],
  rules: [],
  outcomes: [
    {
      id: "spool-feed",
      title: "The spool is not feeding",
      summary: "The unit cannot pull filament off the spool.",
      explanation: "Tangled windings, a spool that does not turn freely, or a spool that does not suit the unit's rollers stop filament leaving the unit. Some units need adapters for certain spool types.",
      checks: [
        "Check the spool turns freely and the filament is not crossed or tangled.",
        "Check the manufacturer's guidance on which spool sizes and materials the unit supports.",
        "Cut the filament end cleanly at an angle before loading.",
      ],
    },
    {
      id: "tube-path",
      title: "Something is blocking the tube path",
      summary: "A kinked tube, a loose fitting or a broken piece of filament is in the way.",
      explanation: "Filament changers rely on tubes and fittings that guide filament to the print head. A sharp bend, a tube that has pulled out of its fitting or a broken fragment stops loading.",
      checks: [
        "Check each tube is fully seated in its fittings and has no sharp bends.",
        "Disconnect tubes one at a time and push filament through by hand to find the blockage.",
      ],
      safety: ["power-off-before-work"],
    },
    {
      id: "tip-shape",
      title: "The filament tip is not forming cleanly",
      summary: "A stringy or swollen tip will not pass back through the path or into the extruder.",
      explanation: "Before each change, the filament end must be cut or formed into a clean tip. A swollen or stringy tip can jam on the way out or fail to enter the extruder. Systems with a cutter rely on a sharp blade; systems that form a tip rely on tip-forming settings for each material.",
      checks: [
        "Check the end of an unloaded filament: it should be clean, not swollen or stringy.",
        "If your system has a filament cutter, check its blade as the manufacturer describes.",
        "If your system forms a tip, use the manufacturer's material profile for that filament.",
      ],
    },
    {
      id: "purge",
      title: "Not enough material is being purged",
      summary: "The purge amount is too small for this colour change.",
      explanation: "Some of the previous colour remains in the hotend after a change. Changing from dark to light colours needs more purging than the other way round.",
      checks: [
        "Increase the purge or flush volume for that colour pair in the slicer.",
        "Use a prime tower, or flush into infill or a support object if your slicer offers it.",
      ],
    },
    {
      id: "brittle",
      title: "The filament is brittle",
      summary: "Brittle filament snaps on the bends in the path.",
      explanation: "Some filaments, particularly older PLA and some silk or speciality PLAs, become brittle over time or with moisture exposure, and snap in tight bends.",
      checks: [
        "Bend a short length of filament: if it snaps easily, it is brittle.",
        "Try a fresh spool, and store spools sealed with desiccant.",
        "Check the path has no unnecessarily tight bends.",
      ],
      guideSlugs: ["dry-filament"],
    },
    {
      id: "sensor",
      title: "A filament sensor is not detecting the filament",
      summary: "The sensor at the print head or in the unit misreads the filament.",
      explanation: "Filament changers use sensors to confirm each stage of a load. Dust or a misaligned sensor can make a successful load look like a failure.",
      checks: ["Clean the sensors as the manufacturer describes.", "Check the sensor status in the printer's menu while loading."],
    },
  ],
  insufficient: {
    title: "Follow the filament path",
    explanation: "Loading problems are found fastest by following the path by hand.",
    checks: ["Unload all slots and push filament through each section of tube by hand.", "Check the manufacturer's maintenance guide for your unit."],
  },
  sourceIds: ["editorial", "bambu-wiki", "prusa-kb"],
  verification: seedVerification(),
};
