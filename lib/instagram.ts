const IG_BASE = "https://graph.instagram.com";
const FB_BASE = "https://graph.facebook.com/v19.0";

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  followersCount?: number;
  mediaCount?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  mediaType: string;
  permalink: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
}

export async function getInstagramProfile(accessToken: string): Promise<InstagramProfile | null> {
  try {
    const res = await fetch(`${IG_BASE}/me?fields=id,username,name,biography,followers_count,media_count&access_token=${accessToken}`);
    if (!res.ok) return null;
    const d = await res.json();
    return { id: d.id, username: d.username, name: d.name, biography: d.biography, followersCount: d.followers_count, mediaCount: d.media_count };
  } catch { return null; }
}

export async function getInstagramAnalytics(igUserId: string, accessToken: string): Promise<{ reach: number; impressions: number; engagement: number } | null> {
  try {
    const res = await fetch(`${FB_BASE}/${igUserId}/insights?metric=reach,impressions,profile_views&period=day&access_token=${accessToken}`);
    if (!res.ok) return null;
    const d = await res.json();
    const metrics: Record<string, number> = {};
    (d.data || []).forEach((m: any) => { metrics[m.name] = m.values?.[0]?.value || 0; });
    return { reach: metrics.reach || 0, impressions: metrics.impressions || 0, engagement: metrics.profile_views || 0 };
  } catch { return null; }
}

export async function publishInstagramPost(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  try {
    // Step 1: Create media container
    const containerRes = await fetch(`${FB_BASE}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    if (!containerRes.ok) { const e = await containerRes.json(); return { success: false, error: e.error?.message }; }
    const { id: creationId } = await containerRes.json();

    // Step 2: Publish
    const publishRes = await fetch(`${FB_BASE}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
    });
    if (!publishRes.ok) { const e = await publishRes.json(); return { success: false, error: e.error?.message }; }
    const { id: mediaId } = await publishRes.json();
    return { success: true, mediaId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function getInstagramOAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID || "",
    redirect_uri: redirectUri,
    scope: "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function exchangeInstagramCode(code: string, redirectUri: string): Promise<string | null> {
  try {
    const res = await fetch(`${FB_BASE}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.INSTAGRAM_CLIENT_ID, client_secret: process.env.INSTAGRAM_CLIENT_SECRET, redirect_uri: redirectUri, code }),
    });
    if (!res.ok) return null;
    const { access_token } = await res.json();
    return access_token;
  } catch { return null; }
}
