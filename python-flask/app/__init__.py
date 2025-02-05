from flask import Flask
from app.main import main as main_blueprint
from app.auth import auth as auth_blueprint

def create_app():
    app = Flask(__name__, template_folder='templates')

    # Register Blueprints
    app.register_blueprint(main_blueprint)
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    return app
