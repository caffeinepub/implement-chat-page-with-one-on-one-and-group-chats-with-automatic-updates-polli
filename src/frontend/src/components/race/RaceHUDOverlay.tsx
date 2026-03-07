import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";

interface RaceHUDOverlayProps {
  currentLap: number;
  totalLaps: number;
  speed: number;
}

export function RaceHUDOverlay({
  currentLap,
  totalLaps,
  speed,
}: RaceHUDOverlayProps) {
  const displaySpeed = Math.round(Math.abs(speed));

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Top left - Lap counter */}
      <div className="absolute left-6 top-6">
        <Badge
          variant="default"
          className="bg-black/70 px-4 py-2 text-lg font-bold text-white backdrop-blur-sm"
        >
          Lap {currentLap}/{totalLaps}
        </Badge>
      </div>

      {/* Top right - Speed */}
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <Badge
          variant="default"
          className="bg-black/70 px-4 py-2 text-lg font-bold text-white backdrop-blur-sm"
        >
          <Gauge className="mr-2 inline h-5 w-5" />
          {displaySpeed} km/h
        </Badge>
      </div>

      {/* Bottom center - Controls hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <Badge
          variant="outline"
          className="bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur-sm"
        >
          WASD / Arrow Keys to Drive
        </Badge>
      </div>
    </div>
  );
}
