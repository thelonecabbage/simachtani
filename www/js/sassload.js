function read(url) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.status == 200 && xmlhttp.readyState == 4) {
      //basename = url.replace(/^.*\/|\.[^.]*$/g, '');
      basename = url.substring(url.lastIndexOf('/') + 1);
      scssCode = xmlhttp.responseText;
      console.log(scssCode);
      Sass.writeFile(basename, scssCode);
      compile('@import "' + basename + '"; ');
    }

  }
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function registerStylesheets() {

  var links = document.getElementsByTagName('link');
  sheets = [];

  for (var i = 0; i < links.length; i++) {

    if (links[i].rel === 'stylesheet/scss') {
      sheets.push(links[i].href);
    }
  }
  return sheets;
};

var sheets = registerStylesheets();

for (var i = 0; i < sheets.length; i++) {
  read(sheets[i]);
}

function compile(scss) {
  console.log(scss);
  console.log(Sass.compile(scss));
}