import flask
import flask.ext.sqlalchemy
import flask.ext.restless
from flask import Flask, send_from_directory
from config import app, db
from models import StrongsDict, WordForms

# Create the Flask-Restless API manager.
manager = flask.ext.restless.APIManager(app, flask_sqlalchemy_db=db)
manager.create_api(StrongsDict, methods=['GET'])
manager.create_api(WordForms, methods=['GET'])


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if not path:
        path = 'index.html'
    return send_from_directory('www/', path)

if __name__ == '__main__':
    app.run()
