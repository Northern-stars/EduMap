import io
import os
import json
import base64
import requests
from PIL import Image
from spire.presentation import Presentation
from pdf2image import convert_from_path
from pypdf import PdfReader


KEY = os.environ.get('MINIMAX_API_KEY', '')
BASE_URL = "https://api.minimax.chat/v1"
FILE_URL = "https://api.minimax.chat/v1/files/upload"
MCP_URL = os.environ.get('MCP_URL', 'https://api.minimaxi.com')

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


def pdf_to_images(pdf_path, dpi=200):
    """Convert PDF file to image list by page

    Args:
        pdf_path: PDF file path
        dpi: Image quality (default 200)

    Returns:
        List[PIL.Image]: Image list for each page
    """
    images = convert_from_path(pdf_path, dpi=dpi)

    # Convert RGBA to RGB if needed
    result_images = []
    for img in images:
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        result_images.append(img)

    return result_images


def extract_text_from_pdf(pdf_path):
    """Extract text content from PDF file

    Args:
        pdf_path: PDF file path

    Returns:
        str: Extracted text content
    """
    reader = PdfReader(pdf_path)
    text_content = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_content.append(text)

    return "\n\n".join(text_content)


class OCRProcessor:
    """OCR processor using PaddleOCR"""

    def __init__(self, lang='ch', use_angle_cls=True):
        """Initialize OCR

        Args:
            lang: Language, 'ch' for Chinese, 'en' for English, 'ch_sim' for simplified Chinese
            use_angle_cls: Whether to use angle classification
        """
        self.ocr = None
        self.lang = lang
        self.use_angle_cls = use_angle_cls

    def _get_ocr(self):
        """Lazy initialization of OCR"""
        if self.ocr is None:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(use_angle_cls=self.use_angle_cls, lang=self.lang)
        return self.ocr

    def extract_text(self, image_path):
        """Extract text from single image

        Args:
            image_path: Path to image file or PIL Image

        Returns:
            str: Extracted text
        """
        ocr = self._get_ocr()

        # PaddleOCR only accepts file paths, not PIL Image
        if isinstance(image_path, Image.Image):
            # Save to temp file
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            image_path.save(temp_file.name, format='PNG')
            temp_file.close()
            image_path = temp_file.name

        result = ocr.ocr(image_path)

        if not result:
            return ""

        # Handle new PaddleOCR format: list of dicts with 'rec_texts'
        if isinstance(result, list) and result and isinstance(result[0], dict):
            if 'rec_texts' in result[0]:
                return "\n".join(result[0].get('rec_texts', []))

        # Old format: list of lists [[box, (text, score)], ...]
        if isinstance(result, list) and result and isinstance(result[0], list):
            lines = []
            for item in result:
                if item and len(item) >= 2:
                    text_data = item[1]
                    if isinstance(text_data, tuple):
                        text = text_data[0]
                    elif isinstance(text_data, str):
                        text = text_data
                    else:
                        text = ''
                    if text:
                        lines.append(text)
            return "\n".join(lines)

        return ""

    def extract_text_batch(self, image_paths):
        """Extract text from multiple images

        Args:
            image_paths: List of image paths or PIL Images

        Returns:
            list: List of extracted texts
        """
        results = []
        for img_path in image_paths:
            text = self.extract_text(img_path)
            results.append(text)
        return results


# Global OCR instance
_ocr_processor = None


def get_ocr_processor(lang='ch'):
    """Get or create global OCR processor"""
    global _ocr_processor
    if _ocr_processor is None:
        _ocr_processor = OCRProcessor(lang=lang)
    return _ocr_processor


def extract_text_from_image(image_path):
    """Extract text from single image using OCR

    Args:
        image_path: Path to image or PIL Image

    Returns:
        str: Extracted text
    """
    ocr = get_ocr_processor()
    return ocr.extract_text(image_path)


