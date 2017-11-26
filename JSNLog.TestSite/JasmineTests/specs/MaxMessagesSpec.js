/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

describe("maxMessages", function () {

    beforeEach(function () {
        JL.set({ maxMessages: 10 });
    });

    afterEach(function () {
        JL.set({ maxMessages: null });
    });

    // nbrLoggers, nbrAppenders, nbr of messages that should have been sent, array with nbr messages through each logger
    var scenarios = [
        // Log below the limit
        { nbrLoggers: 1, nbrAppenders: 1, nbrOfMessagesExpected: 2, nbrMessagesEachLogger: 2 },
        { nbrLoggers: 1, nbrAppenders: 2, nbrOfMessagesExpected: 8, nbrMessagesEachLogger: 4 },
        { nbrLoggers: 3, nbrAppenders: 1, nbrOfMessagesExpected: 6, nbrMessagesEachLogger: 2 },
        // Log to the limit
        { nbrLoggers: 1, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 10 },
        { nbrLoggers: 1, nbrAppenders: 2, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 5 },
        { nbrLoggers: 2, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 5 },
        // Log over the limit
        { nbrLoggers: 1, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 11 },
        { nbrLoggers: 1, nbrAppenders: 2, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 6 },
        { nbrLoggers: 3, nbrAppenders: 1, nbrOfMessagesExpected: 10, nbrMessagesEachLogger: 5 }
    ];

    // test each scenario
    for (let s = 0; s < scenarios.length; s++) {
        var title =
            "Simple case: " +
            scenarios[s].nbrAppenders.toString() + " appenders, " +
            scenarios[s].nbrLoggers.toString() + " loggers, " +
            scenarios[s].nbrOfMessagesExpected.toString() + " messages expected to be sent";

        it(title, function () {

            JLTestUtils.runTestMultiple(
                scenarios[s].nbrLoggers, scenarios[s].nbrAppenders, function (loggers, appenders, xhr, callsToSend) {

                    let messageIdx = 0;
                    for (let lg = 0; lg < scenarios[s].nbrLoggers.length; lg++) {
                        for (let m = 0; m < scenarios[s].nbrMessagesEachLogger; m++) {
                            loggers[lg].fatal("Fatal event" + messageIdx.toString());
                            messageIdx++;
                        }
                    }

                    // Check that the expected nbr of messages sent
                    expect(callsToSend.count()).toEqual(scenarios[s].nbrOfMessagesExpected);

                    // For each message sent, check its content
                    for (let m = 0; m < scenarios[s].nbrOfMessagesExpected; m++) {
                        expect(callsToSend.argsFor(m)[0]).toContain('"m":"Fatal event' + m.toString() + '"');
                    }
                }); 
        }); // it
    } // for

    var scenarios = [
        // Log below the limit
        { nbrNormalMessages: 1, nbrTraceMessages: 1, nbrFatalMessages: 2, nbrOfMessagesExpected: 2 },
    ];

    // test each scenario
    for (s = 0; s < scenarios.length; s++) {
        var title =
            "Using trace messages buffer: " +
            scenarios[s].nbrNormalMessages.toString() + " normal messages, " +
            scenarios[s].nbrTraceMessages.toString() + " trace messages, " +
            scenarios[s].nbrFatalMessages.toString() + " fatal messages, " +
            scenarios[s].nbrOfMessagesExpected.toString() + " messages expected to be sent";

        it(title, function () {

            JLTestUtils.runTest(
                function (logger, appender, xhr, callsToSend) {








                    let messageIdx = 0;
                    for (let lg = 0; lg < scenarios[s].nbrLoggers.length; lg++) {
                        for (let m = 0; m < scenarios[s].nbrMessagesEachLogger; m++) {
                            loggers[lg].fatal("Fatal event" + messageIdx.toString());
                            messageIdx++;
                        }
                    }

                    // Check that the expected nbr of messages sent
                    expect(callsToSend.count()).toEqual(scenarios[s].nbrOfMessagesExpected);

                    // For each message sent, check its content
                    for (let m = 0; m < scenarios[s].nbrOfMessagesExpected; m++) {
                        expect(callsToSend.argsFor(m)[0]).toContain('"m":"Fatal event' + m.toString() + '"');
                    }
                });
        }); // it
    } // for














    it("should stop send all trace messages if if going over maxMessages, 1 appender", function () {
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
        });
    });

    it("should stop send all trace messages if if going over maxMessages, multiple appenders", function () {
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
        });
    });
});

