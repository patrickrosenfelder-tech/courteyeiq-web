# CourtEyeIQ Whitepaper v3.2 — Jun 2026

> **Version:** 3.2 · **Date:** 2026-06-30 · **Status:** Live product in active development
> Replaces: CourtIQ Whitepaper v3.1 (Jun 11, 2026). Product and company renamed CourtIQ → **CourtEyeIQ** (2026-06-25).

---

## 1. Problem

Pro-level tennis analytics — ball tracking, in/out calls, match grading — exist only inside broadcast systems costing hundreds of thousands of dollars. Club and recreational players have nothing. Coaches rely on memory and manual video review.

The technology gap is not capability. TrackNetV2, homography, and triangulation are all proven techniques. The gap is cost, complexity, and hardware. Hawkeye requires 10 calibrated cameras, a server room, and a full-time operator. No recreational club can afford it.

---

## 1b. Project history

CourtIQ (now CourtEyeIQ) was initiated in **April 2026** by solo founder Patrick Rosenfelder, an Austrian citizen and active tennis/pickleball player. The project began with full Notion infrastructure setup, a Master LLM Context Doc built from a live Vercel site, a Git workflow, and a deployed PWA. The CV pipeline was validated early against the public TrackNet dataset, and iOS Spike 8 (Swift TrackNet preprocessing) passed after fixing frame ordering, pixel offset, BGR channel order, normalization, and vImage-based frame scaling bugs. A 29-clip validation dataset was built across 15 scenarios.

**Key milestones since:**

- **April–May 2026:** Core CV pipeline built — ball tracker (ROI filter, trajectory filter, heatmap detection), MediaPipe pose integration, game state machine (99 tests), sync engine (audio cross-correlation, 62.5µs precision), N-player Re-ID, scoring engine.
- **June 2026:** Dual-camera simulation and validation (267 triangulated positions, 26 bounces, 11 IN / 15 OUT on forehand clip); sync engine validated across iPhone + Xiaomi + Mac. Pickleball generalization confirmed with zero fine-tuning. Comprehensive Notion workspace audit (API key exposure found and remediated, SSD backup, whitepaper updated to v3.1). Hardware roadmap designed (three-tier camera stick product ladder). Multi-agent workflow established (Paperclip CEO/CV Engineer agents, Gemini research agent, OpenRouter agents removed after unexpected charges).
- **Late June 2026:** Product rebranded CourtIQ → **CourtEyeIQ**; domain, social handles, and dedicated Vercel project secured. Court detection pipeline rebuilt from manual calibration to a trained YOLO11n-pose model. CourtEyeIQ Clipper shipped V1–V13 and pivoted to a V2 full-pipeline architecture after real-world testing showed ball-only detection was insufficient.

Throughout, the project has been built solo with an AI multi-agent pipeline (Claude, Paperclip/Claude Code, Codex, Gemini) rather than a traditional engineering team — a structural part of how CourtEyeIQ has stayed capital-efficient pre-revenue.

---

## 2. Solution

CourtEyeIQ delivers the same core capabilities using hardware everyone already owns.

**Two iPhones on fence clamps. A Python pipeline. A browser on any screen.**

- Dual-camera ball tracking with TrackNetV2 (256-class per-pixel intensity head)
- Automated court detection via a trained 14-keypoint pose model (YOLO11n-pose), replacing manual click + optical flow calibration
- Triangulated in/out calls with confidence scoring
- Match stats, heatmaps, ball speed, close-call zoom replay
- Challenge system — flag any call, view trajectory + bounce + raw data
- Tennis + Pickleball support
- **CourtEyeIQ Clipper** — free standalone dead-time removal tool for match videos, doubling as a top-of-funnel product (see Section 3b)
- No WiFi required. No server. No subscription to start.

**Critical insight:** The pipeline is already written and sanity-checked. This is not a research project — it is a tuning, validation, and shipping project.

---

## 3. Architecture — V3 (Local-first, dual-camera)

### The four versions

