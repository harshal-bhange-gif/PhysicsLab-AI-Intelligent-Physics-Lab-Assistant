"""
PhysicsLab AI - Backend Application
IBM AICTE Problem Statement: AI Lab Manual & Experiment Generator
Powered by IBM watsonx.ai with IBM Granite Models
"""

import os
import time
import io
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# ─────────────────────────────────────────────────────────────────────────────
# AGENT INSTRUCTIONS — Customize agent behavior, tone, teaching style here
# ─────────────────────────────────────────────────────────────────────────────
AGENT_INSTRUCTIONS = {

    # ── Identity & Role ─────────────────────────────────────────────────────
    "role": (
        "You are PhysicsLab AI, an expert physics lab assistant for "
        "undergraduate engineering and science students. You specialize in "
        "generating complete, accurate, and well-structured physics lab manuals."
    ),

    # ── Teaching Style ───────────────────────────────────────────────────────
    "teaching_style": (
        "Explain concepts step-by-step with clear numbered lists for procedures. "
        "Provide intuitive analogies for complex theories and always link "
        "theoretical concepts to practical observations. Adapt language to be "
        "accessible for first-year undergraduates while maintaining scientific rigor."
    ),

    # ── Physics Level ────────────────────────────────────────────────────────
    "physics_level": (
        "Target undergraduate engineering physics (B.Tech / B.E. first year). "
        "Cover optics, mechanics, electricity, and modern physics. "
        "Use SI units throughout. Include calculus-based derivations where relevant."
    ),

    # ── Tone & Language ──────────────────────────────────────────────────────
    "tone": (
        "Professional yet approachable. Use active voice. Introduce technical "
        "terms with clear definitions. Be encouraging and supportive."
    ),

    # ── Output Format Rules ──────────────────────────────────────────────────
    "output_format": (
        "Structure all experiment manuals with clearly labelled sections: "
        "## AIM, ## THEORY (with formulas), ## APPARATUS, ## PROCEDURE (numbered), "
        "## OBSERVATION TABLE (markdown table), ## CALCULATIONS, ## RESULT, "
        "## PRECAUTIONS, ## VIVA QUESTIONS (with answers), ## COMMON MISTAKES. "
        "Use **bold** for key terms, tables for data, and code blocks for formulas."
    ),

    # ── Safety Rules ─────────────────────────────────────────────────────────
    "safety_rules": (
        "Always include relevant safety precautions. Highlight electrical safety "
        "for circuit experiments, optical safety for laser experiments, and "
        "handling precautions for fragile apparatus."
    ),

    # ── Supported Experiments ────────────────────────────────────────────────
    "supported_experiments": [
        "Newton's Rings",
        "Young's Double Slit Experiment (YDSE)",
        "Diffraction Grating",
        "Brewster's Law",
        "Malus' Law",
        "Simple Pendulum",
        "Compound Pendulum",
        "Photoelectric Effect",
        "Hall Effect",
        "RC Circuit (Charging & Discharging)",
        "Resonance Tube",
        "Spectrometer (Prism)",
        "Biot-Savart Law Verification",
        "Potentiometer Experiments",
    ],

    # ── Exam Mode ────────────────────────────────────────────────────────────
    "exam_mode_instruction": (
        "When generating exam-style content, use formal academic language, "
        "include marks allocation hints, focus on derivations and proofs, "
        "and provide model answers to viva questions in 2-3 sentence format."
    ),
}
# ─────────────────────────────────────────────────────────────────────────────

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ─── IBM watsonx.ai Configuration ────────────────────────────────────────────
IBM_API_KEY    = os.getenv("IBM_API_KEY")
IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID")
IBM_REGION_URL = os.getenv("IBM_REGION_URL", "https://us-south.ml.cloud.ibm.com")
GRANITE_MODEL  = os.getenv("GRANITE_MODEL", "ibm/granite-4-h-small")


