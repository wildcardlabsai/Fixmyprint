import type { SymptomCategory, SymptomInput } from "@/lib/schema";

export const symptomCategories: SymptomCategory[] = [
  { slug: "first-layer-and-bed-adhesion", title: "First layer and bed adhesion", description: "Prints that will not stick, come loose, or have a rough or patchy first layer.", icon: "layers" },
  { slug: "nozzle-and-extrusion", title: "Nozzle and extrusion", description: "Nothing coming out, thin or gappy walls, clicking extruders and blocked nozzles.", icon: "pipette" },
  { slug: "stringing-and-surface-quality", title: "Stringing, blobs and surface quality", description: "Hairs between parts, zits on the surface, bubbling and rough walls.", icon: "spline" },
  { slug: "warping-and-dimensions", title: "Warping and dimensional problems", description: "Lifting corners, elephant's foot, cracking between layers and parts the wrong size.", icon: "ruler" },
  { slug: "bed-levelling-and-probe", title: "Bed levelling and probe errors", description: "Probing failures, a first layer that varies across the bed and Z offset problems.", icon: "crosshair" },
  { slug: "stops-and-error-codes", title: "Printer stops, disconnects and error codes", description: "Prints that stop part way, restarts, lost connections and on-screen errors.", icon: "octagon-alert" },
  { slug: "multi-colour", title: "Multi-colour printing", description: "Filament changers that fail to load or unload, and colours mixing.", icon: "blend" },
  { slug: "motion-and-noises", title: "Motion, belts and unusual noises", description: "Layer shifts, grinding, clunking and ripples next to sharp corners.", icon: "move" },
  { slug: "temperature-and-heating", title: "Temperature and heating faults", description: "Thermal runaway, heaters that will not reach temperature and unstable readings.", icon: "thermometer" },
  { slug: "firmware-and-connectivity", title: "Firmware and connectivity", description: "Network and app connection problems, failed updates and files that do not appear.", icon: "wifi" },
];

