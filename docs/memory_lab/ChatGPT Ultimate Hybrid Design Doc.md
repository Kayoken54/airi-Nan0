## AIRI Memory Lab - Ultimate Hybrid Design Document

### 1. Abstract

This document provides a comprehensive snapshot of the current Ultimate Hybrid architecture for the AIRI Memory Lab. The system merges precision retrieval, semantic reasoning, and controlled inference into a hybrid pipeline designed for conversational memory tasks such as LoCoMo. The architecture balances literal grounding with selective reasoning, using insights from prior runs (Run 09, Run 11, Run 14/14B, Run 15) and is fully grounded in implementation details, design trade-offs, and observed failure modes.

---

### 2. Problem Framing

The system addresses the following challenges observed in previous iterations:

* **Literal vs. Inference Tension**: Earlier runs demonstrated that literal precision (C4) and temporal correctness (C2) degrade when free-form reasoning is applied indiscriminately.
* **Open-Domain Inference**: Prior approaches failed to generalize from subtle cues (e.g., Stamford → Connecticut, fat fingers → obesity) for C3 questions.
* **Multi-Hop Reasoning**: Linking dispersed facts (C1) remained inconsistent without a flexible retrieval expansion mechanism.
* **Data Completeness and Structured Representation**: Some facts were missing key dimensions (who, what, where, when, why), which hindered downstream reasoning and accurate retrieval.

The system is designed to mitigate these issues using a tiered hybrid approach that separates retrieval, reasoning, and abstraction based on question type and category.

---

### 3. Evolution of the System

The system's architecture has evolved through multiple runs, each contributing key insights:

1. **Run 09 (Literal King)**

   * Narrow retrieval window, aggressive heuristic boosters (speaker weighting, verbatim quote matching, name boosting)
   * Surgical factual precision ensuring C4 and temporal F1 stability

2. **Run 11 (Reasoning Dark Horse)**

   * Flexible retrieval for multi-hop reasoning
   * Atomic PCL facts without heavy schemas to enable cross-context linking
   * Demonstrated C1 improvement by connecting dispersed facts

3. **Run 14 / 14A (Inference Specialist)**

   * 5W extraction schema (Who/What/Where/When/Why) for structured memory
   * Dedicated normalization/synthesis pass for interpretive inference
   * Demonstrated C3 gains (open-domain reasoning)

4. **Run 14B (Hardened)**

   * Schema hardening improved temporal stability (C2) and single-hop precision (C4)
   * Suppressed uncontrolled inference, demonstrating the trade-off between literal discipline and inference power

5. **Run 15 (ChatGPT Revision)**

   * Attempted to merge literal precision with controlled abstraction
   * Introduced normalization pass and query classification for “needs abstraction”
   * Highlighted risk of overcomplicating retrieval and destabilizing temporal performance

This evolutionary history informs the design of the Ultimate Hybrid by identifying the strengths to preserve and the failure modes to avoid.

---

### 4. Final Architecture

The Ultimate Hybrid uses a **Tiered Router with three operating modes**, each selected dynamically based on question classification:

#### 4.1 Memory Representation

* **Canonical Fact**: Literal text used for embedding and primary retrieval
* **Observed Text**: Original user phrasing for context and secondary reasoning
* **5W Fields**: `who`, `what`, `where`, `when` (resolved), `why`
* **Temporal Anchors**: Absolute dates for C2 questions
* **Profile Summaries**: Speaker characterization for long-term context

#### 4.2 Query Triage / Tiered Router

* **Literal Mode (default)**: Handles C4 and most C2 questions; retrieves and answers with high precision
* **Bridge Mode**: Expands retrieval for C1 multi-hop; links facts across contexts
* **Detective Mode**: Triggered for C3 and select C1 questions requiring abstraction; invokes normalization and inference on 5W fields
* Router decisions are based on question type, cues from language (e.g., “likely,” “what kind of”), and category detection

#### 4.3 Retrieval Engine

* **Literal Spine**: Run 09-style strict retrieval window and boosting heuristics
* **Semantic Expansion**: Run 11-style broader retrieval applied conditionally for multi-hop questions
* **Dimension-Aware Boosting**: Optional weighting of retrieved facts based on relevant 5W fields
* **Temporal Retrieval**: Protected path to preserve C2 performance

#### 4.4 Reasoning & Normalization Layer

* Only triggered in Detective Mode
* Performs abstraction, concept normalization, and synthesis while grounded in retrieved evidence
* Normalization ensures inference does not hallucinate unsupported concepts
* Uses structured output (`generateObject`) for final answers and intermediate reasoning artifacts

#### 4.5 Answer Generation

* Structured, precision-first outputs for all questions
* Compression to exact spans or canonical concepts
* Maintains separate outputs for literal, bridge, and detective modes for auditability

#### 4.6 Fail-Safe & Logging

* Triage and Detective outputs are logged separately
* JSON validation ensures stability for downstream evaluation
* Canary sessions used to stress-test inference and routing

---

### 5. Failure Taxonomy & Trade-offs

* **Literal choke**: Router fails to open Detective mode when abstraction is needed → mitigated by sharpening triage signals
* **Ungrounded detective**: Normalization makes an inference without supporting evidence → mitigated by enforcing 5W field grounding
* **Retrieval overreach**: Bridge mode introduces noisy facts that degrade precision → mitigated by strict literal spine for C4/C2
* **Abstraction suppression**: Hard schema discipline improves temporal and single-hop metrics but suppresses open-domain inference → mitigated by gated Detective mode

**Design Trade-offs**:

* Prioritize literal correctness for high-frequency, easy categories (C2, C4)
* Allow controlled inference only where justified (C3, select C1)
* Maintain retrieval isolation to avoid pollution of embeddings or loss of temporal precision
* Use structured 5W fields as a **universal grounding mechanism** without forcing all questions through abstraction

---

### 6. Evaluation & Rationale

* Empirical results from Runs 09, 11, 14/14B, 15 informed both retrieval strategy and abstraction gating
* Canary sessions validate routing logic and Detective mode restraint
* Tiered architecture preserves stability while enabling targeted reasoning
* The system is designed for **repeatable, interpretable, and auditable outputs**, balancing F1 maximization with controlled inference

---

### 7. Future Work

* Refine triage classifier for better detection of inference-needed questions
* Extend normalization with confidence-weighted support indicators
* Add automated validation for cross-category trade-offs
* Explore learning-based routing to adaptively balance Literal vs. Detective engagement

---

**End of Document**

This document serves as a full, grounded, system-focused snapshot of the Ultimate Hybrid, suitable for understanding and reproducing the design even without prior knowledge of AIRI’s iterative runs.
