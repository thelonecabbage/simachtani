# models.py

import json
import csv
import re
import config
from config import db
import flask.ext.whooshalchemy as whooshalchemy


class WordForms(db.Model):

    __tablename__ = 'word_forms'

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Unicode, nullable=False, index=True)
    text = db.Column(db.Unicode, nullable=False, index=True)
    nikud = db.Column(db.Unicode, nullable=False, index=True)


class StrongsDict(db.Model):

    __tablename__ = 'strongs_dict'

    id = db.Column(db.Unicode, primary_key=True)
    text = db.Column(db.Unicode, nullable=False, index=True)
    nikud = db.Column(db.Unicode, nullable=False, index=True)
    xlit = db.Column(db.Unicode, nullable=True, index=False)
    pronunciation = db.Column(db.Unicode, nullable=True, index=False)
    derivation = db.Column(db.Unicode, nullable=True, index=False)
    strongs_def = db.Column(db.Unicode, nullable=True, index=False)
    kjv_def = db.Column(db.Unicode, nullable=True, index=False)


class SourceTexts(db.Model):
    __searchable__ = ['text', 'nikud']
    __tablename__ = 'source_texts'
    id = db.Column(db.Integer, primary_key=True)
    collection = db.Column(db.Unicode, nullable=False, index=True)
    book = db.Column(db.Unicode, nullable=False, index=True)
    chapter = db.Column(db.Integer, nullable=False, index=True)
    verse = db.Column(db.Integer, nullable=False, index=True)

    text = db.Column(db.Unicode, nullable=False, index=True)
    nikud = db.Column(db.Unicode, nullable=False, index=True)

    def __repr__(self):
        return '<SourceTexts {collection}:{book}({chapter}:{verse})>'.format(
            collection=self.collection,
            book=self.book,
            chapter=self.chapter,
            verse=self.verse,)

    @classmethod
    def get_library(cls):
        library = {}
        collections = [i[0] for i in db.session.query(cls.collection).distinct()]
        for collection in collections:
            books = {}
            library[collection] = books
            book_list = [i[0] for i in db.session.query(cls.book).filter_by(collection=collection).distinct()]
            for book_name in book_list:
                books[book_name] = {
                    'chapters_count': db.session.query(cls.chapter).filter_by(
                        collection=collection,
                        book=book_name).distinct().count()
                }
        return library
# Create the database tables.
db.create_all()
whooshalchemy.whoosh_index(config.app, SourceTexts)


def force_decode(string, codecs=['latin_1', 'cp857', 'cp866', 'cp1252', 'cp855', 'iso8859_5', 'iso8859_9', 'utf_8']):
    for i in codecs:
        try:
            print string.decode(i)
            print i
        except (Exception) as exception:
            print "Error decoding name!! ", exception
            pass

    print "cannot decode url %s" % ([string])


def init_wordforms():
    with open('www/json/word_forms.csv', 'rb') as csvfile:
        for row in csv.reader(csvfile, delimiter=',', quotechar='"'):
            db.session.add(WordForms(
                group_id=row[0],
                nikud=row[1].decode('utf_8'),
                text=re.sub(u'[^\u05D0-\u05FF ]', '', row[1].decode('utf_8')),
            ))
    db.session.commit()


def init_strongsdict():
    with open('www/json/strongs-hebrew-dictionary.json', 'rb') as jsonfile:
        strongs = json.load(jsonfile)
        for key, val in strongs.iteritems():
            # import ipdb
            # ipdb.set_trace()
            try:
                word = val['lemma']  # .decode('utf_8')
                db.session.add(StrongsDict(
                    id=key,
                    text=re.sub(u'[^\u05D0-\u05FF ]', '', word),
                    nikud=word,
                    xlit=val.get('xlit', ''),
                    pronunciation=val.get('pron', ''),
                    derivation=val.get('derivation', ''),
                    strongs_def=val.get('strongs_def', ''),
                    kjv_def=val.get('kjv_def', '')
                ))
            except Exception:
                import ipdb
                ipdb.set_trace()
                print val
        db.session.commit()


def init_source_texts():
    for book in ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy']:
        with open('www/json/Tanach/Torah/{0}/Hebrew/Tanach with Nikkud.json'.format(book), 'rb') as source_he:
            data = json.load(source_he)
            for chapter_id, chapter in enumerate(data['text']):
                for verse_id, verse in enumerate(chapter):
                    db.session.add(SourceTexts(
                        collection='Torah',
                        book=book,
                        chapter=chapter_id,
                        verse=verse_id,
                        nikud=verse,
                        text=re.sub(u'[^\u05D0-\u05FF ]', '', verse),
                    ))
    db.session.commit()