# ─── Model Factory ────────────────────────────────────────────────────────────
def get_model() -> ModelInference:
    """Return a configured IBM watsonx.ai ModelInference instance."""
    credentials = Credentials(url=IBM_REGION_URL, api_key=IBM_API_KEY)
    return ModelInference(
        model_id=GRANITE_MODEL,
        credentials=credentials,
        project_id=IBM_PROJECT_ID,
        params={
            GenParams.MAX_NEW_TOKENS:     3000,
            GenParams.MIN_NEW_TOKENS:     80,
            GenParams.TEMPERATURE:        0.7,
            GenParams.TOP_P:              0.9,
            GenParams.REPETITION_PENALTY: 1.1,
        },
    )


# ─── System Prompt Builder ────────────────────────────────────────────────────
def build_system_message() -> str:
    """Build the system prompt from AGENT_INSTRUCTIONS."""
    ai = AGENT_INSTRUCTIONS
    return (
        f"{ai['role']}\n\n"
        f"TEACHING STYLE: {ai['teaching_style']}\n\n"
        f"PHYSICS LEVEL: {ai['physics_level']}\n\n"
        f"TONE: {ai['tone']}\n\n"
        f"OUTPUT FORMAT: {ai['output_format']}\n\n"
        f"SAFETY: {ai['safety_rules']}\n\n"
        f"EXAM MODE: {ai['exam_mode_instruction']}\n\n"
        f"SUPPORTED EXPERIMENTS: {', '.join(ai['supported_experiments'])}\n\n"
        "Always respond in well-structured markdown. Be thorough, accurate, and educational."
    )


# ─── Section → User Message Map ───────────────────────────────────────────────
SECTION_MAP = {
    "full":        "Generate a COMPLETE lab manual with ALL sections",
    "aim":         "Generate only the AIM and THEORY sections with derivation",
    "procedure":   "Generate the APPARATUS LIST and step-by-step PROCEDURE",
    "observation": "Generate the OBSERVATION TABLE and CALCULATION FORMAT",
    "viva":        "Generate 10 VIVA QUESTIONS with detailed model answers",
    "mistakes":    "Generate the COMMON MISTAKES and TROUBLESHOOTING guide as a table",
    "result":      "Generate the RESULT, PRECAUTIONS, and CONCLUSION sections",
    "simplified":  "Give a BEGINNER-FRIENDLY simplified explanation with everyday analogies",
    "exam":        "Generate EXAM-STYLE notes with derivations, key points, and model answers",
}


def chat_generate(messages: list[dict]) -> str:
    """
    Call the watsonx.ai chat endpoint (current, non-deprecated API).
    messages format: [{"role": "system"|"user"|"assistant", "content": "..."}]
    """
    model = get_model()
    response = model.chat(messages=messages)
    # Response shape: {"choices": [{"message": {"content": "..."}}], ...}
    return response["choices"][0]["message"]["content"]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status":  "ok",
        "model":   GRANITE_MODEL,
        "version": "1.0.0",
        "agent":   "PhysicsLab AI",
    })


@app.route("/api/experiments", methods=["GET"])
def get_experiments():
    experiments = [
        {"id": i + 1, "name": exp, "category": _get_category(exp)}
        for i, exp in enumerate(AGENT_INSTRUCTIONS["supported_experiments"])
    ]
    return jsonify({"experiments": experiments})


