import os
from PIL import Image
import numpy as np

os.makedirs("public/textures", exist_ok=True)

# Load specular mask (water = 255, land = 0)
from PIL import ImageFilter
spec_img = Image.open("public/textures/earth_specular.jpg").convert("L")
WIDTH, HEIGHT = 4096, 2048
mask_img = spec_img.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)

# Remove 8x8 JPEG compression block artifacts with heavy Gaussian blur
spec_clean = mask_img.filter(ImageFilter.GaussianBlur(radius=8))
spec_arr = np.array(spec_clean, dtype=np.float32) / 255.0
water_binary = (spec_arr > 0.25).astype(np.float32)
mask = water_binary > 0.5

# Smooth coastal feathering for soft alpha blending
smooth_water = Image.fromarray((water_binary * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=6))
smooth_mask = np.array(smooth_water, dtype=np.float32) / 255.0
WATER_ALPHA = (smooth_mask * 150).astype(np.uint8)

# Coordinate grids for equirectangular projection
# Lat: +90 to -90, Lon: -180 to +180
lats = np.linspace(90, -90, HEIGHT)[:, None]
lons = np.linspace(-180, 180, WIDTH)[None, :]

# Distance to Indian Ocean Center (15N, 75E)
dist_arabian = np.sqrt(((lats - 18.0) / 20.0)**2 + ((lons - 70.0) / 25.0)**2)
dist_bengal  = np.sqrt(((lats - 14.0) / 20.0)**2 + ((lons - 88.0) / 25.0)**2)

# -------------------------------------------------------------
# 1. SST THERMAL RASTER (Sea Surface Temperature)
# Base tropical warmth (24°C - 32°C) with cold upwelling tongue off Somalia/Oman
# and warm pool in Eastern Arabian Sea & Bay of Bengal
# -------------------------------------------------------------
print("Generating SST Thermal Raster...")
# Base temperature based on latitude
base_temp = 29.5 * np.cos(np.radians(lats))**0.7
# Add regional oceanographic features:
# Warm pool in North Indian Ocean
warm_pool = 2.2 * np.exp(-dist_arabian*1.2) + 2.0 * np.exp(-dist_bengal*1.2)
# Coastal upwelling cold tongue off Somalia (Lat 5-12, Lon 48-55) & Oman
upwelling_somalia = -4.2 * np.exp(-(((lats - 9.0) / 4.0)**2 + ((lons - 52.0) / 5.0)**2))
upwelling_kerala  = -1.8 * np.exp(-(((lats - 10.0) / 3.0)**2 + ((lons - 75.5) / 2.0)**2))

sst_field = base_temp + warm_pool + upwelling_somalia + upwelling_kerala
# Normalize between 0 (cool ~20°C) and 1 (hot ~33°C) for tropical focus
norm_sst = np.clip((sst_field - 18.0) / 14.0, 0.0, 1.0)

# Colormap: Deep Blue (0.0) -> Cyan (0.3) -> Green (0.5) -> Yellow (0.7) -> Orange (0.85) -> Deep Red (1.0)
def apply_sst_colormap(val):
    # val shape (H, W)
    r = np.zeros_like(val)
    g = np.zeros_like(val)
    b = np.zeros_like(val)

    # 0.0 - 0.25: dark blue to cyan
    m1 = val < 0.25
    t1 = val[m1] / 0.25
    r[m1] = 10 + 10 * t1
    g[m1] = 30 + 170 * t1
    b[m1] = 120 + 120 * t1

    # 0.25 - 0.50: cyan to green
    m2 = (val >= 0.25) & (val < 0.50)
    t2 = (val[m2] - 0.25) / 0.25
    r[m2] = 20 + 30 * t2
    g[m2] = 200 + 30 * t2
    b[m2] = 240 * (1 - t2) + 40 * t2

    # 0.50 - 0.75: green to yellow-orange
    m3 = (val >= 0.50) & (val < 0.75)
    t3 = (val[m3] - 0.50) / 0.25
    r[m3] = 50 + 200 * t3
    g[m3] = 230 - 20 * t3
    b[m3] = 40 * (1 - t3) + 10 * t3

    # 0.75 - 1.0: orange to deep crimson red
    m4 = val >= 0.75
    t4 = (val[m4] - 0.75) / 0.25
    r[m4] = 250 + 5 * t4
    g[m4] = 210 * (1 - t4) + 20 * t4
    b[m4] = 10 + 20 * t4

    return np.stack([r, g, b], axis=-1).astype(np.uint8)

sst_rgb = apply_sst_colormap(norm_sst)
sst_rgba = np.dstack([sst_rgb, WATER_ALPHA])
Image.fromarray(sst_rgba, "RGBA").save("public/textures/sst_raster.png", optimize=True)
print("Saved sst_raster.png")

