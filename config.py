import os
import flask
import flask.ext.sqlalchemy
import flask.ext.restless
from flask import Flask

basedir = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['DEBUG'] = True
db = flask.ext.sqlalchemy.SQLAlchemy(app)

app.config['WHOOSH_BASE'] = os.path.join(basedir, 'search.db')
