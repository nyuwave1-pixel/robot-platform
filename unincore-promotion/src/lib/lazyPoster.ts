/**
 * Set a video's poster only when it is about to scroll into view (and is actually displayed),
 * so posters far down the page don't compete with the first screen. Returns a cleanup function.
 */
export function lazyPoster(video: HTMLVideoElement | null, poster: string | undefined, rootMargin = "800px"): () => void {
  if (!video || !poster) return () => {};
  if (!("IntersectionObserver" in window)) {
    video.poster = poster;
    return () => {};
  }
  const io = new IntersectionObserver(
    ([entry]) => {
      // A video hidden with CSS (e.g. the other breakpoint's variant) never intersects, so it never loads a poster.
      if (entry.isIntersecting) {
        video.poster = poster;
        io.disconnect();
      }
    },
    { rootMargin },
  );
  io.observe(video);
  return () => io.disconnect();
}
