import io
import base64
import requests
from PIL import Image
from spire.presentation import Presentation


KEY = "sk-cp-kybfKR17owcghdMDQp_rmpRfKdUXRs0Y0KP9W6zstrpQLjoeScvTqrpr_e78Sr2X9mMlS_fxp3CMCKkl1qKEtl5P3fl7fYdSaX1iykCTgYGunkhoTE5yerw"
BASE_URL = "https://api.minimax.chat/v1"


def pptx_to_images(pptx_path, dpi=300):
    """Convert PPTX file to image list by page (using Spire.Presentation)

    Args:
        pptx_path: PPTX file path
        dpi: Image quality (current version does not support custom DPI)
    Returns:
        List[PIL.Image]: Image list for each page
    """
    prs = Presentation()
    prs.LoadFromFile(pptx_path)

    images = []

    for i, slide in enumerate(prs.Slides):
        # Save as image, returns Stream
        stream = slide.SaveAsImage()
        stream_bytes = stream.ToArray()
        img = Image.open(io.BytesIO(stream_bytes))
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        images.append(img)

    return images


class api_access:
    def __init__(self, key=KEY, model="MiniMax-M2"):
        self.api_key = key
        self.model = model
        self.base_url = BASE_URL

    def _call_minimax(self, messages, max_tokens=4096, temperature=0.7):
        """Call MiniMax ChatCompletion API

        Args:
            messages: List of message dicts with 'role' and 'content'
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature

        Returns:
            str: Response content
        """
        url = f"{self.base_url}/text/chatcompletion_v2"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        response = requests.post(url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()

        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")

    def read_file(self, path):
        """Read and analyze a file"""
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        messages = [
            {"role": "user", "content": "Read through this file and summarize it:\n\n" + content}
        ]
        return self._call_minimax(messages, max_tokens=1000)

    def read_text(self, text_list):
        """Handle conversation list

        Args:
            text_list: [[role, content], ...] format, role is 'user' or 'assistant'
        """
        messages = []
        for role, content in text_list:
            messages.append({"role": role, "content": content})

        return self._call_minimax(messages, max_tokens=4096)

    def chat(self, message, history=None):
        """Simple chat interface

        Args:
            message: User message
            history: Optional conversation history [[role, content], ...]

        Returns:
            str: AI response
        """
        messages = []
        if history:
            for role, content in history:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        return self._call_minimax(messages, max_tokens=1000)

    def analyze_pptx_images(self, pptx_path, prompt="Describe the content of this slide"):
        """Convert PPTX to images and send to model for analysis

        Args:
            pptx_path: PPTX file path
            prompt: Prompt for the model

        Returns:
            List of recognition results for each slide
        """
        # Convert PPTX to images
        images = pptx_to_images(pptx_path)

        results = []
        for i, img in enumerate(images):
            # Convert PIL Image to bytes
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            img_bytes = buf.getvalue()
            buf.close()

            # Encode image to base64
            img_base64 = base64.b64encode(img_bytes).decode('utf-8')

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_base64}"}},
                        {"type": "text", "text": f"第 {i+1} 页: {prompt}"}
                    ]
                }
            ]

            response = self._call_minimax(messages, max_tokens=2048)

            results.append({
                "page": i + 1,
                "response": response
            })

        return results


