(function (app) {
  'use strict';
  app.filter('hebnum', function () {
    return function (myNumber) {
      var sNumber = String(myNumber);
      var numberLength = sNumber.length;
      var sTens = 0;
      var sHundreds = 0;
      var sUnits = sNumber[numberLength - 1];
      if (myNumber > 9) sTens = sNumber[numberLength - 2];
      if (myNumber > 99) sHundreds = sNumber[numberLength - 3];
      var hebrewHundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
      var hebrewTens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
      var hebrewUnits = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
      var myHebrewNumber = hebrewHundreds[sHundreds] + hebrewTens[sTens] + hebrewUnits[sUnits] + "*";
      myHebrewNumber = myHebrewNumber.replace("יו*", "טז*");
      myHebrewNumber = myHebrewNumber.replace("יה*", "טו*");
      myHebrewNumber = myHebrewNumber.slice(0, myHebrewNumber.length - 1);
      return myHebrewNumber;
    };
  });
  app.filter('range', function () {
    return function (total) {
      var input = [];
      total = Math.ceil(total);
      for (var i = 0; i < total; i++) {
        input.push(i);
      }
      return input;
    };
  });
}(window.simchatani));