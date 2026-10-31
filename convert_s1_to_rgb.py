# convert_s1_to_rgb.py
# Converts grayscale S1 patches to 3-channel RGB for CycleGAN
from PIL import Image
import os

trainA = r'C:\Users\Nishi\PyCharmMiscProject\pytorch-CycleGAN-and-pix2pix\datasets\phalodi_sar2ms\trainA'

for fname in os.listdir(trainA):
    if fname.endswith('.png'):
        path = os.path.join(trainA, fname)
        img  = Image.open(path).convert('RGB')
        img.save(path)

print('All S1 patches converted to RGB!')