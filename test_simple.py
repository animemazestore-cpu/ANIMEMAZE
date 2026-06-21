import cv2
import numpy as np
import os

img_path = 'public/44772.jpg'
if not os.path.exists(img_path):
    img_path = 'img/44772.jpg'

img = cv2.imread(img_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold: pixels < 210 are opaque (255), >= 210 are transparent (0)
# Let's try 210, which should cover most of the white background
_, alpha = cv2.threshold(gray, 210, 255, cv2.THRESH_BINARY_INV)

# Smooth the alpha mask
alpha_smooth = cv2.GaussianBlur(alpha, (9, 9), 0)

# Build RGBA
b, g, r = cv2.split(img)
rgba = cv2.merge([b, g, r, alpha_smooth])

# Save inspection image
inspect_rgba = cv2.resize(rgba, (800, int(800 * h / w)))
artifact_path = r'C:\Users\Vashu\.gemini\antigravity\brain\066a33d5-8db4-40a3-8887-60575b1310ec\hero_bg_simple_test.png'
cv2.imwrite(artifact_path, inspect_rgba)
print("Saved simple threshold test image to:", artifact_path)
