/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

describe("Server Unavailable", function () {

    beforeEach(function () {
        jasmine.clock().install();
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    var initTest = function (appender: JL.JSNLogAjaxAppender) {
        appender.setOptions({
            maxBatchSize: 3,
            sendTimeout: 10000
        });
    }

    var scenarios = [
        { nbrMessagesDuringOutage: 1, expected1: [[0], [1]], expected2: [[0], [1], [1]], expected3: [[0], [1], [1], [2]] },
        // The first log attempt during outage will try to send only the first message. 
        // With second log attempt, send will not be called because first send is still outstanding.
        { nbrMessagesDuringOutage: 2, expected1: [[0], [1]], expected2: [[0], [1], [1, 2]], expected3: [[0], [1], [1, 2], [3]] },
        // maxBatchSize is 3, so 4th log message during outage will be dropped
        { nbrMessagesDuringOutage: 4, expected1: [[0], [1]], expected2: [[0], [1], [1, 2, 3]], expected3: [[0], [1], [1, 2, 3], [5]] }
    ];

    // test each scenario
    for (let s = 0; s < scenarios.length; s++) {
        var title =
            "should buffer messages during outage and resend them after timeout (" +
            scenarios[s].nbrMessagesDuringOutage +
            " messages during outage)";

        it(title, function () {
            JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {

                initTest(appender);

                // Internet is accessible
                let messageIdxRef = { messageIdx: 0 };
                JLTestUtils.logMessages(logger, JL.getWarnLevel(), 1, messageIdxRef);

                // Internet no longer accessible. Note that jsnlog.js should retry after 10000ms.
                xhr.status = 0;

                JLTestUtils.logMessages(logger, JL.getWarnLevel(), 1, messageIdxRef);

                // Make sure that send has been called twice
                JLTestUtils.checkMessages(2, callsToSend, 1, [[0], [1]]);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                // Internet accessible again
                xhr.status = 200;

                // Wait until after it will have retried
                jasmine.clock().tick(10001);

                // It should have resend the message
                JLTestUtils.checkMessages(3, callsToSend, 1, [[0], [1], [1]]);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                // It should have stopped resending the message.
                // Wait another period and make sure it didn't send anything else
                jasmine.clock().tick(10001);
                JLTestUtils.checkMessages(3, callsToSend, 1, [[0], [1], [1]]);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                // It should now be sending messages normally again, without resending
                JLTestUtils.logMessages(logger, JL.getWarnLevel(), 1, messageIdxRef);
                JLTestUtils.checkMessages(4, callsToSend, 1, [[0], [1], [1], [2]]);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                jasmine.clock().tick(10001);
                JLTestUtils.checkMessages(4, callsToSend, 1, [[0], [1], [1], [2]]);
                expect(xhr.abort).toHaveBeenCalledTimes(0);
            });
        });
    }





    // log, outage starts, log bit more, outage ends, log more

    // log, outage starts, log bit more, maxBatchSize reached, log more, outage ends, log more (expect warn message)


// check it aborts the call if the sendtimer timed out



});



