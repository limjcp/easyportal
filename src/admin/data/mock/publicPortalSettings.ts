import type { PublicPortalSettings } from "../../../resident/data/types";

export const seedPublicPortalSettings: PublicPortalSettings = {
  portalThemeColor: "#3278f7",
  subdomain: "wncc87",
  aboutBuilding: "",
  buildingLogoUrl: undefined,
  enableLobbyDisplay: false,
  lobbyDisplayUrl: "https://wncc87.easyportal.ca/communities/login/tv/",
  twitterUrl: "",
  facebookUrl: "https://www.facebook.com/mvpcondo",
  instaUrl: "https://www.instagram.com/mvpcondos/",
  youTubeUrl: "",
};

export const PORTAL_THEME_COLORS = [
  { value: "#71b100", label: "Citrus" },
  { value: "#04aca1", label: "Teal" },
  { value: "#7D5DA8", label: "Purple" },
  { value: "#e98204", label: "Orange" },
  { value: "#9f0404", label: "Red" },
  { value: "#3278f7", label: "Blue" },
  { value: "#92b970", label: "Mint" },
] as const;
