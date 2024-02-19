using System;
using System.Collections.Generic;
using System.Linq;
using JSNLog;
using Microsoft.AspNetCore.Mvc;

namespace JSNLog.TestSite.Controllers
{
    public class JasmineTestsController : Controller
    {
        public ActionResult SpecRunner()
        {
            return View();
        }

    }
}
