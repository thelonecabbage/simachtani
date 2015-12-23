#!/bin/sh

. ../venv/bin/activate
rm test.db
python models.py