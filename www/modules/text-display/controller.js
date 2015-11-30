(function (app) {

  app.controller('textDisplayCtrl', function (book, book_en, $http, $scope, $sce) {
    var that = this;
    this.page_size = 5;
    this.book = book.data;
    this.book_en = book_en.data;
    this.word = '';
    this.book_list = [
      {
        title:"Genesis",
        heTitle:"בראשית",
        file: "Tanach/Torah/Genesis/"
      },
      {
        title:"Exodus",
        heTitle:"שמות",
        file: "Tanach/Torah/Exodus/"
      },
      {
        title:"Leviticus",
        heTitle:"ויקרא",
        file: "Tanach/Torah/Leviticus/"
      },
      {
        title:"Numbers",
        heTitle:"במדבר",
        file: "Tanach/Torah/Numbers/"
      },
      {
        title:"Deuteronomy",
        heTitle:"דברים",
        file: "Tanach/Torah/Deuteronomy/"
      },
    ];
    this.selected_book = 0;
    this.selected_chapter = 0;

    function versesToWord(texts) {
      angular.forEach(texts, function (chapter) {
        angular.forEach(chapter, function (verse, verse_id) {
          if (!verse) {
            return;
          }
          chapter[verse_id] = verse.match(/[^\s]+/g);
        });
      });
      return texts;
    }
    this.book.text = versesToWord(this.book.text);

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
    $scope.$watch('content.word', function (o, n) {
      var word = that.word;
      that.strongs_dict = [];
      that.word_forms = [];
      if (!word) {
        return;
      }
      search_without_nikud(word);
      search_word_forms(word);
    });
    $scope.$watch('content.selected_book', function (o, n) {
      if (parseInt(o)!==parseInt(n)) {
        var p = $http.get('/json/' + that.book_list[that.selected_book].file +'Hebrew/Tanach with Nikkud.json');
        p.then(function(response) {
          that.book = response.data;
          that.book.text = versesToWord(that.book.text);
          that.selected_chapter = 0;
        });
        var p2 = $http.get('/json/' + that.book_list[that.selected_book].file +'English/merged.json');
        p2.then(function(response) {
          that.book_en = response.data;
        });
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
    this.parseInt = function(num) {
      return parseInt(num);
    }
  });
}(window.simchatani))