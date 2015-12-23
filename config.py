import os
import flask
import flask.ext.sqlalchemy
import flask.ext.restless
from flask.ext.script import Manager
from flask.ext.migrate import Migrate, MigrateCommand
from flask import Flask

basedir = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
app.config['DEBUG'] = True

db = flask.ext.sqlalchemy.SQLAlchemy(app, use_native_unicode=True)
