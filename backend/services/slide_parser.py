import os
import uuid
from datetime import datetime
from api_calling import pptx_to_images
from api_calling import api_access

# API configuration
API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
api = api_access(key=API_KEY) if API_KEY else None


def parse_slide_file(file_path, slide_id, filename):
    """Parse slide file

    Args:
        file_path: File path
        slide_id: Slide ID
        filename: Filename

    Returns:
        dict: Parse result
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
        result['error'] = f'Unsupported file format: {ext}'

    return result


def parse_pptx(file_path, slide_id, filename):
    """Parse PPTX file"""
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
        # Convert to images
        images = pptx_to_images(file_path, dpi=300)

        if not images:
            result['status'] = 'ready'
            result['content'] = 'No slides extracted'
            return result

        # Analyze each page with model
        if api:
            analysis_results = []
            for i, img in enumerate(images):
                analysis_results.append(f"Slide {i+1}")

            result['content'] = '\n'.join(analysis_results)
            result['summary'] = f'This PPTX contains {len(images)} slides'

        else:
            result['content'] = f'This PPTX contains {len(images)} slides'
            result['summary'] = 'API not configured, only slide count available'

        result['status'] = 'ready'

    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)

    return result


def parse_pdf(file_path, slide_id, filename):
    """Parse PDF file"""
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'ready',
        'content': 'PDF parsing not implemented',
        'summary': 'PDF parsing not implemented',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }
    return result


def parse_image(file_path, slide_id, filename):
    """Parse image file"""
    result = {
        'id': slide_id,
        'filename': filename,
        'status': 'ready',
        'content': 'Image parsing not implemented',
        'summary': 'Image parsing not implemented',
        'concepts': [],
        'createdAt': datetime.now().isoformat()
    }
    return result


def parse_txt(file_path, slide_id, filename):
    """Parse TXT file - extract text directly"""
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

        # Simple summary: first 200 characters
        if len(content) > 200:
            result['summary'] = content[:200].strip() + '...'
        else:
            result['summary'] = content.strip()

    except Exception as e:
        result['status'] = 'error'
        result['error'] = f'TXT read failed: {str(e)}'

    return result


def parse_docx(file_path, slide_id, filename):
    """Parse DOCX file - extract text directly"""
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

        # Simple summary: first 200 characters
        if len(content) > 200:
            result['summary'] = content[:200].strip() + '...'
        else:
            result['summary'] = content.strip()

    except Exception as e:
        result['status'] = 'error'
        result['error'] = f'DOCX parse failed: {str(e)}'

    return result
