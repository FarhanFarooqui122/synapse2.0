"""
Local inference wrapper for the fine-tuned Mistral-7B fraud detection model
(GGUF quantized build, runs on CPU via llama-cpp-python).

Download the model file first:
  https://huggingface.co/mav23/Mistral-7B-LLM-Fraud-Detection-GGUF/tree/main
  -> mistral-7b-llm-fraud-detection.Q4_K_M.gguf (4.37 GB)
  -> save it to backend/models/mistral-7b-llm-fraud-detection.Q4_K_M.gguf
"""
import os
from llama_cpp import Llama

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "models", "mistral-7b-llm-fraud-detection.Q4_K_M.gguf"
)

_llm = None


def get_model():
    """Lazy-load the model once, on first request, not at import time."""
    global _llm
    if _llm is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}. "
                "Download it from huggingface.co/mav23/Mistral-7B-LLM-Fraud-Detection-GGUF first."
            )
        _llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=2048,       # context window; 2048 is plenty for a transcript
            n_threads=os.cpu_count(),  # use all available CPU cores
            n_gpu_layers=18,  # offload ~18 of 32 layers to a 4GB GPU (e.g. RTX 3050)
                              # tune this: raise it until you hit a CUDA out-of-memory
                              # error, then back off by a couple of layers
            verbose=False,
        )
    return _llm


def check_fraud(transcript: str) -> str:
    """
    Feed a conversation transcript / transaction description to the model
    and get back its fraud assessment as raw text.
    """
    llm = get_model()
    prompt = (
        "[INST] You are a fraud detection assistant. Analyze the following "
        "transcript and determine if it is fraudulent or legitimate. "
        f"Respond with a verdict and a brief reason.\n\n{transcript} [/INST]"
    )
    output = llm(
        prompt,
        max_tokens=200,
        temperature=0.2,   # low temperature — you want consistent, not creative, verdicts
        stop=["</s>"],
    )
    return output["choices"][0]["text"].strip()
