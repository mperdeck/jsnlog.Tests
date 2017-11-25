/// <reference types="jquery"/>
// / <reference path="jquery.d.ts"/>
/// <reference path="../../../jsnlog.js/jsnlog.ts"/>
var JLTestUtils;
(function (JLTestUtils) {
    function Check(checkAppenderUrlPath, checkNbr, expected) {
        var checkAppenderUrl = 'http://dummy.com/' + checkAppenderUrlPath;
        // An appender only calls xhr.send when it tries to send a log request.
        // So if the appender never tries to send anything, than actual will be undefined.
        var actual = window[checkAppenderUrl] || [];
        var resultDiv;
        var expectedString = JSON.stringify(expected);
        var actualString = JSON.stringify(actual);
        // class="jasmine-failed" is used by the integration tests.
        // It is also given to the results element on the Jasmine tests page.
        // If an element with that class exists on the page, the test is taken to have failed.
        var d = new Date();
        var timeNow = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
        var comparisonResult = LogItemArraysCompareResult(expected, actual);
        if (comparisonResult) {
            resultDiv = $('<table style="border-top: 3px red solid" class="jasmine-failed" />');
            resultDiv.append('<tr><td>Error at Check</td><td>' + checkNbr + ' | ' + timeNow + '</td></tr>');
            resultDiv.append('<tr><td valign="top" colspan=\'2\'>' + comparisonResult + '</td></tr>');
            resultDiv.append('<tr><td valign="top">Expected:</td><td>' + expectedString + '</td></tr>');
            resultDiv.append('<tr><td valign="top">Actual:</td><td>' + actualString + '</td></tr></table>');
        }
        else {
            resultDiv = $('<div style="border-top: 3px green solid" >Passed: ' + checkNbr + ' | ' + timeNow + '</div>');
        }
        $('body').append(resultDiv);
        window[checkAppenderUrl] = [];
    }
    JLTestUtils.Check = Check;
    var XMLHttpRequestMock = (function () {
        function XMLHttpRequestMock() {
        }
        XMLHttpRequestMock.prototype.abort = function () { };
        XMLHttpRequestMock.prototype.setRequestHeader = function (header, value) { };
        XMLHttpRequestMock.prototype.open = function (method, url) {
            this._url = url;
        };
        XMLHttpRequestMock.prototype.send = function (json) {
            if (!window[this._url]) {
                window[this._url] = [];
            }
            var item = JSON.parse(json);
            window[this._url] = window[this._url].concat(item.lg);
            this.status = 200;
            this.readyState = 4;
            this.onreadystatechange();
        };
        return XMLHttpRequestMock;
    }());
    JLTestUtils.XMLHttpRequestMock = XMLHttpRequestMock;
    ;
    // The factory has to always return this one mock XMLHttpRequest, so in the Jasmine tests
    // we can spy on it.
    JLTestUtils.xMLHttpRequestMock = new JLTestUtils.XMLHttpRequestMock();
    function createXMLHttpRequestMock() {
        return JLTestUtils.xMLHttpRequestMock;
    }
    JLTestUtils.createXMLHttpRequestMock = createXMLHttpRequestMock;
    JLTestUtils.testNbr = 0;
    function runTest(test) {
        var testNbrString = JLTestUtils.testNbr.toString();
        var testappender = JL.createAjaxAppender("testappender" + testNbrString);
        var testLogger = JL('testlogger' + testNbrString);
        testLogger.setOptions({ appenders: [testappender] });
        var xhrMock = JLTestUtils.xMLHttpRequestMock;
        var sendCalls = JLTestUtils.xMLHttpRequestMock.send.calls;
        test(testLogger, testappender, xhrMock, sendCalls);
    }
    JLTestUtils.runTest = runTest;
    function FormatResult(idx, fieldName, expected, actual) {
        return "idx: " + idx + "</br>field: " + fieldName + "</br>expected: " + expected + "</br>actual: " + actual;
    }
    // Returns string with comparison result. 
    // Returns empty string if expected and actual are equal.
    function LogItemArraysCompareResult(expected, actual) {
        var nbrLogItems = expected.length;
        var i;
        if (nbrLogItems != actual.length) {
            return "Actual nbr log items (" +
                actual.length + ") not equal expected nbr log items (" +
                nbrLogItems + ")";
        }
        for (i = 0; i < nbrLogItems; i++) {
            if (expected[i].l != actual[i].l) {
                return FormatResult(i, "level", expected[i].l.toString(), actual[i].l.toString());
            }
            var m = expected[i].m;
            var match = false;
            if (m instanceof RegExp) {
                match = m.test(actual[i].m);
            }
            else {
                match = (expected[i].m == actual[i].m);
            }
            if (!match) {
                return FormatResult(i, "msg", expected[i].m, actual[i].m);
            }
            if (expected[i].n != actual[i].n) {
                return FormatResult(i, "logger name", expected[i].n, actual[i].n);
            }
            // Timestamps are precise to the ms.
            // Allow a small difference between actual and expected, because we record the timestamp
            // a bit later then when jsnlog produces the log request.
            var allowedDifferenceMs = 10;
            if (Math.abs(expected[i].t - actual[i].t) > allowedDifferenceMs) {
                return FormatResult(i, "timestamp", expected[i].t.toString(), actual[i].t.toString());
            }
        }
        return "";
    }
})(JLTestUtils || (JLTestUtils = {}));
//# sourceMappingURL=JLTestUtils.js.map