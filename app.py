import json
import flask
import flask.ext.sqlalchemy
import flask.ext.restless
from flask import send_from_directory, Response
from config import app, db
from models import StrongsDict, WordForms, SourceTexts, SourceWords


def pre_get_many_sources(search_params=None, **kw):
    search_txt = search_params.pop('search', None)
    if not search_txt:
        return
    search = SourceTexts.query.whoosh_search(search_txt)
    if search.first():
        ids = [i[0] for i in search.values('id')]
        filters = search_params.pop('filters', [])
        filters.append({
            "name": "id",
            "op": "in",
            "val": ids
        })
        search_params['filters'] = filters

# Create the Flask-Restless API manager.
manager = flask.ext.restless.APIManager(app, flask_sqlalchemy_db=db)
manager.create_api(StrongsDict, methods=['GET'])
manager.create_api(WordForms, methods=['GET'])
manager.create_api(SourceTexts, methods=['GET'],
                   preprocessors={'GET_MANY': [pre_get_many_sources], },
                   include_columns=['words', 'words.id',
                                    'words.word', 'words.pos', 'words.group_id',
                                    'words.strongs_num', 'words.simachtani_num',
                                    'verse', 'book', 'chapter'])
manager.create_api(SourceTexts,
                   collection_name='concordance',
                   include_columns=['id', 'collection', 'book', 'book_he', 'chapter', 'verse'],
                   methods=['GET'],
                   preprocessors={'GET_MANY': [pre_get_many_sources], },)
manager.create_api(SourceWords, methods=['GET'],
                   collection_name='words',
                   exclude_columns=['simachtani_num', 'simachtani_def.id', 'simachtani_def.group_id', 'simachtani_def.nikud',
                                    'strongs_def.strongs_num', 'strongs_def.id',
                                    'verses.id', 'verses.nikud',
                                    'wordforms.id', 'wordforms.group_id'])


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if not path:
        path = 'index.html'
    return send_from_directory('www/', path)


@app.route('/api/library', methods=['GET'])
def library():
    return Response(response=json.dumps(SourceTexts.get_library()),
                    status=200,
                    mimetype="application/json")

if __name__ == '__main__':
    app.run()
