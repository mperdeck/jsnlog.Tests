beforeEach(function () {
    JL._createXMLHttpRequest = JLTestUtils.createXMLHttpRequestMock;
    spyOn(JLTestUtils.xMLHttpRequestMock, 'send').and.callThrough();

    // The default appender gets created right after the JL object is created, inside jsnlog.js.
    // So that will have a normal XmlHttpRequest object.
    // In your tests (not here), you need to create new loggers and appenders, so the tests do not
    // influence each other.
});