class MCPClient:
    """MCP client for MiniMax API"""

    def __init__(self, server_url=MCP_URL, api_key=KEY):
        self.server_url = server_url
        self.api_key = api_key
        self.session_id = None

    def _request(self, method, endpoint, data=None, files=None):
        """Make request to MCP server"""
        url = f"{self.server_url}{endpoint}"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        if files:
            # Multipart form data
            response = requests.post(url, headers=headers, files=files, timeout=120)
        else:
            # JSON request
            headers["Content-Type"] = "application/json"
            response = requests.post(url, headers=headers, json=data, timeout=120)

        response.raise_for_status()
        return response.json()

    def upload_file(self, file_path, purpose="file-extract"):
        """Upload file via MCP

        Args:
            file_path: Path to the file
            purpose: Purpose of the file

        Returns:
            dict: File info including file_id
        """
        with open(file_path, "rb") as f:
            files = {
                "file": (os.path.basename(file_path), f),
                "purpose": (None, purpose)
            }
            return self._request("POST", "/tools/upload_file", files=files)

    def list_files(self):
        """List uploaded files"""
        return self._request("GET", "/tools/list_files")

    def delete_file(self, file_id):
        """Delete a file"""
        return self._request("DELETE", f"/tools/delete_file?file_id={file_id}")


