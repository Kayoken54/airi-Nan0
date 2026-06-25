import spaces
import torch

# The cuDNN SDPA backend is broken for this model; disable it and keep the others.
torch.backends.cuda.enable_cudnn_sdp(False)

import gradio as gr
import numpy as np
from transformers import AutoModel, AutoProcessor

MODEL_PATH = "OpenMOSS-Team/MOSS-TTS-Local-Transformer-v1.5"
DEVICE = "cuda"
DTYPE = torch.bfloat16

LANGUAGES = [
    "Auto", "Chinese", "Cantonese", "English", "Arabic", "Czech", "Danish",
    "Dutch", "Finnish", "French", "German", "Greek", "Hebrew", "Hindi",
    "Hungarian", "Italian", "Japanese", "Korean", "Macedonian", "Malay",
    "Persian", "Polish", "Portuguese", "Romanian", "Russian", "Spanish",
    "Swahili", "Swedish", "Tagalog", "Thai", "Turkish", "Vietnamese",
]

processor = AutoProcessor.from_pretrained(MODEL_PATH, trust_remote_code=True)
processor.audio_tokenizer = processor.audio_tokenizer.to(DEVICE)
processor.audio_tokenizer.eval()

model = AutoModel.from_pretrained(
    MODEL_PATH,
    trust_remote_code=True,
    attn_implementation="sdpa",
    torch_dtype=DTYPE,
).to(DEVICE)
model.eval()

SAMPLE_RATE = int(getattr(processor.model_config, "sampling_rate", 48000))


@spaces.GPU(duration=120)
def generate(text, language, reference_audio, temperature, top_p, top_k,
             repetition_penalty, max_new_tokens):
    text = (text or "").strip()
    if not text:
        raise gr.Error("Please enter some text to synthesize.")

    user_kwargs = {"text": text}
    if language and language != "Auto":
        user_kwargs["language"] = language
    if reference_audio:
        user_kwargs["reference"] = [reference_audio]

    conversations = [[processor.build_user_message(**user_kwargs)]]
    batch = processor(conversations, mode="generation")
    input_ids = batch["input_ids"].to(DEVICE)
    attention_mask = batch["attention_mask"].to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_new_tokens=int(max_new_tokens),
            do_sample=True,
            audio_temperature=float(temperature),
            audio_top_p=float(top_p),
            audio_top_k=int(top_k),
            audio_repetition_penalty=float(repetition_penalty),
        )

    messages = processor.decode(outputs)
    if not messages or messages[0] is None:
        raise gr.Error("The model did not return a decodable audio result.")

    audio = messages[0].audio_codes_list[0]  # [channels, samples]
    audio_np = audio.detach().float().cpu().numpy()
    if audio_np.ndim > 1:
        audio_np = audio_np.T  # gradio expects [samples, channels]
    return SAMPLE_RATE, audio_np


with gr.Blocks(title="MOSS-TTS Local Transformer v1.5") as demo:
    gr.Markdown(
        "# 🎙️ MOSS-TTS Local Transformer v1.5\n"
        "Multilingual (31 languages) stereo 48 kHz text-to-speech with zero-shot voice "
        "cloning, powered by "
        "[`OpenMOSS-Team/MOSS-TTS-Local-Transformer-v1.5`]"
        "(https://huggingface.co/OpenMOSS-Team/MOSS-TTS-Local-Transformer-v1.5). "
        "Upload a short reference clip to clone a voice, or leave it empty for a default voice."
    )

    with gr.Row():
        with gr.Column():
            text = gr.Textbox(
                label="Text",
                lines=4,
                placeholder="Enter the text you want the AI to say…",
            )
            language = gr.Dropdown(
                LANGUAGES, value="Auto", label="Language tag",
                info="Tagging the language improves quality in v1.5.",
            )
            reference_audio = gr.Audio(
                label="Reference audio (optional — for voice cloning)",
                type="filepath",
            )
            with gr.Accordion("Advanced settings", open=False):
                temperature = gr.Slider(0.1, 2.0, value=1.7, step=0.05, label="Temperature")
                top_p = gr.Slider(0.1, 1.0, value=0.8, step=0.05, label="Top-p")
                top_k = gr.Slider(1, 100, value=25, step=1, label="Top-k")
                repetition_penalty = gr.Slider(1.0, 2.0, value=1.0, step=0.05, label="Repetition penalty")
                max_new_tokens = gr.Slider(256, 8192, value=4096, step=256, label="Max new tokens")
            run = gr.Button("Generate", variant="primary")
        with gr.Column():
            output = gr.Audio(label="Generated speech", type="numpy")

    gr.Examples(
        examples=[
            ["We stand on the threshold of the AI era.", "English"],
            ["亲爱的你，愿你的每一天都值得被记住。", "Chinese"],
            ["Bonjour, je voudrais essayer une voix française.", "French"],
        ],
        inputs=[text, language],
    )

    run.click(
        generate,
        inputs=[text, language, reference_audio, temperature, top_p, top_k,
                repetition_penalty, max_new_tokens],
        outputs=output,
    )

demo.launch()
