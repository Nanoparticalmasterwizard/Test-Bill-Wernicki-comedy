#!/usr/bin/env python3
"""Turn a stand-up set video into post-ready vertical clips.

  clips.py analyze VIDEO [--out DIR] [--model small.en]
      -> DIR/transcript.txt (compact, for picking clips) and DIR/data.json
  clips.py render DIR
      reads DIR/clips.json, writes DIR/clips/*.mp4, DIR/review.txt, DIR/review.jpg

See README.md in this folder for the full procedure.
"""
import argparse, json, os, re, subprocess, sys, wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "..", "..", "img", "bill-wernicki-logo.png")

# ---- template settings (change here, not per run) ----
W, H, FPS = 1080, 1920, 30
LOGO_SIZE, LOGO_RIGHT, LOGO_TOP, LOGO_OPACITY = 150, 48, 130, 0.9
CAP_FONT, CAP_SIZE, CAP_MARGIN_BOTTOM = "Inter", 76, 430
CAP_MAX_WORDS, CAP_MAX_CHARS = 3, 18
PAD_START, PAD_END, FADE = 0.30, 0.35, 0.25
HOP = 0.05                # seconds per loudness frame
LAUGH_DB, LAUGH_MIN = 8, 0.6   # dB over room floor, min seconds


def sh(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("FAILED: %s\n%s" % (" ".join(cmd[:6]), r.stderr[-1500:]))
    return r.stdout


# ------------------------------------------------------------ analyze
def load_wav(wav):
    with wave.open(wav) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def loudness(a, sr=16000):
    n = int(sr * HOP)
    a = a[: len(a) // n * n].reshape(-1, n)
    return 20 * np.log10(np.sqrt((a ** 2).mean(1)) + 1e-6)


def find_laughs(db, words):
    """Laugh = stretch where nobody is talking but the room is loud."""
    speech = np.zeros(len(db), bool)
    for w in words:
        speech[int(w["s"] / HOP): int(w["e"] / HOP) + 1] = True
    floor = float(np.percentile(db[~speech], 15)) if (~speech).any() else float(db.min())
    loud = (~speech) & (db > floor + LAUGH_DB)
    runs, i = [], 0
    while i < len(loud):
        if loud[i]:
            j = i
            while j < len(loud) and loud[j]:
                j += 1
            runs.append([i, j])
            i = j
        else:
            i += 1
    merged = []
    for r in runs:  # merge runs split by a short dip or a single word
        if merged and (r[0] - merged[-1][1]) * HOP < 0.4:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    laughs = []
    for a, b in merged:
        if (b - a) * HOP >= LAUGH_MIN:
            laughs.append({"s": round(a * HOP, 2), "e": round(b * HOP, 2),
                           "db": round(float(db[a:b].mean() - floor), 1)})
    return floor, laughs


def analyze(a):
    out = a.out or os.path.splitext(a.video)[0] + "_clips"
    os.makedirs(out, exist_ok=True)
    wav = os.path.join(out, "audio.wav")
    sh(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-ac", "1", "-ar", "16000", "-vn", wav])
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=os.cpu_count())
    audio = load_wav(wav)
    segs, _ = model.transcribe(audio, word_timestamps=True, vad_filter=True,
                               condition_on_previous_text=False)
    words = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)}
             for s in segs for w in s.words]
    # sentences: break on end punctuation, on a pause, or at a comma once it gets long
    sents, first = [], 0
    for i, w in enumerate(words):
        last = i == len(words) - 1
        gap = 0 if last else words[i + 1]["s"] - w["e"]
        n = i - first + 1
        if last or re.search(r"[.?!]$", w["w"]) or gap > 0.7 or (n >= 14 and w["w"].endswith(",")) or n >= 28:
            sents.append({"first": first, "last": i})
            first = i + 1
    db = loudness(audio)
    floor, laughs = find_laughs(db, words)
    data = {"video": os.path.abspath(a.video), "floor": round(floor, 1), "words": words,
            "sents": sents, "laughs": laughs, "db": [round(float(x), 1) for x in db]}
    json.dump(data, open(os.path.join(out, "data.json"), "w"))
    # compact transcript: sentences with laughs interleaved
    items = [(words[s["first"]]["s"], "S%d %.1f-%.1f %s" % (
        i, words[s["first"]]["s"], words[s["last"]]["e"],
        " ".join(w["w"] for w in words[s["first"]: s["last"] + 1]))) for i, s in enumerate(sents)]
    items += [(l["s"], "   L%d %.1f-%.1f laugh %.1fs +%ddB" % (i, l["s"], l["e"], l["e"] - l["s"], l["db"]))
              for i, l in enumerate(laughs)]
    with open(os.path.join(out, "transcript.txt"), "w") as f:
        f.write("\n".join(t for _, t in sorted(items)) + "\n")
    os.remove(wav)
    print("wrote %s/transcript.txt: %d lines, %d laughs, %.0fs" % (out, len(items), len(laughs), len(db) * HOP))


