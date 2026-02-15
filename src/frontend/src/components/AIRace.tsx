import AIRaceTrack from './AIRaceTrack';

interface AIRaceProps {
  onExit: () => void;
}

export default function AIRace({ onExit }: AIRaceProps) {
  return <AIRaceTrack onExit={onExit} />;
}
