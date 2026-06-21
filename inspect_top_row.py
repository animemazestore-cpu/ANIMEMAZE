import cv2
import numpy as np
import os

img_path = 'public/44772.jpg'
if not os.path.exists(img_path):
    img_path = 'img/44772.jpg'

img = cv2.imread(img_path)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, light_mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)

h, w = gray.shape
print(f"Width: {w}, Height: {h}")

# Count of 255s and 0s in the top row
top_row = light_mask[0, :]
print(f"Top row counts: 255 -> {np.sum(top_row == 255)}, 0 -> {np.sum(top_row == 0)}")

# Let's print the top row values at intervals of 100
print("Top row values at intervals of 100:")
print([light_mask[0, x] for x in range(0, w, 100)])
