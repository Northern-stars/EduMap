import os
import uuid
from datetime import datetime
from api_calling import pptx_to_images
from api_calling import api_access

# API 配置
API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
api = api_access(key=API_KEY) if API_KEY else None


def parse_slide_file(file_path, slide_id, filename):
    """解析幻灯片文件

    Args:
        file_path: 文件路径
        slide_id: Slide ID
        filename: 文件名

    Returns:
        dict: 解析结果
    """
    ext = os.path.splitext(filename)[1].lower()

    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'processing',
        'content': '',
        'summary': '',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }

    if ext == '.pptx':
        result = parse_pptx(file_path, slide_id, filename)
    elif ext == '.pdf':
        result = parse_pdf(file_path, slide_id, filename)
    elif ext in ['.png', '.jpg', '.jpeg']:
        result = parse_image(file_path, slide_id, filename)
    elif ext == '.txt':
        result = parse_txt(file_path, slide_id, filename)
    elif ext == '.docx':
        result = parse_docx(file_path, slide_id, filename)
    else:
        result['status'] = 'error'
        result['error'] = f'不支持的文件格式: {ext}'

    return result


def parse_pptx(file_path, slide_id, filename):
    """解析 PPTX 文件"""
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'processing',
        'content': '',
        'summary': '',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }

    try:
        # 转换为图片
        images = pptx_to_images(file_path, dpi=300)

        if not images:
            result['status'] = 'ready'
            result['content'] = '未能提取到任何幻灯片'
            return result

        # 使用模型分析每页
        if api:
            analysis_results = []
            for i, img in enumerate(images):
                # 简单的文本分析
                analysis_results.append(f"第 {i+1} 页幻灯片")

            result['content'] = '\n'.join(analysis_results)
            result['summary'] = f'该 PPTX 共包含 {len(images)} 页幻灯片'

            # 可以进一步调用模型提取概念
            # concepts = extract_concepts_from_images(images)
            # result['concepts'] = concepts
        else:
            result['content'] = f'该 PPTX 共包含 {len(images)} 页幻灯片'
            result['summary'] = 'API 未配置，仅解析了页数'

        result['status'] = 'ready'

    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)

    return result


def parse_pdf(file_path, slide_id, filename):
    """解析 PDF 文件"""
    # 简化实现
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'ready',
        'content': 'PDF 解析功能待实现',
        'summary': 'PDF 解析功能待实现',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }
    return result


def parse_image(file_path, slide_id, filename):
    """解析图片文件"""
    # 简化实现
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'ready',
        'content': '图片解析功能待实现',
        'summary': '图片解析功能待实现',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }
    return result


def parse_txt(file_path, slide_id, filename):
    """解析 TXT 文件，直接提取文字"""
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'ready',
        'content': '',
        'summary': '',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        result['content'] = content.strip()

        # 简单的摘要：取前 200 字符
        if len(content) > 200:
            result['summary'] = content[:200].strip() + '...'
        else:
            result['summary'] = content.strip()

    except Exception as e:
        result['status'] = 'error'
        result['error'] = f'TXT 读取失败: {str(e)}'

    return result


def parse_docx(file_path, slide_id, filename):
    """解析 DOCX 文件，直接提取文字"""
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'ready',
        'content': '',
        'summary': '',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }

    try:
        from docx import Document

        doc = Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        content = '\n'.join(paragraphs)

        result['content'] = content

        # 简单的摘要：取前 200 字符
        if len(content) > 200:
            result['summary'] = content[:200].strip() + '...'
        else:
            result['summary'] = content.strip()

    except Exception as e:
        result['status'] = 'error'
        result['error'] = f'DOCX 解析失败: {str(e)}'

    return result