# ------------------------------------------------------------ render
def ref_time(ref, d, end):
    """'S12' -> sentence start, 'L5' -> laugh end, or plain seconds."""
    ref = str(ref)
    if ref[0] == "S":
        s = d["sents"][int(ref[1:])]
        return d["words"][s["last"]]["e"] if end else d["words"][s["first"]]["s"]
    if ref[0] == "L":
        l = d["laughs"][int(ref[1:])]
        return l["e"] if end else l["s"]
    return float(ref)


def bounds(c, d):
    words = d["words"]
    s, e = ref_time(c["start"], d, False), ref_time(c["end"], d, True)
    i0 = next((i for i, w in enumerate(words) if w["s"] >= s - 0.01), len(words))
    i1 = max((i for i, w in enumerate(words) if w["e"] <= e + 0.01), default=-1)
    s = max(s - PAD_START, (words[i0 - 1]["e"] + 0.03) if i0 > 0 else 0, 0)
    e = min(e + PAD_END, (words[i1 + 1]["s"] - 0.03) if i1 + 1 < len(words) else 1e9, len(d["db"]) * HOP)
    c["_i"] = (i0, i1)
    return round(s, 2), round(e, 2)


def ass_time(t):
    return "%d:%02d:%05.2f" % (t // 3600, t % 3600 // 60, t % 60)


def write_ass(path, words, s, e):
    head = ("[Script Info]\nScriptType: v4.00+\nPlayResX: %d\nPlayResY: %d\nWrapStyle: 2\n\n"
            "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, "
            "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV\n"
            "Style: C,%s,%d,&H00FFFFFF,&H00000000,&H80000000,1,1,6,2,2,60,60,%d\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Text\n") % (W, H, CAP_FONT, CAP_SIZE, CAP_MARGIN_BOTTOM)
    ws = words
    chunks, cur = [], []
    for w in ws:
        if cur and (len(cur) >= CAP_MAX_WORDS or len(" ".join(x["w"] for x in cur + [w])) > CAP_MAX_CHARS
                    or w["s"] - cur[-1]["e"] > 0.5 or re.search(r"[.?!,]$", cur[-1]["w"])):
            chunks.append(cur)
            cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    lines = []
    for i, ch in enumerate(chunks):
        t0 = ch[0]["s"] - s
        t1 = min(ch[-1]["e"] - s + 0.6, (chunks[i + 1][0]["s"] - s) if i + 1 < len(chunks) else e - s)
        text = " ".join(x["w"] for x in ch).rstrip(",.")
        lines.append("Dialogue: 0,%s,%s,C,%s" % (ass_time(max(t0, 0)), ass_time(t1), text))
    open(path, "w").write(head + "\n".join(lines) + "\n")


def sharpness(img):
    g = np.asarray(img.convert("L"), dtype=np.float32)
    lap = g[1:-1, 1:-1] * 4 - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]
    return float(lap.var())


