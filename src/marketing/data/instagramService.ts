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
  video_url?: string;
  thumbnail_src?: string;
  display_url?: string;
  taken_at_timestamp?: number;
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

type OEmbedResponse = {
  thumbnail_url?: string;
};

function mapReelNode(node: IgMediaNode): InstagramReel {
  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text?.split("\n")[0]?.trim();
  return {
    shortcode: node.shortcode,
    permalink: `https://www.instagram.com/reel/${node.shortcode}/`,
    caption: caption ? caption.slice(0, 140) : undefined,
    videoUrl: node.video_url,
    thumbnailUrl: node.thumbnail_src ?? node.display_url,
    takenAt: node.taken_at_timestamp,
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
  }

  reels.sort((a, b) => (b.takenAt ?? 0) - (a.takenAt ?? 0));
  return reels.slice(0, REEL_LIMIT);
}

async function fetchOEmbedThumbnail(permalink: string): Promise<string | undefined> {
  const query = `url=${encodeURIComponent(permalink)}`;
  const oembedUrl = import.meta.env.DEV
    ? `/api/instagram-oembed/oembed?${query}`
    : `https://api.instagram.com/oembed?${query}`;

  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) return undefined;
    const data = (await response.json()) as OEmbedResponse;
    return data.thumbnail_url;
  } catch {
    return undefined;
  }
}

async function enrichReelsWithThumbnails(reels: InstagramReel[]): Promise<InstagramReel[]> {
  return Promise.all(
    reels.map(async (reel) => {
      if (reel.thumbnailUrl) return reel;
      const thumbnailUrl = await fetchOEmbedThumbnail(reel.permalink);
      return thumbnailUrl ? { ...reel, thumbnailUrl } : reel;
    })
  );
}

export async function fetchInstagramReels(): Promise<InstagramReel[]> {
  const profilePath = `/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`;
  const url = import.meta.env.DEV
    ? `/api/instagram${profilePath}`
    : `https://www.instagram.com/api/v1${profilePath}`;

  let reels: InstagramReel[] = INSTAGRAM_REELS_FALLBACK;

  try {
    const response = await fetch(url, {
      headers: import.meta.env.DEV
        ? undefined
        : {
            "X-IG-App-ID": IG_APP_ID,
            "User-Agent": "Instagram 219.0.0.12.117 Android",
          },
    });

    if (response.ok) {
      const data = (await response.json()) as IgProfileResponse;
      const parsed = parseReelsFromProfile(data);
      if (parsed.length > 0) {
        reels = parsed;
      }
    }
  } catch {
    // use fallback
  }

  return enrichReelsWithThumbnails(reels);
}
