/// <reference types="jquery"/>
/// <reference types="jasmine"/>
/// <reference path="../../../jsnlog.js/jsnlog.ts"/>
var JLTestUtils;
(function (JLTestUtils) {
    function Check(checkAppenderUrlPath, checkNbr, expected) {
        console.log('------------------------------');
        console.log('Check checkNbr: ' + checkNbr);
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
            console.log('FAILED: ' + comparisonResult);
        }
        else {
            resultDiv = $('<div style="border-top: 3px green solid" >Passed: ' + checkNbr + ' | ' + timeNow + '</div>');
            console.log('SUCCEEDED');
        }
        $('body').append(resultDiv);
        window[checkAppenderUrl] = [];
    }
    JLTestUtils.Check = Check;
    var XMLHttpRequestMock = /** @class */ (function () {
        function XMLHttpRequestMock() {
            this.readyState = 4;
            this.status = 200;
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
            console.log('-- ' + JLTestUtils.getTime() + ' send - json: ' + json);
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
    function nextTestNbr() {
        var testNbrString = JLTestUtils.testNbr.toString();
        JLTestUtils.testNbr++;
        return testNbrString;
    }
    JLTestUtils.nowMs = 0;
    function getTime() {
        return JLTestUtils.nowMs;
    }
    JLTestUtils.getTime = getTime;
    function wait(ms) {
        console.log('-- ' + JLTestUtils.getTime() + ' wait - ms: ' + ms);
        JLTestUtils.nowMs += ms; // updates the time used inside jsnlog.js
        jasmine.clock().tick(ms); // fires setTimer, etc. if needed
    }
    JLTestUtils.wait = wait;
    function runTestMultiple(nbrLoggers, nbrAppenders, test) {
        // Create a new mock object for each test
        var xhrMock = new JLTestUtils.XMLHttpRequestMock();
        JLTestUtils.xMLHttpRequestMock = xhrMock;
        spyOn(xhrMock, 'send').and.callThrough();
        spyOn(xhrMock, 'abort');
        var sendCalls = xhrMock.send.calls;
        // This must be done before creating any appenders, because the appenders will use _createXMLHttpRequest
        // to create the xhr object.
        JL._createXMLHttpRequest = JLTestUtils.createXMLHttpRequestMock;
        JL._getTime = JLTestUtils.getTime;
        // ------------
        var appenders = [];
        var loggers = [];
        for (var a = 0; a < nbrAppenders; a++) {
            var testappender = JL.createAjaxAppender("testappender" + nextTestNbr());
            appenders.push(testappender);
        }
        for (var lg = 0; lg < nbrLoggers; lg++) {
            var testLogger = JL('testlogger' + nextTestNbr());
            testLogger.setOptions({ appenders: appenders });
            loggers.push(testLogger);
        }
        test(loggers, appenders, xhrMock, sendCalls);
    }
    JLTestUtils.runTestMultiple = runTestMultiple;
    function runTest(test) {
        JLTestUtils.runTestMultiple(1, 1, function (loggers, appenders, xhr, callsToSend) {
            test(loggers[0], appenders[0], xhr, callsToSend);
        });
    }
    JLTestUtils.runTest = runTest;
    function logItTitle(title) {
        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        console.log(JLTestUtils.getTime() + ' ' + title);
        console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        console.log('');
    }
    JLTestUtils.logItTitle = logItTitle;
    function logMessages(logger, level, nbrMessagesToLog, messageIdxRef) {
        for (var m = 0; m < nbrMessagesToLog; m++) {
            var message = "Event " + messageIdxRef.messageIdx.toString();
            console.log('-- ' + JLTestUtils.getTime() + ' logMessages  - idx: ' + messageIdxRef.messageIdx + ', level: ' + level + ', message: ' + message);
            logger.log(level, message);
            messageIdxRef.messageIdx++;
        }
    }
    JLTestUtils.logMessages = logMessages;
    // If messageIdxIncrement is 2, then the expected message index gets increments once for every 2 messages.
    // Use this when you have a logger logging through 2 appenders.
    //
    // expectedMessageIndexes is an array of arrays of indexes.
    // Each message is checked to ensure it contains all the given indexes.
    function checkMessages(scenarioId, nbrOfMessagesExpected, callsToSend, messageIdxIncrement, expectedMessageIndexes) {
        if (messageIdxIncrement === void 0) { messageIdxIncrement = 1; }
        if (expectedMessageIndexes === void 0) { expectedMessageIndexes = null; }
        var consolelogid = '>>>' + (new Date()).getTime().toString() + '<<<';
        // Check that the expected nbr of messages sent
        var actualCount = callsToSend.count();
        // Build list of expected messageIdxs if not given
        if (!expectedMessageIndexes) {
            expectedMessageIndexes = [];
            for (var m = 0; m < nbrOfMessagesExpected; m++) {
                var messageIdx = Math.floor(m / messageIdxIncrement);
                expectedMessageIndexes.push([messageIdx]);
            }
        }
        console.log('------------------------------');
        console.log('checkMessages ' + JLTestUtils.getTime());
        console.log('');
        console.log('consolelogid: ' + consolelogid);
        console.log('scenarioId: ' + scenarioId);
        console.log('nbrOfMessagesExpected: ' + nbrOfMessagesExpected);
        console.log('actualCount: ' + actualCount);
        console.log('messageIdxIncrement: ' + messageIdxIncrement);
        console.log('expectedMessageIndexes: ');
        console.dir(expectedMessageIndexes);
        // Second parameter to toBe is undocumented, lets you print a message if the check fails.
        // Doesn't work for toEqual.
        expect(actualCount).toBe(nbrOfMessagesExpected, "scenarioId: " + scenarioId + ', consolelogid: ' + consolelogid);
        // For each message sent, check its content
        for (var m = 0; m < nbrOfMessagesExpected; m++) {
            var args = callsToSend.argsFor(m);
            var argValue0 = args[0];
            console.log('Actual message ' + m + ': ' + argValue0);
            for (var i = 0; i < expectedMessageIndexes[m].length; i++) {
                // Second parameter to toContain is undocumented, lets you print a message if the check fails.
                expect(argValue0).toContain('"m":"Event ' + expectedMessageIndexes[m][i].toString() + '"', 'consolelogid: ' + consolelogid +
                    ", scenarioNbr: " + scenarioId + ", nbrOfMessagesExpected: " + nbrOfMessagesExpected.toString() +
                    ", m: " + m.toString() + ", i: " + i.toString());
            }
        }
    }
    JLTestUtils.checkMessages = checkMessages;
    function FormatResult(idx, fieldName, expected, actual) {
        return "idx: " + idx + "</br>field: " + fieldName + "</br>expected: " + expected + "</br>actual: " + actual;
    }
    // If the items are equal, returns ""
    // If not, returns a string pointing out the diffference
    function LogItemsEqual(i, expected, actual) {
        if (expected.l != actual.l) {
            return FormatResult(i, "level", expected.l.toString(), actual.l.toString());
        }
        var m = expected.m;
        var match = false;
        if (m instanceof RegExp) {
            match = m.test(actual.m);
        }
        else {
            match = (expected.m == actual.m);
        }
        if (!match) {
            return FormatResult(i, "msg", expected.m, actual.m);
        }
        if (expected.n != actual.n) {
            return FormatResult(i, "logger name", expected.n, actual.n);
        }
        // Timestamps are precise to the ms.
        // Allow a small difference between actual and expected, because we record the timestamp
        // a bit later then when jsnlog produces the log request.
        var allowedDifferenceMs = 30;
        if (Math.abs(expected.t - actual.t) > allowedDifferenceMs) {
            return FormatResult(i, "timestamp", expected.t.toString(), actual.t.toString());
        }
        return "";
    }
    // Returns string with comparison result. 
    // Returns empty string if expected and actual are equal.
    // The two arrays are equal if the items in actual all appear in the expected array.
    // This does not take order into account.
    function LogItemArraysCompareResult(expected, actual) {
        var nbrLogItems = expected.length;
        var i;
        if (nbrLogItems != actual.length) {
            return "Actual nbr log items (" +
                actual.length + ") not equal expected nbr log items (" +
                nbrLogItems + ")";
        }
        for (i = 0; i < nbrLogItems; i++) {
            var result = null;
            for (var j = 0; j < nbrLogItems; j++) {
                result = LogItemsEqual(i, expected[i], actual[j]);
                if (result == "") {
                    break;
                }
            }
            if (result == "") {
                continue;
            }
            // No match found
            if (nbrLogItems == 1) {
                return result;
            }
            else {
                return "expected message " + i + " not found in array of actual messages";
            }
        }
        return "";
    }
})(JLTestUtils || (JLTestUtils = {}));
//# sourceMappingURL=JLTestUtils.js.map