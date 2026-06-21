import cv2
import numpy as np
import os

def process_hero_image():
    img_path = 'public/44772.jpg'
    if not os.path.exists(img_path):
        img_path = 'img/44772.jpg'
        
    if not os.path.exists(img_path):
        print("Error: Source image not found")
        return
        
    print("Loading image...")
    # Load image using OpenCV
    img = cv2.imread(img_path) # BGR
    h, w, c = img.shape
    print(f"Image dimensions: {w}x{h}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # We want to identify the light background.
    # The light background is gray/white (intensity > 100).
    # Let's create a binary mask of light pixels.
    _, light_mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)
    
    # We will perform flood fill from the top border, left border, and right border
    # to find the connected outer background.
    flood_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    
    print("Running flood fill from borders...")
    # Seed from top border
    for x in range(0, w, 10):
        if light_mask[0, x] == 255:
            cv2.floodFill(light_mask, flood_mask, (x, 0), 128, loDiff=5, upDiff=5, flags=8)
            
    # Seed from left border
    for y in range(0, h, 10):
        if light_mask[y, 0] == 255:
            cv2.floodFill(light_mask, flood_mask, (0, y), 128, loDiff=5, upDiff=5, flags=8)
            
    # Seed from right border
    for y in range(0, h, 10):
        if light_mask[y, w-1] == 255:
            cv2.floodFill(light_mask, flood_mask, (w-1, y), 128, loDiff=5, upDiff=5, flags=8)
            
    # The pixels filled with 128 are the connected outer light background.
    outer_bg = (light_mask == 128).astype(np.uint8) * 255
    
    # Dilate the outer background mask slightly to get clean edges around characters
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    outer_bg_dilated = cv2.dilate(outer_bg, kernel, iterations=2)
    
    # Smooth the mask to avoid jagged edges
    outer_bg_smooth = cv2.GaussianBlur(outer_bg_dilated, (15, 15), 0)
    
    # Create the alpha channel:
    # 255 (opaque) for foreground, 0 (transparent) for outer background.
    alpha = 255 - outer_bg_smooth
    
    # Let's apply a general edge fade to the entire image.
    # We want a smooth gradient at the top, bottom, left, and right edges.
    # Let's define the fade margins (in pixels)
    fade_x = int(w * 0.15) # 15% width fade on left/right
    fade_y_top = int(h * 0.12) # 12% height fade on top
    fade_y_bottom = int(h * 0.10) # 10% height fade on bottom
    
    print(f"Applying edge fade margins: x={fade_x}, y_top={fade_y_top}, y_bottom={fade_y_bottom}")
    
    # Create a 2D float gradient mask
    grad_x = np.ones(w, dtype=np.float32)
    grad_y = np.ones(h, dtype=np.float32)
    
    # Left fade
    grad_x[:fade_x] = np.linspace(0.0, 1.0, fade_x)
    # Right fade
    grad_x[w-fade_x:] = np.linspace(1.0, 0.0, fade_x)
    
    # Top fade
    grad_y[:fade_y_top] = np.linspace(0.0, 1.0, fade_y_top)
    # Bottom fade (make it fade to black/transparent at the bottom)
    grad_y[h-fade_y_bottom:] = np.linspace(1.0, 0.0, fade_y_bottom)
    
    # Combine into 2D grid
    grid_x, grid_y = np.meshgrid(grad_x, grad_y)
    edge_mask = grid_x * grid_y
    
    # Apply edge_mask to the alpha channel
    alpha_float = alpha.astype(np.float32) / 255.0
    final_alpha = (alpha_float * edge_mask * 255.0).astype(np.uint8)
    
    # Build the final BGRA image
    b, g, r = cv2.split(img)
    rgba = cv2.merge([b, g, r, final_alpha])
    
    # Save output
    output_path = 'public/hero_bg.png'
    cv2.imwrite(output_path, rgba)
    print(f"Processed image saved to: {output_path}")
    
    # Also save a smaller copy to the brain folder for viewing
    brain_dir = r'C:\Users\Vashu\AppData\Roaming\npm\node_modules\antigravity' # wait, the prompt says the artifacts folder is C:\Users\Vashu\.gemini\antigravity\brain\066a33d5-8db4-40a3-8887-60575b1310ec
    artifact_path = r'C:\Users\Vashu\.gemini\antigravity\brain\066a33d5-8db4-40a3-8887-60575b1310ec\hero_bg_processed.png'
    
    # Resize for quick inspection (800 width)
    inspect_rgba = cv2.resize(rgba, (800, int(800 * h / w)))
    cv2.imwrite(artifact_path, inspect_rgba)
    print(f"Inspection copy saved to: {artifact_path}")

if __name__ == '__main__':
    process_hero_image()
