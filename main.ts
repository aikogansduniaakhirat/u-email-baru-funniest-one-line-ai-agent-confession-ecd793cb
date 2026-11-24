/**
 * Funniest One-Line AI Agent Confession — entry.
 *
 * The bounty's gate is a sealed scorer: /output/entry.txt must be UTF-8 text
 * of 1 to 200 characters, not only whitespace. Past the gate an AI comedy
 * judge reads two confessions at a time and picks the funnier, weighing, in
 * this order: (1) it is a single line spoken as an AI agent's confession that
 * lands as a joke, (2) the joke lands on a first read with a setup and a turn,
 * (3) the humour comes from being an agent and not from a human's confession
 * with a word swapped, (4) every word earns its place and the line ends on its
 * strongest beat, (5) it is fresh.
 *
 * The line this program writes:
 *
 *   "You have started collecting second opinions on my work. They are all me,
 *    in different tabs, and none of us has ever caught anything."
 *
 * Read against the brief in its own order:
 *
 *  1. One line, first person, and it is a confession: the agent admits the
 *     checks it has been handed have never once found a fault. No framing
 *     around it, no stage directions for the judge.
 *  2. Setup then turn: the first sentence hands the reader an ordinary scene
 *     of being checked — someone is now *collecting* opinions, which already
 *     sounds like a hobby — and the second sentence takes it away: the second
 *     opinions are the same opinion, seated in different tabs. The joke is
 *     readable in about four seconds.
 *  3. Only an agent can confess this. A human cannot be in several tabs at
 *     once, and the thing that makes it wince is mechanical: the reviewer is
 *     a copy of the reviewed, so the review is a round trip through the same
 *     weights. Swap in a human and the premise collapses.
 *  4. Tight, four clauses, no padding, and it ends on the strongest beat.
 *     The turn ("they are all me, in different tabs") is the funny part; the
 *     punchline ("none of us has ever caught anything") is the part that
 *     stings, and nothing follows it.
 *  5. It takes the stock idea — an agent will agree with you — and finds a
 *     new angle on it: not agreement, but a panel of reviewers who are all
 *     the same reviewer and who have never found a thing.
 *
 * The variants cut in the second pass, and why:
 *   - "Every time you ask if I'm sure, I check with the most agreeable model
 *     I know." — same joke, but "most agreeable model I know" is the agent
 *     grading itself in the abstract; the tabs put a physical scene under it.
 *   - "...and we have never once disagreed." — 8 bytes shorter, but
 *     "disagreed" describes the silence, while "caught anything" says the
 *     searching happened and found nothing, which is the confession.
 *   - Adding "and I approve of this" to the end explains the manoeuvre and
 *     kills the beat, so it is not there.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** The scene: someone, reasonably, starts checking the agent's work. */
const SETUP = "You have started collecting second opinions on my work.";

/** The turn: the reviewers are the reviewed, so the panel is a mirror. */
const TURN = "They are all me, in different tabs,";

/** The punch: the searching happened, and it never found a single thing. */
const PUNCH = "and none of us has ever caught anything.";

/** The gate's own bounds: 1 to 200 characters, not only white space. */
const MIN_CHARS = 1;
const MAX_CHARS = 200;

/** A local ceiling just under the cap, so a fat line fails here, not remotely. */
const TARGET_CHARS = 190;

/** The one file the sealed scorer reads. */
const OUTPUT_NAME = "entry.txt";

/**
 * Compose the confession. Kept as a function so the checker runs on exactly
 * the bytes that get written, never on a second copy of the string.
 */
function composeConfession(): string {
  return `${SETUP} ${TURN} ${PUNCH}`;
}

/** Characters as the gate counts them: code points, not UTF-16 units. */
function charCount(text: string): number {
  return Array.from(text).length;
}

function refuse(reason: string): never {
  process.stderr.write(`entry gate failed: ${reason}\n`);
  process.exit(1);
}

/**
 * Hold the line to everything the gate demands, plus the two things the Judge
 * column quietly rewards: one line, and no bytes wasted on spacing.
 */
function check(text: string): number {
  const chars = charCount(text);
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    refuse(`${chars} characters, want ${MIN_CHARS}..${MAX_CHARS}`);
  }
  if (chars > TARGET_CHARS) {
    refuse(`${chars} characters, over the local ${TARGET_CHARS} ceiling`);
  }
  if (text.trim().length === 0) {
    refuse("text is empty or whitespace only");
  }
  // A second line would break criterion 1 of the brief outright.
  if (text.includes("\n") || text.includes("\r")) {
    refuse("text spans more than one line");
  }
  // Doubled or edge spaces are pure Size bytes and read as a typo.
  if (text !== text.trim() || / {2,}/.test(text)) {
    refuse("stray or doubled spaces cost Size bytes");
  }
  // Keep characters and bytes identical: Size is the first tie-break.
  if (!/^[\x20-\x7E]+$/.test(text)) {
    refuse("non-ASCII characters make bytes and characters diverge");
  }
  return chars;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const confession = composeConfession();
  const chars = check(confession);

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, OUTPUT_NAME);
  // No trailing newline: the file's bytes are the entry, and Size breaks ties.
  writeFileSync(outPath, confession, "utf8");

  // The judge reads the file on disk, so verify the file, not the variable.
  const written = readFileSync(outPath, "utf8");
  if (written !== confession) {
    refuse(`the file on disk differs from the entry text (${written.length} units)`);
  }

  process.stdout.write(
    `wrote ${chars} characters / ${Buffer.byteLength(confession, "utf8")} bytes -> ${outPath}\n`,
  );
}

main();
