"""
Python AI Service — FastAPI
Receives image URLs from Node.js backend, runs Multi-Agent pipeline,
uploads result to Cloudinary, returns actual computed metrics.
"""

import os
import time
import requests
import numpy as np
import cv2
import cloudinary
import cloudinary.uploader
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from agents import ManagerAgent

# Load environment variables
# Look in current dir and then in backend-node dir
load_dotenv()
if not os.environ.get("CLOUDINARY_CLOUD_NAME"):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend-node", ".env"))

app = FastAPI(title="Stellar VisionX AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", "demo"),
    api_key=os.environ.get("CLOUDINARY_API_KEY", "demo"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", "demo"),
)


class FusionRequest(BaseModel):
    session_id: str
    optical_url: str
    thermal_url: str


def download_image(url: str) -> np.ndarray:
    """Download an image from a URL and decode it into a NumPy array."""
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    image_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
    img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Failed to decode image from {url}")
    return img


@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "python-ai",
        "timestamp": time.time(),
        "gpu_available": False,
    }


@app.post("/process-fusion")
async def process_fusion(req: FusionRequest):
    try:
        start_time = time.time()
        print(f"\n[FastAPI] Received fusion request for session: {req.session_id}")
        print(f"  Optical URL: {req.optical_url}")
        print(f"  Thermal URL: {req.thermal_url}")

        # 1. Download images from Cloudinary URLs
        print("  Downloading images...")
        optical = download_image(req.optical_url)
        thermal = download_image(req.thermal_url)

        # 2. Run the full Multi-Agent pipeline
        manager = ManagerAgent()
        result_img, metrics = manager.execute_pipeline(
            optical_input=optical, thermal_input=thermal
        )

        processing_time_ms = int((time.time() - start_time) * 1000)
        metrics["processingTimeMs"] = processing_time_ms

        # 3. Upload result image to Cloudinary
        tmp_path = f"result_{req.session_id}.jpg"
        cv2.imwrite(tmp_path, result_img)

        upload_resp = cloudinary.uploader.upload(
            tmp_path, folder="visionx_results", resource_type="image"
        )
        result_url = upload_resp.get("secure_url")

        # 4. Generate heatmap and upload
        heatmap = generate_heatmap(result_img)
        heatmap_path = f"heatmap_{req.session_id}.jpg"
        cv2.imwrite(heatmap_path, heatmap)
        heatmap_upload = cloudinary.uploader.upload(
            heatmap_path, folder="visionx_heatmaps", resource_type="image"
        )
        heatmap_url = heatmap_upload.get("secure_url")

        # 5. Analyze thermal data for alert system
        thermal_analysis = analyze_thermal_data(result_img)

        # Cleanup temp files
        for f in [tmp_path, heatmap_path]:
            if os.path.exists(f):
                os.remove(f)

        return {
            "session_id": req.session_id,
            "result_url": result_url,
            "heatmap_url": heatmap_url,
            "metrics": metrics,
            "thermal_analysis": thermal_analysis,
        }

    except Exception as e:
        print(f"[FastAPI] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_heatmap(image: np.ndarray) -> np.ndarray:
    """Generate a thermal heatmap from the processed image."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
    return heatmap


def analyze_thermal_data(thermal_image: np.ndarray, min_temp: float = 15.0, max_temp: float = 80.0) -> dict:
    """
    Analyze thermal image to extract temperature data.
    Maps pixel intensities (0-255) to a simulated temperature range.
    Returns max, min, avg temperatures and hotspot regions.
    """
    gray = cv2.cvtColor(thermal_image, cv2.COLOR_BGR2GRAY) if len(thermal_image.shape) == 3 else thermal_image

    # Map pixel intensities to temperature range
    temp_map = gray.astype(np.float64) / 255.0 * (max_temp - min_temp) + min_temp

    max_detected = round(float(np.max(temp_map)), 1)
    min_detected = round(float(np.min(temp_map)), 1)
    avg_detected = round(float(np.mean(temp_map)), 1)

    # Detect hotspot regions (pixels above 70th percentile of the temp range)
    hotspot_threshold_pixel = int(0.7 * 255)
    _, binary = cv2.threshold(gray, hotspot_threshold_pixel, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    hotspot_regions = []
    for i, contour in enumerate(contours[:20]):  # Limit to 20 hotspots
        x, y, w, h = cv2.boundingRect(contour)
        if w * h < 25:  # Skip tiny noise regions
            continue
        # Get peak temperature in this region
        region = temp_map[y:y+h, x:x+w]
        peak = round(float(np.max(region)), 1)
        hotspot_regions.append({
            "id": i + 1,
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "peak_temp": peak,
        })

    return {
        "max_temp": max_detected,
        "min_temp": min_detected,
        "avg_temp": avg_detected,
        "hotspot_regions": hotspot_regions,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
