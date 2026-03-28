import os
import json
from datetime import datetime

MINDMAPS_DIR = os.path.join(os.path.dirname(__file__), '..', 'mindmaps')


def ensure_mindmaps_dir():
    """Ensure mindmaps directory exists"""
    os.makedirs(MINDMAPS_DIR, exist_ok=True)


def get_all_mindmaps():
    """Get list of all mindmaps (metadata only)"""
    ensure_mindmaps_dir()
    mindmaps = []
    for filename in os.listdir(MINDMAPS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(MINDMAPS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                mindmaps.append({
                    'id': data.get('id'),
                    'title': data.get('title'),
                    'createdAt': data.get('createdAt'),
                    'updatedAt': data.get('updatedAt'),
                    'nodeCount': len(data.get('nodes', [])),
                    'edgeCount': len(data.get('edges', []))
                })
    return mindmaps


def get_mindmap(mindmap_id):
    """Get a specific mindmap by ID"""
    ensure_mindmaps_dir()
    filepath = os.path.join(MINDMAPS_DIR, f'{mindmap_id}.json')
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_mindmap(mindmap_data):
    """Save or update a mindmap"""
    ensure_mindmaps_dir()

    mindmap_id = mindmap_data.get('id')
    if not mindmap_id:
        mindmap_id = f'mindmap-{datetime.now().strftime("%Y%m%d%H%M%S")}'
        mindmap_data['id'] = mindmap_id

    mindmap_data['updatedAt'] = datetime.now().isoformat()

    if 'createdAt' not in mindmap_data:
        mindmap_data['createdAt'] = mindmap_data['updatedAt']

    filepath = os.path.join(MINDMAPS_DIR, f'{mindmap_id}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(mindmap_data, f, ensure_ascii=False, indent=2)

    return mindmap_data


def delete_mindmap(mindmap_id):
    """Delete a mindmap by ID"""
    ensure_mindmaps_dir()
    filepath = os.path.join(MINDMAPS_DIR, f'{mindmap_id}.json')
    if os.path.exists(filepath):
        os.remove(filepath)
        return True
    return False


def create_empty_mindmap(title='Untitled Mind Map'):
    """Create a new empty mindmap with a root node"""
    now = datetime.now().isoformat()
    mindmap_id = f'mindmap-{now.strftime("%Y%m%d%H%M%S")}' if isinstance(now, str) else now.strftime("%Y%m%d%H%M%S")

    mindmap_data = {
        'id': f'mindmap-{mindmap_id}',
        'title': title,
        'nodes': [
            {
                'id': 'root',
                'text': '# 新建思维导图\n点击编辑内容',
                'position': {'x': 400, 'y': 300}
            }
        ],
        'edges': [],
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat()
    }

    return save_mindmap(mindmap_data)