<table header-row="true">
<tr>
<td>Version</td>
<td>Host</td>
<td>Status (Jun 2026)</td>
</tr>
<tr>
<td>**V0.1**</td>
<td>Offline PC</td>
<td>Active — court corner detection now model-based (YOLO11n-pose, 14kp); training in progress on merged HuggingFace + Roboflow dataset (11,922 images). Real dual-cam shoot pending — court access resumes \~Jul 1.</td>
</tr>
<tr>
<td>**V0.2a**</td>
<td>On-device iPhone</td>
<td>iOS spike 6/7 complete — \~30 FPS on iPhone 16 Neural Engine. Spike 8 PASS (2026-06-08) — on-court validation pending (Jul 2026).</td>
</tr>
<tr>
<td>**V0.2b**</td>
<td>Server (Render)</td>
<td>Parallel path, not blocking V0.1</td>
</tr>
<tr>
<td>**V1**</td>
<td>iPhone as host · live match</td>
<td>\~2–3 months after V0.1 milestone</td>
</tr>
<tr>
<td>**VX**</td>
<td>Cloud GPU server</td>
<td>When scale demands it</td>
</tr>
</table>

### V0.1 — Offline PC (current phase)

Two iPhones record independently. No streaming, no WiFi, no sync cable needed. USB transfer to laptop after the session. Python pipeline processes offline.

**Pipeline (`python pipeline.py`):**

1. `core/sync_engine.py` — FFT cross-correlation on audio tracks, outputs offset in ms
2. **Court detection — trained YOLO11n-pose model, 14 keypoints.** HuggingFace datasets (gholamreza, oweng — \~8,841 images each) converted to YOLOv8 pose format via `tools/convert_hf_to_yolo.py`; Roboflow datasets (16kp/15kp/12kp schemas) queued for separate conversion (COU-100–105). Datasets merged via `tools/merge_training_datasets.py` into a unified 11,922-image training set. This replaces the earlier manual-click + Lucas-Kanade optical flow approach, which has been fully deprecated.
3. `core/ball_detector.py` — TrackNetV2 inference on both video files
4. `core/triangulator.py` — fuses both cameras → 3D ball position
5. `core/bounce_detector.py` — Z-height threshold tuning per mounting angle
6. `core/in_out_judge.py` — confidence scoring per call
7. Output → `results.json` → browser UI at `localhost:3000`

**Filming spec (confirmed):** 1080p / 60fps · HDR Video OFF · AE/AF lock on court surface · Main (1×) lens only · USB transfer + Keep Originals

### V0.2a — On-device iPhone (ahead of schedule)

TrackNetV2 FP16 mlpackage (`tracknet_v2_fp16.mlpackage`, 27 MB) runs on iPhone 16 Neural Engine:

- **40ms warm inference** (\~25 FPS), **60ms cold start**
- 63/65 operations on Neural Engine · 2 on CPU · 0 on GPU
- Viable for sampled-live + offline modes
- iOS spike: camera → 3-frame buffer → CoreML → output at \~30 FPS confirmed on physical device

### V1 — Full match mode

- iOS React Native app: Device A hosts hotspot, Device B streams to it
- Device C: any browser on the local network — court map, heatmap, in/out list, close-call zoom, ball speed
- Re-sync after camera move: one clap → 3-second recalibration
- Tennis + Pickleball (explicit sport selection required)

---

## 3b. CourtEyeIQ Clipper — parallel product

A free, standalone tool that removes dead time from match videos (changeovers, ball retrieval, between-point gaps), shipping ahead of V0.1 as a top-of-funnel product and brand-builder.

