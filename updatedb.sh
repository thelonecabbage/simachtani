#!/bin/sh

. ../venv/bin/activate
rm test.db || true
python models.py