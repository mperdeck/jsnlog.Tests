using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml;
using JSNLog.Exceptions;
using System.Text.RegularExpressions;
using System.Xml.Serialization;

namespace JSNLog.Tests.UnitTests
{
    internal class XmlHelpers
    {

        /// <summary>
        /// Takes an XML element and converts it to an object of type T.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="xmlNoot"></param>
        /// <returns></returns>
        internal static T DeserialiseXml<T>(XmlNode xmlNode)
        {
            try
            {
                var xmlNodeReader = new XmlNodeReader(xmlNode);
                XmlSerializer deserializer = new XmlSerializer(typeof(T));
                T result = (T)deserializer.Deserialize(xmlNodeReader);
                return result;
            }
            catch (Exception e)
            {
                throw new WebConfigException(e);
            }
        }
    }
}

