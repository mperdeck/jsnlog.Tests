/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

var describeTitle: string = "Server Unavailable | ";
describe(describeTitle, function () {

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
        (function (s: number) {
        var title =
            "should buffer messages during outage and resend them after timeout (" +
            scenarios[s].nbrMessagesDuringOutage +
            " messages during outage)";

        var mySpec:any = it(title, function () {
            JLTestUtils.logItTitle(mySpec.getFullName());
            JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {

                initTest(appender);

                // Internet is accessible
                let messageIdxRef = { messageIdx: 0 };
                JLTestUtils.logMessages(logger, JL.getInfoLevel(), 1, messageIdxRef);

                // Internet no longer accessible. Note that jsnlog.js should retry after 10000ms.
                xhr.status = 0;

                JLTestUtils.logMessages(logger, JL.getInfoLevel(), scenarios[s].nbrMessagesDuringOutage, messageIdxRef);

                // Make sure that send has been called second time
                JLTestUtils.checkMessages(s.toString(), scenarios[s].expected1.length, callsToSend, 1, scenarios[s].expected1);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                if (scenarios[s].haveSecondOutagePeriod) {
                    JLTestUtils.wait(10001);
                    JLTestUtils.logMessages(logger, JL.getInfoLevel(), scenarios[s].nbrMessagesDuringSecondOutagePeriod, messageIdxRef);
                }

                // Internet accessible again
                xhr.status = 200;

                // Wait until after it will have retried
                JLTestUtils.wait(10001);

                // It should have resend the message
                JLTestUtils.checkMessages(s.toString(), scenarios[s].expected2.length, callsToSend, 1, scenarios[s].expected2);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                if (scenarios[s].extraExpectedMessageAfterOutageContains) {
                    var args = callsToSend.argsFor(scenarios[s].extraExpectedMessageAfterOutageIdx);
                    var message = args[0];
                    expect(message).toContain(scenarios[s].extraExpectedMessageAfterOutageContains);
                }

                // It should have stopped resending the message.
                // Wait another period and make sure it didn't send anything else
                JLTestUtils.wait(10001);
                JLTestUtils.checkMessages(s.toString(), scenarios[s].expected2.length, callsToSend, 1, scenarios[s].expected2);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                // It should now be sending messages normally again, without resending
                JLTestUtils.logMessages(logger, JL.getInfoLevel(), 1, messageIdxRef);
                JLTestUtils.checkMessages(s.toString(), scenarios[s].expected3.length, callsToSend, 1, scenarios[s].expected3);
                expect(xhr.abort).toHaveBeenCalledTimes(0);

                JLTestUtils.wait(10001);
                JLTestUtils.checkMessages(s.toString(), scenarios[s].expected3.length, callsToSend, 1, scenarios[s].expected3);
                expect(xhr.abort).toHaveBeenCalledTimes(0);
            }); // runtest
        }); // it
        })(s);
    } // for

    var title: string = "should abort the request in flight after a send timeout";
    var mySpec2: any = it(title, function () {
        JLTestUtils.logItTitle(mySpec2.getFullName());
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {

            initTest(appender);

            // Internet is accessible
            let messageIdxRef = { messageIdx: 0 };
            JLTestUtils.logMessages(logger, JL.getInfoLevel(), 3, messageIdxRef);

            // Next request will see no response.
            xhr.readyState = 3;
            xhr.status = 0;

            // 2 log messages generated. Note that jsnlog.js will try to send the first one right away
            // and fail to do so.
            JLTestUtils.logMessages(logger, JL.getInfoLevel(), 2, messageIdxRef);

            // Next time request is sent, that will be successful
            xhr.readyState = 4;
            xhr.status = 200;

            JLTestUtils.wait(10001);

            // After timeout, the 2 messages should be sent in one batch

            // First 3 messages without problem, then one that failed, than that one and the next log message in one batch
            JLTestUtils.checkMessages("0", 5, callsToSend, 1, [[0], [1], [2], [3], [3, 4]]);
            expect(xhr.abort).toHaveBeenCalledTimes(1);
        });
    });

    var scenariosOverlap = [
        {
            // sendTimeout > batchTimeout
            // Initial message is sent because of batchTimer expiry. 
            // Batchtimer expires for second message before response received for first message.
            id: 0, sendTimeout: 8000, batchTimeout: 1000, 
            nbrSent1: 1, wait1: 1500, nbrSent2: 1, wait2: 1500, goodResponseReceived: true, wait3: 1500, sendsExpected: [[0],[1]]  
        },
        {
            // sendTimeout > batchTimeout
            // Initial message is sent because of batchTimer expiry. 
            // Batchtimer expires for second message before send timout for first message.
            id: 1, sendTimeout: 8000, batchTimeout: 1000,
            nbrSent1: 1, wait1: 1500, nbrSent2: 1, wait2: 1500, goodResponseReceived: false, wait3: 10000, sendsExpected: [[0], [0,1]]
        },
        {
            // sendTimeout > batchTimeout
            // Initial message is sent because batch complete. 
            // Batchtimer expires for second message before response received for first message.
            id: 2, sendTimeout: 8000, batchTimeout: 1000,
            nbrSent1: 4, wait1: 10, nbrSent2: 1, wait2: 1500, goodResponseReceived: true, wait3: 1500, sendsExpected: [[0,1,2,3], [4]]
        },
        {
            // sendTimeout < batchTimeout
            // Initial message is sent because batch complete. 
            // Batchtimer expires for second message after response received for first message.
            id: 3, sendTimeout: 2000, batchTimeout: 8000,
            nbrSent1: 4, wait1: 10, nbrSent2: 1, wait2: 1500, goodResponseReceived: true, wait3: 10000, sendsExpected: [[0, 1, 2, 3], [4]]
        },
        {
            // sendTimeout < batchTimeout
            // Initial message is sent because batch complete, but suffers send timout and successful retry. 
            // Batchtimer set to expire for second message after send timout and retry for first message.
            // When send timer expires, the retry of the first message will send the entire buffer.
            id: 4, sendTimeout: 2000, batchTimeout: 8000,
            nbrSent1: 4, wait1: 10, nbrSent2: 1, wait2: 1500, goodResponseReceived: false, wait3: 10000, sendsExpected: [[0, 1, 2, 3], [0, 1, 2, 3, 4]]
        }
    ];


    // test each scenario
    for (let s = 0; s < scenariosOverlap.length; s++) {
        (function (s: number) {
        var title = "sendTimer and batchTimer both running - test " + scenariosOverlap[s].id;

        var mySpec:any = it(title, function () {
            JLTestUtils.logItTitle(mySpec.getFullName());
            JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {

                appender.setOptions({
                    batchSize: 4,
                    sendTimeout: scenariosOverlap[s].sendTimeout,
                    batchTimeout: scenariosOverlap[s].batchTimeout,
                });

                // Sends from now on all fail
                xhr.status = 0;

                let messageIdxRef = { messageIdx: 0 };
                JLTestUtils.logMessages(logger, JL.getInfoLevel(), scenariosOverlap[s].nbrSent1, messageIdxRef);
                JLTestUtils.wait(scenariosOverlap[s].wait1);

                JLTestUtils.logMessages(logger, JL.getInfoLevel(), scenariosOverlap[s].nbrSent2, messageIdxRef);
                JLTestUtils.wait(scenariosOverlap[s].wait2);

                // Sends from now on all succeed
                xhr.status = 200;
                xhr.readyState = 4;

                if (scenariosOverlap[s].goodResponseReceived) {
                    xhr.onreadystatechange();
                }

                JLTestUtils.wait(scenariosOverlap[s].wait3);

                JLTestUtils.checkMessages(s.toString(), scenariosOverlap[s].sendsExpected.length, callsToSend, 1, scenariosOverlap[s].sendsExpected);
            }); // runtest
        }); // it
        })(s);
    } // for
});



