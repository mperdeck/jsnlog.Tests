using System.Collections.Generic;
using System.Text;
using JSNLog.Tests.Common;

namespace JSNLog.TestSite.Logic
{
    public class TestUtils
    {
        /// <summary>
        /// Generates JS to store the timestamp for a log action
        /// </summary>
        /// <param name="seq">
        /// The index into tests of the log action for which the timestamp is stored.
        /// </param>
        /// <returns></returns>
        private static string StoreTimestampJs(int seq)
        {
            string js = string.Format("__timestamp{0} = (new Date).getTime();", seq);
            return js;
        }

        /// <summary>
        /// Generates JS expression to get the timestamp for a log action
        /// </summary>
        /// <param name="seq"></param>
        /// <returns></returns>
        private static string GetTimestampJs(int seq)
        {
            string js = string.Format("__timestamp{0}", seq);
            return js;
        }

        private static string Msg(int seq, int checkExpected, int level, string logger)
        {
            return $"msg{seq}-{checkExpected} level: {level}, logger: {logger}";
        }

        /// <summary>
        /// Creates JSON with all log items expected for a given check number.
        /// </summary>
        /// <param name="checkNbr"></param>
        /// <param name="tests"></param>
        /// <returns></returns>
        private static string Expected(int checkNbr, IEnumerable<T> tests)
        {
            var sb = new StringBuilder();

            sb.AppendLine(@"[");

            int seq = 0;
            bool first = true;
            foreach (T t in tests)
            {
                if (t.CheckExpected == checkNbr)
                {
                    string msg = t.ExpectedMsg ?? Msg(seq, t.CheckExpected, t.Level, t.Logger);
                    string timestamp = GetTimestampJs(seq);

                    sb.AppendLine(string.Format("  {0}{{", first ? "" : ","));
                    sb.AppendLine(string.Format("    l: {0},", t.Level));
                    sb.AppendLine(string.Format("    m: '{0}',", msg));
                    sb.AppendLine(string.Format("    n: '{0}',", t.Logger));
                    sb.AppendLine(string.Format("    t: {0}", timestamp));
                    sb.AppendLine("  }");

                    first = false;
                }

                seq++;
            }

            sb.AppendLine("]");
            string js = sb.ToString();

            return js;
        }

        public static void AddSetXMLHttpRequest(StringBuilder sb)
        {
            // The Configure method generates code that creates appenders in function __jsnlog_configure.
            // That function is called when jsnlog.js ends loading.
            // If you do not set JL._XMLHttpRequest before __jsnlog_configure is called, the appenders will use the standard
            // XMLHttpRequest object.
            //
            // So, create a new method __jsnlog_configure that first sets JL._XMLHttpRequest and then calls the
            // generated __jsnlog_configure.
            sb.AppendLine(@"
                <script type=""text/javascript"">
                var __jsnlog_configure_generated = __jsnlog_configure;
                __jsnlog_configure = function (JL) {                    JL._createXMLHttpRequest = JLTestUtils.createXMLHttpRequestMock;
                    if (__jsnlog_configure_generated) { __jsnlog_configure_generated(JL); }
                };
                </script>");
        }

        public static void AddLoadJsnlogJs(StringBuilder sb)
        {
            sb.AppendLine(@"<script type=""text/javascript"" src=""/scripts/libs/jsnlog.js""></script>");
        }

        /// <summary>
        /// Returns all javascript to set up a test.
        /// The generated javascript is within an immediately executing function, so it sits in its own namespace.
        /// 
        /// </summary>
        /// <param name="configXml">
        /// String with xml with the JSNLog root element, as would be used in a web.config file.
        /// </param>
        /// <param name="userIp">
        /// Simulated IP address of the client.
        /// </param>
        /// <param name="requestId">
        /// Simulated request id.
        /// </param>
        /// <returns></returns>
        public static string SetupTest(string userIp, string requestId, string configXml, IEnumerable<T> tests)
        {
            var sb = new StringBuilder();

            // Set config cache in JavascriptLogging to contents of xe
            // This essentially injects the config XML into JSNLog (the same way as when reading from web.config).
            CommonTestHelpers.SetConfigCache(configXml);

            // Generate configuration JavaScript
            var jsnlogJavaScriptConfig = JSNLog.JavascriptLogging.Configure(); 
            sb.AppendLine(jsnlogJavaScriptConfig);

            AddSetXMLHttpRequest(sb);
            AddLoadJsnlogJs(sb);

            sb.AppendLine(@"<script type=""text/javascript"">");
            sb.AppendLine("function start() {");

            sb.AppendLine(string.Format(
                "JL.setOptions({{ 'clientIP': '{0}', 'requestId': '{1}' }});", userIp, requestId));
            
            int seq = 0;
            foreach (T t in tests)
            {
                if (t.Level > -1)
                {
                    // Level given, so generate call to logger.

                    string msg = t.LogObject ?? @"""" + Msg(seq, t.CheckExpected, t.Level, t.Logger) + @"""";
                    string logCallJs = string.Format(@"JL(""{0}"").log({1}, {2});", t.Logger, t.Level, msg);
                    string storeTimestampJs = StoreTimestampJs(seq);
                    string consoleLog = $"console.log('log Logger: {t.Logger}, Level: {t.Level}, msg: ' + {msg});";
                    sb.AppendLine(logCallJs + " " + storeTimestampJs + " " + consoleLog);
                }

                if (t.CheckNbr > -1)
                {
                    // CheckNbr given, so do a check

                    // Create JSON object with all expected log entries
                    string expected = Expected(t.CheckNbr, tests);

                    // Generate check js
                    string checkJs = string.Format("JLTestUtils.Check('{0}', {1}, {2});", t.CheckAppender, t.CheckNbr, expected);
                    sb.AppendLine("");
                    sb.AppendLine(checkJs);
                    sb.AppendLine("// ----------------------");
                    sb.AppendLine("");
                }

                if (!string.IsNullOrEmpty(t.Header))
                {
                    sb.AppendLine(string.Format("$('body').append('<h3>{0}</h3>');", t.Header));
                }

                if (t.DelayMs > 0)
                {
                    // Delay execution of the steps by
                    // creating a new function (below the current one), creating a setTimeout to run
                    // that function after the delay. Then continue adding steps to that new function.

                    string nextFunctionName = $"continue{seq}";

                    sb.AppendLine($"setTimeout({nextFunctionName}, {t.DelayMs});");

                    // End curent function
                    sb.AppendLine("}");

                    // Start new function
                    sb.AppendLine($"function {nextFunctionName}() {{");

                }

                seq++;
            }

            // The testdone object signals to the C# that it can stop waiting for the test to finish
            sb.AppendLine(@"$('body').append('<div id=""testdone""></div>');");

             sb.AppendLine("}");

            sb.AppendLine("start();");

            // Remove the "running" heading. If the tests somehow crash, we won't get here and the running header will remain,
            // showing something is wrong.
            sb.AppendLine("$('#running').remove();");

            sb.AppendLine("</script>");
            string js = sb.ToString();

            return js;
        }
    }
}
