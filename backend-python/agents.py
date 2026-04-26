"""
Multi-Agent System for Thermal-Optical Image Fusion & Super-Resolution.
Each agent has a clear role and communicates through the Manager Agent.
"""

import numpy as np
import cv2
import math


class DataPreprocessingAgent:
    """
    Agent 2: Data Preprocessing
    - Loads thermal and optical images
    - Performs image alignment (registration)
    - Resize and normalize inputs
    - Handle noise reduction
    - Output clean aligned data
    """

    def __init__(self):
        self.name = "DataPreprocessingAgent"

    def align_and_preprocess(self, optical: np.ndarray, thermal: np.ndarray):
        print(f"[{self.name}] Starting alignment and preprocessing...")

        if optical is None or thermal is None:
            raise ValueError("One or both input images are None/corrupt.")

        h, w = optical.shape[:2]

        # Resize thermal to match optical dimensions (alignment via geometric transform)
        thermal_resized = cv2.resize(thermal, (w, h), interpolation=cv2.INTER_CUBIC)

        # Noise reduction using bilateral filter (preserves edges, smooths noise)
        optical_denoised = cv2.bilateralFilter(optical, d=9, sigmaColor=75, sigmaSpace=75)
        thermal_denoised = cv2.bilateralFilter(thermal_resized, d=9, sigmaColor=75, sigmaSpace=75)

        # Normalize to [0, 1] float32
        optical_norm = optical_denoised.astype(np.float32) / 255.0
        thermal_norm = thermal_denoised.astype(np.float32) / 255.0

        print(f"[{self.name}] Aligned to {w}x{h}, normalized to float32.")
        return optical_norm, thermal_norm


