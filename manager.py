from config import app, db
from flask.ext.script import Manager
from flask.ext.migrate import Migrate, MigrateCommand

migrate = Migrate(app, db)
manager = Manager(app)
# manager = flask.ext.restless.APIManager(app, flask_sqlalchemy_db=db)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()
