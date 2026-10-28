"""Workout pictures for the site: trim the transparent border, resize and save as WebP (alpha kept).

    python scripts/make-workout-images.py woman      # E:/kmh-video-gen/assets/raw/ex/woman/<id>.png -> assets/workouts/woman/<id>.webp
    python scripts/make-workout-images.py anatomy    # same for the anatomy character

Only the 30 exercises used on the site (no scenes, no mistakes).
"""
import os
import sys

from PIL import Image

IDS = ('kegelLying kegelSitting kegelStanding breathing bridge bridgeBall singleLegBridge bridgeMarch heelSlides supineMarch '
       'deadBug pelvicTilt kneeFallout clamshell sideLegRaise birdDog catCow plank sidePlank superman childPose happyBaby '
       'butterfly frogStretch hipFlexor squat sumoSquat wallSit lunge ballSqueeze').split()
SRC = 'E:/kmh-video-gen/assets/raw/ex/{}/{}.png'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'workouts', '{}')

char = sys.argv[1]
out_dir = OUT.format(char)
os.makedirs(out_dir, exist_ok=True)
total = 0
for i in IDS:
    src = SRC.format(char, i)
    if not os.path.exists(src):
        print('missing', src)
        continue
    im = Image.open(src).convert('RGBA')
    bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop((max(0, bb[0] - 20), max(0, bb[1] - 20), min(im.width, bb[2] + 20), min(im.height, bb[3] + 20)))
    im.thumbnail((1100, 1100))
    p = os.path.join(out_dir, i + '.webp')
    im.save(p, 'WEBP', quality=80, method=4)
    total += os.path.getsize(p)
print(char, len(os.listdir(out_dir)), 'files', round(total / 1024), 'KB')
