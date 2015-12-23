# models.py

import json
import csv
import re
import config
from config import db


class WordForms(db.Model):

    __tablename__ = 'word_forms'

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, nullable=False, index=True)
    nikud = db.Column(db.Unicode, nullable=False, index=True)
    source_words = db.relationship('SourceWords', backref=db.backref('wordforms', lazy='dynamic', uselist=True),
                                   lazy='dynamic')

    @classmethod
    def get_group_id(cls, word):
        word_form = cls.query.filter_by(nikud=word).first()
        return word_form.group_id if word_form else 0

    def get_words_for_id(cls, id):
        return [w[0] for w in cls.query(cls.nikud).filter_by(group_id=id)]


class StrongsDict(db.Model):

    __tablename__ = 'strongs_dict'
    id = db.Column(db.Integer, primary_key=True)
    strongs_num = db.Column(db.Integer, index=True)
    nikud = db.Column(db.Unicode, nullable=False, index=True)
    xlit = db.Column(db.Unicode, nullable=True, index=False)
    pronunciation = db.Column(db.Unicode, nullable=True, index=False)
    derivation = db.Column(db.Unicode, nullable=True, index=False)
    strongs_def = db.Column(db.Unicode, nullable=True, index=False)
    kjv_def = db.Column(db.Unicode, nullable=True, index=False)
    source_words = db.relationship('SourceWords', backref='strongs_def',
                                   lazy='dynamic')


class SimachtaniDict(db.Model):
    """docstring for SimachtaniDict"""
    __tablename__ = 'simachtani'
    id = db.Column(db.Integer, primary_key=True)
    nikud = db.Column(db.Unicode, nullable=False, index=True)
    shoresh = db.Column(db.Unicode, nullable=False, index=True)
    binyan = db.Column(db.Unicode, nullable=False, index=True)
    group_id = db.Column(db.Integer, nullable=False, index=True)
    source_words = db.relationship('SourceWords', backref='simachtani_def',
                                   lazy='dynamic')


sourcetext_words = db.Table('sourcetext_words',
                            db.Column('id', db.Integer, primary_key=True),
                            db.Column('source_id', db.Integer, db.ForeignKey('source_texts.id')),
                            db.Column('words_id', db.Integer, db.ForeignKey('source_words.id')))


class SourceTexts(db.Model):
    __tablename__ = 'source_texts'
    id = db.Column(db.Integer, primary_key=True)
    collection = db.Column(db.Unicode, nullable=False, index=True)
    book = db.Column(db.Unicode, nullable=False, index=True)
    book_he = db.Column(db.Unicode, nullable=True, index=False)
    chapter = db.Column(db.Integer, nullable=False, index=True)
    verse = db.Column(db.Integer, nullable=False, index=True)

    # text = db.Column(db.Unicode, nullable=False, index=False)
    nikud = db.Column(db.Unicode, nullable=False, index=False)
    # words = db.Column(db.PickleType, nullable=False, index=False)
    words = db.relationship('SourceWords', secondary=sourcetext_words,
                            backref=db.backref('verses'), order_by=sourcetext_words.c.id)

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
            books = []
            library[collection] = books
            book_list = db.session.query(cls.book, cls.book_he).filter_by(collection=collection).distinct()
            for book_name, book_name_he in book_list:
                books.append({
                    'name': book_name,
                    'nameHe': book_name_he,
                    'chapters_count': db.session.query(cls.chapter).filter_by(
                        collection=collection,
                        book=book_name).distinct().count()
                })
        return library


class SourceWords(db.Model):
    __tablename__ = 'source_words'
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.Unicode, nullable=False, unique=True)
    pos = db.Column(db.Unicode, nullable=True, index=True)
    group_id = db.Column(db.Integer, db.ForeignKey('word_forms.group_id'), nullable=True)
    strongs_num = db.Column(db.Integer, db.ForeignKey('strongs_dict.strongs_num'), nullable=True)
    simachtani_num = db.Column(db.Integer, db.ForeignKey('simachtani.id'), nullable=True)

    @classmethod
    def get_word(cls, word):
        srcwrd = cls.query.filter_by(word=word).first()
        if srcwrd:
            return srcwrd

        word_form = WordForms.query.filter_by(nikud=word).first()
        strongs = StrongsDict.query.filter_by(nikud=word).first()
        simach = SimachtaniDict.query.filter_by(nikud=word).first()
        if not simach and word_form:
            simach = SimachtaniDict.query.filter_by(group_id=word_form.group_id).first()

        sim = simach.id if simach else None
        try:
            group_id = int(word_form.group_id if word_form else 0)
            if not strongs:
                strongs = StrongsDict.query.filter_by(strongs_num=group_id).first()
        except ValueError:
            group_id = word_form.group_id if word_form else 0

        srcwrd = cls(group_id=group_id,
                     word=word,
                     simachtani_num=sim,
                     strongs_num=strongs.strongs_num if strongs else 0,
                     pos='v' if sim else '')
        db.session.add(srcwrd)
        return srcwrd
