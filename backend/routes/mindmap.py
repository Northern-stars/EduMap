from flask import Blueprint, request, jsonify, send_from_directory
from services.mindmap_service import (
    get_all_mindmaps,
    get_mindmap,
    save_mindmap,
    delete_mindmap,
    create_empty_mindmap,
    MINDMAPS_DIR
)

mindmap_bp = Blueprint('mindmap', __name__)


@mindmap_bp.route('', methods=['GET'])
def list_mindmaps():
    """List all mindmaps"""
    mindmaps = get_all_mindmaps()
    return jsonify(mindmaps)


@mindmap_bp.route('', methods=['POST'])
def create_mindmap():
    """Create a new mindmap"""
    data = request.get_json() or {}
    title = data.get('title', 'Untitled Mind Map')

    if data:
        # If data provided, save it directly
        mindmap_data = save_mindmap(data)
    else:
        # Otherwise create empty with default root node
        mindmap_data = create_empty_mindmap(title)

    return jsonify(mindmap_data), 201


@mindmap_bp.route('/<mindmap_id>', methods=['GET'])
def get_mindmap_by_id(mindmap_id):
    """Get a specific mindmap"""
    mindmap_data = get_mindmap(mindmap_id)
    if not mindmap_data:
        return jsonify({'error': 'Mindmap not found'}), 404
    return jsonify(mindmap_data)


@mindmap_bp.route('/<mindmap_id>', methods=['PUT'])
def update_mindmap(mindmap_id):
    """Update a mindmap"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Ensure ID matches
    data['id'] = mindmap_id
    mindmap_data = save_mindmap(data)
    return jsonify(mindmap_data)


@mindmap_bp.route('/<mindmap_id>', methods=['DELETE'])
def delete_mindmap_by_id(mindmap_id):
    """Delete a mindmap"""
    success = delete_mindmap(mindmap_id)
    if not success:
        return jsonify({'error': 'Mindmap not found'}), 404
    return jsonify({'status': 'ok'})
