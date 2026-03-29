import os
import uuid
from datetime import datetime
from api_calling import pptx_to_images, api_access

# API configuration
API_KEY = os.environ.get('MINIMAX_API_KEY', '')
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
    print(f"Parsing file: {filename} with extension: {ext}")

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
        if api:
            # Use API to analyze PPTX with OCR
            analysis = api.analyze_pptx_with_ocr(file_path, prompt="Summarize this PPT content and extract key concepts")

            result['content'] = analysis.get('full_text', '')
            result['summary'] = analysis.get('summary', '')

            # Extract concepts from summary (simple parsing)
            if result['summary']:
                # Simple concept extraction - split by common delimiters
                lines = result['summary'].split('\n')
                for i, line in enumerate(lines[:5]):  # First 5 lines as concepts
                    if line.strip():
                        result['concepts'].append({
                            'id': f'{slide_id}-concept-{i}',
                            'slideId': slide_id,
                            'title': line.strip()[:50],
                            'description': line.strip()
                        })
        else:
            result['content'] = 'API not configured'
            result['summary'] = 'Please configure MINIMAX_API_KEY'

        result['status'] = 'ready'

    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)
    print(f"Finished parsing file: {filename}, status: {result['status']}")
    return result


def parse_pdf(file_path, slide_id, filename):
    """Parse PDF file"""
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
        if api:
            # Use API to analyze PDF with OCR
            analysis = api.analyze_pdf_with_ocr(file_path, prompt="Summarize this PDF content and extract key concepts")

            result['content'] = analysis.get('full_text', '')
            result['summary'] = analysis.get('summary', '')

            # Extract concepts from summary (simple parsing)
            if result['summary']:
                lines = result['summary'].split('\n')
                for i, line in enumerate(lines[:5]):
                    if line.strip():
                        result['concepts'].append({
                            'id': f'{slide_id}-concept-{i}',
                            'slideId': slide_id,
                            'title': line.strip()[:50],
                            'description': line.strip()
                        })
        else:
            result['content'] = 'API not configured'
            result['summary'] = 'Please configure MINIMAX_API_KEY'

        result['status'] = 'ready'

    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)

    return result


def parse_image(file_path, slide_id, filename):
    """Parse image file - extract text via OCR and summarize with LLM"""
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
        if api:
            # Use API to extract OCR text and summarize with LLM
            analysis = api.analyze_image_with_llm(file_path, prompt="Summarize this image content and extract key concepts")

            result['content'] = analysis.get('full_text', '')
            result['summary'] = analysis.get('summary', '')

            # Extract concepts from summary (simple parsing)
            if result['summary']:
                lines = result['summary'].split('\n')
                for i, line in enumerate(lines[:5]):
                    if line.strip():
                        result['concepts'].append({
                            'id': f'{slide_id}-concept-{i}',
                            'slideId': slide_id,
                            'title': line.strip()[:50],
                            'description': line.strip()
                        })
        else:
            result['content'] = 'API not configured'
            result['summary'] = 'Please configure MINIMAX_API_KEY'

        result['status'] = 'ready'

    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)

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
