import {
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  Clock,
  Cylinder,
  FileText,
  Phone,
  Scissors,
  Shield,
  TreeDeciduous,
  TriangleAlert,
  Truck,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/content/types";

const ICONS: Record<IconName, LucideIcon> = {
  phone: Phone,
  camera: Camera,
  tree: TreeDeciduous,
  "alert-triangle": TriangleAlert,
  scissors: Scissors,
  cylinder: Cylinder,
  truck: Truck,
  wind: Wind,
  "file-text": FileText,
  shield: Shield,
  clock: Clock,
  check: Check,
  "arrow-right": ArrowRight,
  x: X,
  "alert-circle": CircleAlert,
};

/** Decorative stroke icon (2px, round caps). Always aria-hidden; label the parent instead. */
export function Icon({
  name,
  size = 24,
  strokeWidth = 2,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const Cmp = ICONS[name] ?? Check;
  return (
    <Cmp
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
