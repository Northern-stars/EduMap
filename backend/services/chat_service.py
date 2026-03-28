import os
from collections import defaultdict
from api_calling import api_access

# API 配置
API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
api = api_access(key=API_KEY) if API_KEY else None

# 内存存储聊天历史
chat_history_store = defaultdict(list)


def chat_completion(message, user_id='default', slide_id=None, selected_cards=None):
    """处理用户消息并返回 AI 响应

    Args:
        message: 用户消息
        user_id: 用户 ID
        slide_id: 当前 slide ID
        selected_cards: 选中的概念卡片列表

    Returns:
        dict: AI 响应结果
    """
    # 记录用户消息
    chat_history_store[user_id].append({
        'role': 'user',
        'content': message
    })

    # 构建提示词
    prompt_parts = []

    if slide_id:
        prompt_parts.append(f"当前分析的幻灯片 ID: {slide_id}")

    if selected_cards:
        prompt_parts.append(f"用户选中了 {len(selected_cards)} 个概念")

    context = '\n'.join(prompt_parts) if prompt_parts else ''

    # 调用模型
    if api:
        try:
            # 使用 chat 方法进行对话
            history = chat_history_store[user_id][-10:]  # 最近 10 条
            text_list = [[m['role'], m['content']] for m in history]

            ai_response = api.read_text(text_list)
        except Exception as e:
            ai_response = f"抱歉，发生了错误: {str(e)}"
    else:
        # Demo 模式
        ai_response = generate_demo_response(message, selected_cards)

    # 记录 AI 响应
    chat_history_store[user_id].append({
        'role': 'assistant',
        'content': ai_response
    })

    return {
        'response': ai_response,
        'suggestions': [
            {'type': 'concept', 'title': '提取关键概念'},
            {'type': 'action', 'title': '采纳建议'}
        ],
        'historyLength': len(chat_history_store[user_id])
    }


def generate_demo_response(message, selected_cards):
    """生成演示响应（当没有配置 API 时）"""
    if not message.strip():
        return '请输入您的问题'

    if selected_cards and len(selected_cards) > 0:
        return f'我注意到您选中了 {len(selected_cards)} 个概念。请问您想了解它们之间的关联吗？'

    return f'您的问题是: {message}\n\n这是一条模拟响应。请配置 ANTHROPIC_API_KEY 来启用真实的 AI 响应。'


def get_history(user_id='default'):
    """获取聊天历史"""
    return chat_history_store[user_id]


def clear_history(user_id='default'):
    """清除聊天历史"""
    chat_history_store[user_id] = []
