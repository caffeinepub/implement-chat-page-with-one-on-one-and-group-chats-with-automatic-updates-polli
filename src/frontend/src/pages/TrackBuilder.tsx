import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eraser,
  Flame,
  MapPin,
  Minus,
  MousePointer,
  Save,
  Trash2,
  TreePine,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Tool =
  | "select"
  | "draw"
  | "start"
  | "pitstop"
  | "boost"
  | "grass"
  | "tree"
  | "barrier"
  | "eraser";

type Surface = "asphalt" | "concrete" | "kerb";

interface TrackPoint {
  x: number;
  y: number;
}

interface TrackDecoration {
  type: "start" | "pitstop" | "boost" | "grass" | "tree" | "barrier";
  x: number;
  y: number;
}

const SURFACE_COLORS: Record<Surface, string> = {
  asphalt: "#2d2d2d",
  concrete: "#9ca3af",
  kerb: "#dc2626",
};

export default function TrackBuilder() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("draw");
  const [activeSurface, setActiveSurface] = useState<Surface>("asphalt");
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [decorations, setDecorations] = useState<TrackDecoration[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [trackName, setTrackName] = useState("My Custom Track");
  const [trackWidth, setTrackWidth] = useState(12);
  const [isSaving, setIsSaving] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background — grass field
    ctx.fillStyle = "#1a3a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw track
    if (trackPoints.length > 1) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 12;

      ctx.strokeStyle = SURFACE_COLORS[activeSurface];
      ctx.lineWidth = trackWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
      for (let i = 1; i < trackPoints.length; i++) {
        ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // White center line
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
      for (let i = 1; i < trackPoints.length; i++) {
        ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Kerb stripes on edges
      if (activeSurface !== "kerb") {
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
        for (let i = 1; i < trackPoints.length; i++) {
          ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    // Draw decorations
    for (const dec of decorations) {
      ctx.save();
      ctx.translate(dec.x, dec.y);

      switch (dec.type) {
        case "start": {
          const size = 16;
          const cols = 4;
          const rows = 4;
          const cellW = size / cols;
          const cellH = size / rows;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              ctx.fillStyle = (r + c) % 2 === 0 ? "#ffffff" : "#000000";
              ctx.fillRect(
                c * cellW - size / 2,
                r * cellH - size / 2,
                cellW,
                cellH,
              );
            }
          }
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 2;
          ctx.strokeRect(-size / 2, -size / 2, size, size);
          break;
        }
        case "pitstop": {
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.roundRect(-14, -10, 28, 20, 4);
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("PIT", 0, 0);
          break;
        }
        case "boost": {
          ctx.fillStyle = "#a855f7";
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(8, 4);
          ctx.lineTo(0, 0);
          ctx.lineTo(-8, 4);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case "grass": {
          ctx.fillStyle = "#16a34a";
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        }
        case "tree": {
          ctx.fillStyle = "#92400e";
          ctx.fillRect(-3, 4, 6, 8);
          ctx.fillStyle = "#15803d";
          ctx.beginPath();
          ctx.arc(0, -2, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "barrier": {
          ctx.fillStyle = "#9ca3af";
          ctx.fillRect(-14, -4, 28, 8);
          ctx.strokeStyle = "#6b7280";
          ctx.lineWidth = 1;
          for (let rx = -10; rx <= 10; rx += 7) {
            ctx.beginPath();
            ctx.moveTo(rx, -4);
            ctx.lineTo(rx, 4);
            ctx.stroke();
          }
          break;
        }
      }
      ctx.restore();
    }

    if (trackPoints.length > 0 && isDrawing) {
      const last = trackPoints[trackPoints.length - 1];
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [trackPoints, decorations, activeSurface, trackWidth, isDrawing]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    if (activeTool === "draw") {
      setIsDrawing(true);
      setTrackPoints((prev) => [...prev, pos]);
    } else if (activeTool === "eraser") {
      setTrackPoints((prev) =>
        prev.filter((p) => Math.hypot(p.x - pos.x, p.y - pos.y) > trackWidth),
      );
    } else if (
      ["start", "pitstop", "boost", "grass", "tree", "barrier"].includes(
        activeTool,
      )
    ) {
      setDecorations((prev) => [
        ...prev,
        { type: activeTool as TrackDecoration["type"], x: pos.x, y: pos.y },
      ]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== "draw") return;
    const pos = getCanvasPos(e);
    setTrackPoints((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return [pos];
      const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
      if (dist > 6) return [...prev, pos];
      return prev;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setTrackPoints([]);
    setDecorations([]);
  };

  const handleSave = async () => {
    if (trackPoints.length < 20) {
      toast.error("Draw a longer track before saving!");
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    toast.success(`Track "${trackName}" saved successfully!`);
  };

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    {
      id: "draw",
      label: "Draw Track",
      icon: <MousePointer className="h-4 w-4" />,
    },
    { id: "eraser", label: "Eraser", icon: <Eraser className="h-4 w-4" /> },
    {
      id: "start",
      label: "Start/Finish",
      icon: <MapPin className="h-4 w-4" />,
    },
    { id: "pitstop", label: "Pit Stop", icon: <Wrench className="h-4 w-4" /> },
    { id: "boost", label: "Boost Pad", icon: <Flame className="h-4 w-4" /> },
    {
      id: "grass",
      label: "Grass Patch",
      icon: <span className="text-xs">🌿</span>,
    },
    { id: "tree", label: "Tree", icon: <TreePine className="h-4 w-4" /> },
    {
      id: "barrier",
      label: "Armco Barrier",
      icon: <Minus className="h-4 w-4" />,
    },
  ];

  const surfaces: { id: Surface; label: string; color: string }[] = [
    { id: "asphalt", label: "Asphalt", color: "#2d2d2d" },
    { id: "concrete", label: "Concrete", color: "#9ca3af" },
    { id: "kerb", label: "Kerb", color: "#dc2626" },
  ];

  return (
    <div
      className="flex h-[calc(100vh-4rem)] bg-background"
      data-ocid="track-builder.page"
    >
      {/* Left Toolbar */}
      <aside className="w-56 flex-shrink-0 bg-card border-r border-border flex flex-col gap-2 p-3 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            data-ocid="track-builder.cancel_button"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Tools
        </h2>
        {tools.map((tool) => (
          <button
            type="button"
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            data-ocid={`track-builder.${tool.id}.toggle`}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              activeTool === tool.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tool.icon}
            {tool.label}
          </button>
        ))}

        <Separator className="my-2" />

        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Surface
        </h2>
        {surfaces.map((surface) => (
          <button
            type="button"
            key={surface.id}
            onClick={() => setActiveSurface(surface.id)}
            data-ocid={`track-builder.${surface.id}.toggle`}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              activeSurface === surface.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span
              className="w-4 h-4 rounded-sm border border-border flex-shrink-0"
              style={{ backgroundColor: surface.color }}
            />
            {surface.label}
          </button>
        ))}

        <Separator className="my-2" />

        <div className="px-1">
          <Label className="text-xs text-muted-foreground">Track Width</Label>
          <input
            type="range"
            min={6}
            max={30}
            value={trackWidth}
            onChange={(e) => setTrackWidth(Number(e.target.value))}
            className="w-full mt-1 accent-primary"
            data-ocid="track-builder.width.input"
          />
          <span className="text-xs text-muted-foreground">{trackWidth}px</span>
        </div>

        <Separator className="my-2" />

        <Button
          variant="destructive"
          size="sm"
          onClick={handleClear}
          className="mt-auto"
          data-ocid="track-builder.clear.delete_button"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </aside>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-ocid="track-builder.canvas_target"
          style={{ display: "block" }}
        />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
          {activeTool === "draw"
            ? "Click and drag to draw track"
            : activeTool === "eraser"
              ? "Click to erase track points"
              : `Click to place ${activeTool}`}
        </div>
      </div>

      {/* Right Panel */}
      <aside className="w-60 flex-shrink-0 bg-card border-l border-border flex flex-col gap-4 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            Track Properties
          </h2>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                Track Name
              </Label>
              <Input
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="mt-1 text-sm"
                placeholder="Enter track name"
                data-ocid="track-builder.name.input"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Track Points</span>
                <span className="text-foreground font-mono">
                  {trackPoints.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Decorations</span>
                <span className="text-foreground font-mono">
                  {decorations.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Surface</span>
                <span className="text-foreground capitalize">
                  {activeSurface}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Legend
          </h3>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-base">🏁</span> Start / Finish Line
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 bg-yellow-500 rounded-sm inline-block" />{" "}
              Pit Stop Zone
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 bg-purple-500 rounded-sm inline-block" />{" "}
              Nitro Boost Pad
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 bg-green-700 rounded-full inline-block" />{" "}
              Grass Patch
            </div>
            <div className="flex items-center gap-2">
              <TreePine className="h-3 w-3 text-green-600" /> Tree
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-3 bg-gray-400 rounded-sm inline-block" />{" "}
              Armco Barrier
            </div>
          </div>
        </div>

        <Separator />

        <div className="mt-auto space-y-2">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isSaving || trackPoints.length < 20}
            data-ocid="track-builder.save_button"
          >
            {isSaving ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Track"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Saved tracks appear in race track selection
          </p>
        </div>
      </aside>
    </div>
  );
}
