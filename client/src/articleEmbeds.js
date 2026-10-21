// Only canonical provider URLs are emitted; arbitrary embed HTML is never accepted.
export function articleEmbed(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
      id =
        url.pathname === '/watch'
          ? url.searchParams.get('v')
          : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1];
    }
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      return { provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (['instagram.com', 'www.instagram.com'].includes(host)) {
      const post =
        url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/(?:embed\/?)?$/) ||
        url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)$/);
      if (post)
        return { provider: 'Instagram', src: `https://www.instagram.com/${post[1]}/${post[2]}/embed/` };
    }
  } catch {
    /* Invalid URL. */
  }
  return null;
}
