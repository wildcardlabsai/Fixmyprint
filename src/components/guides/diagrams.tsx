/**
 * Simple explanatory diagrams. They are schematic and not to scale, and are
 * labelled as such. They do not depict any particular printer model.
 */

function Figure({ caption, children, label }: { caption: string; label: string; children: React.ReactNode }) {
  return (
    <figure className="mt-3 rounded-lg border border-line bg-page p-3">
      <div role="img" aria-label={label}>
        {children}
      </div>
      <figcaption className="mt-2 text-xs text-ink/70">{caption} Diagram, not to scale.</figcaption>
    </figure>
  );
}

export function FirstLayerHeightDiagram() {
  const panel = (x: number, title: string, gap: number, line: React.ReactNode, tone: string) => (
    <g transform={`translate(${x},0)`}>
      <text x="60" y="16" textAnchor="middle" fontSize="12" fontWeight="600" fill={tone}>
        {title}
      </text>
      <path d={`M40 ${30} h40 v${34 - gap} l-10 12 h-20 l-10 -12 z`} fill="#94a3b8" />
      {line}
      <rect x="0" y="92" width="120" height="10" fill="#cbd5e1" />
    </g>
  );
  return (
    <Figure
      label="Cross-sections of a first-layer line: too far from the bed gives a round line, correct height gives a slightly flattened line, too close gives a thin, wide smear."
      caption="Cross-section of one first-layer line at three nozzle heights."
    >
      <svg viewBox="0 0 400 110" className="h-auto w-full max-w-md">
        {panel(0, "Too far", -2, <circle cx="60" cy="84" r="8" fill="#0878e8" />, "#c0392b")}
        {panel(140, "Correct", 6, <ellipse cx="60" cy="87" rx="13" ry="5" fill="#0878e8" />, "#16835d")}
        {panel(280, "Too close", 13, <ellipse cx="60" cy="90" rx="22" ry="2" fill="#0878e8" />, "#c0392b")}
      </svg>
    </Figure>
  );
}

export function BowdenCouplerDiagram() {
  const column = (x: number, title: string, gap: number, tone: string) => (
    <g transform={`translate(${x},0)`}>
      <text x="70" y="16" textAnchor="middle" fontSize="12" fontWeight="600" fill={tone}>
        {title}
      </text>
      {/* heater block and heat break */}
      <rect x="40" y="40" width="60" height="60" rx="3" fill="#e2e8f0" stroke="#94a3b8" />
      {/* nozzle */}
      <path d="M58 100 h24 v8 l-8 10 h-8 l-8 -10 z" fill="#94a3b8" />
      <rect x="64" y="70" width="12" height="30" fill="#cbd5e1" />
      {/* PTFE tube */}
      <rect x="62" y="24" width="16" height={46 - gap} fill="#ffffff" stroke="#0878e8" strokeWidth="2" />
      {gap > 0 && <rect x="64" y={70 - gap} width="12" height={gap} fill="#f2b8b0" />}
      <text x="108" y="38" fontSize="10" fill="#64748b">
        PTFE tube
      </text>
      {gap > 0 && (
        <text x="108" y={70 - gap / 2 + 3} fontSize="10" fill="#c0392b">
          gap fills with plastic
        </text>
      )}
    </g>
  );
  return (
    <Figure
      label="Two hotend cross-sections. Left: the PTFE tube presses against the nozzle with no gap. Right: the tube has backed out, leaving a gap where plastic collects."
      caption="Inside a Bowden hotend: the tube must press against the nozzle."
    >
      <svg viewBox="0 0 440 125" className="h-auto w-full max-w-lg">
        {column(0, "Seated correctly", 0, "#16835d")}
        {column(220, "Tube backed out", 10, "#c0392b")}
      </svg>
    </Figure>
  );
}

export function GuideDiagram({ id }: { id: "first-layer-height" | "bowden-coupler" }) {
  return id === "first-layer-height" ? <FirstLayerHeightDiagram /> : <BowdenCouplerDiagram />;
}