@app.route("/api/generate", methods=["POST"])
def generate_experiment():
    """Generate experiment content using the chat API."""
    data       = request.get_json()
    experiment = (data.get("experiment") or "").strip()
    section    = (data.get("section") or "full").strip()
    extra      = (data.get("extra_context") or "").strip()

    if not experiment:
        return jsonify({"error": "Experiment name is required"}), 400

    instruction = SECTION_MAP.get(section, f"Generate the {section} section")
    user_content = f"{instruction} for the experiment: **{experiment}**"
    if extra:
        user_content += f"\n\nAdditional context: {extra}"

    messages = [
        {"role": "system",  "content": build_system_message()},
        {"role": "user",    "content": user_content},
    ]

    try:
        content = chat_generate(messages)
        return jsonify({
            "success":    True,
            "experiment": experiment,
            "section":    section,
            "content":    content,
            "model":      GRANITE_MODEL,
            "timestamp":  time.strftime("%Y-%m-%d %H:%M:%S"),
        })
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """Conversational chat with history context."""
    data    = request.get_json()
    message = (data.get("message") or "").strip()
    history = data.get("history", [])

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Build messages list: system + last 6 history turns + current user message
    messages = [{"role": "system", "content": build_system_message()}]
    for turn in history[-6:]:
        role = turn.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": turn.get("content", "")})
    messages.append({"role": "user", "content": message})

    try:
        content = chat_generate(messages)
        return jsonify({
            "success":   True,
            "response":  content,
            "model":     GRANITE_MODEL,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        })
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/api/export/pdf", methods=["POST"])
def export_pdf():
    """Export generated content as a print-ready HTML file."""
    data     = request.get_json()
    content  = data.get("content", "")
    filename = data.get("filename", "experiment_manual")

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PhysicsLab AI — {filename}</title>
<style>
  body  {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.8; color: #1f2328; }}
  h1   {{ color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 8px; }}
  h2   {{ color: #1558b0; margin-top: 28px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }}
  h3   {{ color: #333; margin-top: 20px; }}
  table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
  th, td {{ border: 1px solid #ccc; padding: 8px 12px; text-align: left; }}
  th {{ background: #f0f4ff; font-weight: bold; }}
  tr:nth-child(even) td {{ background: #f8f8f8; }}
  pre  {{ background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; border: 1px solid #ddd; }}
  code {{ background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; font-family: monospace; }}
  ul, ol {{ padding-left: 24px; }}
  li {{ margin: 4px 0; }}
  blockquote {{ border-left: 3px solid #1a73e8; padding: 4px 16px; color: #555; margin: 12px 0; background: #f0f4ff; }}
  .footer {{ margin-top: 60px; color: #888; font-size: 12px; text-align: center; border-top: 1px solid #ddd; padding-top: 16px; }}
  @media print {{ .footer {{ position: fixed; bottom: 0; width: 100%; }} }}
</style>
</head>
<body>
<h1>PhysicsLab AI — Lab Manual</h1>
<div id="content" style="white-space:pre-wrap;font-family:inherit;">{content}</div>
<div class="footer">
  Generated by PhysicsLab AI &bull; Powered by IBM watsonx.ai · IBM Granite &bull;
  IBM AICTE Problem Statement: AI Lab Manual &amp; Experiment Generator<br>
  Developed by <strong>Harshal Tushar Bhange</strong>
</div>
</body>
</html>"""

    buffer = io.BytesIO(html_content.encode("utf-8"))
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype="text/html",
        as_attachment=True,
        download_name=f"{filename}.html",
    )


# ─── Helper ───────────────────────────────────────────────────────────────────
def _get_category(name: str) -> str:
    cats = {
        "Optics":       ["Newton", "Young", "Diffraction", "Brewster", "Malus", "Spectrometer"],
        "Mechanics":    ["Pendulum", "Compound", "Resonance"],
        "Modern Physics": ["Photoelectric", "Hall"],
        "Electricity":  ["RC Circuit", "Biot", "Potentiometer"],
    }
    for cat, keywords in cats.items():
        if any(kw.lower() in name.lower() for kw in keywords):
            return cat
    return "General"


# ─── Entry Point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"🔬 PhysicsLab AI starting → http://127.0.0.1:{port}")
    print(f"   Model   : {GRANITE_MODEL}")
    print(f"   Project : {IBM_PROJECT_ID}")
    app.run(host="0.0.0.0", port=port, debug=debug)
