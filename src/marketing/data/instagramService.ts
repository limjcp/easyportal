import {
  INSTAGRAM_REELS_FALLBACK,
  INSTAGRAM_USERNAME,
  type InstagramReel,
} from "./instagramReels";

const IG_APP_ID = "936619743392459";
const REEL_LIMIT = 12;

type IgMediaNode = {
  shortcode: string;
  is_video?: boolean;
  product_type?: string;
  edge_media_to_caption?: { edges?: { node: { text: string } }[] };
};

type IgProfileResponse = {
  data?: {
    user?: {
      edge_owner_to_timeline_media?: { edges?: { node: IgMediaNode }[] };
      edge_felix_video_timeline?: { edges?: { node: IgMediaNode }[] };
    };
  };
};

function mapReelNode(node: IgMediaNode): InstagramReel {
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text?.split("\n")[0]?.trim();
  return {
    shortcode: node.shortcode,
    permalink: `https://www.instagram.com/reel/${node.shortcode}/`,
    caption: caption ? caption.slice(0, 140) : undefined,
  };
}

function parseReelsFromProfile(data: IgProfileResponse): InstagramReel[] {
  const user = data.data?.user;
  if (!user) return [];

  const timeline = user.edge_owner_to_timeline_media?.edges ?? [];
  const igtv = user.edge_felix_video_timeline?.edges ?? [];
  const seen = new Set<string>();
  const reels: InstagramReel[] = [];

  for (const edge of [...timeline, ...igtv]) {
    const node = edge.node;
    if (!node.is_video || seen.has(node.shortcode)) continue;
    seen.add(node.shortcode);
    reels.push(mapReelNode(node));
    if (reels.length >= REEL_LIMIT) break;
  }

  return reels;
}

export async function fetchInstagramReels(): Promise<InstagramReel[]> {
  const profilePath = `/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`;
  const url = import.meta.env.DEV
    ? `/api/instagram${profilePath}`
    : `https://www.instagram.com/api/v1${profilePath}`;

  try {
    const response = await fetch(url, {
      headers: import.meta.env.DEV
        ? undefined
        : {
            "X-IG-App-ID": IG_APP_ID,
            "User-Agent": "Instagram 219.0.0.12.117 Android",
          },
    });

    if (!response.ok) {
      return INSTAGRAM_REELS_FALLBACK;
    }

    const data = (await response.json()) as IgProfileResponse;
    const reels = parseReelsFromProfile(data);
    return reels.length > 0 ? reels : INSTAGRAM_REELS_FALLBACK;
  } catch {
    return INSTAGRAM_REELS_FALLBACK;
  }
}
