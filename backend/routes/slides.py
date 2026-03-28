import uuid
import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from services.slide_parser import parse_slide_file

slides_bp = Blueprint('slides', __name__)

# 内存存储 slides（生产环境应使用数据库）
slides_store = {}


@slides_bp.route('/upload', methods=['POST'])
def upload_slide():
    """上传并解析幻灯片文件"""
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400

    # 生成 slide ID
    slide_id = f"slide-{uuid.uuid4().hex[:12]}"

    # 保存文件
    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"{slide_id}_{filename}")
    file.save(file_path)

    # 异步解析文件（简化处理，实际可用 celery/rq）
    try:
        result = parse_slide_file(file_path, slide_id, filename)
        slides_store[slide_id] = result
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': f'解析失败: {str(e)}'}), 500


@slides_bp.route('/<slide_id>', methods=['GET'])
def get_slide(slide_id):
    """获取指定 slide"""
    if slide_id not in slides_store:
        return jsonify({'error': 'Slide 不存在'}), 404
    return jsonify(slides_store[slide_id])


@slides_bp.route('/', methods=['GET'])
def list_slides():
    """列出所有 slides"""
    slides = list(slides_store.values())
    return jsonify(slides)
