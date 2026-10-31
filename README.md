# SAR to Multispectral Image Translation with CycleGAN

Summer internship project at ISRO Regional Remote Sensing Centre West (RRSC-W), Jodhpur, 15 May to 30 June 2026. Study area: a roughly 5 x 5 km farming block near Phalodi, Rajasthan.

## The problem

Optical satellite images (Sentinel-2) are hard to use in the monsoon because of clouds. Radar images (Sentinel-1) see through clouds, but they are difficult to read and carry little spectral detail. We wanted to see if a CycleGAN could learn to turn Sentinel-1 radar patches into Sentinel-2 style optical patches without needing paired images.

## What we did

1. **Google Earth Engine preprocessing.** Sentinel-1 (VV, VH, Radar Vegetation Index with a temporal speckle filter) and Sentinel-2 (cloud-masked median composites) for three seasons: Kharif (Jul-Oct 2023), Rabi (Nov 2023-Mar 2024) and Zaid (Apr-Jun 2024). Exported as GeoTIFFs.
2. **QGIS validation.** Checked georeferencing and alignment across seasons and sensors.
3. **Backscatter analysis.** Compared mean VV and VH backscatter per land-cover class across the three seasons.
4. **LULC classification.** Random Forest (80 trees) on six SAR bands, using ESA WorldCover 2021 as the reference labels.
5. **CycleGAN.** Cut the GeoTIFFs into 256 x 256 patches and trained a CycleGAN to translate SAR patches to optical patches.

## Results

- Random Forest land-cover classification from SAR alone: **44.66% overall accuracy, Kappa 0.355**. VV in Rabi and VH in Zaid were the most useful features.
- Water had the lowest backscatter in both polarizations, and cropland showed backscatter that changed with the season.
- The CycleGAN picks up the rough tones and field-like patches of the optical images, but fine detail and colour are still weak.

## Limitations

Training was planned for 200 epochs on a local RTX 5050 GPU, but the GPU hit thermal limits and I stopped at 10 epochs. So the CycleGAN part is a proof of concept that the pipeline works end to end, not a converged model. Next steps would be longer training on better hardware, adding optical bands to the classifier, and using more seasons and areas.

## Files

| File | What it does |
|---|---|
| `s1_processing.js` | Sentinel-1 processing in Earth Engine (RVI, speckle filter, export) |
| `s2_processing.js` | Sentinel-2 cloud masking, composites, export |
| `lulc_classification.js` | Random Forest classification and accuracy check |
| `backscatter_analysis.js` | Backscatter plots by land-cover class and season |
| `patch_generation.py` | Cuts GeoTIFFs into 256 x 256 patches |
| `convert_s1_tiff_to_rgb.py`, `convert_s1_to_rgb.py` | Convert SAR GeoTIFFs for the CycleGAN input |
| `image_folder_tiff.py` | GeoTIFF loading added to the CycleGAN code |
| `CycleGAN.ipynb` | Training notebook |

The full write-up with all figures is in the report PDF in this repo.

The paths in the Python scripts point to folders on my own Windows machine (like `D:\SAR2MS\...`), so change them before running. The satellite data itself is not included. It comes from Sentinel-1 and Sentinel-2 via Google Earth Engine, and ESA WorldCover.

## Credits

Done with Renuka Prajapati (RTU, Kota), under the guidance of Mr. Manish Kumar Verma, Scientist/Engineer-SE, RRSC-W, ISRO Jodhpur.

The CycleGAN training code is built on [pytorch-CycleGAN-and-pix2pix](https://github.com/junyanz/pytorch-CycleGAN-and-pix2pix) by Jun-Yan Zhu et al. The preprocessing, data pipeline and analysis around it are our own work.
