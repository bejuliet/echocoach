export type SportName = "Tennis" | "Ski";

export type CapabilityDefinition = {
  capabilityKey: string;
  label: string;
};

export const SPORT_CAPABILITIES: Record<SportName, readonly CapabilityDefinition[]> = {
  Tennis: [
    { capabilityKey: "forehand", label: "Forehand" },
    { capabilityKey: "backhand", label: "Backhand" },
    { capabilityKey: "serve", label: "Serve" },
    { capabilityKey: "volley", label: "Volley" },
    { capabilityKey: "agility", label: "Agility" },
    { capabilityKey: "eyeHandCoordination", label: "Eye-hand coordination" },
    { capabilityKey: "stamina", label: "Stamina" },
  ],
  Ski: [
    { capabilityKey: "control", label: "Control" },
    { capabilityKey: "turning", label: "Turning" },
    { capabilityKey: "balance", label: "Balance" },
    { capabilityKey: "edges", label: "Edges" },
    { capabilityKey: "movement", label: "Movement" },
    { capabilityKey: "terrainIndependence", label: "Terrain independence" },
  ],
};

export const RATING_SCALE = [
  { rating: 1, label: "Introduced" },
  { rating: 2, label: "Developing" },
  { rating: 3, label: "Functional" },
  { rating: 4, label: "Consistent" },
  { rating: 5, label: "Advanced / Independent" },
] as const;

export function isSupportedSportName(sportName: string): sportName is SportName {
  return sportName in SPORT_CAPABILITIES;
}

export function getSportCapabilities(sportName: string): readonly CapabilityDefinition[] {
  return isSupportedSportName(sportName) ? SPORT_CAPABILITIES[sportName] : [];
}

export function isValidCapabilityKey(sportName: string, capabilityKey: string): boolean {
  return getSportCapabilities(sportName).some(
    (capability) => capability.capabilityKey === capabilityKey,
  );
}