class api_access:
    def __init__(self, key=KEY, model="MiniMax-M2.7"):
        self.api_key = key
        self.model = model
        self.base_url = BASE_URL
        self.file_url = FILE_URL
        self.mcp_client = MCPClient(api_key=key)

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
        print(f"[_call_minimax] API response: {json.dumps(data, ensure_ascii=False)[:500]}")
        message = data.get("choices", [{}])[0].get("message", {})
        content = message.get("content", "")
        # Fallback to reasoning_content if content is empty
        if not content and message.get("reasoning_content"):
            content = message.get("reasoning_content", "")
        print(f"[_call_minimax] extracted content: '{content[:200] if content else 'empty'}'")
        return content

    def upload_file(self, file_path, purpose="file-extract"):
        """Upload file to MiniMax API via MCP

        Args:
            file_path: Path to the file
            purpose: Purpose of the file, "file-extract" or "batch"

        Returns:
            dict: File info including file_id
        """
        return self.mcp_client.upload_file(file_path, purpose)

    def read_file(self, path):
        """Read and analyze a file"""
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        messages = [
            {"role": "user", "content": "Read through this file and summarize it within 200 words:\n\n" + content}
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

    def analyze_pptx_file(self, pptx_path, prompt="Describe the content of this PPT file"):
        """Upload PPTX file to model for analysis

        Args:
            pptx_path: PPTX file path
            prompt: Prompt for the model

        Returns:
            dict: File info and model's response
        """
        # Upload file
        file_info = self.upload_file(pptx_path, purpose="file-extract")
        file_id = file_info.get("file_id")

        if not file_id:
            return {"error": "File upload failed", "file_info": file_info}

        # Use file for chat
        messages = [
            {
                "role": "user",
                "content": prompt,
                "file_ids": [file_id]
            }
        ]

        response = self._call_minimax(messages, max_tokens=4096)

        return {
            "file_info": file_info,
            "response": response
        }

    def analyze_pdf_file(self, pdf_path, prompt="Describe the content of this PDF file"):
        """Upload PDF file to model for analysis

        Args:
            pdf_path: PDF file path
            prompt: Prompt for the model

        Returns:
            dict: File info and model's response
        """
        # Upload file
        file_info = self.upload_file(pdf_path, purpose="file-extract")
        file_id = file_info.get("file_id")

        if not file_id:
            return {"error": "File upload failed", "file_info": file_info}

        # Use file for chat
        messages = [
            {
                "role": "user",
                "content": prompt,
                "file_ids": [file_id]
            }
        ]

        response = self._call_minimax(messages, max_tokens=4096)

        return {
            "file_info": file_info,
            "response": response
        }

    def analyze_image_with_ocr(self, image_path, prompt="Describe the content of this image"):
        """Analyze image using OCR + MiniMax (legacy method)

        Args:
            image_path: Path to image file or PIL Image
            prompt: Prompt for the model

        Returns:
            dict: OCR text and model's response
        """
        # Extract text via OCR
        ocr = get_ocr_processor()
        ocr_text = ocr.extract_text(image_path)

        if not ocr_text.strip():
            return {
                "ocr_text": "",
                "response": "No text content found in the image"
            }

        # Send to MiniMax
        messages = [
            {"role": "user", "content": f"{prompt}\n\nImage text content:\n{ocr_text}"}
        ]
        response = self._call_minimax(messages, max_tokens=4096)

        return {
            "ocr_text": ocr_text,
            "response": response
        }

    def analyze_image_with_llm(self, image_path, prompt="Summarize this image and extract key concepts"):
        """Analyze image by extracting text via OCR, then summarize with LLM

        Args:
            image_path: Path to image file or PIL Image
            prompt: Prompt for the model to summarize

        Returns:
            dict: full_text (OCR result), summary (LLM summary), ocr_text
        """
        # Extract text via OCR
        ocr = get_ocr_processor()
        ocr_text = ocr.extract_text(image_path)

        if not ocr_text.strip():
            return {
                "ocr_text": "",
                "full_text": "",
                "summary": "No text content extracted from image"
            }

        # Send OCR text to MiniMax for summary
        messages = [
            {"role": "user", "content": f"{prompt}\n\nImage text content:\n{ocr_text}"}
        ]
        summary = self._call_minimax(messages, max_tokens=4096)

        return {
            "ocr_text": ocr_text,
            "full_text": ocr_text,
            "summary": summary
        }

    def analyze_pdf_with_ocr(self, pdf_path, prompt="Summarize the content of this PDF"):
        """Analyze PDF by extracting text directly, then summarize

        Args:
            pdf_path: PDF file path
            prompt: Prompt for the model

        Returns:
            dict: Results for each page
        """
        # Extract text directly from PDF using pypdf
        text_content = extract_text_from_pdf(pdf_path)

        if not text_content.strip():
            return {
                "pages": [],
                "full_text": "",
                "summary": "PDF file doesn't contain extractable text content"
            }

        # Send to MiniMax for summary
        messages = [
            {"role": "user", "content": f"{prompt}\n\nPDF content: \n{text_content}"}
        ]
        summary = self._call_minimax(messages, max_tokens=4096)

        return {
            "pages": [],
            "full_text": text_content,
            "summary": summary
        }

    def analyze_pptx_with_ocr(self, pptx_path, prompt="Describe the content of this PPT file"):
        """Analyze PPTX by converting to images, OCR, then summarize

        Args:
            pptx_path: PPTX file path
            prompt: Prompt for the model

        Returns:
            dict: Results for each slide
        """
        # Convert PPTX to images
        images = pptx_to_images(pptx_path)

        results = []
        for i, img in enumerate(images):
            ocr_text = extract_text_from_image(img)
            results.append({
                "slide": i + 1,
                "ocr_text": ocr_text
            })

        # Combine all OCR text
        full_text = "\n\n".join([f"Slide {r['slide']}: \n{r['ocr_text']}" for r in results])

        # Send to MiniMax for summary
        messages = [
            {"role": "user", "content": f"{prompt}\n\n{full_text}"}
        ]
        summary = self._call_minimax(messages, max_tokens=4096)

        return {
            "slides": results,
            "full_text": full_text,
            "summary": summary
        }

    def explain_term(self, term):
        """Explain a term or concept using MiniMax

        Args:
            term: Term or concept to explain
        Returns:
            str: Explanation of the term
        """
        print(f"Explaining term: {term}")

        prompt = f"Briefly explain this concept in one sentence: {term}"

        messages = [
            {"role": "user", "content": prompt}
        ]
        result = self._call_minimax(messages, max_tokens=512)
        print(f"[explain_term] result length: {len(result) if result else 0}, content: {result[:100] if result else 'empty'}")
        return result