// LinkedIn API integration for lead scraping and messaging
// Uses LinkedIn Marketing API + People API

export interface LinkedInProfile {
  id: string;
  name: string;
  email?: string;
  title?: string;
  company?: string;
  profileUrl: string;
  avatarUrl?: string;
  industry?: string;
  location?: string;
}

export async function getLinkedInLeads(
  accessToken: string,
  searchQuery: string
): Promise<LinkedInProfile[]> {
  try {
    const res = await fetch(
      `https://api.linkedin.com/v2/search?q=people&keywords=${encodeURIComponent(
        searchQuery
      )}&count=25`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );
    if (!res.ok) throw new Error(`LinkedIn API error: ${res.status}`);
    const data = await res.json();
    return (data.elements || []).map((el: any) => ({
      id: el.id || el.entityUrn,
      name: `${el.firstName?.localized?.en_US || ""} ${el.lastName?.localized?.en_US || ""}`.trim(),
      title: el.headline?.text || "",
      profileUrl: `https://www.linkedin.com/in/${el.publicIdentifier || el.id}`,
      avatarUrl: el.profilePicture?.displayImage || "",
    }));
  } catch (err) {
    console.error("LinkedIn search error:", err);
    return [];
  }
}

export async function getLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile | null> {
  try {
    const [profileRes, emailRes] = await Promise.all([
      fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
    ]);

    const profile = await profileRes.json();
    const emailData = emailRes.ok ? await emailRes.json() : null;
    const email = emailData?.elements?.[0]?.["handle~"]?.emailAddress;

    return {
      id: profile.sub || profile.id,
      name:
        profile.name ||
        `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
      email,
      avatarUrl: profile.picture,
      profileUrl: `https://www.linkedin.com/in/${profile.sub}`,
    };
  } catch (err) {
    console.error("LinkedIn profile error:", err);
    return null;
  }
}

export async function sendLinkedInMessage(
  accessToken: string,
  recipientUrn: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // NOTE: "com.linkedin.voyager.messaging.MessagingMember" is the URN type key.
    // It must be a quoted string in object literals — dots make it an invalid identifier.
    const res = await fetch("https://api.linkedin.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        recipients: {
          values: [
            {
              person: {
                "com.linkedin.voyager.messaging.MessagingMember": {
                  profileUrn: recipientUrn,
                },
              },
            },
          ],
        },
        subject: "",
        body: message,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
