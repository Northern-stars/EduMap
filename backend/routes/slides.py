import uuid
import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from services.slide_parser import parse_slide_file

slides_bp = Blueprint('slides', __name__)

# In-memory storage for slides (use database in production)
slides_store = {}


@slides_bp.route('/upload', methods=['POST'])
def upload_slide():
    """Upload and parse slide file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    # Generate slide ID
    slide_id = f"slide-{uuid.uuid4().hex[:12]}"

    # Save file
    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"{slide_id}_{filename}")
    file.save(file_path)

    # Parse file synchronously (use celery/rq for async in production)
    try:
        result = parse_slide_file(file_path, slide_id, filename)
        slides_store[slide_id] = result
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': f'Parse failed: {str(e)}'}), 500


@slides_bp.route('/<slide_id>', methods=['GET'])
def get_slide(slide_id):
    """Get slide by ID"""
    if slide_id not in slides_store:
        return jsonify({'error': 'Slide not found'}), 404
    return jsonify(slides_store[slide_id])


@slides_bp.route('/', methods=['GET'])
def list_slides():
    """List all slides"""
    slides = list(slides_store.values())
    return jsonify(slides)
