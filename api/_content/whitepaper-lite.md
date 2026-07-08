# CourtEyeIQ Whitepaper — Lite (Partner/Investor) v1.0

> **Version:** Lite 1.0 · **Date:** 2026-06-30 · For partner & investor sharing
> Derived from CourtEyeIQ Whitepaper v3.2 (internal). Some technical detail intentionally omitted.

---

## 1. Problem

Pro-level tennis analytics — ball tracking, in/out calls, match grading — exist only inside broadcast systems costing hundreds of thousands of dollars. Club and recreational players have nothing. Coaches rely on memory and manual video review.

The technology gap isn't a lack of capability — it's cost, complexity, and hardware. Hawkeye requires 10 calibrated cameras, a server room, and a full-time operator. No recreational club can afford it.

---

## 2. Solution

CourtEyeIQ delivers professional-grade match analytics using hardware people already own.

**Two iPhones on fence clamps. A processing pipeline. A browser on any screen.**

- Dual-camera ball tracking with automated in/out calls and confidence scoring
- Automated court detection — no manual setup required
- Match stats, heatmaps, ball speed, close-call zoom replay
- Challenge system — flag any call, review the evidence
- Tennis + Pickleball support
- **CourtEyeIQ Clipper** — a free companion tool that automatically trims dead time from match videos, used as a top-of-funnel product to build the brand pre-launch
- No WiFi required. No server. No subscription to start.

The core technology is proven and already built. This is a tuning, validation, and go-to-market phase — not an open research problem.

---

## 3. Project history

CourtEyeIQ was founded in **April 2026** by a solo founder, an active competitive tennis and pickleball player, building with a lean AI-assisted development workflow in place of a traditional engineering team. The project has progressed from early computer-vision validation through working dual-camera simulation, real-device on-court testing, and a public-facing companion product (Clipper) — all pre-revenue and self-funded to date.

The product and company were rebranded from CourtIQ to **CourtEyeIQ** in late June 2026, alongside a new website, secured social presence, and a refreshed product roadmap.

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
<td>Single-camera, depth estimated</td>
</tr>
<tr>
<td>**CourtEyeIQ**</td>
<td>2 iPhones (owned)</td>
<td>\$0 to start</td>
<td>Any court, any session</td>
<td>True 3D triangulation</td>
</tr>
</table>

**Structural advantage over SwingVision:** Dual-camera stereo triangulation gives true 3D ball position. Single-camera systems estimate depth statistically, which breaks down on close line calls. Two calibrated cameras remove that ambiguity geometrically — a meaningful accuracy edge for the calls that matter most.

Patent strategy is in motion (provisional → PCT → national phase) around the fence-mount camera method, with prior art already reviewed.

---

## 5. Product roadmap

### Now — Match mode core

Ball tracking · dual-camera sync · automated court detection · 3D triangulation · in/out calls with confidence · heatmaps · ball speed · close-call replay · Tennis + Pickleball

### Next — Match intelligence

Player detection and side assignment · automatic scoring · fault/double-fault logic · match grading · player movement and style analytics · doubles mode

### Later — Training mode

Swing and serve mechanics analysis · drill mode with virtual targets · pro-reference overlays · spin detection · livestream

### Future — Platform

Equipment profiles and testing · community data · user accounts and history · amateur leaderboards · tournament organization · dedicated hardware accessory

---

## 6. Current status (Jun 2026)

**Validated:**

- Core ball-tracking and court-detection pipeline built and passing internal accuracy checks
- On-device iOS inference running in real time on a physical iPhone
- Full working web display — court map, stats, challenge system
- Dual-camera 3D triangulation validated end-to-end in simulation
- Strong zero-shot generalization to pickleball, confirmed as a launch-ready feature at minimal added cost
- CourtEyeIQ Clipper shipped as a working standalone product, already in real-world testing

**In progress:**

- Real on-court dual-camera validation (dual-camera field validation shoot scheduled for early August 2026, returning from travel \~Aug 1)
- Partner and investor outreach

**Milestone:** Full on-court validation targeted for early August 2026, with a live match mode roughly 2–3 months behind that.

---

## 7. Why now

The underlying computer vision techniques (ball tracking, court geometry, multi-camera triangulation) are proven in research and in commercial broadcast systems. What's been missing is a version of this technology built for hardware people already carry in their pocket, at a price recreational players and clubs can actually pay. CourtEyeIQ is built specifically to close that gap — and the core pipeline already exists and works.

---

*This is a lite overview prepared for external sharing. A full technical whitepaper is available on request under NDA.*
