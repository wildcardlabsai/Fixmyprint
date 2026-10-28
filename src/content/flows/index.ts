import type { DiagnosticFlowInput } from "@/lib/schema";
import { bedLevellingAndProbe } from "./bed-levelling-and-probe";
import { extrusionProblems } from "./extrusion-problems";
import { firmwareAndConnectivity } from "./firmware-and-connectivity";
import { firstLayerAdhesion } from "./first-layer-adhesion";
import { heatingFaults } from "./heating-faults";
import { motionAndNoises } from "./motion-and-noises";
import { multiColour } from "./multi-colour";
import { printerStops } from "./printer-stops";
import { stringingAndSurface } from "./stringing-and-surface";
import { warpingAndDimensions } from "./warping-and-dimensions";

export const flowInputs: DiagnosticFlowInput[] = [
  firstLayerAdhesion,
  extrusionProblems,
  stringingAndSurface,
  warpingAndDimensions,
  bedLevellingAndProbe,
  printerStops,
  multiColour,
  motionAndNoises,
  heatingFaults,
  firmwareAndConnectivity,
];
