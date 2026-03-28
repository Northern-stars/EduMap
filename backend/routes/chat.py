from flask import Blueprint, request, jsonify
from services.chat_service import chat_completion, get_history, clear_history

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('', methods=['POST'])
def chat():
    """Send message to AI"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No request data'}), 400

    message = data.get('message', '')
    user_id = data.get('userId', 'default')
    slide_id = data.get('slideId')
    selected_cards = data.get('selectedCards', [])

    if not message:
        return jsonify({'error': 'Empty message'}), 400

    result = chat_completion(
        message=message,
        user_id=user_id,
        slide_id=slide_id,
        selected_cards=selected_cards
    )

    return jsonify(result)


@chat_bp.route('/history', methods=['GET'])
def get_chat_history():
    """Get chat history"""
    user_id = request.args.get('userId', 'default')
    history = get_history(user_id)
    return jsonify(history)


@chat_bp.route('/history', methods=['DELETE'])
def delete_chat_history():
    """Clear chat history"""
    user_id = request.args.get('userId', 'default')
    clear_history(user_id)
    return jsonify({'status': 'ok'})
