# convert_s1_tiff_to_rgb.py
# Converts 1-band S1 GeoTIFF patches to 3-band GeoTIFF patches

import rasterio
import numpy as np
import os

trainA = r'D:\SAR2MS\tiff_patches\trainA'

for fname in os.listdir(trainA):

    if fname.endswith('.tif'):

        path = os.path.join(trainA, fname)

        with rasterio.open(path) as src:

            # Read single band
            band = src.read(1)

            # Copy metadata
            profile = src.profile.copy()

            # Repeat same band 3 times
            rgb = np.stack([band, band, band])

            # Update metadata
            profile.update(count=3)

        # Overwrite file with 3 bands
        with rasterio.open(path, 'w', **profile) as dst:
            dst.write(rgb)

print('All S1 TIFF patches converted to 3-band GeoTIFFs!')
import os

print(len(os.listdir(r'D:\SAR2MS\tiff_patches\trainA')))
print(len(os.listdir(r'D:\SAR2MS\tiff_patches\trainB')))

