beforeEach(function () {
    JL._createXMLHttpRequest = TestUtils.createXMLHttpRequestMock;
    spyOn(TestUtils.xMLHttpRequestMock, 'send');

    // The default appender gets created right after the JL object is created, inside jsnlog.js.
    // So that will have a normal XmlHttpRequest object.
    // Create a new appender, which will have the mocked XmlHttpRequest object, and assign that to the
    // nameless logger.
    var testappender = JL.createAjaxAppender("testappender");
    JL().setOptions({ appenders: [testappender] })
  });

