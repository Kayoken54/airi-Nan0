import ctypes
import gradio as gr
import os
import numpy as np
from pydub import AudioSegment

# 1. Load the compiled Linux library
# In the Dockerfile, we named it libnanotts.so
LIB_PATH = "./libnanotts.so"
if not os.path.exists(LIB_PATH):
    print(f"Warning: Could not find {LIB_PATH} immediately.")

try:
    lib = ctypes.CDLL(LIB_PATH)

    # 2. Define C-API Argument and Return Types
    # These match the nanotts.h header signatures
    lib.load_model.restype = ctypes.c_int
    lib.free_model.restype = None

    # Arguments for generate_wav_from_ref: 
    # (ref_path, text, out_wav_ptr, out_samples, out_channels, out_sr, is_stereo)
    lib.generate_wav_from_ref.argtypes = [
        ctypes.c_char_p,                                # const char* ref_path
        ctypes.c_char_p,                                # const char* text
        ctypes.POINTER(ctypes.POINTER(ctypes.c_float)), # float** wav_out
        ctypes.POINTER(ctypes.c_int),                  # int* samples
        ctypes.POINTER(ctypes.c_int),                  # int* channels
        ctypes.POINTER(ctypes.c_int),                  # int* sr
        ctypes.c_int,                                   # int is_stereo (1=yes)
    ]
    lib.generate_wav_from_ref.restype = ctypes.c_int

    # Arguments for save_wav: (filename, wav_data, samples, channels, sr)
    lib.save_wav.argtypes = [
        ctypes.c_char_p, 
        ctypes.POINTER(ctypes.c_float), 
        ctypes.c_int, 
        ctypes.c_int, 
        ctypes.c_int
    ]
    lib.save_wav.restype = ctypes.c_int
except Exception as e:
    print(f"Failed to load ctypes CDLL: {e}")
    lib = None

def preprocess_audio(input_path):
    """
    Converts input audio to the exact format the C engine expects:
    WAV, 48000Hz, 16-bit PCM.
    """
    target_path = "processed_ref.wav"
    try:
        audio = AudioSegment.from_file(input_path)
        # Standardize to 48k, mono (usually better for extraction), 16-bit
        audio = audio.set_frame_rate(48000).set_channels(1).set_sample_width(2)
        audio.export(target_path, format="wav")
        return target_path
    except Exception as e:
        print(f"Audio Preprocessing Error: {e}")
        return None

def inference(ref_audio, text):
    if not lib:
        return None, "C Library libnanotts.so is not loaded."
    if not ref_audio or not text:
        return None, "Please provide both a reference voice and text."
    
    # Step A: Convert input to compatible WAV
    clean_ref = preprocess_audio(ref_audio)
    if not clean_ref:
        return None, "Failed to process reference audio file."

    # Step B: Prepare pointers for C output
    wav_ptr = ctypes.POINTER(ctypes.c_float)()
    samples = ctypes.c_int()
    channels = ctypes.c_int()
    sr = ctypes.c_int()
    
    output_filename = "output.wav"

    # Step C: Call the C Engine
    # result 0 means success
    result = lib.generate_wav_from_ref(
        clean_ref.encode('utf-8'),
        text.encode('utf-8'),
        ctypes.byref(wav_ptr),
        ctypes.byref(samples),
        ctypes.byref(channels),
        ctypes.byref(sr),
        1 # Stereo output
    )
    
    if result != 0:
        return None, f"C Engine Error: {result}"

    # Step D: Save the generated buffer to a WAV file
    lib.save_wav(output_filename.encode('utf-8'), wav_ptr, samples, channels, sr)
    
    # Step E: Free the memory allocated by the C library using standard libc
    # This prevents memory leaks in your Space
    try:
        libc = ctypes.CDLL("libc.so.6")
        libc.free(wav_ptr)
    except:
        pass # Fallback if libc naming differs

    return output_filename, "Success!"

# 4. Gradio Web Interface
with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🚀 NanoTTS C-Inference Engine")
    gr.Markdown("Zero-dependency C implementation of MOSS-TTS-Nano. Fast, tiny, and runs entirely on CPU.")
    
    with gr.Row():
        with gr.Column():
            input_text = gr.Textbox(
                label="Text to Speak", 
                placeholder="Enter the text you want the AI to say...",
                lines=3
            )
            input_audio = gr.Audio(
                label="Reference Voice (Clone)", 
                type="filepath"
            )
            submit_btn = gr.Button("Synthesize Audio", variant="primary")
        
        with gr.Column():
            audio_out = gr.Audio(label="Generated Result")
            status_out = gr.Textbox(label="Status", interactive=False)

    submit_btn.click(
        fn=inference, 
        inputs=[input_audio, input_text], 
        outputs=[audio_out, status_out]
    )

    gr.Examples(
        examples=[["./asserts/audio/ljs.wav", "Hello, I am a tiny C based voice cloning engine."]],
        inputs=[input_audio, input_text]
    )

if __name__ == "__main__":
    if lib:
        print("Initializing shadow load_model...")
        lib.load_model()
    demo.launch()
