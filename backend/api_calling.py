from anthropic import Anthropic
import io
from PIL import Image
from spire.presentation import Presentation


KEY = ""


def pptx_to_images(pptx_path, dpi=300):
    """将 PPTX 文件按页转换为图片列表（使用 Spire.Presentation）

    Args:
        pptx_path: PPTX 文件路径
        dpi: 图片清晰度（当前版本不支持自定义 DPI）

    Returns:
        List[PIL.Image]: 每页对应的图片列表
    """
    prs = Presentation()
    prs.LoadFromFile(pptx_path)

    images = []

    for i, slide in enumerate(prs.Slides):
        # 保存为图片，返回 Stream
        stream = slide.SaveAsImage()
        stream_bytes = stream.ToArray()
        img = Image.open(io.BytesIO(stream_bytes))
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        images.append(img)

    return images


class api_access:
    def __init__(self, key=KEY, model="claude-sonnet-4-20250514"):
        self.client = Anthropic(api_key=key)
        self.model = model

    def read_file(self, path):
        with open(path, "rb") as f:
            file = f.read()

        response = self.client.responses.create(
            model=self.model,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Read through this file and conclude it"
                        },
                        {
                            "type": "input_file",
                            "filename": path,
                            "file_data": file
                        }
                    ]
                }
            ]
        )

        return response

    def read_text(self, text_list):
        """处理对话列表

        Args:
            text_list: [[role, content], ...] 格式的列表，role 为 'user' 或 'assistant'
        """
        messages = []
        for role, content in text_list:
            if role == 'user':
                messages.append({"role": "user", "content": content})
            elif role == 'assistant':
                messages.append({"role": "assistant", "content": content})

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=messages
        )

        return response.content[0].text

    def chat(self, message, history=None):
        """简单的对话接口

        Args:
            message: 用户消息
            history: 可选的对话历史 [[role, content], ...]
        """
        messages = []
        if history:
            for role, content in history:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=messages
        )

        return response.content[0].text

    def analyze_pptx_images(self, pptx_path, prompt="描述这张幻灯片的内容"):
        """将 PPTX 转换为图片并输给模型识别

        Args:
            pptx_path: PPTX 文件路径
            prompt: 给模型的提示词

        Returns:
            模型对每页幻灯片的识别结果列表
        """
        # 将 PPTX 转换为图片
        images = pptx_to_images(pptx_path)

        results = []
        for i, img in enumerate(images):
            # 将 PIL Image 转换为字节
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            buf.seek(0)

            # 发送给模型
            response = self.client.responses.create(
                model=self.model,
                input=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": f"第 {i+1} 页: {prompt}"},
                            {"type": "input_image", "source": {"type": "base64", "media_type": "image/png", "data": buf.read().decode('latin-1')}}
                        ]
                    }
                ]
            )

            results.append({
                "page": i + 1,
                "response": response
            })

            buf.close()

        return results


