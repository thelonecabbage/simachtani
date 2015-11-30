(function (app) {

  app.controller('textDisplayCtrl', function (book, library, $http, Restangular, $scope, $sce) {
    var that = this;
    this.page_size = 5;
    this.book = book;
    this.library = library.data;
    this.word = '';

    this.selected_book = this.book[0].book;
    this.selected_chapter = this.book[0].chapter;
    this.selected_verse = -1;

    function getBook(collection, book) {
      for (var i in that.library[collection]) {
        if (that.library[collection][i]['name'] === book) {
          return that.library[collection][i];
        }
      }
    }

    function versesToWord(texts) {
      angular.forEach(texts, function (verse, verse_id) {
        if (!verse) {
          return;
        }
        verse.nikud = verse.nikud.match(/[^\s]+/g);
      });
      return texts;
    }
    this.book = versesToWord(this.book);

    this.word_click = function (ev, chapter) {
      if (ev.srcElement.classList.contains('he-word')) {
        var word = ev.srcElement.innerText.replace('׃', '');
        if (that.word === word) {
          that.word = '';
        } else {
          that.word = word;
        }
      }
    };

    function updateHRefs(phrase) {
      if (phrase && phrase.replace) {
        return $sce.trustAsHtml(phrase.replace(/H\d+/g, function (ref) {
          return '<span class="h-link">' + ref + "</span>"
        }));
      }
    }
    this.hlink_click = function (ev) {
      if (ev.srcElement.classList.contains('h-link')) {
        var hlink = ev.srcElement.innerText;
        $http({
          url: '/api/strongs_dict/' + hlink,
          method: "GET"
        }).then(function (response) {
          var obj = response.data;
          that.word = obj.nikud;
        });
      }
    }

    function search_without_nikud(word) {
      var filter = {
        "name": "text",
        "op": "eq",
        "val": that.blinikud(word)
      };
      var promise = $http({
        url: '/api/strongs_dict',
        method: "GET",
        params: {
          q: {
            "filters": [filter]
          }
        }
      })
      promise.then(function (result) {
        angular.forEach(result.data.objects, function (entry) {
          entry.derivation = updateHRefs(entry.derivation);
          that.strongs_dict.push(entry)
        });
      });
      return promise;
    }

    function search_word_forms(word) {
      var filter = {
        "name": "text",
        "op": "eq",
        "val": that.blinikud(word)
      };
      var promise = $http({
        url: '/api/word_forms',
        method: "GET",
        params: {
          q: {
            "filters": [filter]
          }
        }
      })
      promise.then(function (result) {
        if (result.data.objects.length > 0) {
          var filter = {
            "name": "group_id",
            "op": "in",
            "val": _.pluck(result.data.objects, 'group_id')
          };
          var promise = $http({
            url: '/api/word_forms',
            method: "GET",
            params: {
              q: {
                "filters": [filter]
              }
            }
          });
          promise.then(function (result) {
            that.word_forms = _.uniq(_.pluck(result.data.objects, 'nikud'));
          });
        }

      });
      return promise;
    }

    function search_concordance(word) {
      Restangular.all('concordance').getList({
        q: {
          search: that.blinikud(word)
        },
        'results_per_page': 500
      }).then(function (result) {
        that.concordance = result;
      })

    }

    $scope.$watch('content.word', function (o, n) {
      var word = that.word;
      that.strongs_dict = [];
      that.word_forms = [];
      that.concordance = [];
      if (!word) {
        return;
      }
      search_without_nikud(word);
      search_word_forms(word);
      search_concordance(word);
    });
    $scope.$watch('content.selected_book', function (o, n) {
      that.book_info = getBook('Torah', that.selected_book);
      if (o !== n) {
        _.find(that.book.reqParams.q.filters, {
          name: 'book'
        }).val = that.selected_book;
        that.book.refresh_from_server().then(function (result) {
          versesToWord(that.book);
          return result;
        })
      }
    });
    $scope.$watch('content.selected_chapter', function (o, n) {
      if (o !== n) {
        _.find(that.book.reqParams.q.filters, {
          name: 'chapter'
        }).val = that.selected_chapter;
        that.book.refresh_from_server().then(function (result) {
          versesToWord(that.book);
          return result;
        })
      }
    });

    this.blinikud = function (word) {
      if (!word) {
        return '';
      }
      return word.replace(/[^\u05D0-\u05FF]/g, '');
    }
    this.joinlist = function (list) {
      return list.join(', ');
    }
    this.parseInt = function (num) {
      return parseInt(num);
    }
  });
}(window.simchatani))