def render(a):
    from PIL import Image, ImageDraw
    d = json.load(open(os.path.join(a.dir, "data.json")))
    clips = json.load(open(os.path.join(a.dir, "clips.json")))
    out = os.path.join(a.dir, "clips")
    os.makedirs(out, exist_ok=True)
    db, floor, words = np.array(d["db"]), d["floor"], d["words"]
    report, rows = [], []
    for n, c in enumerate(clips, 1):
        s, e = bounds(c, d)
        dur = e - s
        name = "%02d-%s" % (n, re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-"))
        mp4, ass = os.path.join(out, name + ".mp4"), os.path.join(out, name + ".ass")
        write_ass(ass, words[c["_i"][0]: c["_i"][1] + 1], s, e)
        vf = ("[0:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,fps=%d,ass='%s'[v];"
              "[1:v]scale=%d:%d,format=rgba,colorchannelmixer=aa=%s[l];[v][l]overlay=W-w-%d:%d[vo];"
              "[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:d=0.05,afade=t=out:st=%.2f:d=%.2f[ao]") % (
            W, H, W, H, FPS, ass.replace("'", r"\'"), LOGO_SIZE, LOGO_SIZE, LOGO_OPACITY,
            LOGO_RIGHT, LOGO_TOP, dur - FADE, FADE)
        sh(["ffmpeg", "-y", "-v", "error", "-ss", "%.2f" % s, "-t", "%.2f" % dur, "-i", d["video"],
            "-i", LOGO, "-filter_complex", vf, "-map", "[vo]", "-map", "[ao]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-maxrate", "6M", "-bufsize", "12M", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", mp4])
        os.remove(ass)
        # ---- automatic checks ----
        flags = []
        i0, i1 = c.pop("_i")
        inside = words[i0: i1 + 1]
        cut = [w["w"] for w in words[:i0] + words[i1 + 1:] if w["s"] < e and w["e"] > s]
        if cut:
            flags.append("WORD CUT AT EDGE: " + " ".join(cut))
        if not inside:
            flags.append("NO SPEECH")
        last_word = inside[-1]["e"] if inside else s
        tail = e - last_word
        lz = [l for l in d["laughs"] if l["e"] > last_word - 0.3 and l["s"] < e]
        if not lz:
            flags.append("NO LAUGH AFTER LAST LINE")
        elif tail < 1.0:
            flags.append("SHORT LAUGH TAIL %.1fs" % tail)
        end_db = float(db[int((e - 0.3) / HOP): int(e / HOP) + 1].mean() - floor)
        nxt = [w["s"] for w in words if w["s"] >= e]
        if end_db > LAUGH_DB + 4 and not (nxt and nxt[0] - e < 0.2):
            flags.append("LAUGH STILL LOUD AT CUT (+%ddB), room to extend end" % end_db)
        if not 12 <= dur <= 90:
            flags.append("LENGTH %.0fs outside 12-90s" % dur)
        first_gap = (inside[0]["s"] - s) if inside else 0
        if first_gap > 1.2:
            flags.append("SLOW START %.1fs before first word" % first_gap)
        probe = sh(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height",
                    "-of", "csv=p=0", mp4])
        if "%d,%d" % (W, H) not in probe or "audio" not in probe:
            flags.append("BAD OUTPUT FORMAT " + probe.replace("\n", " "))
        # frames for the contact sheet: start, middle, last line, end
        ts = [0.4, dur / 2, min(last_word - s, dur - 0.2), dur - 0.15]
        frames = []
        for t in ts:
            p = os.path.join(out, "_f.jpg")
            sh(["ffmpeg", "-y", "-v", "error", "-ss", "%.2f" % max(t, 0), "-i", mp4, "-frames:v", "1",
                "-vf", "scale=270:480", p])
            frames.append(Image.open(p).copy())
            os.remove(p)
        sharp = min(sharpness(f) for f in frames[:3])
        rows.append((name, frames))
        report.append({"name": name, "s": s, "e": e, "dur": dur, "tail": tail, "end_db": end_db,
                       "sharp": sharp, "flags": flags, "c": c,
                       "first": " ".join(w["w"] for w in inside[:6]), "last": " ".join(w["w"] for w in inside[-8:])})
    med = float(np.median([r["sharp"] for r in report])) if report else 0
    with open(os.path.join(a.dir, "review.txt"), "w") as f:
        for r in report:
            if med and r["sharp"] < 0.5 * med:
                r["flags"].append("POSSIBLY BLURRY (sharpness %d vs typical %d)" % (r["sharp"], med))
            f.write("%s  %s  src %.1f-%.1f  %.0fs  laugh tail %.1fs  end +%ddB\n   starts: %s\n   ends: ...%s\n" % (
                r["name"], "OK" if not r["flags"] else "CHECK", r["s"], r["e"], r["dur"], r["tail"],
                r["end_db"], r["first"], r["last"]))
            for fl in r["flags"]:
                f.write("   ! %s\n" % fl)
    sheet = Image.new("RGB", (270 * 4, (480 + 22) * len(rows)), "black")
    dr = ImageDraw.Draw(sheet)
    for i, (name, frames) in enumerate(rows):
        y = i * 502
        dr.text((4, y + 4), name + "   (start / middle / last line / end)", fill="white")
        for j, fr in enumerate(frames):
            sheet.paste(fr, (j * 270, y + 22))
    sheet.save(os.path.join(a.dir, "review.jpg"), quality=80)
    print(open(os.path.join(a.dir, "review.txt")).read())


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    x = sub.add_parser("analyze"); x.add_argument("video"); x.add_argument("--out"); x.add_argument("--model", default="small.en")
    x = sub.add_parser("render"); x.add_argument("dir")
    a = p.parse_args()
    analyze(a) if a.cmd == "analyze" else render(a)
