export function speakerEditions(speakers, year) {
  if (!year)
    return {
      pastSpeakers: speakers,
      featuredSpeakers: speakers.filter((speaker) => speaker.is_featured),
    };
  return {
    pastSpeakers: speakers.filter(
      (speaker) => !speaker.event_year || Number(speaker.event_year) < Number(year),
    ),
    featuredSpeakers: speakers.filter(
      (speaker) => Number(speaker.event_year) === Number(year) && speaker.is_featured,
    ),
  };
}