# Create the database tables.
db.create_all()


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
    WordForms.query.delete()
    with open('www/json/word_forms.csv', 'rb') as csvfile:
        for row in csv.reader(csvfile, delimiter=',', quotechar='"'):
            nikud = row[1].decode('utf_8')
            if not WordForms.get_group_id(nikud):
                try:
                    group_id = int(row[0] or 0)
                except ValueError:
                    if row[0] == 'b':
                        group_id = -1
                db.session.add(WordForms(
                    group_id=group_id,
                    nikud=nikud,
                    # text=re.sub(u'[^\u05D0-\u05FF ]', '', row[1].decode('utf_8')),
                ))
    db.session.commit()


def init_simactani():
    SimachtaniDict.query.delete()
    with open('www/json/simachtani.csv', 'rb') as csvfile:
        csvfile.readline()
        for row in csv.reader(csvfile, delimiter=',', quotechar='"'):
            if row[0]:
                db.session.add(SimachtaniDict(
                    group_id=WordForms.get_group_id(row[0].strip().decode('utf_8')),
                    nikud=row[0].strip().decode('utf_8'),
                    shoresh=row[1].decode('utf_8'),
                    binyan=row[2].decode('utf_8')
                ))
    db.session.commit()
    for entry in SimachtaniDict.query.filter_by(group_id=0):
        shoresh_entry = SimachtaniDict.query.filter(SimachtaniDict.shoresh == entry.shoresh,
                                                    SimachtaniDict.group_id != 0).first()
        if shoresh_entry:
            entry.group_id = shoresh_entry.group_id
            db.session.add(entry)
    db.session.commit()


def init_strongsdict():
    StrongsDict.query.delete()
    with open('www/json/strongs-hebrew-dictionary.json', 'rb') as jsonfile:
        strongs = json.load(jsonfile)
        for key, val in strongs.iteritems():
            # import ipdb
            # ipdb.set_trace()
            try:
                word = val['lemma']  # .decode('utf_8')
                db.session.add(StrongsDict(
                    strongs_num=int(re.findall("H(\d+)", key)[0]),
                    # text=re.sub(u'[^\u05D0-\u05FF ]', '', word),
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


def word_dict(word):
    word_form = WordForms.query.filter_by(nikud=word).first()
    strongs = StrongsDict.query.filter_by(nikud=word).first()
    simach = SimachtaniDict.query.filter_by(nikud=word).first()
    if not simach and word_form:
        simach = SimachtaniDict.query.filter_by(group_id=word_form.group_id).first()

    sim = simach.id if simach else None
    try:
        group_id = int(word_form.group_id if word_form else 0)
        if not strongs:
            strongs = StrongsDict.query.filter_by(strongs_num=group_id).first()
    except ValueError:
        group_id = word_form.group_id if word_form else 0
    d = {'word': word,
         'pos': 'v' if sim else ''}
    if group_id:
        d['group_id'] = group_id
    if sim:
        d['sim_num'] = sim
    if strongs:
        d['strongs_num'] = strongs.strongs_num
    return d


def init_source_texts():
    SourceTexts.query.delete()
    for book in ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy']:
        with open('www/json/Tanach/Torah/{0}/Hebrew/Tanach with Nikkud.json'.format(book), 'rb') as source_he:
            data = json.load(source_he)
            for chapter_id, chapter in enumerate(data['text']):
                for verse_id, verse in enumerate(chapter):
                    # words = []
                    # for word in re.findall(u'([^\s\u05c3\u05be]+|[\u05be]+)', verse, re.UNICODE):
                    #     words.append(word_dict(word))

                    # db.session.add(SourceTexts(
                    #     collection='Torah',
                    #     book=book,
                    #     book_he=data.get('heTitle', ''),
                    #     chapter=chapter_id,
                    #     verse=verse_id,
                    #     nikud=verse,
                    #     words=words))
                    st = SourceTexts(
                        collection='Torah',
                        book=book,
                        book_he=data.get('heTitle', ''),
                        chapter=chapter_id,
                        verse=verse_id,
                        nikud=verse)
                    for word in re.findall(u'([^\s\u05c3\u05be]+|[\u05be]+)', verse, re.UNICODE):
                        st.words.append(SourceWords.get_word(word))

                    db.session.add(st)
    db.session.commit()

if __name__ == '__main__':
    init_wordforms()
    init_simactani()
    init_strongsdict()
    init_source_texts()