# -------------------------------------------------------------
# 2. CHLOROPHYLL-A BLOOM RASTER
# Phytoplankton blooms: high concentrations (>3.0 mg/m³) along coasts,
# river deltas (Ganges/Indus), upwelling zones, low (<0.1) in open ocean
# -------------------------------------------------------------
print("Generating Chlorophyll Bloom Raster...")
# Base open-ocean oligotrophic background (deep navy blue, low chl)
chl_base = 0.05 + 0.08 * np.sin(np.radians(np.abs(lats)))

# Coastal plumes along India's coastline
# Gujarat Saurashtra & Gulf of Khambhat (20.5-22.5N, 69-72E)
plume_gujarat = 3.8 * np.exp(-(((lats - 21.2) / 2.0)**2 + ((lons - 70.8) / 2.5)**2))
# Konkan / Malabar coast upwelling (9-16N, 73-76E)
plume_malabar = 3.2 * np.exp(-(((lats - 12.0) / 3.5)**2 + ((lons - 74.5) / 2.0)**2))
# Indus River delta plume (23.5N, 67.5E)
plume_indus   = 4.2 * np.exp(-(((lats - 23.8) / 1.8)**2 + ((lons - 67.8) / 2.0)**2))
# Ganges-Brahmaputra Bengal delta plume (21-23N, 88-91E)
plume_bengal  = 4.8 * np.exp(-(((lats - 21.8) / 2.2)**2 + ((lons - 89.5) / 3.0)**2))
# Coromandel / Godavari plume (16.5N, 82.5E)
plume_east    = 2.8 * np.exp(-(((lats - 16.5) / 2.5)**2 + ((lons - 82.5) / 2.2)**2))
# Sri Lanka south upwelling (5.5N, 80.5E)
plume_srilanka= 2.6 * np.exp(-(((lats - 5.8) / 1.5)**2 + ((lons - 80.5) / 2.0)**2))

chl_field = chl_base + plume_gujarat + plume_malabar + plume_indus + plume_bengal + plume_east + plume_srilanka
# Logarithmic scaling typical for Chlorophyll-a (0.05 to 5.0 mg/m³)
norm_chl = np.clip(np.log10(chl_field + 0.1) / 0.8, 0.0, 1.0)

def apply_chl_colormap(val):
    # Deep indigo -> Cyan -> Emerald Green -> Lime -> Gold -> Red bloom peaks
    r = np.zeros_like(val)
    g = np.zeros_like(val)
    b = np.zeros_like(val)

    # Low chl (<0.2): deep indigo / cobalt
    m1 = val < 0.2
    t1 = val[m1] / 0.2
    r[m1] = 6 + 10 * t1
    g[m1] = 20 + 80 * t1
    b[m1] = 80 + 90 * t1

    # Moderate chl (0.2 - 0.5): cobalt to vibrant teal/cyan
    m2 = (val >= 0.2) & (val < 0.5)
    t2 = (val[m2] - 0.2) / 0.3
    r[m2] = 16 + 10 * t2
    g[m2] = 100 + 120 * t2
    b[m2] = 170 - 40 * t2

    # High chl (0.5 - 0.8): emerald green to bright lime
    m3 = (val >= 0.5) & (val < 0.8)
    t3 = (val[m3] - 0.5) / 0.3
    r[m3] = 26 + 180 * t3
    g[m3] = 220 + 25 * t3
    b[m3] = 130 * (1 - t3) + 15 * t3

    # Peak bloom (0.8 - 1.0): lime to intense gold / coral
    m4 = val >= 0.8
    t4 = (val[m4] - 0.8) / 0.2
    r[m4] = 206 + 45 * t4
    g[m4] = 245 - 90 * t4
    b[m4] = 15 + 10 * t4

    return np.stack([r, g, b], axis=-1).astype(np.uint8)

chl_rgb = apply_chl_colormap(norm_chl)
chl_rgba = np.dstack([chl_rgb, WATER_ALPHA])
Image.fromarray(chl_rgba, "RGBA").save("public/textures/chlorophyll_raster.png", optimize=True)
print("Saved chlorophyll_raster.png")

