# ============================================================
# SAR2MS — ISRO RRSC-W Jodhpur
# Patch Generation Script
# Cuts GeoTIFFs into 256x256 patches for CycleGAN
# S1 → trainA, S2 → trainB
# ============================================================

import rasterio
import numpy as np
from PIL import Image
import os

# ── PATHS ────────────────────────────────────────────────────
GEE_DIR    = r'D:\SAR2MS\GEE_exports'
TRAIN_A = r'D:\SAR2MS\patches\trainA'
TRAIN_B = r'D:\SAR2MS\patches\trainB'


PATCH_SIZE = 256
STRIDE     = 256  # no overlap
os.makedirs(TRAIN_A, exist_ok=True)
os.makedirs(TRAIN_B, exist_ok=True)


# ── SEASONS ──────────────────────────────────────────────────
seasons = {
    'kharif': {
        's1': os.path.join(GEE_DIR, 'S1_RVI_kharif_phalodi.tif'),
        's2': os.path.join(GEE_DIR, 'S2_kharif_phalodi.tif')
    },
    'rabi': {
        's1': os.path.join(GEE_DIR, 'S1_RVI_rabi_phalodi.tif'),
        's2': os.path.join(GEE_DIR, 'S2_rabi_phalodi.tif')
    },
    'zaid': {
        's1': os.path.join(GEE_DIR, 'S1_RVI_zaid_phalodi.tif'),
        's2': os.path.join(GEE_DIR, 'S2_zaid_phalodi.tif')
    }
}

# ── NORMALIZE FUNCTION ────────────────────────────────────────
def normalize(array, min_val, max_val):
    """Normalize array to 0-255 range"""
    array = np.clip(array, min_val, max_val)
    array = (array - min_val) / (max_val - min_val)
    return (array * 255).astype(np.uint8)

# ── PATCH GENERATION ─────────────────────────────────────────
total_patches = 0

for season, paths in seasons.items():
    print(f'\n── Processing {season.upper()} season ──')

    # Load S1
    with rasterio.open(paths['s1']) as s1_src:
        s1_data = s1_src.read(1).astype(np.float32)  # RVI band
        h, w    = s1_data.shape
        print(f'S1 shape: {h} x {w}')

    # Load S2
    with rasterio.open(paths['s2']) as s2_src:
        # Read RGB bands (B4=Red, B3=Green, B2=Blue)
        b4 = s2_src.read(3).astype(np.float32)  # Red
        b3 = s2_src.read(2).astype(np.float32)  # Green
        b2 = s2_src.read(1).astype(np.float32)  # Blue
        print(f'S2 shape: {b4.shape[0]} x {b4.shape[1]}')

    # Resize S2 to match S1 if needed
    if b4.shape != s1_data.shape:
        from PIL import Image as PILImage
        b4 = np.array(PILImage.fromarray(b4).resize(
            (w, h), PILImage.BILINEAR))
        b3 = np.array(PILImage.fromarray(b3).resize(
            (w, h), PILImage.BILINEAR))
        b2 = np.array(PILImage.fromarray(b2).resize(
            (w, h), PILImage.BILINEAR))

    # Normalize S1 (RVI range 0-1)
    s1_norm = normalize(s1_data, 0, 1)

    # Normalize S2 (reflectance range 0-0.3)
    r_norm = normalize(b4, 0, 0.3)
    g_norm = normalize(b3, 0, 0.3)
    b_norm = normalize(b2, 0, 0.3)

    # Stack S2 into RGB
    s2_rgb = np.stack([r_norm, g_norm, b_norm], axis=2)

    # ── CUT INTO PATCHES ─────────────────────────────────────
    season_patches = 0

    for y in range(0, h - PATCH_SIZE + 1, STRIDE):
        for x in range(0, w - PATCH_SIZE + 1, STRIDE):

            # Extract patches
            s1_patch = s1_norm[y:y+PATCH_SIZE, x:x+PATCH_SIZE]
            s2_patch = s2_rgb[y:y+PATCH_SIZE, x:x+PATCH_SIZE, :]

            # Skip mostly black/empty patches
            if np.mean(s1_patch) < 5 or np.mean(s1_patch) > 250:
                continue
            if np.mean(s2_patch) < 5:
                continue

            # Save patches
            patch_name = f'{season}_{y:04d}_{x:04d}.png'

            # S1 → trainA (grayscale)
            s1_img = Image.fromarray(s1_patch, mode='L')
            s1_img.save(os.path.join(TRAIN_A, patch_name))

            # S2 → trainB (RGB)
            s2_img = Image.fromarray(s2_patch, mode='RGB')
            s2_img.save(os.path.join(TRAIN_B, patch_name))

            season_patches += 1

    print(f'{season.upper()}: {season_patches} patches generated!')
    total_patches += season_patches

print(f'\n✅ DONE! Total patches: {total_patches}')
print(f'trainA: {TRAIN_A}')
print(f'trainB: {TRAIN_B}')

import os
from PIL import Image
import numpy as np

trainA = r'D:\SAR2MS\patches\trainA'
trainB = r'D:\SAR2MS\patches\trainB'

files_a = os.listdir(trainA)
files_b = os.listdir(trainB)

print(f'trainA patches: {len(files_a)}')
print(f'trainB patches: {len(files_b)}')
print(f'Names match: {sorted(files_a) == sorted(files_b)}')

# Check first patch
img_a = Image.open(os.path.join(trainA, files_a[0]))
img_b = Image.open(os.path.join(trainB, files_b[0]))
print(f'S1 patch size: {img_a.size}, mode: {img_a.mode}')
print(f'S2 patch size: {img_b.size}, mode: {img_b.mode}')