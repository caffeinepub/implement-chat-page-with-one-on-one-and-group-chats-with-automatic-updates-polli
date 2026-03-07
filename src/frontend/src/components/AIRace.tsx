import AIRaceTrack from "./AIRaceTrack";

interface AIRaceProps {
  onExit: () => void;
}

export default function AIRace({ onExit }: AIRaceProps) {
  return <AIRaceTrack onBack={onExit} />;
}
