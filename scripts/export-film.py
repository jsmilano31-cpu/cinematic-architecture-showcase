"""Rebuild the MP4 and scroll frames. Requires NumPy, opencv-python and FFmpeg."""
import json
import os
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np

MEDIA = Path(__file__).resolve().parents[1] / "public" / "demo"
FPS, COUNT, DISSOLVE = 24, 372, 12
# Each shot has 72 frames, with the last 12 shared with the following shot.
STRIDE, LENGTH = 60, 72
SHOTS = [
    ("hero", .543, .50),
    ("exterior-2", .55, .50),
    ("exterior-1", .50, .52),
    ("living", .53, .50),
    ("study", .49, .49),
    ("bedroom", .52, .52),
]
FORMATS = {"landscape": (1280, 720), "portrait": (540, 950)}


def shot_frame(images, shot, age, size, portrait):
    image = images[shot]
    height, width = image.shape[:2]
    out_w, out_h = size
    t = min(1, age / (LENGTH - 1))
    scale = max(out_w / width, out_h / height) * (1 + .045 * t)
    x, y = SHOTS[shot][1:] if portrait else (.5, .5)
    # Sample from a continuous affine transform; no integer-size crop steps.
    half_w, half_h = out_w / (2 * scale), out_h / (2 * scale)
    cx = np.clip(width * x, half_w, width - half_w)
    cy = np.clip(height * y, half_h, height - half_h)
    matrix = np.float64([[1 / scale, 0, cx - half_w], [0, 1 / scale, cy - half_h]])
    return cv2.warpAffine(image, matrix, size, flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REPLICATE)


def render(images, index, size, portrait):
    shot = min(index // STRIDE, len(SHOTS) - 1)
    age = index - shot * STRIDE
    frame = shot_frame(images, shot, age, size, portrait)
    if shot and age < DISSOLVE:
        prev = shot_frame(images, shot - 1, age + STRIDE, size, portrait)
        t = age / (DISSOLVE - 1)
        weight = t * t * (3 - 2 * t)
        frame = cv2.addWeighted(prev, 1 - weight, frame, weight, 0)
    return frame


def export():
    cv2.setNumThreads(3)
    images = [cv2.imread(str(MEDIA / (name + ".webp"))) for name, _, _ in SHOTS]
    if any(image is None for image in images):
        raise RuntimeError("Missing source render")
    with tempfile.TemporaryDirectory(dir=MEDIA.parent.parent) as scratch:
        stage = Path(scratch)
        manifest = {"fps": FPS, "count": COUNT}
        for name, size in FORMATS.items():
            folder = stage / name
            folder.mkdir()
            encoder = None
            if name == "landscape":
                encoder = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "rawvideo", "-pixel_format", "bgr24", "-video_size", f"{size[0]}x{size[1]}",
                    "-framerate", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264", "-threads", "3",
                    "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                    str(stage / "film.mp4")], stdin=subprocess.PIPE)
            try:
                for index in range(COUNT):
                    frame = render(images, index, size, name == "portrait")
                    if encoder:
                        encoder.stdin.write(frame.tobytes())
                    if not cv2.imwrite(str(folder / f"{index:03d}.webp"), frame, [cv2.IMWRITE_WEBP_QUALITY, 72]):
                        raise IOError("Could not write frame")
            finally:
                if encoder:
                    encoder.stdin.close()
                    if encoder.wait():
                        raise RuntimeError("FFmpeg encoding failed")
            manifest[name] = {"width": size[0], "height": size[1], "pattern": name + "/{frame}.webp"}
            print(f"Rendered {COUNT} {name} frames", flush=True)
        dest = MEDIA / "sequence"
        for name in FORMATS:
            (dest / name).mkdir(parents=True, exist_ok=True)
            for frame in (stage / name).glob("*.webp"):
                os.replace(frame, dest / name / frame.name)
        os.replace(stage / "film.mp4", MEDIA / "film.mp4")
        (dest / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    export()
