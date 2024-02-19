using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace JSNLog.TestSite
{
    public static class HtmlHelpers
    {
        public static HtmlString ScriptTag(this IHtmlHelper helper, string url, string cacheBuster)
        {
            // Keep the cache buster the same when reloading the page.
            // If you don't, the browser will think the cache busted js files is different
            // every time you reload the page, making debugging very hard.

            return new HtmlString($@"<script src=""{url}?cachebuster={cacheBuster}""></script>");
        }

        public static HtmlString AnchorTag(this IHtmlHelper helper, string url, string title)
        {
            string cacheBuster = Guid.NewGuid().ToString();
            return new HtmlString($@"<a target=""_blank"" href=""{url}?cachebuster={cacheBuster}"">{title}</a>");
        }
    }
}
