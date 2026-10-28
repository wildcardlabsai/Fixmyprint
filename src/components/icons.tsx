import {
  Blend,
  Crosshair,
  Layers,
  Move,
  OctagonAlert,
  Pipette,
  Ruler,
  Spline,
  Thermometer,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  pipette: Pipette,
  spline: Spline,
  ruler: Ruler,
  crosshair: Crosshair,
  "octagon-alert": OctagonAlert,
  blend: Blend,
  move: Move,
  thermometer: Thermometer,
  wifi: Wifi,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Wrench;
  return <Icon className={className} aria-hidden />;
}
