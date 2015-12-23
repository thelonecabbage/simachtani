(function (app) {

  app.controller('textDisplayCtrl', function (book, library, $http, Restangular, $scope, $sce) {
    var that = this;
    this.page_size = 5;
    this.book = book;
    this.library = library.data;
    this.word = '';

    this.selected = {
      book: this.book[0].book || 'Genesis',
      chapter: this.book[0].chapter || 0,
      verse: 0
    };

    function getBook(collection, book) {
      for (var i in that.library[collection]) {
        if (that.library[collection][i]['name'] === book) {
          return that.library[collection][i];
        }
      }
    }

    this.word_click = function (ev, chapter) {
      if (ev.srcElement.classList.contains('he-word')) {
        var found = 0;
        found += ($scope.appCtrl.clickable.strongs && ev.srcElement.classList.contains('strong')) ? 1:0;
        found += ($scope.appCtrl.clickable.verbs && ev.srcElement.classList.contains('verb')) ? 1:0;
        if (!found) {
          return;
        }
        var data = JSON.parse(ev.srcElement.dataset.word)
        if (data.word.lengh < 2) {
          return;
        }
        if (that.word === data) {
          that.word = false;
        } else {
          that.word = data;
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

    function search_strongs_dict(word) {
      if(!word || !word.strongs_num) {
        return;
      }
      var filter = {
        "name": "snum",
        "op": "eq",
        "val": word.strongs_num
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
        "name": "group_id",
        "op": "eq",
        "val": word.group_id
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
        that.word_forms = _.uniq(_.pluck(result.data.objects, 'nikud'));
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
      that.strongs_dict = {};
      that.word_forms = [];
      that.concordance = [];
      that.simachtani_def = {};
      if (!that.word) {
        return;
      }
      Restangular.all('words').get(that.word.id).then(function (result) {
        that.strongs_dict = result.strongs_def;
        that.word_forms = result.wordforms;
        that.concordance = result.verses;
        that.simachtani_def = result.simachtani_def;
        that.winfo = result;

      })
      // search_strongs_dict(that.word);
      // search_word_forms(that.word);
      // search_concordance(that.word);
    });
    $scope.$watch('content.selected', function (o, n) {
      that.book_info = getBook('Torah', that.selected.book);
      if (n && o !== n) {
        _.find(that.book.reqParams.q.filters, {
          name: 'book'
        }).val = that.selected.book;
        _.find(that.book.reqParams.q.filters, {
          name: 'chapter'
        }).val = that.selected.chapter;
        that.book.refresh_from_server();
      }
    }, true);
    // $scope.$watch('content.selected_book', function (o, n) {
    //   that.book_info = getBook('Torah', that.selected_book);
    //   if (o !== n) {
    //     _.find(that.book.reqParams.q.filters, {
    //       name: 'book'
    //     }).val = that.selected_book;
    //     that.book.refresh_from_server();
    //   }
    // });
    // $scope.$watch('content.selected_chapter', function (o, n) {
    //   if (o !== n) {
    //     _.find(that.book.reqParams.q.filters, {
    //       name: 'chapter'
    //     }).val = that.selected_chapter;
    //     that.book.refresh_from_server();
    //   }
    // });

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