# -------------------------------------------------------------
# 3. OCEAN CURRENTS HYDRODYNAMIC VELOCITY RASTER
# Eulerian velocity magnitude field (Somali Jet, Monsoon Drift, Equatorial currents)
# -------------------------------------------------------------
print("Generating Currents Velocity Raster...")
# Somali Jet (Lat 0-15N, Lon 45-60E, high velocity up to 2.0 m/s)
somali_jet = 1.9 * np.exp(-(((lats - 8.0) / 6.0)**2 + ((lons - 52.0) / 7.0)**2))
# Southwest Monsoon Current (curving across southern tip of India towards Bay of Bengal)
monsoon_current = 1.4 * np.exp(-(((lats - 6.0) / 4.0)**2 + ((lons - 78.0) / 16.0)**2))
# Gulf Stream (Atlantic) & Kuroshio (Pacific) for global realism
gulf_stream = 1.8 * np.exp(-(((lats - 35.0) / 6.0)**2 + ((lons - (-65.0)) / 14.0)**2))
kuroshio     = 1.7 * np.exp(-(((lats - 32.0) / 6.0)**2 + ((lons - 138.0) / 12.0)**2))
# Equatorial counter-current
eq_current   = 0.7 * np.exp(-(((lats - 0.0) / 3.0)**2))

current_speed = 0.15 + somali_jet + monsoon_current + gulf_stream + kuroshio + eq_current
norm_speed = np.clip(current_speed / 2.0, 0.0, 1.0)

def apply_currents_colormap(val):
    # Midnight blue -> Electric Cyan -> Bright Neon Blue -> Magenta/Violet for highest speeds
    r = np.zeros_like(val)
    g = np.zeros_like(val)
    b = np.zeros_like(val)

    m1 = val < 0.3
    t1 = val[m1] / 0.3
    r[m1] = 5 + 10 * t1
    g[m1] = 20 + 90 * t1
    b[m1] = 60 + 130 * t1

    m2 = (val >= 0.3) & (val < 0.65)
    t2 = (val[m2] - 0.3) / 0.35
    r[m2] = 15 + 45 * t2
    g[m2] = 110 + 135 * t2
    b[m2] = 190 + 55 * t2

    m3 = val >= 0.65
    t3 = (val[m3] - 0.65) / 0.35
    r[m3] = 60 + 180 * t3
    g[m3] = 245 * (1 - t3) + 30 * t3
    b[m3] = 245

    return np.stack([r, g, b], axis=-1).astype(np.uint8)

curr_rgb = apply_currents_colormap(norm_speed)
curr_rgba = np.dstack([curr_rgb, WATER_ALPHA])
Image.fromarray(curr_rgba, "RGBA").save("public/textures/currents_raster.png", optimize=True)
print("Saved currents_raster.png")

# -------------------------------------------------------------
# 4. BATHYMETRIC DEPTH RELIEF RASTER
# Shallow shelf (<200m) in vibrant turquoise/cyan, abyssal depths in deep navy
# -------------------------------------------------------------
print("Generating Bathymetry Relief Raster...")
# Invert distance to coast/land to simulate shelf vs abyssal depth
blurred_land = np.array(Image.fromarray((~mask).astype(np.uint8)*255).filter(ImageFilter.GaussianBlur(radius=7)))
shallow_shelf = (blurred_land > 20) & mask

# Deep trenches / ridges
ridge_carlsberg = 0.3 * np.exp(-(((lats - 2.0) / 8.0)**2 + ((lons - 64.0) / 5.0)**2))
trench_java     = 0.6 * np.exp(-(((lats - (-9.0)) / 3.0)**2 + ((lons - 110.0) / 10.0)**2))

bathy_val = np.where(shallow_shelf, 0.85, 0.25) + ridge_carlsberg - trench_java
bathy_norm = np.clip(bathy_val, 0.0, 1.0)

def apply_bathy_colormap(val):
    # Deep Abyssal (0.0): Dark Indigo -> Continental Rise (0.4): Royal Blue -> Shelf (0.8+): Turquoise/Aquamarine
    r = np.zeros_like(val)
    g = np.zeros_like(val)
    b = np.zeros_like(val)

    m1 = val < 0.4
    t1 = val[m1] / 0.4
    r[m1] = 4 + 8 * t1
    g[m1] = 18 + 42 * t1
    b[m1] = 60 + 90 * t1

    m2 = (val >= 0.4) & (val < 0.75)
    t2 = (val[m2] - 0.4) / 0.35
    r[m2] = 12 + 18 * t2
    g[m2] = 60 + 120 * t2
    b[m2] = 150 + 60 * t2

    m3 = val >= 0.75
    t3 = (val[m3] - 0.75) / 0.25
    r[m3] = 30 + 50 * t3
    g[m3] = 180 + 55 * t3
    b[m3] = 210 + 35 * t3

    return np.stack([r, g, b], axis=-1).astype(np.uint8)

bathy_rgb = apply_bathy_colormap(bathy_norm)
bathy_rgba = np.dstack([bathy_rgb, WATER_ALPHA])
Image.fromarray(bathy_rgba, "RGBA").save("public/textures/bathymetry_raster.png", optimize=True)
print("Saved bathymetry_raster.png")
print("Saved bathymetry_raster.png")
print("ALL 4 RASTERS GENERATED SUCCESSFULLY!")
