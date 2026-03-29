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


def concept_associate(text, max_iter=2, max_word=3, base_position=None, nodeId=None):
    """自动概念联想 - 异步生成概念节点

    Args:
        text: 输入文本
        max_iter: 最大迭代次数
        max_word: 每次最多提取的关键词数量
        base_position: 起始位置，格式 {"x": int, "y": int}
        nodeId: 源节点ID，用于连接边

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

    # 迭代生成概念 - 第一轮使用传入的nodeId作为父节点
    current_batch = [(text, nodeId)]  # (text, parent_node_id)
    iteration = 0

    # 位置偏移量，用于分层布局
    position_offset = {"x": 0, "y": 0}
    layer_spacing_x = 220
    layer_spacing_y = 120

    def extract_keywords(text, max_word):
        """Extract keywords using LLM, returns [(keyword, brief_explanation), ...]"""
        prompt = f"""Extract key concepts from the following text. Return each concept in "concept_name::brief_explanation" format, up to {max_word} concepts.

Requirements:
1. Return only the concept list, one per line, format: concept_name::explanation
2. Keep concept names concise, 2-6 characters
3. Keep explanations brief, within 20 characters
4. Return only truly important concepts, avoid generic terms
5. If no obvious concepts, return empty

Text:
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

    print(f"[联想] 开始处理: text={text}, max_iter={max_iter}, max_word={max_word}")

    while current_batch and iteration < max_iter:
        iteration += 1
        next_batch = []
        layer_nodes_count = 0

        print(f"[联想] 第 {iteration}/{max_iter} 轮迭代，当前批次: {len(current_batch)} 个概念")

        # 计算当前层的位置范围（居中）
        layer_total_width = len(current_batch) * layer_spacing_x
        layer_start_x = base_position["x"] - layer_total_width / 2 + position_offset["x"]

        for text_content, parent_id in current_batch:
            # 提取关键词
            print(f"[联想] 正在提取关键词: {text_content}")
            keywords = extract_keywords(text_content, max_word)
            print(f"[联想] 提取到 {len(keywords)} 个关键词: {[k[0] for k in keywords]}")

            for keyword, brief_exp in keywords:
                node_counter += 1
                layer_index = iteration - 1

                # 计算位置（分层布局）
                node_x = layer_start_x + layer_nodes_count * layer_spacing_x
                node_y = base_position["y"] + layer_index * layer_spacing_y + position_offset["y"]

                node_id = f"concept-node-{node_counter}"

                print(f"[联想] 正在解释关键词: {keyword}")

                # 获取完整解释
                full_explanation = explain_term(keyword)

                print(f"[联想] 解释完成: {keyword} -> 生成节点 {node_id}")

                # 构建 markdown 格式的节点文本
                if full_explanation and full_explanation.strip():
                    node_text = f"## {keyword}\n\n**简述:** {brief_exp}\n\n**详解:** {full_explanation[:200]}"
                else:
                    node_text = f"## {keyword}\n\n**简述:** {brief_exp}"

                node_dict = {
                    "id": node_id,
                    "text": node_text,
                    "position": {"x": node_x, "y": node_y},
                    "parent_id": parent_id  # 用于前端创建边
                }

                nodes[node_id] = node_dict

                # 如果有父节点，创建边
                edge_dict = None
                if parent_id:
                    edge_dict = {
                        "id": f"edge-{node_counter}",
                        "from": parent_id,
                        "to": node_id
                    }
                    edges.append(edge_dict)
                    print(f"[联想] 生成边: {parent_id} -> {node_id}")

                # 发送节点事件（包含edge信息）
                print(f"[联想] 发送节点: {node_id}")
                yield {"type": "node", "data": node_dict, "edge": edge_dict}

                # 将当前节点加入下一轮处理
                next_batch.append((keyword, node_id))
                layer_nodes_count += 1

        # 准备下一轮
        current_batch = next_batch
        print(f"[联想] 第 {iteration} 轮完成，生成了 {len(next_batch)} 个节点进入下一轮")

        # 更新位置偏移（每轮向下偏移）
        position_offset = {"x": 0, "y": layer_index * layer_spacing_y}

    print(f"[联想] 全部完成，共生成 {node_counter} 个节点")
    # 完成
    yield {"type": "done", "data": {"total_nodes": node_counter}}
