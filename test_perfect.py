import cv2
import numpy as np
import os

img_path = 'public/44772.jpg'
if not os.path.exists(img_path):
    img_path = 'img/44772.jpg'

img = cv2.imread(img_path)
h, w, c = img.shape
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold to get initial foreground mask (dark pixels <= 170 are foreground)
_, fg_mask = cv2.threshold(gray, 170, 255, cv2.THRESH_BINARY_INV)

# Find contours with hierarchy
# RETR_CCOMP retrieves all contours and organizes them into a two-level hierarchy:
# - Level 1: external boundaries of components
# - Level 2: boundaries of the holes inside components
contours, hierarchy = cv2.findContours(fg_mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

# Create a clean foreground mask
fg_clean = np.zeros_like(fg_mask)

if hierarchy is not None:
    hierarchy = hierarchy[0]
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        
        # Check if it's a hole (hierarchy[i][3] != -1 means it has a parent, so it's a hole)
        is_hole = hierarchy[i][3] != -1
        
        if is_hole:
            # It is a hole inside a character (e.g. white shirt, white hair)
            # If the hole is small (< 80,000 pixels), we fill it to make it solid/opaque
            if area < 80000:
                cv2.drawContours(fg_clean, [contour], -1, 255, -1)
        else:
            # It is an external boundary of a character or brush stroke
            # Only keep relatively large components to avoid speckles/noise
            if area > 1000:
                cv2.drawContours(fg_clean, [contour], -1, 255, -1)

# Now apply a Gaussian blur to get a smooth alpha transition at the edges
fg_smooth = cv2.GaussianBlur(fg_clean, (15, 15), 0)

# Build the RGBA image
b, g, r = cv2.split(img)
rgba = cv2.merge([b, g, r, fg_smooth])

# Save inspection copy
inspect_rgba = cv2.resize(rgba, (800, int(800 * h / w)))
artifact_path = r'C:\Users\Vashu\.gemini\antigravity\brain\066a33d5-8db4-40a3-8887-60575b1310ec\hero_bg_perfect_test.png'
cv2.imwrite(artifact_path, inspect_rgba)
print("Saved perfect test image to:", artifact_path)
