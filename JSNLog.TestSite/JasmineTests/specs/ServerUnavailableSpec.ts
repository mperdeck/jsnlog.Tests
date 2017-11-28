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
            maxBatchSize: 4,
            sendTimeout: 10000
        });
    }

    var scenarios = [
        {
            nbrMessagesDuringOutage: 1, expected1: [[0], [1]], expected2: [[0], [1], [1]], expected3: [[0], [1], [1], [2]],
            extraExpectedMessageAfterOutageContains: null,
            extraExpectedMessageAfterOutageIdx: 0,
            haveSecondOutagePeriod: false,
            nbrMessagesDuringSecondOutagePeriod: 0
        },
        // The first log attempt during outage will try to send only the first message. 
        // With second log attempt, send will not be called because first send is still outstanding.
        {
            nbrMessagesDuringOutage: 2, expected1: [[0], [1]], expected2: [[0], [1], [1, 2]], expected3: [[0], [1], [1, 2], [3]],
            extraExpectedMessageAfterOutageContains: null,
            extraExpectedMessageAfterOutageIdx: 0,
            haveSecondOutagePeriod: false,
            nbrMessagesDuringSecondOutagePeriod: 0
        },
        // maxBatchSize is 4, so 5th and 6th log message during outage will be dropped.
        // After the messages that were buffered during the outage were successfully sent, jsnlog.js should also send
        // (in a separate message) the WARN about losing messages.
        {
            nbrMessagesDuringOutage: 6, expected1: [[0], [1]], expected2: [[0], [1], [1, 2, 3, 4], []], expected3: [[0], [1], [1, 2, 3, 4], [], [7]],
            extraExpectedMessageAfterOutageContains: "Lost 2 messages while connection with the server was down",
            extraExpectedMessageAfterOutageIdx: 3,
            haveSecondOutagePeriod: false,
            nbrMessagesDuringSecondOutagePeriod: 0
        },
        {
            // 2 outage periods, no messages during second outage period, maxBatchSize not exceeded
            nbrMessagesDuringOutage: 1, expected1: [[0], [1]], expected2: [[0], [1], [1], [1]], expected3: [[0], [1], [1], [1], [2]],
            extraExpectedMessageAfterOutageContains: null,
            extraExpectedMessageAfterOutageIdx: 0,
            haveSecondOutagePeriod: true,
            nbrMessagesDuringSecondOutagePeriod: 0
        },
        {
            // 2 outage periods, messages during second outage period, maxBatchSize not exceeded
            nbrMessagesDuringOutage: 2, expected1: [[0], [1]], expected2: [[0], [1], [1, 2], [1, 2, 3]], expected3: [[0], [1], [1, 2], [1, 2, 3], [4]],
            extraExpectedMessageAfterOutageContains: null,
            extraExpectedMessageAfterOutageIdx: 0,
            haveSecondOutagePeriod: true,
            nbrMessagesDuringSecondOutagePeriod: 1
        },
        {
            // 2 outage periods, 3 messages during second outage period, maxBatchSize exceeded 
            nbrMessagesDuringOutage: 2, expected1: [[0], [1]], expected2: [[0], [1], [1, 2], [1, 2, 3, 4], []], expected3: [[0], [1], [1, 2], [1, 2, 3, 4], [], [6]],
            extraExpectedMessageAfterOutageContains: "Lost 1 messages while connection with the server was down",
            extraExpectedMessageAfterOutageIdx: 4,
            haveSecondOutagePeriod: true,
            nbrMessagesDuringSecondOutagePeriod: 3
        }
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
                JLTestUtils.logMessages(logger, JL.getInfoLevel(), 1, messageIdxRef);

                // Internet no longer accessible. Note that jsnlog.js should retry after 10000ms.
                xhr.status = 0;

                JLTestUtils.logMessages(logger, JL.getInfoLevel(), scenarios[s].nbrMessagesDuringOutage, messageIdxRef);

                // Make sure that send has been called second time
                JLTestUtils.checkMessages(scenarios[s].expected1.length, callsToSend, 1, scenarios[s].expected1);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                if (scenarios[s].haveSecondOutagePeriod) {
                    jasmine.clock().tick(10001);
                    JLTestUtils.logMessages(logger, JL.getInfoLevel(), scenarios[s].nbrMessagesDuringSecondOutagePeriod, messageIdxRef);
                }

                // Internet accessible again
                xhr.status = 200;

                // Wait until after it will have retried
                jasmine.clock().tick(10001);

                // It should have resend the message
                JLTestUtils.checkMessages(scenarios[s].expected2.length, callsToSend, 1, scenarios[s].expected2);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                if (scenarios[s].extraExpectedMessageAfterOutageContains) {
                    var args = callsToSend.argsFor(scenarios[s].extraExpectedMessageAfterOutageIdx);
                    var message = args[0];
                    expect(message).toContain(scenarios[s].extraExpectedMessageAfterOutageContains);
                }

                // It should have stopped resending the message.
                // Wait another period and make sure it didn't send anything else
                jasmine.clock().tick(10001);
                JLTestUtils.checkMessages(scenarios[s].expected2.length, callsToSend, 1, scenarios[s].expected2);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                // It should now be sending messages normally again, without resending
                JLTestUtils.logMessages(logger, JL.getInfoLevel(), 1, messageIdxRef);
                JLTestUtils.checkMessages(scenarios[s].expected3.length, callsToSend, 1, scenarios[s].expected3);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                jasmine.clock().tick(10001);
                JLTestUtils.checkMessages(scenarios[s].expected3.length, callsToSend, 1, scenarios[s].expected3);
                expect(xhr.abort).toHaveBeenCalledTimes(0);
            });
        });
    }





    // log, outage starts, log bit more, outage ends, log more

    // log, outage starts, log bit more, maxBatchSize reached, log more, outage ends, log more (expect warn message)


// check it aborts the call if the sendtimer timed out



});