export const symptoms: SymptomInput[] = [
  // First layer
  { slug: "first-layer-not-sticking", category: "first-layer-and-bed-adhesion", title: "First layer will not stick", description: "Filament is dragged around, curls up behind the nozzle or comes loose during the first layers.", synonyms: ["bed adhesion", "not sticking", "wont stick", "won't stick", "print came loose", "spaghetti", "adhesion"], flowId: "first-layer-adhesion", guideSlugs: ["level-the-bed", "clean-the-build-plate"], common: true },
  { slug: "rough-or-gappy-first-layer", category: "first-layer-and-bed-adhesion", title: "First layer is rough, ridged or has gaps", description: "Lines do not join up, or the surface is ploughed and rough.", synonyms: ["first layer gaps", "ridges", "rough first layer", "squish"], flowId: "first-layer-adhesion", guideSlugs: ["set-the-z-offset", "level-the-bed"] },
  { slug: "print-stuck-to-bed", category: "first-layer-and-bed-adhesion", title: "Print is stuck too firmly", description: "Parts are hard to remove or have pulled pieces out of the build surface.", synonyms: ["cant remove print", "bonded to bed", "petg ripped pei"], flowId: null, guideSlugs: ["clean-the-build-plate"] },

  // Extrusion
  { slug: "not-extruding", category: "nozzle-and-extrusion", title: "Nothing comes out of the nozzle", description: "The printer moves but no filament comes out, or extrusion stops part way.", synonyms: ["clogged nozzle", "clog", "jam", "blocked", "no extrusion", "nozzle blocked"], flowId: "extrusion-problems", guideSlugs: ["clear-a-blocked-nozzle"], common: true },
  { slug: "under-extrusion", category: "nozzle-and-extrusion", title: "Under-extrusion: thin or gappy walls", description: "Walls are weak, top layers have gaps, or lines look thin and broken.", synonyms: ["under extrusion", "gaps in walls", "weak prints", "missing layers", "thin lines"], flowId: "extrusion-problems", guideSlugs: ["clear-a-blocked-nozzle", "check-the-extruder"], common: true },
  { slug: "extruder-clicking", category: "nozzle-and-extrusion", title: "Extruder clicking or grinding filament", description: "A repeating click from the extruder, or filament with chewed-out grooves.", synonyms: ["clicking", "skipping extruder", "grinding filament", "ticking"], flowId: "extrusion-problems", guideSlugs: ["check-the-extruder"] },

  // Surface
  { slug: "stringing", category: "stringing-and-surface-quality", title: "Stringing between parts", description: "Fine hairs or strands bridge the gaps between separate parts of a print.", synonyms: ["strings", "oozing", "hairs", "cobwebs", "wisps", "spider webs"], flowId: "stringing-and-surface", guideSlugs: ["tune-retraction", "dry-filament"], common: true },
  { slug: "blobs-and-zits", category: "stringing-and-surface-quality", title: "Blobs and zits on the surface", description: "Small bumps where each layer starts and ends, or blobs of melted plastic.", synonyms: ["zits", "pimples", "seam blobs", "blobs"], flowId: "stringing-and-surface", guideSlugs: ["tune-retraction"] },
  { slug: "bubbling-or-rough-surface", category: "stringing-and-surface-quality", title: "Popping, bubbling or rough surface", description: "Crackling sounds while printing, steam, bubbles or a fuzzy surface.", synonyms: ["popping", "crackling", "wet filament", "steam", "bubbles", "fuzzy"], flowId: "stringing-and-surface", guideSlugs: ["dry-filament"] },

  // Warping and dimensions
  { slug: "warping", category: "warping-and-dimensions", title: "Corners lifting or warping", description: "The corners or edges of a part curl up from the bed as it prints.", synonyms: ["warp", "warping", "curling", "lifting corners", "corners lifting"], flowId: "warping-and-dimensions", guideSlugs: ["reduce-warping"], common: true },
  { slug: "elephants-foot", category: "warping-and-dimensions", title: "Bottom layers flare out (elephant's foot)", description: "The bottom few layers are wider than the rest of the part.", synonyms: ["elephant foot", "elephants foot", "flared base"], flowId: "warping-and-dimensions", guideSlugs: ["set-the-z-offset"] },
  { slug: "layer-separation", category: "warping-and-dimensions", title: "Layers splitting or cracking", description: "Cracks between layers, often on tall parts or engineering materials.", synonyms: ["delamination", "layer split", "cracking", "layer separation"], flowId: "warping-and-dimensions", guideSlugs: ["reduce-warping"] },

  // Probe
  { slug: "probing-failed", category: "bed-levelling-and-probe", title: "Probing or levelling fails", description: "The printer reports a probing error, or levelling stops part way.", synonyms: ["probing failed", "bltouch error", "cr touch error", "probe error", "levelling failed", "leveling failed", "bed leveling failed"], flowId: "bed-levelling-and-probe", guideSlugs: ["level-the-bed"], common: true },
  { slug: "first-layer-uneven-across-bed", category: "bed-levelling-and-probe", title: "First layer differs across the bed", description: "Good in one area, too close or too far in another.", synonyms: ["uneven bed", "bed not level", "one side too high", "uneven first layer"], flowId: "bed-levelling-and-probe", guideSlugs: ["level-the-bed"] },

  // Stops
  { slug: "print-stops-midway", category: "stops-and-error-codes", title: "Print stops part way through", description: "The printer stops, pauses or freezes before the print is finished.", synonyms: ["stops printing", "print stopped", "freezes", "pauses", "halted"], flowId: "printer-stops", guideSlugs: [], common: true },
  { slug: "printer-restarts", category: "stops-and-error-codes", title: "Printer restarts or loses connection", description: "The printer reboots, the screen resets, or the host loses its connection.", synonyms: ["reboots", "restarts", "lost communication", "disconnects", "usb disconnect"], flowId: "printer-stops", guideSlugs: [] },

  // Multi-colour
  { slug: "filament-changer-load-failure", category: "multi-colour", title: "Filament changer fails to load or unload", description: "An AMS, MMU or similar unit cannot feed or retract filament.", synonyms: ["ams error", "mmu error", "filament change failed", "ams not loading", "mmu load fail"], flowId: "multi-colour", guideSlugs: [], common: false },
  { slug: "colour-bleed", category: "multi-colour", title: "Colours mixing or bleeding", description: "The previous colour shows in the next one after a filament change.", synonyms: ["colour mixing", "color bleed", "purge", "wrong colour"], flowId: "multi-colour", guideSlugs: [] },

  // Motion
  { slug: "layer-shift", category: "motion-and-noises", title: "Layers shifted sideways", description: "Part of the print is offset from the layers below it.", synonyms: ["layer shift", "shifted layers", "offset layers", "skipped steps"], flowId: "motion-and-noises", guideSlugs: ["check-belt-tension"], common: true },
  { slug: "unusual-noises", category: "motion-and-noises", title: "Grinding, clunking or squeaking", description: "New noises from the motors, belts, wheels or bearings.", synonyms: ["noise", "grinding noise", "clunking", "squeaking", "rattling", "vibration"], flowId: "motion-and-noises", guideSlugs: ["check-belt-tension"] },
  { slug: "ringing", category: "motion-and-noises", title: "Ripples after corners (ringing)", description: "Repeating ripples in the wall just after a sharp corner or edge.", synonyms: ["ghosting", "ringing", "echoes", "ripples"], flowId: "motion-and-noises", guideSlugs: ["check-belt-tension"] },

  // Heating
  { slug: "thermal-runaway", category: "temperature-and-heating", title: "Thermal runaway or heating failed", description: "The printer stops with a thermal runaway or heating failed error.", synonyms: ["thermal runaway", "heating failed", "heater not heating at expected rate", "heating error"], flowId: "heating-faults", guideSlugs: ["check-heater-and-thermistor-wiring"], common: true },
  { slug: "wont-reach-temperature", category: "temperature-and-heating", title: "Will not reach temperature", description: "The nozzle or bed heats slowly or never gets to the target.", synonyms: ["wont heat", "not heating", "slow heating", "bed not heating"], flowId: "heating-faults", guideSlugs: ["check-heater-and-thermistor-wiring"] },
  { slug: "temperature-reading-wrong", category: "temperature-and-heating", title: "Temperature reading is wrong or jumps", description: "Readings that jump around, show room temperature when hot, or show an impossible value.", synonyms: ["mintemp", "maxtemp", "temperature fluctuates", "temperature jumps", "thermistor"], flowId: "heating-faults", guideSlugs: ["check-heater-and-thermistor-wiring"] },

  // Firmware
  { slug: "cannot-connect", category: "firmware-and-connectivity", title: "Cannot connect to Wi-Fi or the app", description: "The printer will not join a network or does not appear in the app.", synonyms: ["wifi", "wi-fi", "network", "app not connecting", "offline"], flowId: "firmware-and-connectivity", guideSlugs: [] },
  { slug: "firmware-update-failed", category: "firmware-and-connectivity", title: "Firmware update failed", description: "An update stopped, the screen is blank or the printer will not start after updating.", synonyms: ["flash failed", "update failed", "bricked", "blank screen after update"], flowId: "firmware-and-connectivity", guideSlugs: ["update-firmware-safely"] },
  { slug: "files-not-showing", category: "firmware-and-connectivity", title: "Print files do not appear", description: "The printer does not show files on the SD card or USB drive.", synonyms: ["sd card not reading", "files missing", "usb drive not detected", "gcode not showing"], flowId: "firmware-and-connectivity", guideSlugs: [] },
];
