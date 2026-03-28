from flask import Blueprint, request, jsonify
from services.chat_service import chat_completion, get_history, clear_history

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('', methods=['POST'])
def chat():
    """发送消息给 AI"""
    data = request.get_json()
    if not data:
        return jsonify({'error': '没有请求数据'}), 400

    message = data.get('message', '')
    user_id = data.get('userId', 'default')
    slide_id = data.get('slideId')
    selected_cards = data.get('selectedCards', [])

    if not message:
        return jsonify({'error': '消息为空'}), 400

    result = chat_completion(
        message=message,
        user_id=user_id,
        slide_id=slide_id,
        selected_cards=selected_cards
    )

    return jsonify(result)


@chat_bp.route('/history', methods=['GET'])
def get_chat_history():
    """获取聊天历史"""
    user_id = request.args.get('userId', 'default')
    history = get_history(user_id)
    return jsonify(history)


@chat_bp.route('/history', methods=['DELETE'])
def delete_chat_history():
    """清除聊天历史"""
    user_id = request.args.get('userId', 'default')
    clear_history(user_id)
    return jsonify({'status': 'ok'})
