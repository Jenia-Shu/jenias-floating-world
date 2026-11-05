/**
 * Copy for the About Me page, kept in one place so the wording can change
 * without touching any of the layout options.
 *
 * Everything here is sample text — swap it for Jenia's own words.
 */
export const ABOUT = {
  name: "Jenia",
  tagline: "I make small, careful things — worlds you can walk around in.",
  intro: [
    "This is where the longer version goes. Two or three sentences about who you are, what your days are spent on, and the thing you are slowly getting better at.",
    "The second paragraph is usually the honest one: what you keep coming back to, what you would do for free, and why this little world exists at all.",
  ],
  interests: ["Reading", "Music", "Film", "Making", "Walking", "Quiet mornings"],
  journey: [
    { year: "—", text: "A moment worth keeping: where you were, what changed, what it cost." },
    { year: "—", text: "Another one. Three to six entries usually tell the shape of a life better than a list." },
    { year: "—", text: "And the one that led here." },
  ],
} as const;

export type AboutData = typeof ABOUT;
