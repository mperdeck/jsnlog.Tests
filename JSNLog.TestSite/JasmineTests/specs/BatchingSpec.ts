/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

var describeTitle: string = "Batching | ";
describe(describeTitle, function () {

    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    var _batchBufferSize: number = 5;
    var _batchTimeoutMs: number = 5000;

    var scenarios = [
        // Batch buffer not full, no timeout
        { id: 0, test: [{ nbrTrace: 0, nbrFatal: 1, waitMs: _batchTimeoutMs / 2, expected: [] }] },
        // Batch buffer fills up immediately just
        { id: 1, test: [{ nbrTrace: _batchBufferSize - 1, nbrFatal: 1, waitMs: _batchTimeoutMs * 0.95, expected: [[4, 0, 1, 2, 3]] }] },
        // Batch buffer fills more than up immediately
        { id: 2, test: [{ nbrTrace: _batchBufferSize * 1.5, nbrFatal: 1, waitMs: _batchTimeoutMs * 0.95, expected: [[4, 0, 1, 2, 3]] }] },
        // Batch buffer fills more than up immediately twice over. Note that when jsnlog.js decides to send all trace messages,
        // it puts them in one batch (together with the fatal message if that wasn't sent already)
        { id: 3, test: [{ nbrTrace: 6, nbrFatal: 8, waitMs: _batchTimeoutMs * 0.95, expected: [[6, 0, 1, 2, 3, 4, 5], [7, 8, 9, 10, 11]] }] },
        // Batch buffer not full, timeout
        { id: 4, test: [{ nbrTrace: 0, nbrFatal: 2, waitMs: _batchTimeoutMs * 1.05, expected: [[0, 1]] }] },
        // Ensure that oldest message waits no longer than timeout
        { id: 5, test: [
            { nbrTrace: 0, nbrFatal: 2, waitMs: _batchTimeoutMs / 2, expected: [] },
            { nbrTrace: 0, nbrFatal: 1, waitMs: _batchTimeoutMs, expected: [[0,1,2]] }
        ] },
        // On timeout, batch buffer should be cleared
        { id: 6, test: [
            { nbrTrace: 0, nbrFatal: 2, waitMs: _batchTimeoutMs * 1.5, expected: [[0,1]] },
            { nbrTrace: 0, nbrFatal: 1, waitMs: _batchTimeoutMs * 1.2, expected: [[0, 1],[2]] },
            { nbrTrace: 0, nbrFatal: 0, waitMs: _batchTimeoutMs * 1.2, expected: [[0, 1], [2]] }
        ] }
    ];

    // test each scenario
    var mySpec1: any[];
    for (let s = 0; s < scenarios.length; s++) {
        var title = "Test: " + scenarios[s].id.toString();

        mySpec1[s] = it(title, function () {
            JLTestUtils.logItTitle(mySpec1[s].getFullName());
            JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {

                    appender.setOptions({
                        batchTimeout: _batchTimeoutMs, 
                        batchSize: _batchBufferSize,
                        storeInBufferLevel: JL.getDebugLevel(),
                        level: JL.getWarnLevel(),
                        sendWithBufferLevel: JL.getFatalLevel(),
                        bufferSize: 30
                    });

                    let messageIdxRef = { messageIdx: 0 };
                    for (let t = 0; t < scenarios[s].test.length; t++) {
                        JLTestUtils.logMessages(logger, JL.getDebugLevel(), scenarios[s].test[t].nbrTrace, messageIdxRef);
                        JLTestUtils.logMessages(logger, JL.getFatalLevel(), scenarios[s].test[t].nbrFatal, messageIdxRef);
                        JLTestUtils.wait(scenarios[s].test[t].waitMs);

                        JLTestUtils.checkMessages(s.toString() + "." + t.toString(), scenarios[s].test[t].expected.length, callsToSend, 1, scenarios[s].test[t].expected);
                    }
            }); //runtest
        }); // it
    } // for
});