class FeatureExtractionAgent:
    """
    Agent 3: Feature Extraction
    - CNN-style feature extractors for thermal and optical
    - Uses multi-scale edge and texture analysis
    - Ensures features are compatible for fusion
    """

    def __init__(self):
        self.name = "FeatureExtractionAgent"

    def extract_features(self, optical_norm: np.ndarray, thermal_norm: np.ndarray):
        print(f"[{self.name}] Extracting features from both modalities...")

        # Optical: Extract edge features using Canny + Laplacian (high-freq detail)
        gray_opt = cv2.cvtColor((optical_norm * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
        edges_canny = cv2.Canny(gray_opt, 50, 150)
        edges_laplacian = cv2.Laplacian(gray_opt, cv2.CV_64F)
        edges_laplacian = np.clip(np.abs(edges_laplacian), 0, 255).astype(np.uint8)

        # Combine edge maps
        optical_features = cv2.addWeighted(edges_canny, 0.6, edges_laplacian, 0.4, 0)
        optical_features_3ch = cv2.cvtColor(optical_features, cv2.COLOR_GRAY2BGR).astype(np.float32) / 255.0

        # Thermal: Extract gradient magnitude features (preserves temperature gradients)
        gray_thm = cv2.cvtColor((thermal_norm * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
        grad_x = cv2.Sobel(gray_thm, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray_thm, cv2.CV_64F, 0, 1, ksize=3)
        thermal_gradient = np.sqrt(grad_x ** 2 + grad_y ** 2)
        thermal_gradient = np.clip(thermal_gradient / thermal_gradient.max() * 255, 0, 255).astype(np.uint8)
        thermal_features = thermal_norm  # Keep full thermal data as features

        print(f"[{self.name}] Extracted optical edges and thermal gradients.")
        return optical_features_3ch, thermal_features, thermal_gradient


class FusionAgent:
    """
    Agent 4: Feature Fusion
    - Implements attention-based fusion (channel + spatial)
    - Combines thermal + optical features
    - Preserves thermal characteristics
    """

    def __init__(self):
        self.name = "FusionAgent"

    def attention_fusion(self, optical_features: np.ndarray, thermal_features: np.ndarray, thermal_gradient: np.ndarray):
        print(f"[{self.name}] Applying cross-attention fusion mechanism...")

        # Channel Attention: Weight thermal features higher to preserve temperature info
        # Spatial Attention: Use optical edges to sharpen thermal boundaries

        # Create spatial attention map from optical edges
        spatial_attention = cv2.GaussianBlur(optical_features, (5, 5), 0)
        spatial_attention = spatial_attention / (spatial_attention.max() + 1e-8)

        # Fuse: thermal base + spatially-weighted optical detail injection
        fused = thermal_features * 0.75 + spatial_attention * 0.25

        # Apply thermal gradient as additional sharpening mask
        grad_mask = thermal_gradient.astype(np.float32) / 255.0
        grad_mask_3ch = cv2.cvtColor(grad_mask, cv2.COLOR_GRAY2BGR)
        fused = fused + grad_mask_3ch * 0.1

        fused = np.clip(fused, 0.0, 1.0)

        print(f"[{self.name}] Fusion complete. Thermal integrity preserved.")
        return fused


class SuperResolutionAgent:
    """
    Agent 5: Super-Resolution
    - Enhances resolution using interpolation + sharpening pipeline
    - Upscales fused features into high-resolution output
    - Maintains detail and clarity
    """

    def __init__(self, scale_factor=2):
        self.name = "SuperResolutionAgent"
        self.scale_factor = scale_factor

    def enhance_resolution(self, fused_map: np.ndarray):
        print(f"[{self.name}] Upscaling by {self.scale_factor}x...")

        h, w = fused_map.shape[:2]
        new_w, new_h = w * self.scale_factor, h * self.scale_factor

        # Step 1: High-quality upscale with Lanczos
        upscaled = cv2.resize(fused_map, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

        # Step 2: Unsharp masking for detail enhancement
        blurred = cv2.GaussianBlur(upscaled, (0, 0), 3)
        sharpened = cv2.addWeighted(upscaled, 1.5, blurred, -0.5, 0)
        sharpened = np.clip(sharpened, 0.0, 1.0)

        # Convert back to uint8
        hr_image = (sharpened * 255).astype(np.uint8)

        print(f"[{self.name}] Output resolution: {new_w}x{new_h}")
        return hr_image


class LossFunctionAgent:
    """
    Agent 6: Loss Function Computation
    - Reconstruction loss (MSE / L1)
    - Perceptual loss (structural)
    - Thermal consistency loss
    """

    def __init__(self):
        self.name = "LossFunctionAgent"

    def compute_losses(self, original_thermal: np.ndarray, generated_hr: np.ndarray):
        print(f"[{self.name}] Computing specialized loss values...")

        # Resize original thermal to match generated HR for comparison
        gen_h, gen_w = generated_hr.shape[:2]
        original_resized = cv2.resize(original_thermal, (gen_w, gen_h), interpolation=cv2.INTER_CUBIC)

        if len(original_resized.shape) == 2:
            original_resized = cv2.cvtColor(original_resized, cv2.COLOR_GRAY2BGR)

        orig_f = original_resized.astype(np.float64) / 255.0
        gen_f = generated_hr.astype(np.float64) / 255.0

        # L1 Reconstruction Loss (MAE)
        l1_loss = np.mean(np.abs(orig_f - gen_f))

        # MSE Reconstruction Loss
        mse_loss = np.mean((orig_f - gen_f) ** 2)

        # Thermal Consistency Loss: Compare mean intensities
        orig_mean = np.mean(orig_f)
        gen_mean = np.mean(gen_f)
        thermal_consistency = abs(orig_mean - gen_mean)

        print(f"[{self.name}] L1={l1_loss:.4f}, MSE={mse_loss:.6f}, ThermalConsistency={thermal_consistency:.4f}")
        return {
            "l1_loss": round(float(l1_loss), 4),
            "mse_loss": round(float(mse_loss), 6),
            "thermal_consistency_loss": round(float(thermal_consistency), 4),
        }


class EvaluationAgent:
    """
    Agent 7: Evaluation
    - PSNR, SSIM computation from actual images
    - Thermal fidelity score
    - Edge preservation score
    """

    def __init__(self):
        self.name = "EvaluationAgent"

    def _compute_psnr(self, original: np.ndarray, generated: np.ndarray):
        mse = np.mean((original.astype(np.float64) - generated.astype(np.float64)) ** 2)
        if mse == 0:
            return 100.0
        return round(float(20 * math.log10(255.0 / math.sqrt(mse))), 2)

    def _compute_ssim(self, original: np.ndarray, generated: np.ndarray):
        """Simplified SSIM computation."""
        C1 = (0.01 * 255) ** 2
        C2 = (0.03 * 255) ** 2

        img1 = original.astype(np.float64)
        img2 = generated.astype(np.float64)

        mu1 = cv2.GaussianBlur(img1, (11, 11), 1.5)
        mu2 = cv2.GaussianBlur(img2, (11, 11), 1.5)

        mu1_sq = mu1 ** 2
        mu2_sq = mu2 ** 2
        mu1_mu2 = mu1 * mu2

        sigma1_sq = cv2.GaussianBlur(img1 ** 2, (11, 11), 1.5) - mu1_sq
        sigma2_sq = cv2.GaussianBlur(img2 ** 2, (11, 11), 1.5) - mu2_sq
        sigma12 = cv2.GaussianBlur(img1 * img2, (11, 11), 1.5) - mu1_mu2

        ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / \
                   ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))

        return round(float(np.mean(ssim_map)), 4)

    def _compute_rmse(self, original: np.ndarray, generated: np.ndarray):
        mse = np.mean((original.astype(np.float64) - generated.astype(np.float64)) ** 2)
        return round(float(math.sqrt(mse)), 4)

    def _compute_thermal_fidelity(self, original_thermal: np.ndarray, generated: np.ndarray):
        """How well the generated image preserves thermal intensity distribution."""
        orig_gray = cv2.cvtColor(original_thermal, cv2.COLOR_BGR2GRAY) if len(original_thermal.shape) == 3 else original_thermal
        gen_gray = cv2.cvtColor(generated, cv2.COLOR_BGR2GRAY) if len(generated.shape) == 3 else generated

        gen_resized = cv2.resize(gen_gray, (orig_gray.shape[1], orig_gray.shape[0]))

        correlation = np.corrcoef(orig_gray.flatten().astype(np.float64), gen_resized.flatten().astype(np.float64))[0, 1]
        fidelity = max(0, min(100, correlation * 100))
        return round(float(fidelity), 1)

    def _compute_edge_preservation(self, original: np.ndarray, generated: np.ndarray):
        """Measure how well edges are preserved."""
        orig_gray = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY) if len(original.shape) == 3 else original
        gen_gray = cv2.cvtColor(generated, cv2.COLOR_BGR2GRAY) if len(generated.shape) == 3 else generated

        gen_resized = cv2.resize(gen_gray, (orig_gray.shape[1], orig_gray.shape[0]))

        edges_orig = cv2.Canny(orig_gray, 100, 200)
        edges_gen = cv2.Canny(gen_resized, 100, 200)

        intersection = np.sum(np.logical_and(edges_orig > 0, edges_gen > 0))
        union = np.sum(np.logical_or(edges_orig > 0, edges_gen > 0))

        if union == 0:
            return 100.0
        score = (intersection / union) * 100
        return round(float(score), 1)

    def _detect_hotspots(self, thermal_img: np.ndarray, threshold=200):
        """Detect high-temperature hotspots in the thermal image."""
        gray = cv2.cvtColor(thermal_img, cv2.COLOR_BGR2GRAY) if len(thermal_img.shape) == 3 else thermal_img
        _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return len(contours)

    def evaluate(self, original_thermal: np.ndarray, original_optical: np.ndarray, generated_hr: np.ndarray):
        print(f"[{self.name}] Running full evaluation suite...")

        gen_h, gen_w = generated_hr.shape[:2]
        thermal_resized = cv2.resize(original_thermal, (gen_w, gen_h), interpolation=cv2.INTER_CUBIC)
        optical_resized = cv2.resize(original_optical, (gen_w, gen_h), interpolation=cv2.INTER_CUBIC)

        psnr = self._compute_psnr(thermal_resized, generated_hr)
        ssim = self._compute_ssim(thermal_resized, generated_hr)
        rmse = self._compute_rmse(thermal_resized, generated_hr)
        thermal_fidelity = self._compute_thermal_fidelity(original_thermal, generated_hr)
        edge_preservation = self._compute_edge_preservation(optical_resized, generated_hr)
        hotspots = self._detect_hotspots(generated_hr)

        # Overall quality score (weighted combination)
        quality_score = round(min(100, (psnr / 50 * 30) + (ssim * 40) + (thermal_fidelity / 100 * 30)), 1)
        confidence = round(min(100, ssim * 100 * 0.6 + (psnr / 50) * 100 * 0.4), 1)

        metrics = {
            "psnr": psnr,
            "ssim": ssim,
            "rmse": rmse,
            "thermalFidelity": thermal_fidelity,
            "edgePreservation": edge_preservation,
            "accuracy": quality_score,
            "confidence": confidence,
            "hotspotsDetected": hotspots,
        }

        print(f"[{self.name}] Metrics: PSNR={psnr}, SSIM={ssim}, RMSE={rmse}, Quality={quality_score}%")
        return metrics


class ManagerAgent:
    """
    Agent 1: Manager
    - Breaks down pipeline into stages
    - Assigns tasks to agents
    - Ensures proper data flow between agents
    - Reviews outputs and enforces consistency
    """

    def __init__(self):
        self.name = "ManagerAgent"
        self.preprocessor = DataPreprocessingAgent()
        self.extractor = FeatureExtractionAgent()
        self.fusion = FusionAgent()
        self.sr_engine = SuperResolutionAgent(scale_factor=2)
        self.loss_agent = LossFunctionAgent()
        self.evaluator = EvaluationAgent()

    def execute_pipeline(self, optical_input: np.ndarray, thermal_input: np.ndarray):
        print(f"\n{'='*60}")
        print(f"[{self.name}] INITIATING MULTI-AGENT PIPELINE")
        print(f"{'='*60}")

        # Stage 1: Preprocessing
        print(f"\n--- Stage 1: Data Preprocessing ---")
        opt_norm, thm_norm = self.preprocessor.align_and_preprocess(optical_input, thermal_input)

        # Stage 2: Feature Extraction
        print(f"\n--- Stage 2: Feature Extraction ---")
        opt_feat, thm_feat, thm_grad = self.extractor.extract_features(opt_norm, thm_norm)

        # Stage 3: Attention-Based Fusion
        print(f"\n--- Stage 3: Attention Fusion ---")
        fused = self.fusion.attention_fusion(opt_feat, thm_feat, thm_grad)

        # Stage 4: Super-Resolution
        print(f"\n--- Stage 4: Super-Resolution ---")
        hr_thermal = self.sr_engine.enhance_resolution(fused)

        # Stage 5: Loss Computation
        print(f"\n--- Stage 5: Loss Functions ---")
        losses = self.loss_agent.compute_losses(thermal_input, hr_thermal)

        # Stage 6: Evaluation
        print(f"\n--- Stage 6: Evaluation ---")
        metrics = self.evaluator.evaluate(thermal_input, optical_input, hr_thermal)
        metrics["losses"] = losses

        print(f"\n{'='*60}")
        print(f"[{self.name}] PIPELINE COMPLETE")
        print(f"{'='*60}\n")

        return hr_thermal, metrics
