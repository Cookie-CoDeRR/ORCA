import os
import io
import math
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import numpy as np

# We fetch zoom 3 tiles (8x8 = 64 tiles) to form a high-resolution 2048x2048 Web Mercator image,
# then reproject to 2048x1024 Equirectangular plate carree.
# We fetch zoom 4 tiles (16x16 = 256 tiles) to form a 4K 4096x4096 Web Mercator image,
# then reproject to 4096x2048 Equirectangular plate carree.
Z = 4
N = 1 << Z # 16
TILE_SIZE = 256
MERCATOR_W = N * TILE_SIZE # 4096
MERCATOR_H = N * TILE_SIZE # 4096

print(f"Downloading {N*N} ArcGIS World Imagery tiles at zoom {Z}...")

def download_tile(coord):
    tx, ty = coord
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{ty}/{tx}.jpg"
    req = urllib.request.Request(url, headers={"User-Agent": "ORCA-GIS-Engine/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            img = Image.open(io.BytesIO(data)).convert("RGB")
            return (tx, ty, img)
    except Exception as e:
        print(f"Error downloading tile {tx},{ty}: {e}")
        # Return fallback blank tile
        return (tx, ty, Image.new("RGB", (TILE_SIZE, TILE_SIZE), (10, 25, 50)))

coords = [(x, y) for y in range(N) for x in range(N)]
mercator_img = Image.new("RGB", (MERCATOR_W, MERCATOR_H))

with ThreadPoolExecutor(max_workers=32) as executor:
    results = executor.map(download_tile, coords)
    for tx, ty, tile_img in results:
        mercator_img.paste(tile_img, (tx * TILE_SIZE, ty * TILE_SIZE))

print("All tiles downloaded. Stitching and reprojecting to 4K Equirectangular (4096x2048)...")

# Convert Mercator image to numpy array
merc_arr = np.array(mercator_img)

# Target Equirectangular dimensions (4K)
TARGET_W = 4096
TARGET_H = 2048

# Equirectangular latitudes: +90 to -90 deg
# Web Mercator max valid latitude is ~85.051129 deg
MAX_LAT = 85.05112878

out_arr = np.zeros((TARGET_H, TARGET_W, 3), dtype=np.uint8)

# For each row y in equirectangular image:
lats = np.linspace(90.0, -90.0, TARGET_H)

# Web Mercator Y formula:
# y_norm = (1.0 - (ln(tan(lat_rad) + sec(lat_rad)) / pi)) / 2.0
# clamp latitude between -MAX_LAT and +MAX_LAT
clamped_lats = np.clip(lats, -MAX_LAT, MAX_LAT)
lat_rads = np.radians(clamped_lats)
y_norms = (1.0 - (np.log(np.tan(np.pi / 4.0 + lat_rads / 2.0)) / np.pi)) / 2.0
src_ys = np.clip(y_norms * (MERCATOR_H - 1), 0, MERCATOR_H - 1).astype(int)

# X coordinates map linearly 1:1
src_xs = np.linspace(0, MERCATOR_W - 1, TARGET_W).astype(int)

# Build equirectangular image
for dst_y in range(TARGET_H):
    src_y = src_ys[dst_y]
    out_arr[dst_y, :, :] = merc_arr[src_y, src_xs, :]

# Poles: blend edge rows smoothly to avoid polar pinching artifacts
out_arr[:15, :, :] = out_arr[15:16, :, :] # north pole cap
out_arr[-15:, :, :] = out_arr[-16:-15, :, :] # south pole cap

eq_img = Image.fromarray(out_arr, "RGB")
os.makedirs("public/textures", exist_ok=True)
out_path = "public/textures/world_imagery_base.jpg"
eq_img.save(out_path, quality=92, optimize=True)
print(f"Successfully saved {out_path} ({os.path.getsize(out_path)} bytes)")