- **V1 (complete):** ball-only detection state machine, landing page, score tracker, overlay, 93 unit tests. Real-world test on a 22-minute amateur clip showed ball-only detection is insufficient for reliable point-boundary calls.
- **V2 (in development):** uses the full single-cam CourtEyeIQ pipeline — auto court detection + ball-in-bounds + velocity + serve-side + player position — rather than patching the V1 ball-only approach.
- **Business model:** free-first (runs locally on Mac) → Ko-fi tips (cloud processing) → Paddle, \$1.99/upload at scale. Paddle chosen over Stripe (no fixed per-transaction fee, handles EU VAT). RunPod chosen over Render for GPU compute.
- Live at [courteyeiq.com/clipper](http://courteyeiq.com/clipper).

---

## 4. Competitive landscape

<table header-row="true">
<tr>
<td>System</td>
<td>Cameras</td>
<td>Price</td>
<td>Portability</td>
<td>Accuracy</td>
</tr>
<tr>
<td>**Hawkeye**</td>
<td>10 fixed cameras</td>
<td>\$100k+</td>
<td>Permanent install</td>
<td>Reference standard</td>
</tr>
<tr>
<td>**SwingVision**</td>
<td>1 iPhone</td>
<td>\$130/yr</td>
<td>Portable</td>
<td>Single-camera, monocular limits</td>
</tr>
<tr>
<td>**CourtEyeIQ V0.1**</td>
<td>2 iPhones (owned)</td>
<td>\$0 to start</td>
<td>Any court, any session</td>
<td>Dual-camera triangulation</td>
</tr>
<tr>
<td>**CourtEyeIQ V1**</td>
<td>2 iPhones</td>
<td>TBD subscription</td>
<td>Any court</td>
<td>Full match mode, live calls</td>
</tr>
</table>

**CourtEyeIQ's structural advantage over SwingVision:** Dual-camera stereo triangulation gives true 3D ball position. SwingVision is monocular — it estimates depth statistically, which fails at close line calls where the ball is near the court surface. Two calibrated cameras remove that ambiguity geometrically.

**Patent strategy:** Provisional → PCT → national phase. Key prior art noted: US9696610B2 (two parallel wire engagement clip) and Patent 8,152,389 (telescoping wedge-hook pole) — distinct from CourtEyeIQ's fence-mount method.

---

## 5. Technology

<table header-row="true">
<tr>
<td>Component</td>
<td>Technology</td>
</tr>
<tr>
<td>CV pipeline</td>
<td>Python 3.14 · OpenCV · NumPy · PyTorch 2.11 (CPU)</td>
</tr>
<tr>
<td>Ball tracking</td>
<td>TrackNetV2 (Yu-Chuan Huang 2020) · 256-class per-pixel intensity head · softmax + argmax</td>
</tr>
<tr>
<td>Court detection</td>
<td>YOLO11n-pose, 14-keypoint model · trained on merged HuggingFace + Roboflow dataset (11,922 images) · MPS (M2 Pro) training</td>
</tr>
<tr>
<td>Inference (Surface dev)</td>
<td>ONNX Runtime DirectML on Iris Xe (2.8 FPS — offline batch)</td>
</tr>
<tr>
<td>Inference (V0.2a iPhone)</td>
<td>CoreML mlprogram FP16 on iPhone 16 Neural Engine · 40ms warm</td>
</tr>
<tr>
<td>Mobile app (V1)</td>
<td>React Native (iOS first)</td>
</tr>
<tr>
<td>Display UI (Device C)</td>
<td>HTML/CSS/JS PWA · WebSocket · installable from Safari/Chrome</td>
</tr>
<tr>
<td>Scoring engine</td>
<td>core/tennis_[scoring.py](http://scoring.py) · Tier 1–4 tests passing · configurable tiebreak targets</td>
</tr>
<tr>
<td>Agent/orchestration stack</td>
<td>Claude (orchestration + Notion MCP) · Paperclip (CEO + CV Engineer agents, Claude Code local) · Codex (web tasks) · Gemini (research + labeling)</td>
</tr>
<tr>
<td>Project IDE</td>
<td>PyCharm · Claude Code · MacBook Pro M2 Pro</td>
</tr>
</table>

---

## 6. Feature map by version

### V0.1 / V1 — Match mode core

Ball tracking · dual-cam sync · model-based court detection (YOLO11n-pose) · TrackNetV2 · 3D triangulation · in/out calls + confidence · heatmap · ball speed · height over net · close-call zoom replay · trajectory playback · Tennis + Pickleball

### V2 — Match intelligence

Player detection + side assignment (MediaPipe) · auto scoring (Tier 1–4 tests passing) · serve fault / double fault logic · match grading · movement distance per player · playing style fingerprint · doubles mode · N-player Re-ID (HSV histogram + Hungarian assignment + OSNet Tier 2)

### V3 — Training mode

Swing analysis (forehand/backhand) · serve mechanics breakdown · drill mode with virtual targets · 3D overlay vs pro reference · bounce height analysis · spin detection (research phase) · livestream

### V4 — Platform

Racket + string tension profiles · A/B racket test · community string database · GPS + weather auto-context · user accounts + history · global amateur leaderboard · tournament organisation · CourtEyeIQ stick (Jetson Orin Nano hardware product)

---

## 7. Current status (Jun 2026)

**Done:**

- Rebranded CourtIQ → CourtEyeIQ (2026-06-25): domain [courteyeiq.com](http://courteyeiq.com) live, dedicated Vercel project serving site + /clipper, social handles secured (Instagram, X, TikTok, YouTube)
- Court detection rebuilt around a trained model: YOLO11n-pose, 14 keypoints, HuggingFace + Roboflow datasets merged (11,922 images, zero missing labels) — manual-click + optical flow approach fully deprecated
- TrackNetV2 architecture confirmed, ONNX + CoreML export complete
- iOS: TrackNetV2 running on physical iPhone 16 at \~30 FPS (Spikes 1–8 ✅, on-court validation pending)
- display.html PWA live — full UI with court map, stats, challenge system
- Scoring engine — Tier 1–4 tests passing
- Dual-cam simulation: 3D triangulation → bounce → in/out path validated end-to-end (architectural validation — accuracy on real stereo footage still pending)
- Pickleball: TrackNet generalizes zero-shot — 49.0% PPA broadcast / 33.4% amateur indoor, exceeding tennis fence-mount baseline. V1 feature confirmed at near-zero added cost
- CourtEyeIQ Clipper V1 shipped (state machine, landing page, score tracker, overlay, 93 tests); V2 architecture decided (full single-cam pipeline)
- Multi-agent orchestration stack established: Claude (orchestration + Notion), Paperclip (CEO/CV Engineer agents), Codex (web), Gemini (research/labeling)

**Active blocker:**

Real dual-camera footage — court access resumes \~Jul 1 (Medellín stay). Calibration, ball detection gate, and the 3D triangulation path via simulated cam2 have all passed, but bounce position and in/out accuracy on real stereo footage remain unvalidated. See "July 2026 Ground-Truth Accuracy Test Protocol" under Project Specs.

**Next steps:**

- Visually validate trained court detection model (`best.pt`) on held-out images before trusting it for comparison against the merged dataset
- Train pickleball-specific court detection model (separate 12kp dataset, 2,444 images)
- On-court validation of iOS Spike 8 with a real ball (Jul 2026)
- Partner pitch deck (in progress, derived from this whitepaper)

**Estimated timeline:**

- V0.1 milestone: Jul 2026 — gated on real dual-cam shoot (court access resumes \~Jul 1)
- V0.2a iOS demo: concurrent with V0.1
- V1 full match mode: 2–3 months after V0.1

---

## 8. Links

- 🐙 [GitHub](https://github.com/patrickrosenfelder-tech/tennisswcourtiq)
- 🎯 [Current Task](https://app.notion.com/p/345211d35b8a8154b478cf0cd5005401)
- 🧠 [Decisions Log](https://app.notion.com/p/345211d35b8a8121972dc1f2c8c84e71)
- 📋 [Master LLM Context Doc](https://app.notion.com/p/345211d35b8a81b99155c6ad53e973c8)

---

*Updated 2026-06-30 (v3.2 — CourtEyeIQ rebrand, court detection model migration, Clipper section added). Predecessor: CourtIQ Whitepaper v3.1 (Jun 11, 2026), retained for reference.*
