import type { DiagnosticFlowInput } from "@/lib/schema";
import { seedVerification } from "../shared";

export const heatingFaults: DiagnosticFlowInput = {
  id: "heating-faults",
  version: 1,
  title: "Thermal runaway, heating errors and temperature faults",
  summary: "Works out whether a heating error comes from the temperature sensor, its wiring, the heater, cooling air, tuning or the power supply, without weakening any safety protection.",
  category: "temperature-and-heating",
  symptomSlugs: ["thermal-runaway", "wont-reach-temperature", "temperature-reading-wrong"],
  start: "reported",
  safety: ["never-bypass-protection", "hot-surfaces", "power-off-before-work"],
  questions: [
    {
      id: "reported",
      prompt: "What is the printer reporting or doing?",
      why: "Each heating error means something specific. MINTEMP and MAXTEMP are usually the sensor; runaway and heating errors can be the sensor, the heater or cooling.",
      options: [
        { id: "runaway", label: "A thermal runaway error", next: "which-heater", evidence: { "thermistor-loose": 1, "heater-weak": 1, "cooling-draft": 1 } },
        { id: "heating-failed", label: "Heating failed, or not heating at the expected rate", next: "which-heater", evidence: { "heater-weak": 2, "thermistor-loose": 1 } },
        { id: "mintemp", label: "MINTEMP, or a reading far below room temperature", next: "which-heater", evidence: { "thermistor-open": 4 } },
        { id: "maxtemp", label: "MAXTEMP, or a reading far higher than expected", next: "really-hot", evidence: { "thermistor-short": 3 } },
        { id: "slow", label: "Heats slowly or never reaches the target, without an error", next: "which-heater", evidence: { "heater-weak": 2, "cooling-draft": 1 } },
        { id: "fluctuates", label: "The temperature swings or jumps around", next: "which-heater" },
      ],
    },
    {
      id: "really-hot",
      prompt: "From a safe distance, is anything actually overheating?",
      why: "A real overheating heater is a fire risk and needs a different response from a faulty reading.",
      help: "Signs include smoke, a burning smell, discoloured plastic near the heater, or the heater getting hot while the printer says it is off.",
      safety: ["mains-electrical", "hot-surfaces"],
      options: [
        { id: "yes", label: "Yes, or I'm not certain it isn't", next: "result", evidence: { "heater-stuck-on": 8 } },
        { id: "no", label: "No, it is cool or at a normal temperature", next: "which-heater", evidence: { "thermistor-short": 2 } },
      ],
    },
    {
      id: "which-heater",
      prompt: "Which heater is affected?",
      why: "The nozzle and bed have separate sensors, heaters and wiring. If both are affected, the cause is usually shared.",
      options: [
        {
          id: "hotend",
          label: "The nozzle (hotend)",
          next: {
            branch: [
              { when: { answer: "reported", in: ["runaway", "heating-failed", "slow"] }, goto: "when-error" },
              { when: { answer: "reported", in: ["fluctuates"] }, goto: "fluctuation" },
            ],
            otherwise: "wiring-movement",
          },
        },
        {
          id: "bed",
          label: "The bed",
          next: {
            branch: [
              { when: { answer: "reported", in: ["runaway", "heating-failed", "slow"] }, goto: "when-error" },
              { when: { answer: "reported", in: ["fluctuates"] }, goto: "fluctuation" },
            ],
            otherwise: "wiring-movement",
          },
        },
        {
          id: "both",
          label: "Both",
          next: {
            branch: [
              { when: { answer: "reported", in: ["runaway", "heating-failed", "slow"] }, goto: "when-error" },
              { when: { answer: "reported", in: ["fluctuates"] }, goto: "fluctuation" },
            ],
            otherwise: "wiring-movement",
          },
          evidence: { "power-supply": 2 },
        },
      ],
    },
    {
      id: "when-error",
      prompt: "When does the problem happen?",
      why: "Timing separates a heater that cannot keep up from a sensor that has come loose or air that is cooling the heater.",
      options: [
        {
          id: "heating-up",
          label: "While heating up from cold",
          next: { branch: [{ when: { answer: "which-heater", in: ["hotend", "both"] }, goto: "sock" }], otherwise: "wiring-movement" },
          evidence: { "heater-weak": 2, "thermistor-loose": 1, "pid-tuning": 1 },
        },
        {
          id: "fan-on",
          label: "Mid-print, often when the part cooling fan speeds up",
          next: { branch: [{ when: { answer: "which-heater", in: ["hotend", "both"] }, goto: "sock" }], otherwise: "wiring-movement" },
          evidence: { "cooling-draft": 3, "pid-tuning": 2 },
        },
        {
          id: "random",
          label: "Mid-print, at random",
          next: { branch: [{ when: { answer: "which-heater", in: ["hotend", "both"] }, goto: "sock" }], otherwise: "wiring-movement" },
          evidence: { "wiring-intermittent": 3, "thermistor-loose": 2 },
        },
        {
          id: "after-maintenance",
          label: "Since I changed the nozzle, hotend, heater or sensor",
          next: { branch: [{ when: { answer: "which-heater", in: ["hotend", "both"] }, goto: "sock" }], otherwise: "wiring-movement" },
          evidence: { "thermistor-loose": 4, "pid-tuning": 2 },
        },
      ],
    },
    {
      id: "sock",
      prompt: "Is a silicone sock fitted on the heater block, if your hotend uses one?",
      why: "Cooling air hitting a bare heater block can pull heat away faster than the heater can replace it.",
      options: [
        { id: "fitted", label: "Yes, fitted and in good condition", next: "wiring-movement", evidence: { "cooling-draft": -1 } },
        { id: "missing", label: "No, or it is torn", next: "wiring-movement", evidence: { "cooling-draft": 3 } },
        { id: "not-used", label: "My hotend doesn't use one, or I'm not sure", next: "wiring-movement", uncertain: true },
      ],
    },
    {
      id: "fluctuation",
      prompt: "How does the reading change?",
      why: "Slow swings point to tuning. Sudden jumps point to the sensor or its wiring.",
      options: [
        { id: "slow-swings", label: "Slow swings of a few degrees around the target", next: "wiring-movement", evidence: { "pid-tuning": 4 } },
        { id: "jumps", label: "Sudden jumps or drops of many degrees", next: "wiring-movement", evidence: { "wiring-intermittent": 4, "thermistor-loose": 1 } },
        { id: "fan-drops", label: "It drops when the part cooling fan comes on", next: "wiring-movement", evidence: { "cooling-draft": 4, "pid-tuning": 1 } },
      ],
    },
    {
      id: "wiring-movement",
      prompt: "With the printer idle and cool, watch the temperature reading while you move the print head or bed slowly by hand. Does the reading jump or drop out?",
      why: "Sensor wires often break inside their insulation where they flex. The fault only shows when the cable bends.",
      help: "Disable the motors first so the axes move freely. Do not touch any wiring or connectors while the printer is switched on.",
      safety: ["moving-parts"],
      options: [
        { id: "jumps", label: "Yes, it jumps or drops out", next: "result", evidence: { "wiring-intermittent": 5 } },
        { id: "steady", label: "No, it stays steady", next: "result", evidence: { "wiring-intermittent": -2 } },
        { id: "cant", label: "I can't check this", next: "result", uncertain: true },
      ],
    },
  ],
  rules: [
    {
      id: "both-heaters-slow",
      when: { all: [{ answer: "which-heater", in: ["both"] }, { answer: "reported", in: ["heating-failed", "slow", "runaway"] }] },
      evidence: { "power-supply": 2 },
      reason: "When both heaters struggle together, a cause they share, such as the power supply, is more likely than both failing at once.",
    },
  ],
  outcomes: [
    {
      id: "heater-stuck-on",
      title: "A heater may be on when it should be off",
      summary: "Switch the printer off at the wall now and do not use it until it has been inspected.",
      explanation: "If a heater keeps heating when the printer has stopped it, the part of the mainboard that switches it may have failed. This is a fire risk. Firmware protection cannot stop a heater whose switching component has failed.",
      checks: [
        "Switch off at the wall socket and unplug the printer. Do not switch it back on to test.",
        "Keep the area clear and let everything cool.",
        "Contact the manufacturer's support.",
      ],
      safety: ["mains-electrical", "power-off-before-work", "hot-surfaces"],
      escalation: "This needs the manufacturer or a qualified technician. Do not attempt to repair mainboard or power supply components yourself.",
    },
    {
      id: "thermistor-open",
      title: "The temperature sensor circuit is open",
      summary: "The printer cannot read the sensor, usually because of a disconnected or broken wire.",
      explanation: "MINTEMP means the reading is below the lowest plausible value, which almost always means the sensor circuit is broken: an unplugged connector, a wire broken where it flexes, or a failed thermistor. A very cold room can occasionally trigger it.",
      checks: [
        "Switch off and unplug the printer, then check the sensor connector at the mainboard and at the print head or bed.",
        "Look for broken or damaged wires near the heater block and where cables bend.",
        "Replace the thermistor with one of the type the firmware expects; a different type reads incorrectly.",
      ],
      guideSlugs: ["check-heater-and-thermistor-wiring"],
      safety: ["power-off-before-work"],
    },
    {
      id: "thermistor-short",
      title: "The temperature sensor wiring may be shorted",
      summary: "The reading is impossibly high, but nothing is actually overheating.",
      explanation: "If the two sensor wires touch, or plastic or metal bridges them, the reading jumps to a very high value and the firmware stops with MAXTEMP. Damaged insulation near the heater block is a common cause.",
      checks: [
        "Switch off and unplug the printer, let it cool, then check the sensor wires for damaged insulation.",
        "Check for plastic build-up around the heater block and sensor.",
      ],
      guideSlugs: ["check-heater-and-thermistor-wiring"],
      safety: ["power-off-before-work"],
      escalation: "If you are not sure nothing is overheating, treat it as a real overheating fault: keep the printer unplugged and contact the manufacturer.",
    },
    {
      id: "thermistor-loose",
      title: "The temperature sensor is not seated properly",
      summary: "A loose sensor reads too low, so the heater keeps heating and the firmware stops it.",
      explanation: "The sensor must be held firmly in the heater block or bed. If it slips out, it reads lower than the real temperature. The heater works harder and the firmware stops the print because the temperature is not responding as expected. This is common after nozzle or hotend changes.",
      checks: [
        "With the printer cold and unplugged, check the sensor is fully inserted and held by its screw or clip as designed.",
        "Do not overtighten the retaining screw; it can crush the sensor or its wires.",
      ],
      guideSlugs: ["check-heater-and-thermistor-wiring"],
      safety: ["power-off-before-work"],
    },
    {
      id: "heater-weak",
      title: "The heater or its connection may be failing",
      summary: "The heater is not delivering its full power.",
      explanation: "A heater cartridge or bed heater can weaken with age, and a poor connection reduces the power reaching it. A loose high-current connection can also overheat, so any sign of heat damage on a connector is serious.",
      checks: [
        "With the printer off and unplugged, check the heater connections for looseness, browning or melting.",
        "Stop using the printer if any connector shows heat damage.",
        "Replace heaters only with parts of the voltage and power the manufacturer specifies.",
      ],
      guideSlugs: ["check-heater-and-thermistor-wiring"],
      safety: ["power-off-before-work", "mains-electrical"],
      escalation: "Heat-damaged connectors, and anything involving the power supply or mains wiring, should be handled by the manufacturer's support or a qualified technician.",
    },
    {
      id: "cooling-draft",
      title: "Cooling air is taking heat from the heater block",
      summary: "The part cooling fan or a draft is cooling the heater block, not just the print.",
      explanation: "If cooling air hits the heater block, the heater has to work much harder, and at high fan speeds it may not keep up. A missing silicone sock or a misaligned fan duct makes it worse.",
      checks: [
        "Fit a silicone sock if your hotend is designed for one.",
        "Check the fan duct points at the print, not the heater block.",
        "Re-run the temperature tuning with the fan running.",
      ],
      safety: ["hot-surfaces"],
    },
    {
      id: "pid-tuning",
      title: "The temperature control needs re-tuning",
      summary: "The firmware's heater settings no longer match the hardware.",
      explanation: "Firmware controls heaters using tuning values for that heater. After changing a heater, hotend, sock or fan, the old values may overshoot or swing. Running the built-in calibration fixes this. Tuning never involves changing the safety protection settings.",
      checks: [
        "Run the heater calibration your firmware provides: M303 on Marlin, PID_CALIBRATE on Klipper, or the manufacturer's built-in calibration.",
        "Save the new values as the firmware instructions describe.",
      ],
      safety: ["hot-surfaces", "never-bypass-protection"],
    },
    {
      id: "wiring-intermittent",
      title: "A cable is breaking where it flexes",
      summary: "A sensor or heater wire is intermittently losing contact.",
      explanation: "Wires that flex with every move eventually break inside their insulation. The reading drops out or jumps only when the cable bends, which triggers heating errors mid-print.",
      checks: [
        "With the printer off and unplugged, check cables along their length, especially where they bend.",
        "Replace damaged cables with the manufacturer's part rather than splicing them.",
      ],
      guideSlugs: ["check-heater-and-thermistor-wiring"],
      safety: ["power-off-before-work"],
      escalation: "Do not twist or tape heater wires together: poor joints in high-current wiring can overheat.",
    },
    {
      id: "power-supply",
      title: "The power supply may not be delivering enough",
      summary: "A shared cause such as the power supply is likely when both heaters struggle.",
      explanation: "If the nozzle and bed both heat slowly or fail together, the power they share is the likely cause. That could be the supply itself or the mains connection.",
      checks: [
        "Plug the printer directly into a wall socket rather than an extension lead with other heavy loads.",
        "Note whether the problem happens when both heaters are on at once.",
      ],
      safety: ["mains-electrical"],
      escalation: "Do not open or repair the power supply. Contact the manufacturer's support or a qualified technician.",
    },
  ],
  insufficient: {
    title: "Note the exact error and readings",
    explanation: "Heating faults are easier to diagnose with the exact message and what the temperature did.",
    checks: [
      "Write down or photograph the exact error message.",
      "Note the temperature shown when the printer is cold. It should be close to room temperature.",
      "Never disable or raise the limits of thermal protection to get past the error.",
    ],
  },
  sourceIds: ["editorial", "marlin-docs", "marlin-m303", "klipper-config", "klipper-faq"],
  verification: seedVerification(),
};
