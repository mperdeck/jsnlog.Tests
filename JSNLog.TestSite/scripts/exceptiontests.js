﻿
// --------------------------------------------------
// Arrange

// Assumes that TestUtil.js has already been loaded
JL._createXMLHttpRequest = JLTestUtils.createXMLHttpRequestMock;

var a0 = JL.createAjaxAppender('da1');
a0.setOptions({ "url": "http://dummy.com/da1" });
JL().setOptions({ "appenders": [a0] });

// --------------------------------------------------

// Built in exception

function fa() {
    try {
        i.xxx.yyy = 'not declared exception';
    }
    catch (e) {
        JL('l1').fatalException(null, e);
        __timestamp1 = (new Date).getTime();
    }

    JLTestUtils.Check('da1', 1, [
      {
          l: 6000,
          m: /i is not defined/,
          n: 'l1',
          t: __timestamp1
      }
    ]
    );
}

// JL.Exception 

function fb() {
    try {
        throw new JL.Exception("throwing JL.Exception");
    }
    catch (e) {
        JL('l2').fatalException({ "i": 5, "j": "abc" }, e);
        __timestamp2 = (new Date).getTime();
    }

    JLTestUtils.Check('da1', 2, [
      {
          l: 6000,
          m: /throwing JL\.Exception.*?\{\"i\":5,\"j\":\"abc\"\}/,
          n: 'l2',
          t: __timestamp2
      }
    ]
    );
}

// Exception not derived from Error

function fc() {
    try {
        throw "Not derived from Error";
    }
    catch (e) {
        JL('l3').fatalException(function () { return { "i2": 66, "j2": "def" } }, e);
        __timestamp3 = (new Date).getTime();
    }

    JLTestUtils.Check('da1', 3, [
      {
          l: 6000,
          m: /Not derived from Error.*?\{\"i2\":66,\"j2\":\"def\"\}/,
          n: 'l3',
          t: __timestamp3
      }
    ]
    );
}

// -----------------------------

function f1() {
    i.xxx.yyy = 'not declared exception in f1';
}

function f2() {
    try {
        f1();
    }
    catch (e) {
        throw new JL.Exception({ "i3": 77, "j3": "ghi" }, e);
    }
}

// Add data and inner

function fd() {
    try {
        f2();
    }
    catch (e) {
        JL('l4').fatalException(function () { return { "i4": 88, "j4": "jkl" } }, e);
        __timestamp4 = (new Date).getTime();
    }

    JLTestUtils.Check('da1', 4, [
      {
          l: 6000,
          m: /\{\\\"i3\\\":77,\\\"j3\\\":\\\"ghi\\\"\}.*?i is not defined.*?\{\"i4\":88,\"j4\":\"jkl\"\}/,
          n: 'l4',
          t: __timestamp4
      }
    ]
    );

    // Add inner exception, but no data

    try {
        f2();
    }
    catch (e) {
        JL('l5').fatalException(null, e);
        __timestamp5 = (new Date).getTime();
    }

    JLTestUtils.Check('da1', 5, [
      {
          l: 6000,
          m: /\{\\\"i3\\\":77,\\\"j3\\\":\\\"ghi\\\"\}.*?i is not defined.*?null/,
          n: 'l5',
          t: __timestamp5
      }
    ]
    );
}

// --------------------------------------------------
// Act and Assert

$(function () {
    fa();
    fb();
    fc();
    fd();

    // The integration tests looks not only for error messages (generated by JLTestUtils) but also 
    // whether the #running message is still on the page (indicating that the test code crashed).
    $('#running').remove();
});





