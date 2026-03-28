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
    now = datetime.now()
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


def concept_associate(text, max_iter=2, max_word=3, base_position=None):
    """自动概念联想 - 异步生成概念节点

    Args:
        text: 输入文本
        max_iter: 最大迭代次数
        max_word: 每次最多提取的关键词数量
        base_position: 起始位置，格式 {"x": int, "y": int}

    Yields:
        dict: 包含节点或边信息的事件
              - {"type": "node", "data": node_dict}
              - {"type": "edge", "data": edge_dict}
              - {"type": "done", "data": {"total_nodes": int}}
    """
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from api_calling import api_access

    api = api_access()

    if base_position is None:
        base_position = {"x": 400, "y": 300}

    # Track all nodes and their parent relationships
    nodes = {}  # node_id -> node_dict
    edges = []  # list of edge_dicts
    visited_texts = set()  # 已处理过的文本，避免重复

    # 迭代生成概念
    current_batch = [(text, None)]  # (text, parent_node_id)
    iteration = 0

    # 位置偏移量，用于分层布局
    position_offset = {"x": 0, "y": 0}
    layer_spacing_x = 220
    layer_spacing_y = 120

    def extract_keywords(text, max_word):
        """使用 LLM 提取关键词，返回 [(keyword, brief_explanation), ...]"""
        prompt = f"""从以下文本中提取关键概念，每个概念用 "概念名::简短解释" 格式返回，最多返回 {max_word} 个概念。

要求：
1. 只返回概念列表，每行一个，格式为：概念名::解释
2. 概念名要简洁，2-6个字
3. 解释要简短，20字以内
4. 只返回真正重要的概念，不要泛泛的词
5. 如果没有明显概念，返回空行

文本：
{text[:1000]}"""

        try:
            response = api._call_minimax(
                [{"role": "user", "content": prompt}],
                max_tokens=1024,
                temperature=0.7
            )

            # 解析响应
            keywords = []
            for line in response.strip().split('\n'):
                line = line.strip()
                if '::' in line:
                    parts = line.split('::', 1)
                    keyword = parts[0].strip()
                    explanation = parts[1].strip() if len(parts) > 1 else ""
                    if keyword and keyword not in visited_texts:
                        keywords.append((keyword, explanation))
                        visited_texts.add(keyword)

            return keywords[:max_word]
        except Exception as e:
            print(f"Error extracting keywords: {e}")
            return []

    def explain_term(term):
        """获取术语解释"""
        try:
            return api.explain_term(term)
        except Exception as e:
            print(f"Error explaining term {term}: {e}")
            return f"{term}的详细解释"

    node_counter = 0
    layer_index = 0

    while current_batch and iteration < max_iter:
        iteration += 1
        next_batch = []
        layer_nodes_count = 0

        # 计算当前层的位置范围（居中）
        layer_total_width = len(current_batch) * layer_spacing_x
        layer_start_x = base_position["x"] - layer_total_width / 2 + position_offset["x"]

        for text_content, parent_id in current_batch:
            # 提取关键词
            keywords = extract_keywords(text_content, max_word)

            for keyword, brief_exp in keywords:
                node_counter += 1
                layer_index = iteration - 1

                # 计算位置（分层布局）
                node_x = layer_start_x + layer_nodes_count * layer_spacing_x
                node_y = base_position["y"] + layer_index * layer_spacing_y + position_offset["y"]

                node_id = f"concept-node-{node_counter}"

                # 获取完整解释
                full_explanation = explain_term(keyword)

                # 构建 markdown 格式的节点文本
                node_text = f"## {keyword}\n\n**简述:** {brief_exp}\n\n**详解:** {full_explanation[:200]}"

                node_dict = {
                    "id": node_id,
                    "text": node_text,
                    "position": {"x": node_x, "y": node_y}
                }

                nodes[node_id] = node_dict

                # 如果有父节点，创建边
                if parent_id:
                    edge_dict = {
                        "id": f"edge-{node_counter}",
                        "from": parent_id,
                        "to": node_id
                    }
                    edges.append(edge_dict)
                    yield {"type": "edge", "data": edge_dict}

                # 发送节点事件
                yield {"type": "node", "data": node_dict}

                # 将当前节点加入下一轮处理
                next_batch.append((keyword, node_id))
                layer_nodes_count += 1

        # 准备下一轮
        current_batch = next_batch

        # 更新位置偏移（每轮向下偏移）
        position_offset = {"x": 0, "y": layer_index * layer_spacing_y}

    # 完成
    yield {"type": "done", "data": {"total_nodes": node_counter}}
