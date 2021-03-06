/// <reference path="../../scripts/JLTestUtils.ts"/>
/// <reference path="../../../../jsnlog.js/jsnlog.ts"/>
// The default appender gets created right after the JL object is created, inside jsnlog.js.
// So that will have a normal XmlHttpRequest object.
// In your tests (not here), you need to create new loggers and appenders, so the tests do not
// influence each other.
var describeTitle = "Simple Logging | ";
describe(describeTitle, function () {
    var title = "should log fatal event";
    var mySpec1 = it(title, function () {
        JLTestUtils.logItTitle(mySpec1.getFullName());
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
            logger.fatal("Fatal event");
            expect(callsToSend.count()).toEqual(1);
            var sentMessage = callsToSend.mostRecent().args[0];
            expect(sentMessage).toContain('"m":"Fatal event"');
        });
    });
    title = "should log multiple fatal events";
    var mySpec2 = it(title, function () {
        JLTestUtils.logItTitle(mySpec2.getFullName());
        JLTestUtils.runTest(function (logger, appender, xhr, callsToSend) {
            logger.fatal("Fatal event 0");
            logger.fatal("Fatal event 1");
            logger.fatal("Fatal event 2");
            expect(callsToSend.count()).toEqual(3);
            expect(callsToSend.argsFor(0)[0]).toContain('"m":"Fatal event 0"');
            expect(callsToSend.argsFor(1)[0]).toContain('"m":"Fatal event 1"');
            expect(callsToSend.argsFor(2)[0]).toContain('"m":"Fatal event 2"');
        });
    });
});
//# sourceMappingURL=SimpleLoggingSpec.js.map