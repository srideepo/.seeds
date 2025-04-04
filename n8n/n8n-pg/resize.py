# resize.py
from PIL import Image
import argparse

def resize_image(input_path, output_path, size=1000):
    # Open the original image
    original_image = Image.open(input_path)
    width, height = original_image.size
    
    # Calculate new dimensions while preserving aspect ratio
    ratio = min(size / width, size / height)
    new_width = int(width * ratio)
    new_height = int(height * ratio)
    
    # Resize the image
    resized_image = original_image.resize((new_width, new_height), Image.LANCZOS)
    
    # Create a white 1000x1000 background and paste the resized image
    final_image = Image.new("RGB", (size, size), (255, 255, 255))
    offset_x = (size - new_width) // 2
    offset_y = (size - new_height) // 2
    final_image.paste(resized_image, (offset_x, offset_y))
    
    # Save the result
    final_image.save(output_path)
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Resize image to 1000x1000")
    parser.add_argument("input_image", help="Path to input image")
    parser.add_argument("output_image", help="Path to output image")
    args = parser.parse_args()
    resize_image(args.input_image, args.output_image)