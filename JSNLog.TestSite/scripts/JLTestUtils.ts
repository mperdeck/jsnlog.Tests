﻿/// <reference types="jquery"/>
/// <reference types="jasmine"/>
/// <reference path="../../../jsnlog.js/jsnlog.ts"/>

module JLTestUtils {
    export function Check(checkAppenderUrlPath: string, checkNbr: number, expected: JL.LogItem[]) {

        var checkAppenderUrl = 'http://dummy.com/' + checkAppenderUrlPath;

		// An appender only calls xhr.send when it tries to send a log request.
		// So if the appender never tries to send anything, than actual will be undefined.
        var actual: JL.LogItem[] = (<any>window)[checkAppenderUrl] || [];

        var resultDiv: JQuery;

        var expectedString = JSON.stringify(expected);
        var actualString = JSON.stringify(actual);

        // class="jasmine-failed" is used by the integration tests.
        // It is also given to the results element on the Jasmine tests page.
        // If an element with that class exists on the page, the test is taken to have failed.

        var d = new Date();
        var timeNow = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();

        var comparisonResult: string = LogItemArraysCompareResult(expected, actual);
        if (comparisonResult) {
            resultDiv = $('<table style="border-top: 3px red solid" class="jasmine-failed" />');
            resultDiv.append('<tr><td>Error at Check</td><td>' + checkNbr + ' | ' + timeNow + '</td></tr>');
            resultDiv.append('<tr><td valign="top" colspan=\'2\'>' + comparisonResult + '</td></tr>');
            resultDiv.append('<tr><td valign="top">Expected:</td><td>' + expectedString + '</td></tr>');
            resultDiv.append('<tr><td valign="top">Actual:</td><td>' + actualString + '</td></tr></table>');
        } else {
            resultDiv = $('<div style="border-top: 3px green solid" >Passed: ' + checkNbr + ' | ' + timeNow + '</div>');
        }

        $('body').append(resultDiv);

        (<any>window)[checkAppenderUrl] = [];
    }

    export class XMLHttpRequestMock {
        onreadystatechange: () => void;
        readyState: number = 4;
        status: number = 200;

        private _url: string;

        abort() { }

        setRequestHeader(header: string, value: string) { }
        open(method: string, url: string) {
            this._url = url;
        }

        send(json: string) {

            if (!(<any>window)[this._url]) { (<any>window)[this._url] = []; }
            var item = JSON.parse(json);
            (<any>window)[this._url] = (<any>window)[this._url].concat(item.lg);

            this.onreadystatechange();
        }
    };

    // The factory has to always return this one mock XMLHttpRequest, so in the Jasmine tests
    // we can spy on it.
    export var xMLHttpRequestMock = new JLTestUtils.XMLHttpRequestMock();

    export function createXMLHttpRequestMock(): XMLHttpRequest {
        return <any>JLTestUtils.xMLHttpRequestMock;
    }

    export var testNbr: number = 0;

    function nextTestNbr(): string {
        var testNbrString: string = JLTestUtils.testNbr.toString();
        JLTestUtils.testNbr++;
        return testNbrString;
    }

    export function runTestMultiple(
        nbrLoggers: number, nbrAppenders: number,
        test: (
            loggers: JL.JSNLogLogger[], appenders: JL.JSNLogAjaxAppender[], xhr: XMLHttpRequestMock, callsToSend: any) => void) {

        // Create a new mock object for each test
        var xhrMock = new JLTestUtils.XMLHttpRequestMock();

        JLTestUtils.xMLHttpRequestMock = xhrMock;
        spyOn(xhrMock, 'send').and.callThrough();
        spyOn(xhrMock, 'abort');
        var sendCalls = (<any>xhrMock.send).calls;

        // This must be done before creating any appenders, because the appenders will use _createXMLHttpRequest
        // to create the xhr object.
        JL._createXMLHttpRequest = JLTestUtils.createXMLHttpRequestMock;

        // ------------

        var appenders: JL.JSNLogAjaxAppender[] = [];
        var loggers: JL.JSNLogLogger[] = [];

        for (let a: number = 0; a < nbrAppenders; a++) {
            var testappender = JL.createAjaxAppender("testappender" + nextTestNbr());
            appenders.push(testappender);
        }

        for (let lg: number = 0; lg < nbrLoggers; lg++) {
            var testLogger = JL('testlogger' + nextTestNbr());
            testLogger.setOptions({ appenders: appenders })
            loggers.push(testLogger);
        }

        test(loggers, appenders, xhrMock, sendCalls);
    }

    export function runTest(test: (logger: JL.JSNLogLogger, appender: JL.JSNLogAjaxAppender, xhr: XMLHttpRequestMock, callsToSend: any) => void) {
        JLTestUtils.runTestMultiple(1, 1, function (loggers: JL.JSNLogLogger[], appenders: JL.JSNLogAjaxAppender[], xhr: XMLHttpRequestMock, callsToSend: any) {
            test(loggers[0], appenders[0], xhr, callsToSend);
        });
    }

    export function logMessages(logger: JL.JSNLogLogger, level: number, nbrMessagesToLog: number, messageIdxRef: { messageIdx: number }): void {
        for (let m = 0; m < nbrMessagesToLog; m++) {
            logger.log(level, "Event " + messageIdxRef.messageIdx.toString());
            messageIdxRef.messageIdx++;
        }
    }

    // If messageIdxIncrement is 2, then the expected message index gets increments once for every 2 messages.
    // Use this when you have a logger logging through 2 appenders.
    //
    // expectedMessageIndexes is an array of arrays of indexes.
    // Each message is checked to ensure it contains all the given indexes.
    export function checkMessages(nbrOfMessagesExpected: number, callsToSend: any,
        messageIdxIncrement: number = 1, expectedMessageIndexes: number[][] = null) {
        // Check that the expected nbr of messages sent
        var actualCount: number = callsToSend.count(); 
        expect(actualCount).toEqual(nbrOfMessagesExpected);

        // Build list of expected messageIdxs if not given
        if (!expectedMessageIndexes) {
            expectedMessageIndexes = [];

            for (let m = 0; m < nbrOfMessagesExpected; m++) {
                var messageIdx = Math.floor(m / messageIdxIncrement);
                expectedMessageIndexes.push([messageIdx]);
            }
        }

        // For each message sent, check its content
        for (let m = 0; m < nbrOfMessagesExpected; m++) {
            var args = callsToSend.argsFor(m);
            var argValue0 = args[0];

            for (let i = 0; i < expectedMessageIndexes[m].length; i++) {
                expect(argValue0).toContain('"m":"Event ' + expectedMessageIndexes[m][i].toString() + '"');
            }
        }
    }

    function FormatResult(idx: number, fieldName: string, expected: string, actual: string): string {
        return "idx: " + idx + "</br>field: " + fieldName + "</br>expected: " + expected +"</br>actual: "+ actual;
    }

    // Returns string with comparison result. 
    // Returns empty string if expected and actual are equal.
    function LogItemArraysCompareResult(expected: JL.LogItem[], actual: JL.LogItem[]): string {
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

            var m: any = expected[i].m;
            var match = false;

            if (m instanceof RegExp)
            {
                match = m.test(actual[i].m);
            }
            else
            {
                match = (expected[i].m == actual[i].m);
            }

            if (!match)
            {
                return FormatResult(i, "msg", expected[i].m, actual[i].m);
            }

            if (expected[i].n != actual[i].n)
            {
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
}
