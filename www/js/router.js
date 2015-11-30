(function (app) {

  app.config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
    function ($urlRouterProvider, $stateProvider, $locationProvider) {
      $locationProvider.html5Mode(false);
      $urlRouterProvider.otherwise('/torah');
      $stateProvider.
      state('main_ui', {
        url: '/torah',
        //         abstract: false,
        templateUrl: '/modules/text-display/content.html?cache=' + Math.random(),
        resolve: {
          library: ['$http', '$state',
            function ($http, $state) {
              return $http.get('/api/library');
            }
          ],
          book: ['Restangular', 'library',
            function (Restangular, library) {
              var collection = {
                "name": "collection",
                "op": "eq",
                "val": 'Torah'
              };
              var book = {
                "name": "book",
                "op": "eq",
                "val": library.data[collection.val][0]['name']
              };
              var chapter = {
                "name": "chapter",
                "op": "eq",
                "val": 0
              };
              return Restangular.all('source_texts').getList(
                {
                  q: {
                    "filters": [collection,book, chapter]
                  },
                  results_per_page: library.data[collection.val][0]['chapters_count']
                }
              );
            }
          ],
          // book_en: ['$http', '$state',
          //   function ($http, $state) {
          //     return $http.get('/json/Tanach/Torah/Genesis/English/merged.json');
          //   }]

        },
        controllerAs: 'content',
        controller: 'textDisplayCtrl'
      });
    }
  ]);
}(window.simchatani));