#app.py

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
import subprocess
import tempfile
import os
import io

app = FastAPI()

@app.get("/home")
def read_url():
    return {"message": "Hello World"}

@app.post("/resize")
async def resize_image(file: UploadFile = File(...)):
    # Create temporary files for input and output
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as input_file:
        input_path = input_file.name
        input_file.write(await file.read())
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as output_file:
        output_path = output_file.name
    
    # Run the resize script
    try:
        subprocess.run(["python", "resize.py", input_path, output_path], check=True)
    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to resize image: {e}"}
    
    # Read the resized image
    with open(output_path, "rb") as f:
        image_data = f.read()
    
    # Clean up temporary files
    os.remove(input_path)
    os.remove(output_path)
    
    # Return the image as a response
    return StreamingResponse(io.BytesIO(image_data), media_type="image/jpeg")

@app.get("/getresize")
async def resize_image2():
    # Create temporary files for input and output
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as input_file:
        input_path = input_file.name
        input_file.write(await file.read())
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as output_file:
        output_path = output_file.name
    
    # Run the resize script
    try:
        subprocess.run(["python", "resize.py", input_path, output_path], check=True)
    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to resize image: {e}"}
    """
    
    # Read the resized image
    with open("/app/test2.jpg", "rb") as f:
        image_data = f.read()
    
    # Clean up temporary files
    #os.remove(input_path)
    #os.remove(output_path)
    
    # Return the image as a response
    return StreamingResponse(io.BytesIO(image_data), media_type="image/jpeg")
