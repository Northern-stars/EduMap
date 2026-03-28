import os
from collections import defaultdict
from api_calling import api_access

# API configuration
API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
api = api_access(key=API_KEY) if API_KEY else None

# In-memory chat history storage
chat_history_store = defaultdict(list)


def chat_completion(message, user_id='default', slide_id=None, selected_cards=None):
    """Process user message and return AI response

    Args:
        message: User message
        user_id: User ID
        slide_id: Current slide ID
        selected_cards: Selected concept cards

    Returns:
        dict: AI response result
    """
    # Record user message
    chat_history_store[user_id].append({
        'role': 'user',
        'content': message
    })

    # Build context
    prompt_parts = []

    if slide_id:
        prompt_parts.append(f"Current slide ID: {slide_id}")

    if selected_cards:
        prompt_parts.append(f"User selected {len(selected_cards)} concepts")

    context = '\n'.join(prompt_parts) if prompt_parts else ''

    # Call model
    if api:
        try:
            history = chat_history_store[user_id][-10:]  # Last 10 messages
            text_list = [[m['role'], m['content']] for m in history]

            ai_response = api.read_text(text_list)
        except Exception as e:
            ai_response = f"An error occurred: {str(e)}"
    else:
        # Demo mode
        ai_response = generate_demo_response(message, selected_cards)

    # Record AI response
    chat_history_store[user_id].append({
        'role': 'assistant',
        'content': ai_response
    })

    return {
        'response': ai_response,
        'suggestions': [
            {'type': 'concept', 'title': 'Extract key concepts'},
            {'type': 'action', 'title': 'Apply suggestion'}
        ],
        'historyLength': len(chat_history_store[user_id])
    }


def generate_demo_response(message, selected_cards):
    """Generate demo response when API is not configured"""
    if not message.strip():
        return 'Please enter your question'

    if selected_cards and len(selected_cards) > 0:
        return f'I notice you selected {len(selected_cards)} concepts. Would you like to know how they are related?'

    return f'Your question is: {message}\n\nThis is a simulated response. Please configure ANTHROPIC_API_KEY to enable real AI responses.'


def get_history(user_id='default'):
    """Get chat history"""
    return chat_history_store[user_id]


def clear_history(user_id='default'):
    """Clear chat history"""
    chat_history_store[user_id] = []
