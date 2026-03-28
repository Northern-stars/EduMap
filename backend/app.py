from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Register blueprints
from routes.slides import slides_bp
from routes.chat import chat_bp
from routes.mindmap import mindmap_bp

app.register_blueprint(slides_bp, url_prefix='/api/slides')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(mindmap_bp, url_prefix='/api/mindmaps')

@app.route('/api/health')
def health():
    return {'status': 'ok'}
@app.route("/chat")
def chat():
    return {"message": "Hello from the backend!"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
