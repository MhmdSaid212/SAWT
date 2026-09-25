from pathlib import Path
import shutil
import subprocess

STORAGE_DIR = Path("storage/audio")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def save_audio(file, filename: str):
    file_path = STORAGE_DIR / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return str(file_path.resolve())


def get_audio_duration(file_path: str) -> float:
    import subprocess
    import re

    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration:stream=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                file_path,
            ],
            capture_output=True,
            text=True,
        )

        print("FFPROBE OUTPUT:", result.stdout)
        print("FFPROBE ERROR:", result.stderr)

        for line in result.stdout.splitlines():
            line = line.strip()

            if line and line.lower() != "n/a":
                try:
                    duration = float(line)

                    if duration > 0:
                        return round(duration, 2)
                except ValueError:
                    pass

        # Fallback: ask ffmpeg directly
        result = subprocess.run(
            [
                "ffmpeg",
                "-i",
                file_path,
            ],
            capture_output=True,
            text=True,
        )

        match = re.search(
            r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",
            result.stderr,
        )

        if match:
            hours = int(match.group(1))
            minutes = int(match.group(2))
            seconds = float(match.group(3))

            duration = (
                hours * 3600
                + minutes * 60
                + seconds
            )

            if duration > 0:
                return round(duration, 2)

    except Exception as error:
        print("AUDIO DURATION ERROR:", error)

    return 0.0