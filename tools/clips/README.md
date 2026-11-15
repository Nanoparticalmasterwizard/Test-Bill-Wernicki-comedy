# Clip maker for Bill's sets

Turns a video of a set into vertical, captioned, watermarked clips. Scripts do the heavy work. The model only reads one small transcript, writes the clip picks and the caption lines, and looks at one review image.

## Setup (once per machine)

    pip install faster-whisper gdown numpy pillow     # ffmpeg must also be installed

## Per-run procedure

Follow these steps exactly. Do not read `data.json`, do not open the video, and do not extract extra frames unless a check fails.

1. **Get the video.** Sets live in the public Drive folder `10g5rNXmubDjqgPk_hHhDIBWaOV-1ieAQ`. List it, then download one file by id:

       python3 -c "import gdown; [print(f.id, f.path) for f in gdown.download_folder(id='10g5rNXmubDjqgPk_hHhDIBWaOV-1ieAQ', skip_download=True, quiet=True)]"
       gdown <file-id>

2. **Analyze** (about 4 minutes per 5 minutes of video, no model usage):

       python3 tools/clips/clips.py analyze SET.mp4 --out run

3. **Read `run/transcript.txt`** (about 2k tokens for a 5 minute set). Lines look like:

       S33 129.5-133.1 you can flush 10 pool balls through the toilet.
          L22 133.2-133.8 laugh 0.7s +24dB

   `S` lines are sentences, `L` lines are crowd laughs (length and loudness over the room).

4. **Write `run/clips.json`**. Pick 3 to 6 bits. Rules:
   - Start at the sentence that sets the bit up, so it makes sense to someone who has not seen the set.
   - End on the laugh after the punchline (an `L` id), so the laugh tail is kept. Prefer the bigger, longer laughs.
   - Aim for 12 to 60 seconds.
   - If a sentence line starts mid-thought, give seconds instead of an id.

       [
         {"name": "home depot toilet", "start": "S32", "end": "L24"},
         {"name": "mcdonalds", "start": 262.3, "end": "L32"}
       ]

5. **Write the captions.** Run:

       python3 tools/clips/clips.py captions run

   This writes a draft `run/captions.txt` with a `# clip-name` header per clip and the transcriber's words below it. Rewrite the whole file. Each line is one caption card shown on screen, timed automatically to when Bill says it. Rules:
   - Fix words the transcriber got wrong, using context ("Sharon was caring" is "sharing was caring"). Keep Bill's wording otherwise. Do not add or drop sentences.
   - Break lines where Bill would pause: one phrase or clause per card, 3 to 8 words, at most 44 characters.
   - **Never split a punchline across cards.** The punchline gets its own card, and the setup ends on the card before it.
   - Keep the `# clip-name` headers exactly as written.

6. **Render and review** (about 30 seconds per clip, no model usage):

       python3 tools/clips/clips.py render run

   This prints `run/review.txt`. Each clip is `OK` or `CHECK` with a reason (word cut at an edge, no laugh after the last line, short laugh tail, laugh still loud at the cut, bad length, slow start, blurry, captions missing, too long, or not matching the audio).

7. **Look at `run/review.jpg` once.** One row per clip: start, middle, last line, end. Check that Bill is in frame, captions are readable and not covering his face, and the logo sits in the top right.

8. **Fix only what is flagged.** Change `start` or `end` for that clip in `clips.json` (and add or remove that clip's caption lines to match) and run step 6 again. "Short laugh tail" is fine when Bill talks straight over the laugh. Then hand over `run/clips/*.mp4`.

## Template

All look and feel settings are constants at the top of `clips.py`: output size (1080x1920, 30 fps), logo size and position (top right, clear of the captions and of the app buttons), caption font, size and height, padding and fade. The logo is `img/bill-wernicki-logo.png`. Audio is normalized to -14 LUFS.

## Known limits

- Transcription is the `medium.en` Whisper model. It still gets some slang and names wrong, which is why step 5 has the model correct the wording. `--model small.en` is about 3x faster but makes more mistakes.
- Laughs are found as loud stretches where nobody is talking, so a laugh Bill talks over looks shorter than it was.
