/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>

var describeTitle: string = "maxMessages | ";
describe(describeTitle, function () {

    beforeEach(function () {
        JL.setOptions({ maxMessages: 10 });
    });

    afterEach(function () {
        JL.setOptions({ maxMessages: null });
    });

    describe("Simple", function () {

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
            (function (s: number) {
                var title =
                    "Simple case - test " + s.toString() + ': ' +
                    scenarios[s].nbrAppenders.toString() + " appenders, " +
                    scenarios[s].nbrLoggers.toString() + " loggers, " +
                    scenarios[s].nbrOfMessagesExpected.toString() + " messages expected to be sent";

                var mySpec: any = it(title, function () {
                    JLTestUtils.logItTitle(mySpec.getFullName());
                    JLTestUtils.runTestMultiple(
                        scenarios[s].nbrLoggers, scenarios[s].nbrAppenders, function (loggers, appenders, xhr, callsToSend) {
                            let messageIdxRef = { messageIdx: 0 };
                            for (let lg = 0; lg < scenarios[s].nbrLoggers; lg++) {
                                JLTestUtils.logMessages(loggers[lg], JL.getFatalLevel(), scenarios[s].nbrMessagesEachLogger, messageIdxRef);
                            }

                            // When there are 2 appenders, the same message (with the same messageIdx) will be logged twice.
                            JLTestUtils.checkMessages(s.toString(), scenarios[s].nbrOfMessagesExpected, callsToSend, scenarios[s].nbrAppenders);
                        });
                }); // it
            })(s);
        } // for
    });

    describeTitle = "Used with trace buffer | ";
    describe(describeTitle, function () {
        var bufferScenarios = [
            // Log below the limit. 3 messages are expected, because the trace messages and the fatal message go out in 1 batch
            { nbrNormalMessages: 1, nbrTraceMessages: 4, nbrFatalMessages: 2, nbrOfMessagesExpected: 3, expectedMessageIndexes: [[4], [5, 0, 1, 2, 3], [6]] },
            // Log over the limit. Note that the first fatal message is sent before the trace messages.
            { nbrNormalMessages: 3, nbrTraceMessages: 9, nbrFatalMessages: 2, nbrOfMessagesExpected: 4, expectedMessageIndexes: [[9],[10],[11],[12,0,1,2,3,4,5,6]] },
        ];

        // test each scenario
        for (let s = 0; s < bufferScenarios.length; s++) {
            (function (s: number) {
            var title =
                "Using trace messages buffer: " +
                bufferScenarios[s].nbrNormalMessages.toString() + " normal messages, " +
                bufferScenarios[s].nbrTraceMessages.toString() + " trace messages, " +
                bufferScenarios[s].nbrFatalMessages.toString() + " fatal messages, " +
                bufferScenarios[s].nbrOfMessagesExpected.toString() + " messages expected to be sent";

            var mySpec:any = it(title, function () {
                JLTestUtils.logItTitle(mySpec.getFullName());
                JLTestUtils.runTest(
                    function (logger, appender, xhr, callsToSend) {

                        appender.setOptions({
                            level: JL.getInfoLevel(),
                            storeInBufferLevel: JL.getTraceLevel(),
                            sendWithBufferLevel: JL.getFatalLevel(),
                            bufferSize: 10,
                            sendTimeout: 2147483647
                        });

                        logger.setOptions({
                            level: JL.getTraceLevel()
                        });

                        let messageIdxRef = { messageIdx: 0 };
                        JLTestUtils.logMessages(logger, JL.getTraceLevel(), bufferScenarios[s].nbrTraceMessages, messageIdxRef);
                        JLTestUtils.logMessages(logger, JL.getWarnLevel(), bufferScenarios[s].nbrNormalMessages, messageIdxRef);
                        JLTestUtils.logMessages(logger, JL.getFatalLevel(), bufferScenarios[s].nbrFatalMessages, messageIdxRef);

                        JLTestUtils.checkMessages(s.toString(), bufferScenarios[s].nbrOfMessagesExpected, callsToSend, 1, bufferScenarios[s].expectedMessageIndexes);
                    });
            }); // it
            })(s);
        } // for
    });
});

