# Clip maker for Bill's sets

Turns a video of a set into vertical, captioned, watermarked clips. Scripts do the heavy work. The model only reads one small transcript, writes one small JSON file, and looks at one review image.

## Setup (once per machine)

    pip install faster-whisper gdown numpy pillow     # ffmpeg must also be installed

## Per-run procedure

Follow these steps exactly. Do not read `data.json`, do not open the video, and do not extract extra frames unless a check fails.

1. **Get the video.** Sets live in the public Drive folder `10g5rNXmubDjqgPk_hHhDIBWaOV-1ieAQ`. List it, then download one file by id:

       python3 -c "import gdown; [print(f.id, f.path) for f in gdown.download_folder(id='10g5rNXmubDjqgPk_hHhDIBWaOV-1ieAQ', skip_download=True, quiet=True)]"
       gdown <file-id>

2. **Analyze** (about 1 minute per 5 minutes of video, no model usage):

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

5. **Render and review** (about 30 seconds per clip, no model usage):

       python3 tools/clips/clips.py render run

   This prints `run/review.txt`. Each clip is `OK` or `CHECK` with a reason (word cut at an edge, no laugh after the last line, short laugh tail, laugh still loud at the cut, bad length, slow start, blurry).

6. **Look at `run/review.jpg` once.** One row per clip: start, middle, last line, end. Check that Bill is in frame, captions are readable and not covering his face, and the logo sits in the top right.

7. **Fix only what is flagged.** Change `start` or `end` for that clip in `clips.json` and run step 5 again. "Short laugh tail" is fine when Bill talks straight over the laugh. Then hand over `run/clips/*.mp4`.

## Template

All look and feel settings are constants at the top of `clips.py`: output size (1080x1920, 30 fps), logo size and position (top right, clear of the captions and of the app buttons), caption font, size and height, padding and fade. The logo is `img/bill-wernicki-logo.png`. Audio is normalized to -14 LUFS.

## Known limits

- Transcription is the `small.en` Whisper model. It gets slang and names wrong sometimes, and captions show what it heard. Use `--model medium.en` for better captions at about 3x the time. To fix a caption by hand, edit the word in `run/data.json` and render again.
- Laughs are found as loud stretches where nobody is talking, so a laugh Bill talks over looks shorter than it was.
