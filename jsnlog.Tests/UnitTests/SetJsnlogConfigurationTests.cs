using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Xunit;
using JSNLog.LogHandling;
using System.Xml;
using JSNLog.Infrastructure;
using System.Text;
using JSNLog.Exceptions;
using JSNLog.Tests.Common;

namespace JSNLog.Tests.UnitTests
{
    /// <summary>
    /// These tests ensure that errorneous config is handled with an exception, rather than outright crashing.
    /// </summary>

    [Collection("JSNLog")]
    public class SetJsnlogConfigurationTests
    {
        [Fact]
        public void AppenderNameDuplicate1()
        {
            // Arrange

            JsnlogConfiguration jsnlogConfiguration = new JsnlogConfiguration()
            {
                ajaxAppenders = new List<AjaxAppender>()
            };

            jsnlogConfiguration.ajaxAppenders.Add(new AjaxAppender()
            {
                name = "samename"
            });

            jsnlogConfiguration.ajaxAppenders.Add(new AjaxAppender()
            {
                name = "samename"
            });

            // Act and Assert
            Exception ex = Assert.Throws<GeneralAppenderException>(() => RunTest(jsnlogConfiguration));
        }

        [Fact]
        public void AppenderNameDuplicate2()
        {
            // Arrange

            JsnlogConfiguration jsnlogConfiguration = new JsnlogConfiguration()
            {
                ajaxAppenders = new List<AjaxAppender>(),
                consoleAppenders = new List<ConsoleAppender>()
            };

            jsnlogConfiguration.ajaxAppenders.Add(new AjaxAppender()
            {
                name = "samename"
            });

            jsnlogConfiguration.consoleAppenders.Add(new ConsoleAppender()
            {
                name = "samename"
            });

            // Act and Assert
            Exception ex = Assert.Throws<GeneralAppenderException>(() => RunTest(jsnlogConfiguration));
        }

        [Fact]
        public void AppenderNameEmpty()
        {
            // Arrange

            JsnlogConfiguration jsnlogConfiguration = new JsnlogConfiguration()
            {
                ajaxAppenders = new List<AjaxAppender>()
            };

            jsnlogConfiguration.ajaxAppenders.Add(new AjaxAppender()
            {
                name = ""
            });

            // Act and Assert
            Exception ex = Assert.Throws<GeneralAppenderException>(() => RunTest(jsnlogConfiguration));
        }

        [Fact]
        public void AppenderNameNull()
        {
            // Arrange

            JsnlogConfiguration jsnlogConfiguration = new JsnlogConfiguration()
            {
                ajaxAppenders = new List<AjaxAppender>()
            };

            jsnlogConfiguration.ajaxAppenders.Add(new AjaxAppender()
            {
                name = null
            });

            // Act and Assert
            Exception ex = Assert.Throws<GeneralAppenderException>(() => RunTest(jsnlogConfiguration));
        }

        private void RunTest(JsnlogConfiguration jsnlogConfiguration)
        {
            JavascriptLogging.SetJsnlogConfiguration(jsnlogConfiguration);
            JsnlogConfiguration retrievedJsnlogConfiguration = JavascriptLogging.GetJsnlogConfiguration();
        }
    }
}

