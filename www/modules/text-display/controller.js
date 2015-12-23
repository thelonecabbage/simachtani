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

    $scope.$watch('content.word', function (o, n) {
      if (!that.word) {
        return;
      }
      Restangular.all('words').get(that.word.id).then(function (result) {
         that.word.info = result;
      });
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