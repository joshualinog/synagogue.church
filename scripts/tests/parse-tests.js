const { parsePassage } = require("../bible-utils");

const tests = [
  {
    in: "Leviticus 27:16 - 27:34",
    wantLen: 1,
    wantStart: { book: "Leviticus", startChapter: 27, startVerse: 16 },
  },
  {
    in: "Matthew 28:16-20",
    wantLen: 1,
    wantStart: { book: "Matthew", startChapter: 28, startVerse: 16 },
  },
  {
    in: "John 3:16",
    wantLen: 1,
    wantStart: { book: "John", startChapter: 3, startVerse: 16 },
  },
  {
    in: "Psalm 23",
    wantLen: 1,
    wantStart: { book: "Psalm", startChapter: 23, startVerse: 1 },
  },
  {
    in: "Romans 8:28-9:1",
    wantLen: 1,
    wantStart: { book: "Romans", startChapter: 8, startVerse: 28 },
    wantEnd: { endChapter: 9, endVerse: 1 },
  },
  { in: "Genesis 1:1-5, 2:1-3", wantLen: 2 },
  {
    in: "1 Corinthians 13:1-13",
    wantLen: 1,
    wantStart: { book: "1 Corinthians", startChapter: 13, startVerse: 1 },
  },
  // additional edge cases
  {
    in: "Matt 1:1-2:5",
    wantLen: 1,
    wantStart: { book: "Matthew", startChapter: 1, startVerse: 1 },
    wantEnd: { endChapter: 2, endVerse: 5 },
  },
  { in: "Ps 119:160-120:8", wantLen: 1 },
  {
    in: "Song of Solomon 2:1-7",
    wantLen: 1,
    wantStart: { book: "Song of Solomon", startChapter: 2, startVerse: 1 },
  },
  {
    in: "1 Sam 17:1-50",
    wantLen: 1,
    wantStart: { book: "1 Samuel", startChapter: 17, startVerse: 1 },
  },
];

module.exports = tests;
