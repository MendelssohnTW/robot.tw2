/*! tw2overflow.min.js@1.0.7 | Licence MIT */
!function(a, b) {
    define("Lockr", function(a, b) {
        "use strict";
        return b.prefix = "",
        b._getPrefixedKey = function(a, b) {
            return b = b || {},
            b.noPrefix ? a : this.prefix + a
        }
        ,
        b.set = function(a, b, c) {
            var d = this._getPrefixedKey(a, c);
            try {
                localStorage.setItem(d, JSON.stringify({
                    data: b
                }))
            } catch (a) {}
        }
        ,
        b.get = function(a, b, c) {
            var d, e = this._getPrefixedKey(a, c);
            try {
                d = JSON.parse(localStorage.getItem(e))
            } catch (a) {
                d = localStorage[e] ? {
                    data: localStorage.getItem(e)
                } : null
            }
            return null === d ? b : "object" == typeof d && void 0 !== d.data ? d.data : b
        }
        ,
        b
    }(a, {}))
}(this),
function() {
    var a, b, c, d = function(a, b) {
        return function() {
            return a.apply(b, arguments)
        }
    };
    a = function() {
        function a() {
            this.translate = d(this.translate, this),
            this.data = {
                values: {},
                contexts: []
            },
            this.globalContext = {}
        }
        return a.prototype.translate = function(a, b, c, d, e) {
            var f, g, h, i;
            return null == e && (e = this.globalContext),
            h = function(a) {
                var b;
                return "function" === (b = typeof a) || "object" === b && !!a
            }
            ,
            h(b) ? (f = null,
            i = null,
            g = b,
            e = c || this.globalContext) : "number" == typeof b ? (f = null,
            i = b,
            g = c,
            e = d || this.globalContext) : (f = b,
            "number" == typeof c ? (i = c,
            g = d,
            e = e) : (i = null,
            g = c,
            e = d || this.globalContext)),
            h(a) ? (h(a.i18n) && (a = a.i18n),
            this.translateHash(a, e)) : this.translateText(a, i, g, e, f)
        }
        ,
        a.prototype.add = function(a) {
            var b, c, d, e, f, g, h, i;
            if (null != a.values) {
                g = a.values;
                for (c in g)
                    d = g[c],
                    this.data.values[c] = d
            }
            if (null != a.contexts) {
                for (h = a.contexts,
                i = [],
                e = 0,
                f = h.length; e < f; e++)
                    b = h[e],
                    i.push(this.data.contexts.push(b));
                return i
            }
        }
        ,
        a.prototype.setContext = function(a, b) {
            return this.globalContext[a] = b
        }
        ,
        a.prototype.clearContext = function(a) {
            return this.lobalContext[a] = null
        }
        ,
        a.prototype.reset = function() {
            return this.data = {
                values: {},
                contexts: []
            },
            this.globalContext = {}
        }
        ,
        a.prototype.resetData = function() {
            return this.data = {
                values: {},
                contexts: []
            }
        }
        ,
        a.prototype.resetContext = function() {
            return this.globalContext = {}
        }
        ,
        a.prototype.translateHash = function(a, b) {
            var c, d;
            for (c in a)
                "string" == typeof (d = a[c]) && (a[c] = this.translateText(d, null, null, b));
            return a
        }
        ,
        a.prototype.translateText = function(a, b, c, d, e) {
            var f, g;
            return null == d && (d = this.globalContext),
            null == this.data ? this.useOriginalText(e || a, b, c) : (f = this.getContextData(this.data, d),
            null != f && (g = this.findTranslation(a, b, c, f.values, e)),
            null == g && (g = this.findTranslation(a, b, c, this.data.values, e)),
            null == g ? this.useOriginalText(e || a, b, c) : g)
        }
        ,
        a.prototype.findTranslation = function(a, b, c, d) {
            var e, f, g, h, i;
            if (null == (g = d[a]))
                return null;
            if (null == b) {
                if ("string" == typeof g)
                    return this.applyFormatting(g, b, c)
            } else if (g instanceof Array || g.length)
                for (h = 0,
                i = g.length; h < i; h++)
                    if (f = g[h],
                    (b >= f[0] || null === f[0]) && (b <= f[1] || null === f[1]))
                        return e = this.applyFormatting(f[2].replace("-%n", String(-b)), b, c),
                        this.applyFormatting(e.replace("%n", String(b)), b, c);
            return null
        }
        ,
        a.prototype.getContextData = function(a, b) {
            var c, d, e, f, g, h, i, j;
            if (null == a.contexts)
                return null;
            for (i = a.contexts,
            g = 0,
            h = i.length; g < h; g++) {
                c = i[g],
                d = !0,
                j = c.matches;
                for (e in j)
                    f = j[e],
                    d = d && f === b[e];
                if (d)
                    return c
            }
            return null
        }
        ,
        a.prototype.useOriginalText = function(a, b, c) {
            return null == b ? this.applyFormatting(a, b, c) : this.applyFormatting(a.replace("%n", String(b)), b, c)
        }
        ,
        a.prototype.applyFormatting = function(a, b, c) {
            var d, e;
            for (d in c)
                e = new RegExp("%{" + d + "}","g"),
                a = a.replace(e, c[d]);
            return a
        }
        ,
        a
    }(),
    c = new a,
    b = c.translate,
    b.translator = c,
    b.create = function(c) {
        var d;
        return d = new a,
        null != c && d.add(c),
        d.translate.create = b.create,
        d.translate
    }
    ,
    define("i18n", function() {
        return b
    })
}
.call(this),
function(a) {
    define("ejs", function() {
        return function a(b, c, d) {
            function e(g, h) {
                if (!c[g]) {
                    if (!b[g]) {
                        var i = "function" == typeof require && require;
                        if (!h && i)
                            return i(g, !0);
                        if (f)
                            return f(g, !0);
                        var j = new Error("Cannot find module '" + g + "'");
                        throw j.code = "MODULE_NOT_FOUND",
                        j
                    }
                    var k = c[g] = {
                        exports: {}
                    };
                    b[g][0].call(k.exports, function(a) {
                        var c = b[g][1][a];
                        return e(c || a)
                    }, k, k.exports, a, b, c, d)
                }
                return c[g].exports
            }
            for (var f = "function" == typeof require && require, g = 0; g < d.length; g++)
                e(d[g]);
            return e
        }({
            1: [function(a, b, c) {
                "use strict";
                function d(a, b) {
                    var d;
                    if ("/" == a.charAt(0))
                        d = c.resolveInclude(a.replace(/^\/*/, ""), b.root || "/", !0);
                    else {
                        if (!b.filename)
                            throw new Error("`include` use relative path requires the 'filename' option.");
                        d = c.resolveInclude(a, b.filename)
                    }
                    return d
                }
                function e(a, b) {
                    var d, e = a.filename, f = arguments.length > 1;
                    if (a.cache) {
                        if (!e)
                            throw new Error("cache option requires a filename");
                        if (d = c.cache.get(e))
                            return d;
                        f || (b = g(e).toString().replace(v, ""))
                    } else if (!f) {
                        if (!e)
                            throw new Error("Internal EJS error: no file name or template provided");
                        b = g(e).toString().replace(v, "")
                    }
                    return d = c.compile(b, a),
                    a.cache && c.cache.set(e, d),
                    d
                }
                function f(a, b, c) {
                    var d;
                    try {
                        d = e(a)(b)
                    } catch (a) {
                        return c(a)
                    }
                    return c(null, d)
                }
                function g(a) {
                    return c.fileLoader(a)
                }
                function h(a, b) {
                    var c = o.shallowCopy({}, b);
                    return c.filename = d(a, c),
                    e(c)
                }
                function i(a, b) {
                    var c, e, f = o.shallowCopy({}, b);
                    c = d(a, f),
                    e = g(c).toString().replace(v, ""),
                    f.filename = c;
                    var h = new l(e,f);
                    return h.generateSource(),
                    {
                        source: h.source,
                        filename: c,
                        template: e
                    }
                }
                function j(a, b, c, d, e) {
                    var f = b.split("\n")
                      , g = Math.max(d - 3, 0)
                      , h = Math.min(f.length, d + 3)
                      , i = e(c)
                      , j = f.slice(g, h).map(function(a, b) {
                        var c = b + g + 1;
                        return (c == d ? " >> " : "    ") + c + "| " + a
                    }).join("\n");
                    throw a.path = i,
                    a.message = (i || "ejs") + ":" + d + "\n" + j + "\n\n" + a.message,
                    a
                }
                function k(a) {
                    return a.replace(/;(\s*$)/, "$1")
                }
                function l(a, b) {
                    b = b || {};
                    var d = {};
                    this.templateText = a,
                    this.mode = null,
                    this.truncate = !1,
                    this.currentLine = 1,
                    this.source = "",
                    this.dependencies = [],
                    d.client = b.client || !1,
                    d.escapeFunction = b.escape || o.escapeXML,
                    d.compileDebug = !1 !== b.compileDebug,
                    d.debug = !!b.debug,
                    d.filename = b.filename,
                    d.delimiter = b.delimiter || c.delimiter || r,
                    d.strict = b.strict || !1,
                    d.context = b.context,
                    d.cache = b.cache || !1,
                    d.rmWhitespace = b.rmWhitespace,
                    d.root = b.root,
                    d.localsName = b.localsName || c.localsName || s,
                    d.strict ? d._with = !1 : d._with = void 0 === b._with || b._with,
                    this.opts = d,
                    this.regex = this.createRegex()
                }
                var m = a("fs")
                  , n = a("path")
                  , o = a("./utils")
                  , p = !1
                  , q = a("../package.json").version
                  , r = "%"
                  , s = "locals"
                  , t = ["delimiter", "scope", "context", "debug", "compileDebug", "client", "_with", "rmWhitespace", "strict", "filename"]
                  , u = t.concat("cache")
                  , v = /^\uFEFF/;
                c.cache = o.cache,
                c.fileLoader = m.readFileSync,
                c.localsName = s,
                c.resolveInclude = function(a, b, c) {
                    var d = n.dirname
                      , e = n.extname
                      , f = n.resolve
                      , g = f(c ? b : d(b), a);
                    return e(a) || (g += ".ejs"),
                    g
                }
                ,
                c.compile = function(a, b) {
                    var c;
                    return b && b.scope && (p || (console.warn("`scope` option is deprecated and will be removed in EJS 3"),
                    p = !0),
                    b.context || (b.context = b.scope),
                    delete b.scope),
                    c = new l(a,b),
                    c.compile()
                }
                ,
                c.render = function(a, b, c) {
                    var d = b || {}
                      , f = c || {};
                    return 2 == arguments.length && o.shallowCopyFromList(f, d, t),
                    e(f, a)(d)
                }
                ,
                c.renderFile = function() {
                    var a, b = arguments[0], c = arguments[arguments.length - 1], d = {
                        filename: b
                    };
                    return arguments.length > 2 ? (a = arguments[1],
                    3 === arguments.length ? a.settings && a.settings["view options"] ? o.shallowCopyFromList(d, a.settings["view options"], u) : o.shallowCopyFromList(d, a, u) : o.shallowCopy(d, arguments[2]),
                    d.filename = b) : a = {},
                    f(d, a, c)
                }
                ,
                c.clearCache = function() {
                    c.cache.reset()
                }
                ,
                l.modes = {
                    EVAL: "eval",
                    ESCAPED: "escaped",
                    RAW: "raw",
                    COMMENT: "comment",
                    LITERAL: "literal"
                },
                l.prototype = {
                    createRegex: function() {
                        var a = "(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)"
                          , b = o.escapeRegExpChars(this.opts.delimiter);
                        return a = a.replace(/%/g, b),
                        new RegExp(a)
                    },
                    compile: function() {
                        var a, b, c = this.opts, d = "", e = "", f = c.escapeFunction;
                        this.source || (this.generateSource(),
                        d += "  var __output = [], __append = __output.push.bind(__output);\n",
                        !1 !== c._with && (d += "  with (" + c.localsName + " || {}) {\n",
                        e += "  }\n"),
                        e += '  return __output.join("");\n',
                        this.source = d + this.source + e),
                        a = c.compileDebug ? "var __line = 1\n  , __lines = " + JSON.stringify(this.templateText) + "\n  , __filename = " + (c.filename ? JSON.stringify(c.filename) : "undefined") + ";\ntry {\n" + this.source + "} catch (e) {\n  rethrow(e, __lines, __filename, __line, escapeFn);\n}\n" : this.source,
                        c.debug && console.log(a),
                        c.client && (a = "escapeFn = escapeFn || " + f.toString() + ";\n" + a,
                        c.compileDebug && (a = "rethrow = rethrow || " + j.toString() + ";\n" + a)),
                        c.strict && (a = '"use strict";\n' + a);
                        try {
                            b = new Function(c.localsName + ", escapeFn, include, rethrow",a)
                        } catch (a) {
                            throw a instanceof SyntaxError && (c.filename && (a.message += " in " + c.filename),
                            a.message += " while compiling ejs\n\n",
                            a.message += "If the above error is not helpful, you may want to try EJS-Lint:\n",
                            a.message += "https://github.com/RyanZim/EJS-Lint"),
                            a
                        }
                        if (c.client)
                            return b.dependencies = this.dependencies,
                            b;
                        var g = function(a) {
                            var d = function(b, d) {
                                var e = o.shallowCopy({}, a);
                                return d && (e = o.shallowCopy(e, d)),
                                h(b, c)(e)
                            };
                            return b.apply(c.context, [a || {}, f, d, j])
                        };
                        return g.dependencies = this.dependencies,
                        g
                    },
                    generateSource: function() {
                        this.opts.rmWhitespace && (this.templateText = this.templateText.replace(/\r/g, "").replace(/^\s+|\s+$/gm, "")),
                        this.templateText = this.templateText.replace(/[ \t]*<%_/gm, "<%_").replace(/_%>[ \t]*/gm, "_%>");
                        var a = this
                          , b = this.parseTemplateText()
                          , d = this.opts.delimiter;
                        b && b.length && b.forEach(function(e, f) {
                            var g, h, j, k, l, m;
                            if (0 === e.indexOf("<" + d) && 0 !== e.indexOf("<" + d + d) && (h = b[f + 2]) != d + ">" && h != "-" + d + ">" && h != "_" + d + ">")
                                throw new Error('Could not find matching close tag for "' + e + '".');
                            if ((j = e.match(/^\s*include\s+(\S+)/)) && (g = b[f - 1]) && (g == "<" + d || g == "<" + d + "-" || g == "<" + d + "_"))
                                return k = o.shallowCopy({}, a.opts),
                                l = i(j[1], k),
                                m = a.opts.compileDebug ? "    ; (function(){\n      var __line = 1\n      , __lines = " + JSON.stringify(l.template) + "\n      , __filename = " + JSON.stringify(l.filename) + ";\n      try {\n" + l.source + "      } catch (e) {\n        rethrow(e, __lines, __filename, __line);\n      }\n    ; }).call(this)\n" : "    ; (function(){\n" + l.source + "    ; }).call(this)\n",
                                a.source += m,
                                void a.dependencies.push(c.resolveInclude(j[1], k.filename));
                            a.scanLine(e)
                        })
                    },
                    parseTemplateText: function() {
                        for (var a, b = this.templateText, c = this.regex, d = c.exec(b), e = []; d; )
                            a = d.index,
                            0 !== a && (e.push(b.substring(0, a)),
                            b = b.slice(a)),
                            e.push(d[0]),
                            b = b.slice(d[0].length),
                            d = c.exec(b);
                        return b && e.push(b),
                        e
                    },
                    scanLine: function(a) {
                        function b() {
                            c.truncate ? (a = a.replace(/^(?:\r\n|\r|\n)/, ""),
                            c.truncate = !1) : c.opts.rmWhitespace && (a = a.replace(/^\n/, "")),
                            a && (a = a.replace(/\\/g, "\\\\"),
                            a = a.replace(/\n/g, "\\n"),
                            a = a.replace(/\r/g, "\\r"),
                            a = a.replace(/"/g, '\\"'),
                            c.source += '    ; __append("' + a + '")\n')
                        }
                        var c = this
                          , d = this.opts.delimiter
                          , e = 0;
                        switch (e = a.split("\n").length - 1,
                        a) {
                        case "<" + d:
                        case "<" + d + "_":
                            this.mode = l.modes.EVAL;
                            break;
                        case "<" + d + "=":
                            this.mode = l.modes.ESCAPED;
                            break;
                        case "<" + d + "-":
                            this.mode = l.modes.RAW;
                            break;
                        case "<" + d + "#":
                            this.mode = l.modes.COMMENT;
                            break;
                        case "<" + d + d:
                            this.mode = l.modes.LITERAL,
                            this.source += '    ; __append("' + a.replace("<" + d + d, "<" + d) + '")\n';
                            break;
                        case d + d + ">":
                            this.mode = l.modes.LITERAL,
                            this.source += '    ; __append("' + a.replace(d + d + ">", d + ">") + '")\n';
                            break;
                        case d + ">":
                        case "-" + d + ">":
                        case "_" + d + ">":
                            this.mode == l.modes.LITERAL && b(),
                            this.mode = null,
                            this.truncate = 0 === a.indexOf("-") || 0 === a.indexOf("_");
                            break;
                        default:
                            if (this.mode) {
                                switch (this.mode) {
                                case l.modes.EVAL:
                                case l.modes.ESCAPED:
                                case l.modes.RAW:
                                    a.lastIndexOf("//") > a.lastIndexOf("\n") && (a += "\n")
                                }
                                switch (this.mode) {
                                case l.modes.EVAL:
                                    this.source += "    ; " + a + "\n";
                                    break;
                                case l.modes.ESCAPED:
                                    this.source += "    ; __append(escapeFn(" + k(a) + "))\n";
                                    break;
                                case l.modes.RAW:
                                    this.source += "    ; __append(" + k(a) + ")\n";
                                    break;
                                case l.modes.COMMENT:
                                    break;
                                case l.modes.LITERAL:
                                    b()
                                }
                            } else
                                b()
                        }
                        c.opts.compileDebug && e && (this.currentLine += e,
                        this.source += "    ; __line = " + this.currentLine + "\n")
                    }
                },
                c.escapeXML = o.escapeXML,
                c.__express = c.renderFile,
                a.extensions && (a.extensions[".ejs"] = function(a, b) {
                    var d = b || a.filename
                      , e = {
                        filename: d,
                        client: !0
                    }
                      , f = g(d).toString()
                      , h = c.compile(f, e);
                    a._compile("module.exports = " + h.toString() + ";", d)
                }
                ),
                c.VERSION = q,
                c.name = "ejs",
                "undefined" != typeof window && (window.ejs = c)
            }
            , {
                "../package.json": 6,
                "./utils": 2,
                fs: 3,
                path: 4
            }],
            2: [function(a, b, c) {
                "use strict";
                function d(a) {
                    return f[a] || a
                }
                var e = /[|\\{}()[\]^$+*?.]/g;
                c.escapeRegExpChars = function(a) {
                    return a ? String(a).replace(e, "\\$&") : ""
                }
                ;
                var f = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&#34;",
                    "'": "&#39;"
                }
                  , g = /[&<>\'"]/g;
                c.escapeXML = function(a) {
                    return void 0 == a ? "" : String(a).replace(g, d)
                }
                ,
                c.escapeXML.toString = function() {
                    return Function.prototype.toString.call(this) + ';\nvar _ENCODE_HTML_RULES = {\n      "&": "&amp;"\n    , "<": "&lt;"\n    , ">": "&gt;"\n    , \'"\': "&#34;"\n    , "\'": "&#39;"\n    }\n  , _MATCH_HTML = /[&<>\'"]/g;\nfunction encode_char(c) {\n  return _ENCODE_HTML_RULES[c] || c;\n};\n'
                }
                ,
                c.shallowCopy = function(a, b) {
                    b = b || {};
                    for (var c in b)
                        a[c] = b[c];
                    return a
                }
                ,
                c.shallowCopyFromList = function(a, b, c) {
                    for (var d = 0; d < c.length; d++) {
                        var e = c[d];
                        void 0 !== b[e] && (a[e] = b[e])
                    }
                    return a
                }
                ,
                c.cache = {
                    _data: {},
                    set: function(a, b) {
                        this._data[a] = b
                    },
                    get: function(a) {
                        return this._data[a]
                    },
                    reset: function() {
                        this._data = {}
                    }
                }
            }
            , {}],
            3: [function(a, b, c) {}
            , {}],
            4: [function(a, b, c) {
                (function(a) {
                    function b(a, b) {
                        for (var c = 0, d = a.length - 1; d >= 0; d--) {
                            var e = a[d];
                            "." === e ? a.splice(d, 1) : ".." === e ? (a.splice(d, 1),
                            c++) : c && (a.splice(d, 1),
                            c--)
                        }
                        if (b)
                            for (; c--; c)
                                a.unshift("..");
                        return a
                    }
                    function d(a, b) {
                        if (a.filter)
                            return a.filter(b);
                        for (var c = [], d = 0; d < a.length; d++)
                            b(a[d], d, a) && c.push(a[d]);
                        return c
                    }
                    var e = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
                      , f = function(a) {
                        return e.exec(a).slice(1)
                    };
                    c.resolve = function() {
                        for (var c = "", e = !1, f = arguments.length - 1; f >= -1 && !e; f--) {
                            var g = f >= 0 ? arguments[f] : a.cwd();
                            if ("string" != typeof g)
                                throw new TypeError("Arguments to path.resolve must be strings");
                            g && (c = g + "/" + c,
                            e = "/" === g.charAt(0))
                        }
                        return c = b(d(c.split("/"), function(a) {
                            return !!a
                        }), !e).join("/"),
                        (e ? "/" : "") + c || "."
                    }
                    ,
                    c.normalize = function(a) {
                        var e = c.isAbsolute(a)
                          , f = "/" === g(a, -1);
                        return a = b(d(a.split("/"), function(a) {
                            return !!a
                        }), !e).join("/"),
                        a || e || (a = "."),
                        a && f && (a += "/"),
                        (e ? "/" : "") + a
                    }
                    ,
                    c.isAbsolute = function(a) {
                        return "/" === a.charAt(0)
                    }
                    ,
                    c.join = function() {
                        var a = Array.prototype.slice.call(arguments, 0);
                        return c.normalize(d(a, function(a, b) {
                            if ("string" != typeof a)
                                throw new TypeError("Arguments to path.join must be strings");
                            return a
                        }).join("/"))
                    }
                    ,
                    c.relative = function(a, b) {
                        function d(a) {
                            for (var b = 0; b < a.length && "" === a[b]; b++)
                                ;
                            for (var c = a.length - 1; c >= 0 && "" === a[c]; c--)
                                ;
                            return b > c ? [] : a.slice(b, c - b + 1)
                        }
                        a = c.resolve(a).substr(1),
                        b = c.resolve(b).substr(1);
                        for (var e = d(a.split("/")), f = d(b.split("/")), g = Math.min(e.length, f.length), h = g, i = 0; i < g; i++)
                            if (e[i] !== f[i]) {
                                h = i;
                                break
                            }
                        for (var j = [], i = h; i < e.length; i++)
                            j.push("..");
                        return j = j.concat(f.slice(h)),
                        j.join("/")
                    }
                    ,
                    c.sep = "/",
                    c.delimiter = ":",
                    c.dirname = function(a) {
                        var b = f(a)
                          , c = b[0]
                          , d = b[1];
                        return c || d ? (d && (d = d.substr(0, d.length - 1)),
                        c + d) : "."
                    }
                    ,
                    c.basename = function(a, b) {
                        var c = f(a)[2];
                        return b && c.substr(-1 * b.length) === b && (c = c.substr(0, c.length - b.length)),
                        c
                    }
                    ,
                    c.extname = function(a) {
                        return f(a)[3]
                    }
                    ;
                    var g = "b" === "ab".substr(-1) ? function(a, b, c) {
                        return a.substr(b, c)
                    }
                    : function(a, b, c) {
                        return b < 0 && (b = a.length + b),
                        a.substr(b, c)
                    }
                }
                ).call(this, a("_process"))
            }
            , {
                _process: 5
            }],
            5: [function(a, b, c) {
                function d() {
                    throw new Error("setTimeout has not been defined")
                }
                function e() {
                    throw new Error("clearTimeout has not been defined")
                }
                function f(a) {
                    if (l === setTimeout)
                        return setTimeout(a, 0);
                    if ((l === d || !l) && setTimeout)
                        return l = setTimeout,
                        setTimeout(a, 0);
                    try {
                        return l(a, 0)
                    } catch (b) {
                        try {
                            return l.call(null, a, 0)
                        } catch (b) {
                            return l.call(this, a, 0)
                        }
                    }
                }
                function g(a) {
                    if (m === clearTimeout)
                        return clearTimeout(a);
                    if ((m === e || !m) && clearTimeout)
                        return m = clearTimeout,
                        clearTimeout(a);
                    try {
                        return m(a)
                    } catch (b) {
                        try {
                            return m.call(null, a)
                        } catch (b) {
                            return m.call(this, a)
                        }
                    }
                }
                function h() {
                    q && o && (q = !1,
                    o.length ? p = o.concat(p) : r = -1,
                    p.length && i())
                }
                function i() {
                    if (!q) {
                        var a = f(h);
                        q = !0;
                        for (var b = p.length; b; ) {
                            for (o = p,
                            p = []; ++r < b; )
                                o && o[r].run();
                            r = -1,
                            b = p.length
                        }
                        o = null,
                        q = !1,
                        g(a)
                    }
                }
                function j(a, b) {
                    this.fun = a,
                    this.array = b
                }
                function k() {}
                var l, m, n = b.exports = {};
                !function() {
                    try {
                        l = "function" == typeof setTimeout ? setTimeout : d
                    } catch (a) {
                        l = d
                    }
                    try {
                        m = "function" == typeof clearTimeout ? clearTimeout : e
                    } catch (a) {
                        m = e
                    }
                }();
                var o, p = [], q = !1, r = -1;
                n.nextTick = function(a) {
                    var b = new Array(arguments.length - 1);
                    if (arguments.length > 1)
                        for (var c = 1; c < arguments.length; c++)
                            b[c - 1] = arguments[c];
                    p.push(new j(a,b)),
                    1 !== p.length || q || f(i)
                }
                ,
                j.prototype.run = function() {
                    this.fun.apply(null, this.array)
                }
                ,
                n.title = "browser",
                n.browser = !0,
                n.env = {},
                n.argv = [],
                n.version = "",
                n.versions = {},
                n.on = k,
                n.addListener = k,
                n.once = k,
                n.off = k,
                n.removeListener = k,
                n.removeAllListeners = k,
                n.emit = k,
                n.binding = function(a) {
                    throw new Error("process.binding is not supported")
                }
                ,
                n.cwd = function() {
                    return "/"
                }
                ,
                n.chdir = function(a) {
                    throw new Error("process.chdir is not supported")
                }
                ,
                n.umask = function() {
                    return 0
                }
            }
            , {}],
            6: [function(a, b, c) {
                b.exports = {
                    name: "ejs",
                    description: "Embedded JavaScript templates",
                    keywords: ["template", "engine", "ejs"],
                    version: "2.5.6",
                    author: "Matthew Eernisse <mde@fleegix.org> (http://fleegix.org)",
                    contributors: ["Timothy Gu <timothygu99@gmail.com> (https://timothygu.github.io)"],
                    license: "Apache-2.0",
                    main: "./lib/ejs.js",
                    repository: {
                        type: "git",
                        url: "git://github.com/mde/ejs.git"
                    },
                    bugs: "https://github.com/mde/ejs/issues",
                    homepage: "https://github.com/mde/ejs",
                    dependencies: {},
                    devDependencies: {
                        browserify: "^13.0.1",
                        eslint: "^3.0.0",
                        "git-directory-deploy": "^1.5.1",
                        istanbul: "~0.4.3",
                        jake: "^8.0.0",
                        jsdoc: "^3.4.0",
                        "lru-cache": "^4.0.1",
                        mocha: "^3.0.2",
                        "uglify-js": "^2.6.2"
                    },
                    engines: {
                        node: ">=0.10.0"
                    },
                    scripts: {
                        test: "mocha",
                        lint: 'eslint "**/*.js" Jakefile',
                        coverage: "istanbul cover node_modules/mocha/bin/_mocha",
                        doc: "jake doc",
                        devdoc: "jake doc[dev]"
                    }
                }
            }
            , {}]
        }, {}, [1])(1)
    }())
}(),
function(a, b) {
    var c = injector.get("$rootScope")
      , d = injector.get("transferredSharedDataService")
      , e = injector.get("modelDataService")
      , f = injector.get("socketService")
      , g = injector.get("routeProvider")
      , h = injector.get("eventTypeProvider")
      , i = injector.get("windowDisplayService")
      , j = injector.get("windowManagerService")
      , k = injector.get("hotkeys")
      , l = injector.get("armyService")
      , m = injector.get("villageService")
      , n = injector.get("mapService")
      , o = injector.get("$filter");
    define("two/eventQueue", function() {
        var a = {}
          , b = {};
        return b.bind = function(b, c) {
            a.hasOwnProperty(b) || (a[b] = []),
            a[b].push(c)
        }
        ,
        b.trigger = function(b, c) {
            a.hasOwnProperty(b) && a[b].forEach(function(a) {
                a.apply(this, c)
            })
        }
        ,
        b
    }),
    define("two/utils", ["helper/time"], function(a) {
        var b = {};
        return b.randomSeconds = function(a) {
            a = parseInt(a, 10);
            var b = a + a / 2
              , c = a - a / 2;
            return Math.round(Math.random() * (b - c) + c)
        }
        ,
        b.time2seconds = function(a) {
            return a = a.split(":"),
            a[0] = 60 * parseInt(a[0], 10) * 60,
            a[1] = 60 * parseInt(a[1], 10),
            a[2] = parseInt(a[2], 10),
            a.reduce(function(a, b) {
                return a + b
            })
        }
        ,
        b.emitNotif = function(a, b) {
            var d = "success" === a ? h.MESSAGE_SUCCESS : h.MESSAGE_ERROR;
            c.$broadcast(d, {
                message: b
            })
        }
        ,
        b.genVillageLabel = function(a) {
            return a.name + " (" + a.x + "|" + a.y + ")"
        }
        ,
        b.isValidCoords = function(a) {
            return /\s*\d{2,3}\|\d{2,3}\s*/.test(a)
        }
        ,
        b.isValidDateTime = function(a) {
            return /^\s*([01][0-9]|2[0-3]):[0-5]\d:[0-5]\d(:\d{1,3})? (0[1-9]|[12][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}\s*$/.test(a)
        }
        ,
        b.fixDate = function(a) {
            var b = a.split(" ")
              , c = b[0]
              , d = b[1].split("/");
            return c + " " + d[1] + "/" + d[0] + "/" + d[2]
        }
        ,
        b.guid = function() {
            return Math.floor(16777216 * Math.random()).toString(16)
        }
        ,
        b.matchesElem = function(a, b) {
            return !!$(a).parents(b).length
        }
        ,
        b.getTimeFromString = function(a, b) {
            var c = a.trim().split(" ")
              , d = c[0].split(":")
              , e = c[1].split("/")
              , f = d[0]
              , g = d[1]
              , h = d[2]
              , i = d[3] || null
              , j = parseInt(e[0], 10) - 1
              , k = e[1]
              , l = e[2]
              , e = new Date(l,j,k,f,g,h,i);
            return e.getTime() + (b || 0)
        }
        ,
        b.formatDate = function(a, b) {
            return o("readableDateFilter")(a, null, c.GAME_TIMEZONE, c.GAME_TIME_OFFSET, b || "HH:mm:ss dd/MM/yyyy")
        }
        ,
        b.getTimeOffset = function() {
            return 1e3 * a.gameDate().getTimezoneOffset() * 60 + c.GAME_TIME_OFFSET
        }
        ,
        b.xhrGet = function(a, b, c) {
            if (!a)
                return !1;
            c = c || "text",
            b = b || function() {}
            ;
            var d;
            d = new XMLHttpRequest,
            d.open("GET", a, !0),
            d.responseType = c,
            d.addEventListener("load", function() {
                b(d.response)
            }, !1),
            d.send()
        }
        ,
        b
    }),
    define("two/locale", ["conf/locale", "i18n"], function(a, b) {
        function c(a, b, c) {
            if (!d.hasOwnProperty(a))
                return console.error("Language for module " + a + " not created");
            var e = Array.from(arguments).slice(1)
              , g = f[a];
            return d[a][g].apply(this, e)
        }
        var d = {}
          , e = {}
          , f = {}
          , g = a.LANGUAGE.split("_")[0]
          , h = function(a) {
            for (var b in a)
                return b
        };
        return c.create = function(a, c, i) {
            if (d.hasOwnProperty(a))
                return !1;
            d[a] = {};
            var j = c.hasOwnProperty(g)
              , k = c.hasOwnProperty(i);
            e[a] = k ? i : h(c),
            f[a] = j ? g : e[a];
            for (var l in c)
                d[a][l] = b.create({
                    values: c[l]
                })
        }
        ,
        c.change = function(a, b) {
            d[a].hasOwnProperty(b) ? f[a] = b : (console.error("Language " + b + " of module " + a + " not created. Selection default (" + e[a] + ")"),
            f[a] = e[a])
        }
        ,
        c.current = function(a) {
            return f[a]
        }
        ,
        c.eachLang = function(a, b) {
            var c = d[a];
            for (var e in c)
                b(e, c[e]("langName"))
        }
        ,
        c
    }),
    define("two/ready", ["conf/gameStates"], function(a) {
        var b = function(f, g) {
            g = g || ["map"];
            var i = function(a) {
                g = g.filter(function(b) {
                    return b !== a
                }),
                g.length || f()
            }
              , j = {
                map: function() {
                    if (d.getSharedData("MapController").isInitialized)
                        return i("map");
                    c.$on(h.MAP_INITIALIZED, function() {
                        i("map")
                    })
                },
                tribe_relations: function() {
                    var a = e.getSelectedCharacter();
                    if (a) {
                        var b = a.getTribeRelations();
                        if (!a.getTribeId() || b)
                            return i("tribe_relations")
                    }
                    var d = c.$on(h.TRIBE_RELATION_LIST, function() {
                        d(),
                        i("tribe_relations")
                    })
                },
                initial_village: function() {
                    if (e.getGameState().getGameState(a.INITIAL_VILLAGE_READY))
                        return i("initial_village");
                    c.$on(h.GAME_STATE_INITIAL_VILLAGE_READY, function() {
                        i("initial_village")
                    })
                },
                all_villages_ready: function() {
                    if (e.getGameState().getGameState(a.ALL_VILLAGES_READY))
                        return i("all_villages_ready");
                    c.$on(h.GAME_STATE_ALL_VILLAGES_READY, function() {
                        i("all_villages_ready")
                    })
                }
            };
            if (!d.getSharedData("MapController"))
                return setTimeout(function() {
                    b(f, g)
                }, 100);
            g.forEach(function(a) {
                j[a]()
            })
        };
        return b
    }),
    require(["two/ready", "Lockr", "ejs"], function(a, b, d) {
        a(function() {
            var a = e.getSelectedCharacter();
            d.delimiter = "#",
            b.prefix = a.getId() + "_twOverflow_" + a.getWorldId() + "-",
            k.add("esc", function() {
                c.$broadcast(h.WINDOW_CLOSED, null, !0)
            }, ["INPUT", "SELECT", "TEXTAREA"])
        })
    }),
    require(["two/locale"], function(a) {
        a.create("common", {
            en: {
                start: "Start",
                started: "Started",
                pause: "Pause",
                paused: "Paused",
                stop: "Stop",
                stopped: "Stopped",
                status: "Status",
                none: "None",
                info: "Information",
                settings: "Settings",
                others: "Others",
                village: "Village",
                villages: "Villages",
                building: "Building",
                buildings: "Buildings",
                level: "Level",
                registers: "Registers",
                filters: "Filters",
                add: "Add",
                waiting: "Waiting",
                attack: "Attack",
                support: "Support",
                relocate: "Transfer",
                activate: "Enable",
                deactivate: "Disable",
                units: "Units",
                officers: "Officers",
                origin: "Origin",
                target: "Target",
                save: "Save",
                logs: "Logs",
                headquarter: "Headquarters",
                barracks: "Barracks",
                tavern: "Tavern",
                hospital: "Hospital",
                preceptory: "Hall of Orders",
                chapel: "Chapel",
                church: "Church",
                academy: "Academy",
                rally_point: "Rally Point",
                statue: "Statue",
                market: "Market",
                timber_camp: "Timber Camp",
                clay_pit: "Clay Pit",
                iron_mine: "Iron Mine",
                farm: "Farm",
                warehouse: "Warehouse",
                wall: "Wall",
                spear: "Spearman",
                sword: "Swordsman",
                axe: "Axe Fighter",
                archer: "Archer",
                light_cavalry: "Light Cavalry",
                mounted_archer: "Mounted Archer",
                heavy_cavalry: "Heavy Cavalry",
                ram: "Ram",
                catapult: "Catapult",
                doppelsoldner: "Berserker",
                trebuchet: "Trebuchet",
                snob: "Nobleman",
                knight: "Paladin",
                "no-results": "No results...",
                selected: "Selected",
                now: "Now",
                costs: "Costs",
                duration: "Duration",
                points: "Points",
                player: "Player",
                players: "Players",
                next_features: "Next features",
                misc: "Miscellaneous",
                colors: "Colors"
            },
            pl: {
                start: "Start",
                started: "Uruchomiony",
                pause: "Pauza",
                paused: "Wstrzymany",
                stop: "Zatrzymany",
                stopped: "Zatrzymany",
                status: "Status",
                none: "Żaden",
                info: "Informacje",
                settings: "Ustawienia",
                others: "Inne",
                village: "Wioska",
                villages: "Wioski",
                building: "Budynek",
                buildings: "Budynki",
                level: "Poziom",
                registers: "Rejestry",
                filters: "Filtry",
                add: "Dodaj",
                waiting: "Oczekujące",
                attack: "Atak",
                support: "Wsparcie",
                relocate: "Przeniesienie",
                activate: "Włącz",
                deactivate: "Wyłącz",
                units: "Jednostki",
                officers: "Oficerowie",
                origin: "Źródło",
                target: "Cel",
                save: "Zapisz",
                logs: "Logi",
                headquarter: "Ratusz",
                barracks: "Koszary",
                tavern: "Tawerna",
                hospital: "Szpital",
                preceptory: "Komturia",
                chapel: "Kaplica",
                church: "Kościół",
                academy: "Akademia",
                rally_point: "Plac",
                statue: "Piedestał",
                market: "Rynek",
                timber_camp: "Tartak",
                clay_pit: "Kopalnia gliny",
                iron_mine: "Huta żelaza",
                farm: "Farma",
                warehouse: "Magazyn",
                wall: "Mur",
                spear: "Pikinier",
                sword: "Miecznik",
                axe: "Topornik",
                archer: "Łucznik",
                light_cavalry: "Lekki kawalerzysta",
                mounted_archer: "Łucznik konny",
                heavy_cavalry: "Ciężki kawalerzysta",
                ram: "Taran",
                catapult: "Katapulta",
                doppelsoldner: "Berserker",
                trebuchet: "Trebusz",
                snob: "Szlachcic",
                knight: "Rycerz",
                "no-results": "Brak wyników...",
                selected: "Wybrana",
                now: "Teraz",
                costs: "Koszty",
                duration: "Czas trwania",
                points: "Punkty",
                player: "Gracz",
                players: "Gracze",
                next_features: "Następne funkcje",
                misc: "Różne",
                colors: "Kolory"
            },
            pt: {
                start: "Iniciar",
                started: "Iniciado",
                pause: "Pausar",
                paused: "Pausado",
                stop: "Parar",
                stopped: "Parado",
                status: "Status",
                none: "Nenhum",
                info: "Informações",
                settings: "Configurações",
                others: "Outros",
                village: "Aldeia",
                villages: "Aldeias",
                building: "Edifício",
                buildings: "Edifícios",
                level: "Nível",
                registers: "Registros",
                filters: "Filtros",
                add: "Adicionar",
                waiting: "Em espera",
                attack: "Ataque",
                support: "Apoio",
                relocate: "Transferência",
                activate: "Ativar",
                deactivate: "Desativar",
                units: "Unidades",
                officers: "Oficiais",
                origin: "Origem",
                target: "Alvo",
                save: "Salvar",
                logs: "Logs",
                headquarter: "Edifício Principal",
                barracks: "Quartel",
                tavern: "Taverna",
                hospital: "Hospital",
                preceptory: "Salão das Ordens",
                chapel: "Capela",
                church: "Igreja",
                academy: "Academia",
                rally_point: "Ponto de Encontro",
                statue: "Estátua",
                market: "Mercado",
                timber_camp: "Bosque",
                clay_pit: "Poço de Argila",
                iron_mine: "Mina de Ferro",
                farm: "Fazenda",
                warehouse: "Armazém",
                wall: "Muralha",
                spear: "Lanceiro",
                sword: "Espadachim",
                axe: "Viking",
                archer: "Arqueiro",
                light_cavalry: "Cavalaria Leve",
                mounted_archer: "Arqueiro Montado",
                heavy_cavalry: "Cavalaria Pesada",
                ram: "Aríete",
                catapult: "Catapulta",
                doppelsoldner: "Berserker",
                trebuchet: "Trabuco",
                snob: "Nobre",
                knight: "Paladino",
                "no-results": "Sem resultados...",
                selected: "Selecionado",
                now: "Agora",
                costs: "Custos",
                duration: "Duração",
                points: "Pontos",
                player: "Jogador",
                players: "Jogadores",
                next_features: "Próximas funcionalidades",
                misc: "Diversos",
                colors: "Cores"
            }
        }, "en")
    }),
    define("two/attackView", ["two/queue", "two/eventQueue", "two/ready", "two/locale", "models/CommandModel", "conf/unitTypes", "Lockr", "helper/math", "helper/mapconvert", "struct/MapData"], function(a, b, d, i, j, k, l, m, n, o) {
        for (var p = {
            ORIGIN_VILLAGE: "origin_village_name",
            COMMAND_TYPE: "command_type",
            TARGET_VILLAGE: "target_village_name",
            TIME_COMPLETED: "time_completed",
            COMMAND_PROGRESS: "command_progress",
            ORIGIN_CHARACTER: "origin_character_name"
        }, q = {
            ATTACK: "attack",
            SUPPORT: "support",
            RELOCATE: "relocate"
        }, r = {
            COMMAND_TYPES: "commandTypes",
            VILLAGE: "village",
            INCOMING_UNITS: "incomingUnits"
        }, s = [k.LIGHT_CAVALRY, k.HEAVY_CAVALRY, k.AXE, k.SWORD, k.RAM, k.SNOB, k.TREBUCHET], t = {}, u = 0; u < s.length; u++)
            t[s[u]] = !0;
        var v, w = !1, x = {}, y = injector.get("overviewService"), z = [], A = {}, B = {}, C = {
            reverse: !1,
            column: p.COMMAND_PROGRESS
        }, D = function() {
            var a, b, c = [r.COMMAND_TYPES], d = e.getSelectedVillage().getId(), f = {};
            for (a = 0; a < c.length; a++)
                for (b in A[c[a]])
                    if (f[c[a]] || (f[c[a]] = []),
                    A[c[a]][b])
                        switch (c[a]) {
                        case r.COMMAND_TYPES:
                            "ATTACK" === b ? f[c[a]].push(q.ATTACK) : "SUPPORT" === b ? f[c[a]].push(q.SUPPORT) : "RELOCATE" === b && f[c[a]].push(q.RELOCATE)
                        }
            B = f,
            B.village = A[r.VILLAGE] ? [d] : []
        }, E = function(a, c) {
            c ? A[a][c] = !A[a][c] : A[a] = !A[a],
            D(),
            b.trigger("attackView/filtersChanged")
        }, F = function(a) {
            if (!p[a])
                return !1;
            p[a] === C.column ? C.reverse = !C.reverse : (C.column = p[a],
            C.reverse = !1),
            b.trigger("attackView/sortingChanged")
        }, G = function() {
            O()
        }, H = function(a, c) {
            b.trigger("attackView/commandCancelled", [c.id || c.command_id])
        }, I = function(a, c) {
            for (var d = 0; d < z.length; d++)
                z[d].command_id === c.command_id && z.splice(d, 1);
            b.trigger("attackView/commandIgnored", [c.command_id])
        }, J = function(a, c) {
            for (var d = 0; d < z.length; d++)
                z[d].target_village_id === c.village_id && (z[d].target_village_name = c.name,
                z[d].targetVillage.name = c.name);
            b.trigger("attackView/villageRenamed", [c])
        }, K = function(a, b) {
            B[r.VILLAGE].length && (B[r.VILLAGE] = [b],
            O())
        }, L = function() {
            l.set("attackView-filters", A),
            O()
        }, M = function() {
            O()
        }, N = function(a) {
            z = a.commands;
            for (var c = 0; c < z.length; c++)
                y.formatCommand(z[c]),
                z[c].slowestUnit = P(z[c]);
            z = z.filter(function(a) {
                return A[r.INCOMING_UNITS][a.slowestUnit]
            }),
            b.trigger("attackView/commandsLoaded", [z])
        }, O = function() {
            var a = v.getCommandListModel().getIncomingCommands().length
              , b = a > 25 ? a : 25;
            f.emit(g.OVERVIEW_GET_INCOMING, {
                count: b,
                offset: 0,
                sorting: C.column,
                reverse: C.reverse ? 1 : 0,
                groups: [],
                command_types: B[r.COMMAND_TYPES],
                villages: B[r.VILLAGE]
            }, N)
        }, P = function(b) {
            var c = b.model.duration
              , d = {}
              , e = {
                x: b.origin_x,
                y: b.origin_y
            }
              , f = {
                x: b.target_x,
                y: b.target_y
            }
              , g = [];
            return s.forEach(function(c) {
                d[c] = 1,
                g.push({
                    unit: c,
                    duration: a.getTravelTime(e, f, d, b.command_type, {})
                })
            }),
            g = g.map(function(a) {
                return a.duration = Math.abs(a.duration - c),
                a
            }).sort(function(a, b) {
                return a.duration - b.duration
            }),
            g[0].unit
        }, Q = function() {
            return z
        }, R = function() {
            return A
        }, S = function() {
            return C
        }, T = function() {
            x[h.COMMAND_INCOMING] = c.$on(h.COMMAND_INCOMING, G),
            x[h.COMMAND_CANCELLED] = c.$on(h.COMMAND_CANCELLED, H),
            x[h.MAP_SELECTED_VILLAGE] = c.$on(h.MAP_SELECTED_VILLAGE, K),
            x[h.VILLAGE_NAME_CHANGED] = c.$on(h.VILLAGE_NAME_CHANGED, J),
            x[h.COMMAND_IGNORED] = c.$on(h.COMMAND_IGNORED, I)
        }, U = function() {
            for (var a in x)
                x[a]()
        }, V = function(a, b) {
            return a.sort(function(a, c) {
                return m.actualDistance(b, a) - m.actualDistance(b, c)
            })
        }, W = function(a, b) {
            if (o.hasTownDataInChunk(a.x, a.y)) {
                var c, d, f, g = o.loadTownData(a.x, a.y, 25, 25, 25), h = [], i = [], j = [], k = [], l = e.getSelectedCharacter().getTribeId(), m = e.getSelectedCharacter().getId();
                if (g.forEach(function(a) {
                    for (d in a.data)
                        for (f in a.data[d])
                            h.push(a.data[d][f])
                }),
                i = h.filter(function(a) {
                    return null === a.character_id && a.id > 0
                }),
                j = h.filter(function(b) {
                    return b.character_id === m && a.id !== b.id
                }),
                l && (k = h.filter(function(a) {
                    return l && a.tribe_id === l
                })),
                i.length)
                    c = V(i, a);
                else if (j.length)
                    c = V(j, a);
                else {
                    if (!k.length)
                        return b(!1);
                    c = V(k, a)
                }
                return b(c[0])
            }
            var p = n.scaledGridCoordinates(a.x, a.y, 25, 25, 25)
              , q = 0;
            o.loadTownDataAsync(a.x, a.y, 25, 25, function() {
                ++q === p.length && W(a, b)
            })
        }, X = function(b, c) {
            W(b.targetVillage, function(d) {
                var e = b.targetVillage
                  , f = d
                  , g = null === f.character_id ? "attack" : "support";
                a.addCommand({
                    origin: e,
                    target: f,
                    date: c,
                    dateType: "out",
                    units: {
                        spear: "*",
                        sword: "*",
                        axe: "*",
                        archer: "*",
                        light_cavalry: "*",
                        mounted_archer: "*",
                        heavy_cavalry: "*",
                        ram: "*",
                        catapult: "*",
                        snob: "*",
                        knight: "*",
                        doppelsoldner: "*",
                        trebuchet: "*"
                    },
                    officers: {},
                    type: g,
                    catapultTarget: "wall"
                }),
                a.isRunning() || a.start()
            })
        };
        return {
            init: function() {
                i.create("attackView", {
                    en: {
                        title: "AttackView",
                        "filters.tooltip.current-only": "Current village only",
                        "filters.types": "Types",
                        "filters.tooltip.show-attacks": "Show attacks",
                        "filters.tooltip.show-supports": "Show supports",
                        "filters.tooltip.show-relocations": "Show relocations",
                        "filters.incoming-units": "Incoming Units",
                        "tooltip.command-type": "Command Type",
                        "tooltip.slowest-unit": "Slowest Unit",
                        "command-type": "CT",
                        "slowest-unit": "SU",
                        actions: "Actions",
                        "no-incoming": "No commands incoming.",
                        "commands.tooltip.copy-arrival": "Copy arrival date.",
                        "commands.tooltip.copy-back": "Copy backtime date.",
                        "commands.tooltip.set-remove": "Set a CommandQueue to remove all troops before the attack hit."
                    },
                    pl: {
                        title: "Strażnik",
                        "filters.tooltip.current-only": "Tylko aktywna wioska",
                        "filters.types": "Rodzaj",
                        "filters.tooltip.show-attacks": "Pokaż ataki",
                        "filters.tooltip.show-supports": "Pokaż wsparcia",
                        "filters.tooltip.show-relocations": "Pokaż przeniesienia",
                        "filters.incoming-units": "Nadchodzące jednostki",
                        "tooltip.command-type": "Rodzaj",
                        "tooltip.slowest-unit": "Najwolniejsza jednostka",
                        "command-type": "Rodzaj",
                        "slowest-unit": "Co?",
                        actions: "Dostępne akcje",
                        "no-incoming": "Brak nadchodzących wojsk.",
                        "commands.tooltip.copy-arrival": "Kopiuj czas dotarcia.",
                        "commands.tooltip.copy-back": "Kopiuj czas powrotu do wioski źródłowej.",
                        "commands.tooltip.set-remove": "Wstaw rozkaz wycofania wojsk przed dotarciem ataku do Kolejki rozkazów."
                    },
                    pt: {
                        title: "AttackView",
                        "filters.tooltip.current-only": "Apenas aldeia selecionada",
                        "filters.types": "Tipos",
                        "filters.tooltip.show-attacks": "Mostrar ataques",
                        "filters.tooltip.show-supports": "Mostrar apoios",
                        "filters.tooltip.show-relocations": "Mostrar transferências",
                        "filters.incoming-units": "Unidades Chegando",
                        "tooltip.command-type": "Tipo de Comando",
                        "tooltip.slowest-unit": "Unidade mais Lenta",
                        "command-type": "TC",
                        "slowest-unit": "UL",
                        actions: "Ações",
                        "no-incoming": "Nenhum comando chegando.",
                        "commands.tooltip.copy-arrival": "Copiar data de chegada.",
                        "commands.tooltip.copy-back": "Copiar backtime.",
                        "commands.tooltip.set-remove": "Criar um comando no CommandQueue para remover todas tropas da aldeia antes do comando bater na aldeia."
                    }
                }, "en");
                var a = {};
                a[r.COMMAND_TYPES] = angular.copy(q),
                a[r.INCOMING_UNITS] = angular.copy(t),
                a[r.VILLAGE] = !1,
                w = !0,
                v = e.getSelectedCharacter().getGlobalInfo(),
                A = l.get("attackView-filters", {}, !0),
                angular.merge(A, a),
                d(function() {
                    D()
                }, ["initial_village"]),
                b.bind("attackView/filtersChanged", L),
                b.bind("attackView/sortingChanged", M)
            },
            version: "1.0.0",
            loadCommands: O,
            getCommands: Q,
            getFilters: R,
            getSortings: S,
            toggleFilter: E,
            toggleSorting: F,
            FILTER_TYPES: r,
            COMMAND_TYPES: q,
            UNIT_SPEED_ORDER: s,
            COLUMN_TYPES: p,
            registerListeners: T,
            unregisterListeners: U,
            setQueueCommand: X
        }
    }),
    require(["two/ready", "two/attackView", "two/attackView/ui"], function(a, b) {
        if (b.initialized)
            return !1;
        a(function() {
            b.init(),
            b.interface()
        })
    }),
    define("two/attackView/ui", ["two/attackView", "two/queue", "two/locale", "two/ui", "two/FrontButton", "two/utils", "two/eventQueue", "helper/time", "conf/unitTypes", "ejs"], function(a, b, d, f, g, j, k, l, m, o) {
        var p, q, r, s, t, u, v, w, x = function() {
            return p = new f("AttackView",{
                template: '<div class="win-content message-list-wrapper searchable-list ng-scope"><header class="win-head"><h2><#= locale("attackView", "title") #> <span class="small">v<#= version #></span></h2><ul class="list-btn"><li><a href="#" class="twOverflow-close size-34x34 btn-red icon-26x26-close"></a></li></ul></header><div class="win-main"><div class="box-paper"><div class="filters"><table class="tbl-border-light"><tbody><tr><th><#= locale("common", "village") #></th></tr><tr><td><div class="box-border-dark icon village" tooltip="<#= locale("attackView", "filters.tooltip.current-only") #>"><span class="icon-34x34-village-info icon-bg-black"></span></div></td></tr></tbody></table><table class="tbl-border-light"><tbody><tr><th><#= locale("attackView", "filters.types") #></th></tr><tr><td><div data-filter="ATTACK" class="box-border-dark icon commandTypes attack" tooltip="<#= locale("attackView", "filters.tooltip.show-attacks") #>"><span class="icon-34x34-attack icon-bg-black"></span></div><div data-filter="SUPPORT" class="box-border-dark icon commandTypes support" tooltip="<#= locale("attackView", "filters.tooltip.show-supports") #>"><span class="icon-34x34-support icon-bg-black"></span></div><div data-filter="RELOCATE" class="box-border-dark icon commandTypes relocate" tooltip="<#= locale("attackView", "filters.tooltip.show-relocations") #>"><span class="icon-34x34-relocate icon-bg-black"></span></div></td></tr></tbody></table><table class="tbl-border-light"><tbody><tr><th><#= locale("attackView", "filters.incoming-units") #></th></tr><tr><td> <# UNIT_SPEED_ORDER.forEach(function(unit) { #> <div data-filter="<#= unit #>" class="box-border-dark icon incomingUnits <#= unit #>" tooltip="<#= locale("common", unit) #>"><span class="icon-34x34-unit-<#= unit #> icon-bg-black"></span></div> <# }) #> </td></tr></tbody></table></div><table class="tbl-border-light commands-table"><colgroup><col width="7%"><col width="14%"><col width=""><col width=""><col width="4%"><col width="12%"><col width="11%"></colgroup><thead class="sorting"><tr><th data-sort="COMMAND_TYPE" tooltip="<#= locale("attackView", "tooltip.command-type") #>"><#= locale("attackView", "command-type") #></th><th data-sort="ORIGIN_CHARACTER"><#= locale("common", "player") #></th><th data-sort="ORIGIN_VILLAGE"><#= locale("common", "origin") #></th><th data-sort="TARGET_VILLAGE"><#= locale("common", "target") #></th><th tooltip="<#= locale("attackView", "tooltip.slowest-unit") #>"><#= locale("attackView", "slowest-unit") #></th><th data-sort="TIME_COMPLETED">Arrive</th><th><#= locale("attackView", "actions") #></th></tr></thead><tbody class="commands"></tbody><tbody class="empty"><tr><td colspan="7"><#= locale("attackView", "no-incoming") #></td></tr></tbody></table></div></div></div>',
                activeTab: "attacks",
                replaces: {
                    version: a.version,
                    author: {
                        name: "Relaxeaza",
                        email: "mafrazzrafael@gmail.com",
                        url: "https://gitlab.com/relaxeaza",
                        gitlab_user_id: 518047
                    },
                    locale: d,
                    UNIT_SPEED_ORDER: a.UNIT_SPEED_ORDER
                },
                css: '#AttackView table.commands-table{table-layout:fixed;font-size:13px}#AttackView table.commands-table th{text-align:center;padding:0}#AttackView table.commands-table td{padding:1px 0;min-height:initial;border:none;text-align:center}#AttackView table.commands-table tr.attack.snob td{background:#bb8658}#AttackView table.commands-table tr.support td,#AttackView table.commands-table tr.relocate td{background:#9c9368}#AttackView table.commands-table .empty td{height:32px}#AttackView .village .coords{font-size:11px;color:#71471a}#AttackView .village .coords:hover{color:#ffde00;text-shadow:0 1px 0 #000}#AttackView .village .name:hover{color:#fff;text-shadow:0 1px 0 #000}#AttackView .village.selected .name{font-weight:bold}#AttackView .character .name:hover{color:#fff;text-shadow:1px 1px 0 #000}#AttackView .progress-wrapper{height:20px;margin-bottom:0}#AttackView .progress-wrapper .progress-text{position:absolute;width:100%;height:100%;text-align:center;z-index:10;padding:0 5px;line-height:20px;color:#f0ffc9;overflow:hidden}#AttackView .filters{height:95px;margin-bottom:10px}#AttackView .filters table{width:auto;float:left;margin:5px}#AttackView .filters .icon{width:38px;float:left;margin:0 6px}#AttackView .filters .icon.active:before{box-shadow:0 0 0 1px #000,-1px -1px 0 2px #ac9c44,0 0 0 3px #ac9c44,0 0 0 4px #000;border-radius:1px;content:"";position:absolute;width:38px;height:38px;left:-1px;top:-1px}#AttackView .filters td{padding:6px}#AttackView .icon-20x20-backtime{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAEMklEQVQ4y42US2xUdRTGf3funZn/PHqnnVdpKZZ2RCWBVESgoZogSAKKEEAlGhVNLMGg0QiJKxYudIdoTEyDj8SFGo2seDUGhEQqRHk/UimDpdAptHMr8+jM3Dv35QJbi9KEszzJ+eU753z5JKYuOQGBUpAa2SLiuPgBPBKGrZAPlSlmoQLYk4ekqUCmEHHL0pslRb7fsNwWF8L/DIz5Fanftey0oogBr65rk8HS3WC6jyY8ckfZdNtfWdX++tzGIDMabAJmArte4my/l/c//vaLoFc6jmP3iCqD41B5Mi0BId1Hk+V6ljfEQlvWL2xZoY/lKOTLGCY01tZhVLMkRJEtqzoeyUvSnN70SNZRXC1iUylDVZmszhQiDmbH9Lrgpta4mKPlCjy95D6Wrn8GAKFEEfEmdG2Qowd+4I0XFrUC7+w7eL5sCu8hdL3imaQuYFl6c9l021vjYk7Y72Xjq4/z1IaNCCVKMRckq+moiQDJ2bN48uV3GbnSx9b1ra1l0223LL05AYF/Vw4S80jyonnN6paq5YTe3LyU2rpaYrFpJGfPItlcTzI1H8R8cC38NTFiaojhSzeJJ8KNJ/4YOmP43GsTCmWLiGG5LTUBb2LuzGm3e3Ij3321m5Hey6A0AVAcPjmhQcSbuDyU5sF6e5phuS2yRWQC6Lj4x62h1vjJ3BwjlUoiYn52ffolmUtnuXj4ADu2b7/DFoN9RVQ1gAthx8U/+Sk4LiGAQtFAHzXIajpr16yiu/tX98euzyWAzrc6Abj8+1G0TIZ8uYx/xJpgjANlWfEKqjaZbIlixQQgdDHDyuULWLFisZTVdBJxQTIVA2uQ+qZ6KoU0nhqV09f+QoIxj4ThAWRVJWLZToNXUaarYR8Hdm+iZBic7N5LbmgI0xclERcAFLIVAHRtkFOHjwBwNHNryK9I/bZCXlFVIk6ZuSbukidmR1Z+/cliAHzRBjKjBTq37bz9gEAAgA+2vQjAjb4j9F6pUCga/Hzm5v6A5KRDFkXF1UnWRcRj256d/vam9zrJXT0GwGc7V+ONRwAwtTwAa9bs4ND+PTy8MMW5az7+vJ7lXKZ4IeiVjsuIgaylVxTHxf/S84+u3bh5Mbmrx/D6Y1hjGtaYBjduH9g0RonNSmH4o/T1j9JzeoBixSRbsi9ktNIuRXJ6vFVbA2ypVoiZNuay+qj62r6u1R0ee4i65Iw7rDEOnLegC4CSqwxf18b23C0cFMenF5wKJzLZfLDtuW/4pWt1Ry6XY8/ug8jRB6gN3GI0k6VtXcq9csvqtm2rTyjS+YDkpGXEgLdq/z++EhA2hYjbmMtMx7P8+4/Wbdj64U89/cP5Xlli2HGcUsAnjziulMGxbrheRu4lYH21QjSarvXQoraZbQC/nUoflzwMyx6hVz26MRVkysROQNhQ8XmqQr1XwH/rb2Du69Eebp25AAAAAElFTkSuQmCC")}#AttackView .icon-20x20-arrivetime{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAEW0lEQVQ4y4WUWWxUZRiGn7PMnNPOVtvODHQBSlulAUFBoQiEaBHBhCsSFaIhIe6JSyAkRkO8NpErY2KoYuINISkkRFAjEUyAUCQsBSu1BVpKZ2DmTNuZzsyZMz3L70Vbgkjqe/Ul//89//K9eSX+KyUKFcVKQopDxBNoALJE2VXJBUzyBpQA9xG9SA+DbF2vdRxrvqQqLWVHNAkITm8saKo0KBz3hqrqt32WlXkUWHoQZvlpQFbWmLZo//zj7W8ua7JRUoKSz+DOXYVrSZMfjnV/W+mTuvHcs/okIw9DFYAoBCw/DY6QX9yycemer9/p6KiQE7ilIj4vwNXBFIO3M1iFLKta4suNvLUwZzpZTxWZiEvJhMkHgYpf1+cKSazfsnHpnve2rVqYTg2xdvMrPL76JWKNNSxesYB1LyyDiQQ9fWkCmhxzkRuLZTcpVC1lOU4eEDNPDUzitJVc6eUDn6zuSAwl2PDGLqrnx9ECPob6kkxaPiLBEK1LniIaFVz/c4SAJsf6U2ZaEfZwxMOYuaVCJTWypKz68LXV7y6sigWf7thMdfMKkMOgryA2r5pYYwWBaA3FzBhFM8uiRXFOnumn/jGt0SjYl8t+MWzbFABkxSFSdkTTE3F3zkDyBnptw/2J5VMXpwq1gfT1AQ4eOIyi1AHw5II5hCp80bIjmhSHyEyP7Ak0AcFwuIKR/vy/PLVv7156T/1M4u8e9n/1HXqNRnNzjMS9AuGQBlMfF5zxKoA6U2hph5xp0nv+ErX1KVqfXctbH+yk65tOAOa1tolNm56TjIyFNVpmIl8GwBMEHnSzKkuUJUHh8vAYcihMIFQi3hAHZ4T65hq27dyKkbGI1uqS7a/mXO8F+gZGuDZ0j4nClFsU1adj2wrgyq5KTlOlwTOJ8STApVO/Y2VGAJgwSgBEa3VsfzXZZJKLvxyjWC7z8+G3CQf9+FS13nG9ueEwEUBRqmywEfrAvWLF4rqq5fmiwCvcIjuqYCTu8v5nnXQd7+bgoZ/48dduXF8F4ZpaNj0/j60bgly+YLTeNMyUYosxPUhONaBUpeq3K7G7T/Ym2pfWh5ZU1MzBX/0XV/64iVYe4+jR3QD4aqeGaWdylPNjABw9upv9X3R+9GVXwsjmrZQCiJDjOI4scjnTyZZc0ZhKJmM9PcNYlsu4CLJjez3jt65ij45jpZPYhVG8SRNFrcQc7eeZ9evIl9xI96Xh4yqAAaXoJCOW3zuRGjfNwbRob6wNbkkYxTizaDx9B0+pY93rnWdTYxPf+xQ9p0yvCRPciEtJqFpKEfZwyXaupArOYLbM+JK2lS3HDhyRbgwanO6eoPvEaWLxOixLY+WOrrP5onUI4Z2TdMeQZgtYySaGrM6VJVFfmnRjsiwHXEG8KR5p2/fpxjWv7jpyyCd7JxR8v03nY0Fidt2H+z1dcz1LFx7xlctb2gHO9wz1+CS1L2tZSabD4f+Asx7g+a0JbYJJg6lgAPgHUh4QWRIJr4EAAAAASUVORK5CYII=")}',
                onClose: function() {
                    a.unregisterListeners()
                }
            }),
            q = new g("AttackView",{
                onClick: function() {
                    a.registerListeners(),
                    a.loadCommands(),
                    y(),
                    p.openWindow()
                },
                classHover: !1,
                classBlur: !1
            }),
            r = $(p.$window),
            s = r.find(".commands"),
            t = r.find(".empty"),
            v = r.find(".filters"),
            u = {
                village: v.find(".village"),
                commandTypes: {
                    ATTACK: v.find(".attack"),
                    SUPPORT: v.find(".support"),
                    RELOCATE: v.find(".relocate")
                },
                incomingUnits: {
                    light_cavalry: v.find(".light_cavalry"),
                    heavy_cavalry: v.find(".heavy_cavalry"),
                    axe: v.find(".axe"),
                    sword: v.find(".sword"),
                    ram: v.find(".ram"),
                    snob: v.find(".snob"),
                    trebuchet: v.find(".trebuchet")
                }
            },
            w = r.find(".sorting th[data-sort]"),
            u.village.on("click", function() {
                a.toggleFilter(a.FILTER_TYPES.VILLAGE)
            }),
            v.find(".commandTypes").on("click", function() {
                a.toggleFilter(a.FILTER_TYPES.COMMAND_TYPES, this.dataset.filter)
            }),
            v.find(".incomingUnits").on("click", function() {
                a.toggleFilter(a.FILTER_TYPES.INCOMING_UNITS, this.dataset.filter)
            }),
            w.on("click", function() {
                a.toggleSorting(this.dataset.sort)
            }),
            setInterval(function() {
                p.isVisible("attacks") && y()
            }, 1e3),
            k.bind("attackView/commandsLoaded", z),
            k.bind("attackView/commandCancelled", A),
            k.bind("attackView/commandIgnored", B),
            k.bind("attackView/villageRenamed", C),
            k.bind("attackView/filtersChanged", G),
            k.bind("attackView/sortingChanged", H),
            c.$on(h.MAP_SELECTED_VILLAGE, D),
            G(),
            p
        }, y = function() {
            for (var b, c = a.getCommands(), d = .001 * Date.now(), e = 0; e < c.length; e++)
                b = c[e].model.percent(),
                100 !== b ? (c[e].$arrivalProgress.style.width = b + "%",
                c[e].$arrivalIn.innerHTML = l.readableSeconds(l.server2ClientTimeInSeconds(c[e].time_completed - d))) : c[e].$command.remove()
        }, z = function(b) {
            s.children().remove();
            var c = Date.now();
            if (!b.length)
                return t.css("display", "");
            t.hide(),
            b.forEach(function(b) {
                var e = document.createElement("tr")
                  , f = 1e3 * b.time_completed
                  , g = j.formatDate(f, "HH:mm:ss dd/MM/yyyy")
                  , h = l.server2ClientTimeInSeconds(f - c)
                  , k = l.readableMilliseconds(h, !1, !0)
                  , p = b.time_completed - b.time_start
                  , q = 1e3 * (b.time_completed + p)
                  , r = j.formatDate(q, "HH:mm:ss dd/MM/yyyy")
                  , t = "command-" + b.command_id + " " + b.command_type;
                b.slowestUnit === m.SNOB && (t += " snob"),
                e.className = t,
                e.innerHTML = o.render('<td class="commandType"><span class="icon-20x20-<#= commandType #>"></span></td><td class="originCharacter character player-<#= originCharacter.id #>"><span class="name"><#= originCharacter.name #> </span></td><td class="originVillage village village-<#= originVillage.id #>"><span class="name"><#= originVillage.name #></span><span class="coords"> <#= originVillage.x #>|<#= originVillage.y #></span></td><td class="targetVillage village village-<#= targetVillage.id #>"><span class="name"><#= targetVillage.name #></span><span class="coords"> <#= targetVillage.x #>|<#= targetVillage.y #></span></td><td><span class="icon-20x20-unit-<#= slowestUnit #>"></span></td><td><div class="progress-wrapper" tooltip="<#= arrivalDate #>"><div class="progress-bar arrivalProgress" style="width:<#= progress #>%"></div><div class="progress-text"><span class="arrivalIn"><#= arrivalIn #></span></div></div></td><td class="actions"><a class="copyArriveTime btn btn-orange size-20x20 icon-20x20-arrivetime" tooltip="<#= locale("attackView", "commands.tooltip.copy-arrival") #>"></a> <a class="copyBackTime btn btn-red size-20x20 icon-20x20-backtime" tooltip="<#= locale("attackView", "commands.tooltip.copy-back") #>"></a> <a class="removeTroops btn btn-orange size-20x20 icon-20x20-units-outgoing" tooltip="<#= locale("attackView", "commands.tooltip.set-remove") #>"></a></td>', {
                    locale: d,
                    originCharacter: b.originCharacter,
                    originVillage: b.originVillage,
                    targetVillage: b.targetVillage,
                    arrivalDate: g,
                    arrivalIn: k,
                    slowestUnit: b.slowestUnit,
                    progress: b.model.percent(),
                    commandType: b.command_type
                });
                var u = e.querySelector(".originCharacter .name")
                  , v = e.querySelector(".originVillage .name")
                  , w = e.querySelector(".originVillage .coords")
                  , x = e.querySelector(".targetVillage .name")
                  , y = e.querySelector(".targetVillage .coords")
                  , z = e.querySelector(".arrivalProgress")
                  , A = e.querySelector(".arrivalIn")
                  , B = e.querySelector(".removeTroops")
                  , C = e.querySelector(".copyArriveTime")
                  , D = e.querySelector(".copyBackTime");
                u.addEventListener("click", function() {
                    i.openCharacterProfile(b.originCharacter.id)
                }),
                v.addEventListener("click", function() {
                    i.openVillageInfo(b.originVillage.id)
                }),
                w.addEventListener("click", function() {
                    n.jumpToVillage(b.originVillage.x, b.originVillage.y)
                }),
                x.addEventListener("click", function() {
                    i.openVillageInfo(b.targetVillage.id)
                }),
                y.addEventListener("click", function() {
                    n.jumpToVillage(b.targetVillage.x, b.targetVillage.y)
                }),
                B.addEventListener("click", function() {
                    var c = j.formatDate(1e3 * (b.time_completed - 10), "HH:mm:ss:sss dd/MM/yyyy");
                    a.setQueueCommand(b, c)
                }),
                C.addEventListener("click", function() {
                    document.execCommand("copy")
                }),
                C.addEventListener("copy", function(a) {
                    a.preventDefault(),
                    a.clipboardData.setData("text/plain", g),
                    j.emitNotif("success", "Arrive time copied!")
                }),
                D.addEventListener("click", function() {
                    document.execCommand("copy")
                }),
                D.addEventListener("copy", function(a) {
                    a.preventDefault(),
                    a.clipboardData.setData("text/plain", r),
                    j.emitNotif("success", "Back time copied!")
                }),
                s.append(e),
                b.$command = e,
                b.$arrivalProgress = z,
                b.$arrivalIn = A
            }),
            p.setTooltips(),
            p.recalcScrollbar(),
            F()
        }, A = function(a) {
            s.find(".command-" + a).remove(),
            p.recalcScrollbar()
        }, B = function(a) {
            s.find(".command-" + a).remove(),
            p.recalcScrollbar()
        }, C = function(a) {
            var b = ".village-" + a.village_id + " .name";
            s.find(b).html(a.name)
        }, D = function(b, c) {
            a.getFilters()[a.FILTER_TYPES.VILLAGE] || F(c)
        }, E = function() {
            s.find(".village.selected").removeClass("selected")
        }, F = function(a) {
            E(),
            a = a || e.getSelectedVillage().getId(),
            s.find(".village-" + a).addClass("selected")
        }, G = function() {
            var b, c, d, e = a.getFilters();
            for (b in e)
                if (angular.isObject(e[b]))
                    for (c in e[b])
                        d = e[b][c] ? "addClass" : "removeClass",
                        u[b][c][d]("active");
                else
                    d = e[b] ? "addClass" : "removeClass",
                    u[b][d]("active")
        }, H = function() {
            var b = a.getSortings()
              , c = document.createElement("span");
            c.className = "float-right arrow ",
            c.className += b.reverse ? "icon-26x26-normal-arrow-up" : "icon-26x26-normal-arrow-down",
            w.find(".arrow").remove(),
            w.some(function(d, e) {
                var f = d.dataset.sort;
                if (b.column === a.COLUMN_TYPES[f])
                    return d.appendChild(c),
                    !0
            })
        };
        a.interface = function() {
            a.interface = x()
        }
    }),
    define("two/builder", ["two/locale", "two/utils", "two/eventQueue", "two/ready", "Lockr", "conf/upgradeabilityStates", "conf/buildingTypes", "conf/locationTypes"], function(a, b, d, i, j, k, l, n) {
        var o, p, q, r, s, t = injector.get("buildingService"), u = !1, v = !1, w = {}, x = {}, y = {};
        y.Essential = [l.HEADQUARTER, l.FARM, l.WAREHOUSE, l.RALLY_POINT, l.BARRACKS, l.TIMBER_CAMP, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.HEADQUARTER, l.RALLY_POINT, l.FARM, l.WAREHOUSE, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.WAREHOUSE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.WAREHOUSE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.FARM, l.WAREHOUSE, l.HEADQUARTER, l.STATUE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.BARRACKS, l.HEADQUARTER, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.FARM, l.HOSPITAL, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.WAREHOUSE, l.HEADQUARTER, l.WALL, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.FARM, l.FARM, l.FARM, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.BARRACKS, l.WAREHOUSE, l.WAREHOUSE, l.FARM, l.WAREHOUSE, l.WAREHOUSE, l.HEADQUARTER, l.MARKET, l.BARRACKS, l.WALL, l.WALL, l.FARM, l.FARM, l.BARRACKS, l.WAREHOUSE, l.FARM, l.BARRACKS, l.WAREHOUSE, l.FARM, l.BARRACKS, l.WAREHOUSE, l.FARM, l.WALL, l.WALL, l.WALL, l.MARKET, l.MARKET, l.MARKET, l.BARRACKS, l.BARRACKS, l.HEADQUARTER, l.HEADQUARTER, l.TAVERN, l.TAVERN, l.TAVERN, l.RALLY_POINT, l.BARRACKS, l.BARRACKS, l.WAREHOUSE, l.FARM, l.WAREHOUSE, l.FARM, l.BARRACKS, l.BARRACKS, l.STATUE, l.STATUE, l.WALL, l.WALL, l.HEADQUARTER, l.HEADQUARTER, l.WAREHOUSE, l.FARM, l.FARM, l.IRON_MINE, l.IRON_MINE, l.IRON_MINE, l.WAREHOUSE, l.BARRACKS, l.BARRACKS, l.WAREHOUSE, l.FARM, l.WALL, l.WALL, l.TAVERN, l.TAVERN, l.TAVERN, l.MARKET, l.MARKET, l.MARKET, l.WAREHOUSE, l.FARM, l.WAREHOUSE, l.FARM, l.WAREHOUSE, l.FARM, l.IRON_MINE, l.IRON_MINE, l.IRON_MINE, l.RALLY_POINT, l.BARRACKS, l.BARRACKS, l.FARM, l.FARM, l.FARM, l.FARM, l.WAREHOUSE, l.WAREHOUSE, l.HEADQUARTER, l.HEADQUARTER, l.STATUE, l.STATUE, l.FARM, l.BARRACKS, l.HEADQUARTER, l.HEADQUARTER, l.FARM, l.BARRACKS, l.HEADQUARTER, l.HEADQUARTER, l.BARRACKS, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.ACADEMY, l.FARM, l.WAREHOUSE, l.WAREHOUSE, l.WAREHOUSE, l.MARKET, l.MARKET, l.MARKET, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.TIMBER_CAMP, l.CLAY_PIT, l.TIMBER_CAMP, l.TIMBER_CAMP, l.WALL, l.WALL, l.MARKET, l.MARKET, l.MARKET, l.TIMBER_CAMP, l.CLAY_PIT, l.TIMBER_CAMP, l.CLAY_PIT, l.TAVERN, l.TAVERN, l.TAVERN, l.WALL, l.WALL, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.BARRACKS, l.BARRACKS, l.BARRACKS, l.FARM, l.WAREHOUSE, l.WAREHOUSE, l.TAVERN, l.TAVERN, l.TAVERN, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.BARRACKS, l.BARRACKS, l.FARM, l.WAREHOUSE, l.WAREHOUSE, l.WALL, l.WALL, l.WALL, l.WALL, l.TAVERN, l.TAVERN, l.TAVERN, l.RALLY_POINT, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.CLAY_PIT, l.IRON_MINE, l.TIMBER_CAMP, l.CLAY_PIT, l.CLAY_PIT, l.IRON_MINE, l.WALL, l.WALL],
        y["Full Village"] = [l.HOSPITAL, l.HOSPITAL, l.HOSPITAL, l.HOSPITAL, l.MARKET, l.MARKET, l.MARKET, l.MARKET, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.PRECEPTORY, l.HOSPITAL, l.HOSPITAL, l.HOSPITAL, l.HOSPITAL, l.HOSPITAL, l.MARKET, l.MARKET, l.MARKET, l.MARKET, l.PRECEPTORY, l.PRECEPTORY, l.MARKET, l.MARKET, l.MARKET, l.MARKET, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.HEADQUARTER, l.PRECEPTORY, l.PRECEPTORY, l.PRECEPTORY, l.PRECEPTORY, l.PRECEPTORY, l.PRECEPTORY, l.PRECEPTORY],
        Array.prototype.unshift.apply(y["Full Village"], y.Essential),
        y["Essential Without Wall"] = y.Essential.filter(function(a) {
            return a !== l.WALL
        }),
        y["Full Wall"] = [l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL, l.WALL];
        var z = {
            groupVillages: {
                default: "",
                inputType: "select"
            },
            buildingPreset: {
                default: "Essential",
                inputType: "select"
            },
            buildingOrder: {
                default: y,
                inputType: "buildingOrder"
            }
        };
        for (var A in l)
            w[l[A]] = 0;
        var B = function() {
            a.create("builder", {
                en: {
                    title: "BuilderQueue",
                    "info.header": "Title",
                    "info.content": "Content",
                    "general.disabled": "— Disabled —",
                    "general.started": "BuilderQueue started",
                    "general.stopped": "BuilderQueue stopped",
                    settings: "Settings",
                    "settings.groupVillages": "Build only on villages with the group",
                    "settings.buildingPreset": "Building order preset",
                    "settings.buildingsOrder": "Build Order",
                    "settings.buildingsOrderFinal": "Buildings Level",
                    "settings.saved": "Settings saved!",
                    "logs.noBuilds": "No builds started",
                    "logs.clear": "Clear logs"
                },
                pl: {
                    title: "Architekt",
                    "info.header": "Tytuł",
                    "info.content": "Zawartość",
                    "general.disabled": "— Wyłączony —",
                    "general.started": "Architekt Uruchomiony",
                    "general.stopped": "Architekt Zatrzymany",
                    settings: "Ustawienia",
                    "settings.groupVillages": "Buduj w wioskach z grupy",
                    "settings.buildingPreset": "Szablon kolejki budowy",
                    "settings.buildingsOrder": "Kolejność budowy",
                    "settings.buildingsOrderFinal": "Poziom budynków",
                    "settings.saved": "Ustawienia zapisane!",
                    "logs.noBuilds": "Nie rozpoczęto żadnej rozbudowy",
                    "logs.clear": "Wyczyść logi"
                },
                pt: {
                    title: "BuilderQueue",
                    "info.header": "Título",
                    "info.content": "Conteúdo",
                    "general.disabled": "— Desativado —",
                    "general.started": "BuilderQueue iniciado",
                    "general.stopped": "BuilderQueue parado",
                    settings: "Configurações",
                    "settings.groupVillages": "Construir apenas em aldeias do grupo",
                    "settings.buildingPreset": "Predefinições de ordens",
                    "settings.buildingsOrder": "Ordem de Construção",
                    "settings.buildingsOrderFinal": "Nível dos Edifícios",
                    "settings.saved": "Configurações salvas!",
                    "logs.noBuilds": "Nenhuma construção iniciada",
                    "logs.clear": "Limpar registros"
                }
            }, "en"),
            u = !0,
            o = j.get("builder-settings", {}, !0),
            s = j.get("builder-log", [], !0),
            r = e.getSelectedCharacter(),
            q = e.getGroupList();
            for (var b in z) {
                var d = z[b].default;
                x[b] = o.hasOwnProperty(b) ? o[b] : d
            }
            buildingOrderLimit = H(x.buildingPreset),
            c.$on(h.BUILDING_LEVEL_CHANGED, function(a, b) {
                if (!v)
                    return !1;
                setTimeout(function() {
                    var a = r.getVillage(b.village_id);
                    E(a)
                }, 1e3)
            })
        }
          , C = function() {
            (x.groupVillages ? q.getGroupVillageIds(x.groupVillages) : D()).forEach(function(a) {
                var b = r.getVillage(a)
                  , c = b.checkReadyState()
                  , d = b.buildingQueue;
                return d.getAmountJobs() !== d.getUnlockedSlots() && !(!c.buildingQueue || !c.buildings) && (b.isInitialized() || m.initializeVillage(b),
                void E(b))
            })
        }
          , D = function() {
            var a = []
              , b = r.getVillages();
            for (var c in b)
                a.push(c);
            return a
        }
          , E = function(a) {
            var b = angular.copy(a.buildingData.getBuildingLevels())
              , c = a.buildingQueue.getQueue()
              , e = angular.copy(w);
            if (c.forEach(function(a) {
                b[a.building]++
            }),
            G(b))
                return !1;
            x.buildingOrder[x.buildingPreset].some(function(c) {
                if (++e[c] > b[c])
                    return t.compute(a),
                    F(a, c, function(b, c) {
                        if (b) {
                            var e = Date.now()
                              , f = [{
                                x: a.getX(),
                                y: a.getY(),
                                name: a.getName(),
                                id: a.getId()
                            }, c.job.building, c.job.level, e];
                            d.trigger("Builder/jobStarted", f),
                            s.unshift(f),
                            j.set("builder-log", s)
                        }
                    }),
                    !0
            })
        }
          , F = function(a, b, c) {
            a.getBuildingData().getDataForBuilding(b).upgradeability === k.POSSIBLE ? f.emit(g.VILLAGE_UPGRADE_BUILDING, {
                building: b,
                village_id: a.getId(),
                location: n.MASS_SCREEN,
                premium: !1
            }, function(a, b) {
                c(!0, a)
            }) : c(!1)
        }
          , G = function(a) {
            for (var b in a)
                if (a[b] < buildingOrderLimit[b])
                    return !1;
            return !0
        }
          , H = function(a) {
            var b = x.buildingOrder[a]
              , c = angular.copy(w);
            return b.forEach(function(a) {
                c[a]++
            }),
            c
        }
          , I = function(a) {
            var b, c;
            for (c in a) {
                if (!z[c])
                    return d.trigger("Builder/settings/unknownSetting", [c]),
                    !1;
                b = a[c],
                angular.equals(x[c], b) || (x[c] = b)
            }
            return buildingOrderLimit = H(a.buildingPreset),
            j.set("builder-settings", x),
            !0
        }
          , J = function() {
            return x
        }
          , K = function() {
            v = !0,
            p = setInterval(C, 6e4),
            i(C, ["all_villages_ready"]),
            d.trigger("Builder/start")
        }
          , L = function() {
            v = !1,
            clearInterval(p),
            d.trigger("Builder/stop")
        }
          , M = function() {
            return u
        };
        return {
            init: B,
            start: K,
            stop: L,
            updateSettings: I,
            isRunning: function() {
                return v
            },
            isInitialized: M,
            settingsMap: z,
            getSettings: J,
            getBuildLog: function() {
                return s
            },
            clearLogs: function() {
                s = [],
                j.set("builder-log", s),
                d.trigger("Builder/clearLogs")
            },
            version: "1.0.0"
        }
    }),
    require(["two/ready", "two/builder", "two/builder/ui"], function(a, b) {
        if (b.isInitialized())
            return !1;
        a(function() {
            b.init(),
            b.interface()
        })
    }),
    define("two/builder/ui", ["two/builder", "two/locale", "two/ui", "two/FrontButton", "two/eventQueue", "two/utils", "ejs", "conf/buildingTypes", "helper/time", "two/ready"], function(a, b, d, f, g, j, k, l, m, n) {
        var o, p, q, r, s, t, u, v, w, x, y, z, A, B, C = {}, D = [l.HEADQUARTER, l.TIMBER_CAMP, l.CLAY_PIT, l.IRON_MINE, l.FARM, l.WAREHOUSE, l.CHURCH, l.CHAPEL, l.RALLY_POINT, l.BARRACKS, l.STATUE, l.HOSPITAL, l.WALL, l.MARKET, l.TAVERN, l.ACADEMY, l.PRECEPTORY], E = function() {
            return q = e.getGroupList().getGroups(),
            B = b("builder", "general.disabled"),
            o = new d("BuilderQueue",{
                activeTab: "settings",
                template: '<div class="win-content message-list-wrapper searchable-list ng-scope"><header class="win-head"><h2><#= locale("builder", "title") #> <span class="small">v<#= version #></span></h2><ul class="list-btn"><li><a href="#" class="twOverflow-close size-34x34 btn-red icon-26x26-close"></a></li></ul></header><div class="tabs tabs-bg"><div class="tabs-two-col"><div class="tab" tab="settings"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "settings") #></a></div></div></div><div class="tab" tab="log"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "logs") #></a></div></div></div></div></div><div class="win-main"><div class="box-paper footer has-footer-upper twOverflow-content-settings"><p class="center">BuilderQueue is in experimental mode at the moment. You can\'t create custom buildings order. Any bug or suggestion please send an email to <i>mafrazzrafael@gmail.com</i></p><form class="settings"><h5 class="twx-section collapse"><#= locale("builder", "settings") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="50%"><col></colgroup><tbody><tr><td><span class="ff-cell-fix"><#= locale("builder", "settings.groupVillages") #></span></td><td><select data-setting="groupVillages" class="groupVillages"></select></td></tr><tr><td><span class="ff-cell-fix"><#= locale("builder", "settings.buildingPreset") #></span></td><td><select data-setting="buildingPreset" class="buildingPreset"></select></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("builder", "settings.buildingsOrderFinal") #></h5><table class="tbl-border-light header-center"><colgroup><col width="10%"><col width="50%"><col></colgroup><thead><tr><th colspan="2"><#= locale("common", "building") #></th><th><#= locale("common", "level") #></th></tr></thead><tbody class="buildingOrderFinal"></tbody></table><h5 class="twx-section collapse"><#= locale("builder", "settings.buildingsOrder") #></h5><table class="tbl-border-light header-center"><colgroup><col width="5%"><col width="26%"><col width="7%"><col width="13%"><col width="8%"><col></colgroup><thead><tr><th colspan="2"><#= locale("common", "building") #></th><th><#= locale("common", "level") #></th><th><#= locale("common", "duration") #></th><th><#= locale("common", "points") #></th><th><#= locale("common", "costs") #></th></tr></thead><tbody class="buildingOrder"></tbody></table></form></div><div class="box-paper footer has-footer-upper twOverflow-content-log"><table class="tbl-border-light tbl-striped header-center"><colgroup><col width="40%"><col width="30%"><col width="5%"><col width="25%"><col></colgroup><thead><tr><th><#= locale("common", "village") #></th><th><#= locale("common", "building") #></th><th><#= locale("common", "level") #></th><th><#= locale("common", "started") #></th></tr></thead><tbody class="buildLog"><tr class="noBuilds"><td colspan="4"><#= locale("builder", "logs.noBuilds") #></td></tr></tbody></table></div></div><footer class="win-foot"><ul class="list-btn list-center buttons"><li class="twOverflow-button-settings"><a class="btn-orange btn-border save"><#= locale("common", "save") #></a></li><li class="twOverflow-button-log"><a class="btn-orange btn-border clearLogs"><#= locale("builder", "logs.clear") #></a></li><li class="twOverflow-button"><a class="btn-green btn-border switch"><#= locale("common", "start") #></a></li></ul></footer></div>',
                replaces: {
                    locale: b,
                    version: "1.0.0"
                },
                css: '#BuilderQueue .buildingOrder td,#BuilderQueue .buildingOrderFinal td{background:url("data:image/png;base64,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") #d1ad86}#BuilderQueue .buildingOrder tr.reached td,#BuilderQueue .buildingOrderFinal tr.reached td{background-color:#b9af7e}#BuilderQueue .buildingOrder tr.progress td,#BuilderQueue .buildingOrderFinal tr.progress td{background-color:#af9d57}#BuilderQueue input[type="text"],#BuilderQueue input[type="number"],#BuilderQueue select{color:#000;min-width:70%}#BuilderQueue .settings .helper{font-weight:bold;vertical-align:-1px;font-family:helvetica;color:rgba(0,0,0,0.3)}#BuilderQueue .settings .helper:hover{color:#000}#BuilderQueue .settings .custom-select{width:200px}#BuilderQueue .settings td{text-align:center}#BuilderQueue .settings .green{color:#297720}#BuilderQueue .buildLog td{text-align:center}#BuilderQueue .buildLog .village:hover{color:#fff;text-shadow:0 1px 0 #000}#BuilderQueue table.header-center th{text-align:center}#BuilderQueue .noBuilds td{height:26px;text-align:center}#BuilderQueue .force-26to20{transform:scale(.8);width:20px;height:20px}'
            }),
            p = new f("Builder",{
                classHover: !1,
                classBlur: !1,
                onClick: function() {
                    o.openWindow(),
                    R()
                }
            }),
            C = X(),
            r = $(o.$window),
            s = r.find(".buildingOrder"),
            $buildingOrderFinal = r.find(".buildingOrderFinal"),
            t = r.find(".groupVillages"),
            u = r.find(".buildingPreset"),
            v = r.find(".settings"),
            w = r.find(".save"),
            x = r.find(".switch"),
            y = r.find(".buildLog"),
            z = r.find(".noBuilds"),
            A = r.find(".clearLogs"),
            M(),
            H(),
            G(),
            V(),
            F(),
            o
        }, F = function() {
            u.on("selectSelected", function() {
                N(this.dataset.value),
                O(this.dataset.value),
                R()
            }),
            w.on("click", function(a) {
                L()
            }),
            x.on("click", function(b) {
                a.isRunning() ? a.stop() : a.start()
            }),
            A.on("click", function(b) {
                a.clearLogs()
            }),
            g.bind("Builder/start", function() {
                x.html(b("common", "stop")),
                x.removeClass("btn-green").addClass("btn-red"),
                p.$elem.removeClass("btn-green").addClass("btn-red"),
                j.emitNotif("success", b("builder", "general.started"))
            }),
            g.bind("Builder/stop", function() {
                x.html(b("common", "start")),
                x.removeClass("btn-red").addClass("btn-green"),
                p.$elem.removeClass("btn-red").addClass("btn-green"),
                j.emitNotif("success", b("builder", "general.stopped"))
            }),
            g.bind("Builder/jobStarted", T),
            g.bind("Builder/clearLogs", U),
            c.$on(h.GROUPS_UPDATED, function() {
                H()
            }),
            c.$on(h.VILLAGE_SELECTED_CHANGED, function() {
                o.isVisible() && R()
            }),
            c.$on(h.BUILDING_UPGRADING, S),
            c.$on(h.BUILDING_LEVEL_CHANGED, S),
            c.$on(h.BUILDING_TEARING_DOWN, S),
            c.$on(h.VILLAGE_BUILDING_QUEUE_CHANGED, S)
        }, G = function() {
            var b = u.find(".custom-select-handler").html("")
              , c = u.find(".custom-select-data").html("")
              , d = a.getSettings();
            for (var e in d.buildingOrder) {
                d.buildingPreset == e && (b.html(e),
                u[0].dataset.name = e,
                u[0].dataset.value = e),
                J(c, {
                    name: e,
                    value: e
                }),
                u.append(c)
            }
        }, H = function() {
            var b = t.find(".custom-select-handler").html("")
              , c = t.find(".custom-select-data").html("")
              , d = a.getSettings();
            I(c, "");
            for (var e in q) {
                var f = q[e].name;
                d.groupVillages;
                "" === d.groupVillages ? (b.html(B),
                t[0].dataset.name = B,
                t[0].dataset.value = "") : d.groupVillages == e && (b.html(f),
                t[0].dataset.name = f,
                t[0].dataset.value = e),
                J(c, {
                    name: f,
                    value: e,
                    icon: q[e].icon
                }),
                t.append(c)
            }
            d.groupVillages || b.html(B)
        }, I = function(a, b) {
            var c = document.createElement("span");
            c.dataset.name = B,
            c.dataset.value = b || "",
            a.append(c)
        }, J = function(a, b) {
            var c = document.createElement("span");
            for (var d in b)
                c.dataset[d] = b[d];
            a.append(c)
        }, K = function(a) {
            r.find("[data-setting]").forEach(function(b) {
                var c = b.dataset.setting;
                a(b, c)
            })
        }, L = function() {
            var c = {};
            return K(function(b, d) {
                switch (a.settingsMap[d].inputType) {
                case "text":
                    c[d] = "number" === b.type ? parseInt(b.value, 10) : b.value;
                    break;
                case "select":
                    c[d] = b.dataset.value;
                    break;
                case "checkbox":
                    c[d] = b.checked
                }
            }),
            !!a.updateSettings(c) && (j.emitNotif("success", b("builder", "settings.saved")),
            !0)
        }, M = function() {
            var b = a.getSettings();
            K(function(c, d) {
                switch (a.settingsMap[d].inputType) {
                case "text":
                    c.value = b[d];
                    break;
                case "select":
                    c.dataset.value = b[d];
                    break;
                case "checkbox":
                    b[d] && (c.checked = !0,
                    c.parentElement.classList.add("icon-26x26-checkbox-checked"))
                }
            }),
            n(function() {
                N(),
                O(),
                R()
            }, ["initial_village"])
        }, N = function(c) {
            var d = {}
              , f = a.getSettings()
              , g = f.buildingOrder[c || f.buildingPreset]
              , h = e.getGameData().getBuildings();
            for (var i in l)
                d[l[i]] = 0;
            s.html(""),
            g.forEach(function(a) {
                var c = ++d[a]
                  , e = document.createElement("tr")
                  , f = h[a].individual_level_costs[c];
                e.innerHTML = k.render('<td><span class="building-icon icon-20x20-building-<#= building #>"></span></td><td><#= locale("common", building) #></td><td><#= level #></td><td><#= duration #></td><td class="green">+<#= levelPoints #></td><td><span class="icon-26x26-resource-wood force-26to20"></span> <#= wood #> <span class="icon-26x26-resource-clay force-26to20"></span> <#= clay #> <span class="icon-26x26-resource-iron force-26to20"></span> <#= iron #> </td>', {
                    locale: b,
                    building: a,
                    level: c,
                    duration: m.readableSeconds(f.build_time),
                    wood: f.wood,
                    clay: f.clay,
                    iron: f.iron,
                    levelPoints: C[a][c - 1]
                }),
                e.dataset.building = a,
                e.dataset.level = c,
                s.append(e)
            }),
            o.recalcScrollbar()
        }, O = function(c) {
            var d = {}
              , e = a.getSettings()
              , f = e.buildingOrder[c || e.buildingPreset];
            $buildingOrderFinal.html(""),
            f.forEach(function(a) {
                d[a] = d[a] || 0,
                ++d[a]
            }),
            D.forEach(function(a) {
                if (a in d) {
                    var c = document.createElement("tr")
                      , e = d[a];
                    c.innerHTML = k.render('<td><span class="building-icon icon-20x20-building-<#= building #>"></span></td><td><#= locale("common", building) #></td><td><#= level #></td>', {
                        locale: b,
                        building: a,
                        level: e
                    }),
                    c.dataset.building = a,
                    c.dataset.level = e,
                    $buildingOrderFinal.append(c)
                }
            }),
            o.recalcScrollbar()
        }, P = function(a, b) {
            return e.getSelectedVillage().getBuildingData().getBuildingLevel(a) >= b
        }, Q = function(a, b) {
            var c = e.getSelectedVillage().getBuildingQueue().getQueue()
              , d = !1;
            return c.some(function(c) {
                if (c.building === a && c.level === b)
                    return d = !0
            }),
            d
        }, R = function() {
            s.find("tr").forEach(function(a) {
                var b = a.dataset.building
                  , c = parseInt(a.dataset.level, 10)
                  , d = "";
                P(b, c) ? d = "reached" : Q(b, c) && (d = "progress"),
                a.className = d
            }),
            $buildingOrderFinal.find("tr").forEach(function(a) {
                var b = P(a.dataset.building, a.dataset.level);
                a.className = b ? "reached" : ""
            })
        }, S = function(a, b) {
            var c = b.village_id || b.id;
            o.isVisible() && e.getSelectedVillage().getId() === c && R()
        }, T = function(a, c, d, e) {
            z.hide();
            var f = document.createElement("tr");
            f.innerHTML = k.render('<td class="village"><#= village #></td><td><span class="building-icon icon-20x20-building-<#= building #>"></span> <#= locale("common", building) #></td><td><#= level #></td><td><#= started #></td>', {
                locale: b,
                village: j.genVillageLabel(a),
                building: c,
                level: d,
                started: j.formatDate(e)
            }),
            f.querySelector(".village").addEventListener("click", function() {
                i.openVillageInfo(a.id)
            }),
            y.prepend(f),
            o.recalcScrollbar()
        }, U = function() {
            y.find("tr:not(.noBuilds)").remove(),
            z.css("display", "")
        }, V = function() {
            a.getBuildLog().forEach(function(a) {
                T.apply(this, a)
            })
        }, W = function(a, b, c) {
            return c ? parseInt(Math.round(a * Math.pow(b, c - 1)), 10) : 0
        }, X = function() {
            var a = e.getGameData()
              , b = {};
            for (var c in a.data.buildings) {
                var d, f, g = a.getBuildingDataForBuilding(c), h = g.points;
                b[c] = [];
                for (var i = 1; i <= g.max_level; i++)
                    f = W(g.points, g.points_factor, i),
                    d = f - h,
                    h += d,
                    b[c].push(d)
            }
            return b
        };
        a.interface = function() {
            a.interface = E()
        }
    }),
    define("two/autoCollector", ["two/eventQueue", "helper/time", "Lockr"], function(a, b, d) {
        var i = !1
          , j = !1
          , k = !0
          , l = 0
          , m = function(a) {
            f.emit(g.RESOURCE_DEPOSIT_START_JOB, {
                job_id: a.id
            })
        }
          , n = function(a) {
            f.emit(g.RESOURCE_DEPOSIT_COLLECT, {
                job_id: a.id,
                village_id: e.getSelectedVillage().getId()
            })
        }
          , o = function() {
            f.emit(g.RESOURCE_DEPOSIT_GET_INFO, {})
        }
          , p = function() {
            if (!j)
                return !1;
            var a = e.getSelectedCharacter().getResourceDeposit();
            if (!a)
                return !1;
            if (a.getCurrentJob())
                return !1;
            var b = a.getCollectibleJobs();
            if (b)
                return n(b.shift());
            var c = a.getReadyJobs();
            return c ? m(q(c)) : void 0
        }
          , q = function(a) {
            return a.sort(function(a, b) {
                return a.duration - b.duration
            })[0]
        }
          , r = function(a) {
            var b = 1e3 * a.time_next_reset - Date.now() + 1e3;
            clearTimeout(l),
            l = setTimeout(o, b)
        }
          , s = {};
        return s.init = function() {
            i = !0,
            c.$on(h.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, function() {
                if (!k || !j)
                    return !1;
                k = !1,
                setTimeout(function() {
                    k = !0,
                    p()
                }, 1500)
            }),
            c.$on(h.RESOURCE_DEPOSIT_JOBS_REROLLED, p),
            c.$on(h.RESOURCE_DEPOSIT_JOB_COLLECTED, p),
            c.$on(h.RESOURCE_DEPOSIT_INFO, function(a, b) {
                p(),
                r(b)
            })
        }
        ,
        s.start = function() {
            a.trigger("Collector/started"),
            j = !0,
            p()
        }
        ,
        s.stop = function() {
            a.trigger("Collector/stopped"),
            j = !1
        }
        ,
        s.isRunning = function() {
            return j
        }
        ,
        s.isInitialized = function() {
            return i
        }
        ,
        s
    }),
    define("two/autoCollector/secondVillage", ["two/autoCollector", "two/eventQueue", "helper/time", "models/SecondVillageModel"], function(a, b, d, i) {
        var j = !1
          , k = !1
          , l = injector.get("secondVillageService")
          , m = function(a) {
            var b = Date.now();
            for (var c in a)
                if (a[c].time_started && a[c].time_completed && b < d.server2ClientTime(a[c].time_completed))
                    return a[c];
            return !1
        }
          , n = function(a) {
            var b = Date.now();
            for (var c in a)
                if (a[c].time_started && a[c].time_completed && b >= d.server2ClientTime(a[c].time_completed) && !a[c].collected)
                    return c;
            return !1
        }
          , o = function(a) {
            f.emit(g.SECOND_VILLAGE_COLLECT_JOB_REWARD, {
                village_id: e.getSelectedVillage().getId(),
                job_id: a
            })
        }
          , p = function(a, b) {
            f.emit(g.SECOND_VILLAGE_START_JOB, {
                village_id: e.getSelectedVillage().getId(),
                job_id: a
            }, b)
        }
          , q = function(a) {
            for (var b in a)
                return b;
            return !1
        }
          , r = function(a) {
            f.emit(g.SECOND_VILLAGE_GET_INFO, {}, function(b) {
                var c = new i(b);
                e.getSelectedCharacter().setSecondVillage(c),
                a()
            })
        }
          , s = function() {
            r(t)
        }
          , t = function() {
            var a = e.getSelectedCharacter().getSecondVillage();
            if (!k || !a || !a.isAvailable())
                return !1;
            var b = m(a.data.jobs);
            if (b) {
                var c = d.server2ClientTime(b.time_completed)
                  , f = c - Date.now() + 1e3;
                return setTimeout(s, f),
                !1
            }
            var g = n(a.data.jobs);
            if (g)
                return o(g);
            var h = l.getCurrentDayJobs(a.data.jobs, a.data.day)
              , i = l.getCollectedJobs(a.data.jobs)
              , j = e.getSelectedVillage().getResources().getResources()
              , r = l.getAvailableJobs(h, i, j, []);
            if (r) {
                var t = q(r);
                p(t, function() {
                    var a = r[t];
                    setTimeout(s, 1e3 * a.duration + 1e3)
                })
            }
        }
          , u = {};
        u.init = function() {
            if (!l.isFeatureActive())
                return !1;
            j = !0,
            c.$on(h.SECOND_VILLAGE_VILLAGE_CREATED, s),
            c.$on(h.SECOND_VILLAGE_JOB_COLLECTED, s),
            c.$on(h.SECOND_VILLAGE_VILLAGE_CREATED, s)
        }
        ,
        u.start = function() {
            if (!j)
                return !1;
            b.trigger("Collector/secondVillage/started"),
            k = !0,
            s()
        }
        ,
        u.stop = function() {
            if (!j)
                return !1;
            b.trigger("Collector/secondVillage/stopped"),
            k = !1
        }
        ,
        u.isRunning = function() {
            return k
        }
        ,
        u.isInitialized = function() {
            return j
        }
        ,
        a.secondVillage = u
    }),
    require(["two/ready", "two/autoCollector", "Lockr", "two/eventQueue", "two/autoCollector/secondVillage", "two/autoCollector/ui"], function(a, b, c, d) {
        if (b.isInitialized())
            return !1;
        a(function() {
            b.init(),
            b.secondVillage.init(),
            b.interface(),
            a(function() {
                c.get("collector-active", !1, !0) && (b.start(),
                b.secondVillage.start()),
                d.bind("Collector/started", function() {
                    c.set("collector-active", !0)
                }),
                d.bind("Collector/stopped", function() {
                    c.set("collector-active", !1)
                })
            }, ["initial_village"])
        })
    }),
    define("two/autoCollector/ui", ["two/autoCollector", "two/FrontButton", "two/locale", "two/utils", "two/eventQueue"], function(a, b, c, d, e) {
        function f() {
            return c.create("collector", {
                en: {
                    title: "AutoCollector",
                    description: "Automatic Resource Deposit/Second Village collector.",
                    activated: "Automatic Collector activated",
                    deactivated: "Automatic Collector deactivated"
                },
                pl: {
                    title: "Kolekcjoner",
                    description: "Automatyczny kolekcjoner depozytu/drugiej wioski.",
                    activated: "Kolekcjoner aktywowany",
                    deactivated: "Kolekcjoner deaktywowany"
                },
                pt: {
                    title: "AutoCollector",
                    description: "Coletor automático para Depósito de Recursos/Segunda Aldeia.",
                    activated: "Coletor Automático ativado",
                    deactivated: "Coletor Automático desativado"
                }
            }, "en"),
            g = new b("Collector",{
                classHover: !1,
                classBlur: !1,
                tooltip: c("collector", "description")
            }),
            g.click(function() {
                a.isRunning() ? (a.stop(),
                a.secondVillage.stop(),
                d.emitNotif("success", c("collector", "deactivated"))) : (a.start(),
                a.secondVillage.start(),
                d.emitNotif("success", c("collector", "activated")))
            }),
            e.bind("Collector/started", function() {
                g.$elem.removeClass("btn-green").addClass("btn-red")
            }),
            e.bind("Collector/stopped", function() {
                g.$elem.removeClass("btn-red").addClass("btn-green")
            }),
            a.isRunning() && e.trigger("Collector/started"),
            g
        }
        var g;
        a.interface = function() {
            a.interface = f()
        }
    }),
    define("two/queue", ["two/locale", "two/utils", "two/eventQueue", "helper/time", "helper/math", "struct/MapData", "conf/conf", "Lockr"], function(b, c, d, h, i, j, k, m) {
        var n, o, p = {
            NOT_OWN_VILLAGE: "notOwnVillage",
            NOT_ENOUGH_UNITS: "notEnoughUnits",
            TIME_LIMIT: "timeLimit",
            COMMAND_REMOVED: "commandRemoved",
            COMMAND_SENT: "commandSent"
        }, q = {
            INVALID_ORIGIN: "invalidOrigin",
            INVALID_TARGET: "invalidTarget"
        }, r = [], s = {}, t = [], u = [], v = !1, w = {
            selectedVillage: function(a) {
                return a.origin.id === e.getSelectedVillage().getId()
            },
            barbarianTarget: function(a) {
                return !a.target.character_id
            },
            allowedTypes: function(a, b) {
                return b.allowedTypes[a.type]
            },
            attack: function(a) {
                return "attack" !== a.type
            },
            support: function(a) {
                return "support" !== a.type
            },
            relocate: function(a) {
                return "relocate" !== a.type
            },
            textMatch: function(a, b) {
                var c = !0
                  , d = b.textMatch.toLowerCase().split(/\W/)
                  , e = [a.origin.name, a.originCoords, a.originCoords, a.origin.character_name || "", a.target.name, a.targetCoords, a.target.character_name || "", a.target.tribe_name || "", a.target.tribe_tag || ""];
                return e = e.join("").toLowerCase(),
                d.some(function(a) {
                    if (a.length && !e.includes(a))
                        return c = !1,
                        !0
                }),
                c
            }
        }, x = function(a) {
            return a < h.gameTime() + o
        }, y = function(a) {
            var b = {};
            for (var c in a) {
                var d = a[c];
                "*" !== d && 0 === d || (b[c] = d)
            }
            return b
        }, z = function() {
            r = r.sort(function(a, b) {
                return a.sendTime - b.sendTime
            })
        }, A = function(a) {
            r.push(a)
        }, B = function(a) {
            s[a.id] = a
        }, C = function(a) {
            t.push(a)
        }, D = function(a) {
            u.push(a)
        }, E = function() {
            m.set("queue-commands", r)
        }, F = function() {
            m.set("queue-sent", t)
        }, G = function() {
            m.set("queue-expired", u)
        }, H = function() {
            var a = m.get("queue-commands", [], !0);
            if (a.length)
                for (var b = 0; b < a.length; b++) {
                    var c = a[b];
                    h.gameTime() > c.sendTime ? K.expireCommand(c, p.TIME_LIMIT) : (A(c),
                    B(c))
                }
        }, I = function(a) {
            var b = e.getVillages()
              , c = b[a.origin.id];
            if (!c)
                return p.NOT_OWN_VILLAGE;
            var d = c.unitInfo.units
              , f = {};
            for (var g in a.units) {
                var h = a.units[g];
                if ("*" === h) {
                    if (0 === (h = d[g].available))
                        continue
                } else if (h < 0) {
                    if ((h = d[g].available - Math.abs(h)) < 0)
                        return p.NOT_ENOUGH_UNITS
                } else if (h > 0 && h > d[g].available)
                    return p.NOT_ENOUGH_UNITS;
                f[g] = h
            }
            return angular.equals({}, f) ? p.NOT_ENOUGH_UNITS : f
        }, J = function() {
            setInterval(function() {
                r.length && r.some(function(a) {
                    if (!x(a.sendTime))
                        return !0;
                    v ? K.sendCommand(a) : K.expireCommand(a, p.TIME_LIMIT)
                })
            }, 100)
        }, K = {};
        return K.initialized = !1,
        K.version = "1.2.0",
        K.init = function() {
            b.create("queue", {
                en: {
                    title: "CommandQueue",
                    attack: "Attack",
                    support: "Support",
                    relocate: "Transfer",
                    sent: "sent",
                    activated: "enabled",
                    deactivated: "disabled",
                    expired: "expired",
                    removed: "removed",
                    added: "added",
                    "general.clear": "Clear logs",
                    "general.nextCommand": "Next command",
                    "add.basics": "Basic information",
                    "add.origin": "Origin",
                    "add.addSelected": "Active village",
                    "add.target": "Target",
                    "add.addMapSelected": "Selected village on a map",
                    "add.arrive": "Command arrive at date",
                    "add.out": "Command leave at date",
                    "add.currentDate": "Current date",
                    "add.currentDatePlus": "Increase date in 100 milliseconds.",
                    "add.currentDateMinus": "Reduce date in 100 milliseconds.",
                    "add.travelTimes": "Unit travel time",
                    "add.date": "Date/time",
                    "add.no-village": "select a village...",
                    "add.village-search": "Village search...",
                    "add.clear": "Clear fields",
                    "add.insert-preset": "Insert preset",
                    "queue.waiting": "Waiting commands",
                    "queue.noneAdded": "No command added.",
                    "queue.sent": "Commands sent",
                    "queue.noneSent": "No command sent.",
                    "queue.expired": "Expired commands",
                    "queue.noneExpired": "No command expired.",
                    "queue.remove": "Remove command form list",
                    "queue.filters": "Filter commands",
                    "filters.selectedVillage": "Show only commands from the selected village",
                    "filters.barbarianTarget": "Show only commands with barbarian villages as target",
                    "filters.attack": "Show attacks",
                    "filters.support": "Show supports",
                    "filters.relocate": "Show transfers",
                    "filters.textMatch": "Filter by text...",
                    "command.out": "Out",
                    "command.timeLeft": "Time remaining",
                    "command.arrive": "Arrival",
                    "error.noUnitsEnough": "No units enough to send the command!",
                    "error.notOwnVillage": "The origin village is not owned by you!",
                    "error.origin": "Invalid origin village!",
                    "error.target": "Invalid target village!",
                    "error.noUnits": "No units specified!",
                    "error.invalidDate": "Invalid date",
                    "error.alreadySent": "This %{type} should have left %{date}",
                    "error.noMapSelectedVillage": "No selected village on map.",
                    "error.removeError": "Error removing command."
                },
                pl: {
                    title: "Generał",
                    attack: "Atak",
                    support: "Wsparcie",
                    relocate: "przenieś",
                    sent: "wysłany/e",
                    activated: "włączony",
                    deactivated: "wyłączony",
                    expired: "przedawniony/e",
                    removed: "usunięty/e",
                    added: "dodany/e",
                    "general.clear": "Wyczyść logi",
                    "general.nextCommand": "Następny rozkaz",
                    "add.basics": "Podstawowe informacje",
                    "add.origin": "Źródło",
                    "add.addSelected": "Aktywna wioska",
                    "add.target": "Cel",
                    "add.addMapSelected": "Wybrana wioska na mapie",
                    "add.arrive": "Czas dotarcia na cel",
                    "add.out": "Czas wyjścia z  twojej wioski",
                    "add.currentDate": "Obecny czas",
                    "add.currentDatePlus": "Zwiększ czas o 100 milisekund.",
                    "add.currentDateMinus": "Zmniejsz czas o 100 milisekund.",
                    "add.travelTimes": "Czas podróży jendostek",
                    "add.date": "Czas/Data",
                    "add.no-village": "Wybierz wioskę...",
                    "add.village-search": "Znajdź wioskę...",
                    "add.clear": "wyczyść",
                    "add.insert-preset": "Insert preset",
                    "queue.waiting": "Rozkazy",
                    "queue.noneAdded": "Brak dodanych rozkazów.",
                    "queue.sent": "Rozkazy wysłane",
                    "queue.noneSent": "Brak wysłanych rozkazów.",
                    "queue.expired": "Przedawnione rozkazy",
                    "queue.noneExpired": "Brak przedawnionych rozkazów.",
                    "queue.remove": "Usuń rozkaz z listy",
                    "queue.filters": "Filtruj rozkazy",
                    "filters.selectedVillage": "Pokaż tylko rozkazy z aktywnej wioski",
                    "filters.barbarianTarget": "Pokaż tylko rozkazy na wioski barbarzyńskie",
                    "filters.attack": "Pokaż ataki",
                    "filters.support": "Pokaż wsparcia",
                    "filters.relocate": "Pokaż przeniesienia",
                    "filters.textMatch": "Filtruj za pomocą tekstu...",
                    "command.out": "Czas wyjścia",
                    "command.timeLeft": "Pozostały czas",
                    "command.arrive": "Czas dotarcia",
                    "error.noUnitsEnough": "Brak wystarczającej liczby jednostek do wysłania rozkazu!",
                    "error.notOwnVillage": "Wioska źródłowa nie należy do ciebie!",
                    "error.origin": "Nieprawidłowa wioska źródłowa!",
                    "error.target": "Nieprawidłowa wioska cel!",
                    "error.noUnits": "Nie wybrano jednostek!",
                    "error.invalidDate": "Nieprawidłowy Czas",
                    "error.alreadySent": "Ten rozkaz %{type} powinien zostać wysłany %{date}",
                    "error.noMapSelectedVillage": "Nie zaznaczono wioski na mapie.",
                    "error.removeError": "Błąd usuwania rozkazu."
                },
                pt: {
                    title: "CommandQueue",
                    attack: "Ataque",
                    support: "Apoio",
                    relocate: "Transferência",
                    sent: "enviado",
                    activated: "ativado",
                    deactivated: "desativado",
                    expired: "expirado",
                    removed: "removido",
                    added: "adicionado",
                    "general.clear": "Limpar registros",
                    "general.nextCommand": "Próximo comando",
                    "add.basics": "Informações básicas",
                    "add.origin": "Coordenadas da origem",
                    "add.addSelected": "Aldeia ativa",
                    "add.target": "Coordenadas do alvo",
                    "add.addMapSelected": "Aldeia selecionada no mapa",
                    "add.arrive": "Data de chegada",
                    "add.out": "Data de saída",
                    "add.currentDate": "Data/hora",
                    "add.currentDatePlus": "Aumentar data em 100 milisegunds.",
                    "add.currentDateMinus": "Reduzir data em 100 milisegunds.",
                    "add.travelTimes": "Tempos de viagem",
                    "add.date": "Data",
                    "add.no-village": "selecione uma aldeia...",
                    "add.village-search": "Procurar aldeia...",
                    "add.clear": "Limpar campos",
                    "add.insert-preset": "Inserir predefinição",
                    "queue.waiting": "Comandos em espera",
                    "queue.noneAdded": "Nenhum comando adicionado.",
                    "queue.sent": "Comandos enviados",
                    "queue.noneSent": "Nenhum comando enviado.",
                    "queue.expired": "Comandos expirados",
                    "queue.noneExpired": "Nenhum comando expirado.",
                    "queue.remove": "Remover comando da lista",
                    "queue.filters": "Filtro de comandos",
                    "filters.selectedVillage": "Mostrar apenas comandos com origem da aldeia selecionada",
                    "filters.barbarianTarget": "Mostrar apenas comandos com aldeias bárbaras como alvo",
                    "filters.attack": "Mostrar ataques",
                    "filters.support": "Mostrar apoios",
                    "filters.relocate": "Mostrar transferências",
                    "filters.textMatch": "Filtrar por texto...",
                    "command.out": "Saída na data",
                    "command.timeLeft": "Tempo restante",
                    "command.arrive": "Chegada na data",
                    "error.noUnitsEnough": "Sem unidades o sulficientes para enviar o comando!",
                    "error.notOwnVillage": "A aldeia de origem não pertence a você!",
                    "error.origin": "Aldeia de origem inválida!",
                    "error.target": "Aldeia alvo inválida!",
                    "error.noUnits": "Nenhuma unidade especificada!",
                    "error.invalidDate": "Data inválida",
                    "error.alreadySent": "Esse %{type} deveria ter saído %{date}",
                    "error.noMapSelectedVillage": "Nenhuma aldeia selecionada no mapa.",
                    "error.removeError": "Erro ao remover comando."
                }
            }, "en"),
            o = c.getTimeOffset(),
            n = e.getSelectedCharacter(),
            K.initialized = !0,
            t = m.get("queue-sent", [], !0),
            u = m.get("queue-expired", [], !0),
            H(),
            J(),
            a.addEventListener("beforeunload", function(a) {
                v && r.length && (a.returnValue = !0)
            })
        }
        ,
        K.sendCommand = function(a) {
            var b = I(a);
            if ("string" == typeof b)
                return K.expireCommand(a, b);
            a.units = b,
            f.emit(g.SEND_CUSTOM_ARMY, {
                start_village: a.origin.id,
                target_village: a.target.id,
                type: a.type,
                units: a.units,
                icon: 0,
                officers: a.officers,
                catapult_target: a.catapultTarget
            }),
            C(a),
            F(),
            K.removeCommand(a, p.COMMAND_SENT),
            d.trigger("Queue/command/send", [a])
        }
        ,
        K.expireCommand = function(a, b) {
            D(a),
            G(),
            K.removeCommand(a, b)
        }
        ,
        K.addCommand = function(a) {
            if (!a.origin)
                return d.trigger("Queue/command/add/invalidOrigin", [a]);
            if (!a.target)
                return d.trigger("Queue/command/add/invalidTarget", [a]);
            if (!c.isValidDateTime(a.date))
                return d.trigger("Queue/command/add/invalidDate", [a]);
            if (!a.units || angular.equals(a.units, {}))
                return d.trigger("Queue/command/add/noUnits", [a]);
            a.originCoords = a.origin.x + "|" + a.origin.y,
            a.targetCoords = a.target.y + "|" + a.target.y;
            var b = new Promise(function(b, c) {
                K.getVillageByCoords(a.origin.x, a.origin.y, function(a) {
                    a ? b(a) : c(q.INVALID_ORIGIN)
                })
            }
            )
              , e = new Promise(function(b, c) {
                K.getVillageByCoords(a.target.x, a.target.y, function(a) {
                    a ? b(a) : c(q.INVALID_TARGET)
                })
            }
            )
              , f = Promise.all([b, e]);
            f.then(function(b) {
                a.origin = b[0],
                a.target = b[1],
                a.units = y(a.units),
                a.date = c.fixDate(a.date),
                a.travelTime = K.getTravelTime(a.origin, a.target, a.units, a.type, a.officers);
                var e = c.getTimeFromString(a.date);
                if ("arrive" === a.dateType ? (a.sendTime = e - a.travelTime,
                a.arriveTime = e) : (a.sendTime = e,
                a.arriveTime = e + a.travelTime),
                x(a.sendTime))
                    return d.trigger("Queue/command/add/alreadySent", [a]);
                "attack" === a.type && "supporter"in a.officers && delete a.officers.supporter;
                for (var f in a.officers)
                    a.officers[f] = 1;
                "attack" === a.type && a.units.catapult ? a.catapultTarget = a.catapultTarget || "headquarter" : a.catapultTarget = null,
                a.id = c.guid(),
                A(a),
                B(a),
                z(),
                E(),
                d.trigger("Queue/command/add", [a])
            }),
            f.catch(function(b) {
                switch (b) {
                case q.INVALID_ORIGIN:
                    d.trigger("Queue/command/add/invalidOrigin", [a]);
                    break;
                case q.INVALID_TARGET:
                    d.trigger("Queue/command/add/invalidTarget", [a])
                }
            })
        }
        ,
        K.removeCommand = function(a, b) {
            var c = !1;
            delete s[a.id];
            for (var e = 0; e < r.length; e++)
                if (r[e].id == a.id) {
                    r.splice(e, 1),
                    E(),
                    c = !0;
                    break
                }
            if (c) {
                switch (b) {
                case p.TIME_LIMIT:
                    d.trigger("Queue/command/send/timeLimit", [a]);
                    break;
                case p.NOT_OWN_VILLAGE:
                    d.trigger("Queue/command/send/notOwnVillage", [a]);
                    break;
                case p.NOT_ENOUGH_UNITS:
                    d.trigger("Queue/command/send/noUnitsEnough", [a]);
                    break;
                case p.COMMAND_REMOVED:
                    d.trigger("Queue/command/remove", [a])
                }
                return !0
            }
            return d.trigger("Queue/command/remove/error", [a]),
            !1
        }
        ,
        K.clearRegisters = function() {
            m.set("queue-expired", []),
            m.set("queue-sent", []),
            u = [],
            t = []
        }
        ,
        K.start = function(a) {
            v = !0,
            d.trigger("Queue/start", [a])
        }
        ,
        K.stop = function() {
            v = !1,
            d.trigger("Queue/stop")
        }
        ,
        K.isRunning = function() {
            return v
        }
        ,
        K.getWaitingCommands = function() {
            return r
        }
        ,
        K.getWaitingCommandsObject = function() {
            return s
        }
        ,
        K.getSentCommands = function() {
            return t
        }
        ,
        K.getExpiredCommands = function() {
            return u
        }
        ,
        K.getTravelTime = function(a, b, c, d, e) {
            var f = !1
              , g = null === b.character_id
              , h = b.character_id && b.tribe_id && b.tribe_id === n.getTribeId();
            "attack" === d ? ("supporter"in e && delete e.supporter,
            g && (f = !0)) : "support" === d && (h && (f = !0),
            "supporter"in e && (f = !0));
            var j = {
                units: c,
                officers: angular.copy(e)
            }
              , k = l.calculateTravelTime(j, {
                barbarian: g,
                ownTribe: h,
                officers: e,
                effects: f
            }, d)
              , m = i.actualDistance(a, b);
            return 1e3 * l.getTravelTimeForDistance(j, k, m, d)
        }
        ,
        K.getVillageByCoords = function(a, b, c) {
            j.loadTownDataAsync(a, b, 1, 1, c)
        }
        ,
        K.filterCommands = function(a, b, c) {
            var d = w[a];
            return (c || r).filter(function(a) {
                return d(a, b)
            })
        }
        ,
        K
    }),
    define("two/queue/analytics", ["two/queue", "two/eventQueue"], function(a, b) {
        a.analytics = function() {
            ga("create", "UA-92130203-5", "auto", "CommandQueue");
            var a = e.getPlayer()
              , c = a.getSelectedCharacter()
              , d = [];
            d.push(c.getName()),
            d.push(c.getId()),
            d.push(c.getWorldId()),
            b.bind("Queue/send", function(a) {
                ga("CommandQueue.send", "event", "commands", a.type, d.join("~"))
            }),
            b.bind("Queue/expired", function() {
                ga("CommandQueue.send", "event", "commands", "expired", d.join("~"))
            })
        }
    }),
    require(["two/ready", "two/queue", "two/queue/ui", "two/queue/analytics"], function(a, b) {
        if (b.initialized)
            return !1;
        a(function() {
            b.init(),
            b.interface(),
            b.analytics(),
            b.getWaitingCommands().length > 0 && b.start(!0)
        })
    }),
    define("two/queue/ui", ["two/queue", "two/locale", "two/ui", "two/ui/buttonLink", "two/ui/autoComplete", "two/FrontButton", "two/utils", "two/eventQueue", "helper/time", "ejs"], function(a, b, d, i, j, k, l, m, n, p) {
        function q() {
            M = l.getTimeOffset(),
            L = Object.keys(S.getBuildings()),
            J = e.getSelectedCharacter();
            var c = {
                version: a.version,
                locale: b,
                units: Ha(),
                officers: X,
                buildings: L
            };
            return r = new d("CommandQueue",{
                activeTab: "add",
                template: '<div class="win-content message-list-wrapper searchable-list ng-scope"><header class="win-head"><h2><#= locale("queue", "title") #> <span class="small">v<#= version #></span></h2><ul class="list-btn"><li><a href="#" class="twOverflow-close size-34x34 btn-red icon-26x26-close"></a></li></ul></header><div class="tabs tabs-bg"><div class="tabs-three-col"><div class="tab" tab="add"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "add") #></a></div></div></div><div class="tab" tab="queue"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "waiting") #></a></div></div></div><div class="tab" tab="log"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "logs") #></a></div></div></div></div></div><div class="win-main"><div class="box-paper footer has-footer-upper rich-text twOverflow-content-add"><form class="addForm"><div><table class="tbl-border-light tbl-striped"><colgroup><col width="30%"><col width="5%"><col><col width="18%"></colgroup><tbody><tr><td><input data-setting="origin" type="text" class="textfield-border origin" pattern="\\d{2,3}\\|\\d{2,3}" placeholder="<#= locale("queue", "add.village-search") #>" required></td><td class="text-center"><span class="icon-26x26-rte-village"></span></td><td class="originVillage"><#= locale("queue", "add.no-village") #></td><td class="actions"><a class="btn btn-orange addSelected" tooltip="<#= locale("queue", "add.addSelected") #>"><#= locale("common", "selected") #></a></td></tr><tr><td><input data-setting="target" type="text" class="textfield-border target" pattern="\\d{2,3}\\|\\d{2,3}" placeholder="<#= locale("queue", "add.village-search") #>" required></td><td class="text-center"><span class="icon-26x26-rte-village"></span></td><td class="targetVillage"><#= locale("queue", "add.no-village") #></td><td class="actions"><a class="btn btn-orange addMapSelected" tooltip="<#= locale("queue", "add.addMapSelected") #>"><#= locale("common", "selected") #></a></td></tr><tr><td><input data-setting="date" type="text" class="textfield-border date" pattern="\\s*\\d{1,2}:\\d{1,2}:\\d{1,2}(:\\d{1,3})? \\d{1,2}\\/\\d{1,2}\\/\\d{4}\\s*" placeholder="<#= locale("queue", "add.date") #>" tooltip="00:00:00:000 00/00/0000" required></td><td class="text-center"><span class="icon-26x26-time"></span></td><td><span class="ff-cell-fix"><select data-setting="dateType" class="dateType"><option value="arrive" selected="selected"><#= locale("queue", "add.arrive") #></option><option value="out"><#= locale("queue", "add.out") #></option></select></span></td><td class="actions"><a class="btn btn-orange currentDateMinus" tooltip="<#= locale("queue", "add.currentDateMinus") #>">-</a><a class="btn btn-orange addCurrentDate" tooltip="<#= locale("queue", "add.currentDate") #>"><#= locale("common", "now") #></a><a class="btn btn-orange currentDatePlus" tooltip="<#= locale("queue", "add.currentDatePlus") #>">+</a></td></tr></tbody></table><table class="tbl-border-light tbl-units tbl-speed screen-village-info travelTimes" style="display:none"><thead><tr><th colspan="7"><#= locale("queue", "add.travelTimes") #></th></tr></thead><tbody><tr><td class="odd"><div class="unit-wrap"><span class="icon icon-34x34-unit-knight"></span> <span class="icon icon-34x34-unit-light_cavalry"></span> <span class="icon icon-34x34-unit-mounted_archer"></span></div><div class="travelTime box-time-sub-icon"><div class="time-icon icon-20x20-attack"></div><span class="attack" data-unit="knight"></span></div><div class="travelTime box-time-sub-icon"><div class="time-icon icon-20x20-support"></div><span class="support" data-unit="knight"></span></div></td><td><div class="unit-wrap"><span class="icon icon-single icon-34x34-unit-heavy_cavalry"></span></div><div class="travelTime"><span class="attack" data-unit="heavy_cavalry"></span></div><div class="travelTime"><span class="support" data-unit="heavy_cavalry"></span></div></td><td class="odd"><div class="unit-wrap"><span class="icon icon-34x34-unit-archer"></span> <span class="icon icon-34x34-unit-spear"></span> <span class="icon icon-34x34-unit-axe"></span> <span class="icon icon-34x34-unit-doppelsoldner"></span></div><div class="travelTime"><span class="attack" data-unit="axe"></span></div><div class="travelTime"><span class="support" data-unit="axe"></span></div></td><td><div class="unit-wrap"><span class="icon icon-single icon-34x34-unit-sword"></span></div><div class="travelTime"><span class="attack" data-unit="sword"></span></div><div class="travelTime"><span class="support" data-unit="sword"></span></div></td><td class="odd"><div class="unit-wrap"><span class="icon icon-34x34-unit-catapult"></span> <span class="icon icon-34x34-unit-ram"></span></div><div class="travelTime"><span class="attack" data-unit="ram"></span></div><div class="travelTime"><span class="support" data-unit="ram"></span></div></td><td><div class="unit-wrap"><span class="icon icon-single icon-34x34-unit-snob"></span></div><div class="travelTime"><span class="attack" data-unit="snob"></span></div><div class="travelTime"><span class="support" data-unit="snob"></span></div></td><td class="odd"><div class="unit-wrap"><span class="icon icon-single icon-34x34-unit-trebuchet"></span></div><div class="travelTime"><span class="attack" data-unit="trebuchet"></span></div><div class="travelTime"><span class="support" data-unit="trebuchet"></span></div></td></tr></tbody></table></div><h5 class="twx-section collapse"><#= locale("common", "units") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="25%"><col width="25%"><col width="25%"><col width="25%"></colgroup><tbody class="add-units"><tr><td colspan="4" class="actions"><select class="insert-preset"></select> <a class="clear-units btn btn-orange"><#= locale("queue", "add.clear") #></a></td></tr><tr> <# units.forEach(function(unit, i) { #> <# if (i !== 0 && i % 4 === 0) { #> </tr><tr> <# } #> <td class="cell-space-left"><span class="unit-icon icon-bg-black icon-34x34-unit-<#= unit #>"></span> <input class="unit <#= unit #>" type="text" data-setting="<#= unit #>" placeholder="0"></td> <# }) #> <td class="text-center catapult-target" style="display:none" colspan="3"><select data-setting="catapultTarget"> <# buildings.forEach(function(building, i) { #> <# if (building === "headquarter") { #> <option value="headquarter" selected="selected"><#= locale("common", "headquarter") #></option> <# } else { #> <option value="<#= building #>"><#= locale("common", building) #></option> <# } #> <# }) #> </select></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("common", "officers") #></h5><table class="tbl-border-light tbl-striped officers"><tbody><tr> <# officers.forEach(function(officer) { #> <td><span class="icon-34x34-premium_officer_<#= officer #>"></span> <label class="btn-orange icon-26x26-checkbox"><input type="checkbox" data-setting="<#= officer #>" class="<#= officer #>"></label></td> <# }) #> </tr></tbody></table></form></div><div class="box-paper footer has-footer-upper rich-text twOverflow-content-queue"><div class="filters"><table class="tbl-border-light"><tbody><tr><td><div data-filter="selectedVillage" class="box-border-dark icon selectedVillage" tooltip="<#= locale("queue", "filters.selectedVillage") #>"><span class="icon-34x34-village-info icon-bg-black"></span></div><div data-filter="barbarianTarget" class="box-border-dark icon barbarianTarget" tooltip="<#= locale("queue", "filters.barbarianTarget") #>"><span class="icon-34x34-barbarian-village icon-bg-black"></span></div><div data-filter="attack" class="box-border-dark icon allowedTypes active" tooltip="<#= locale("queue", "filters.attack") #>"><span class="icon-34x34-attack icon-bg-black"></span></div><div data-filter="support" class="box-border-dark icon allowedTypes active" tooltip="<#= locale("queue", "filters.support") #>"><span class="icon-34x34-support icon-bg-black"></span></div><div data-filter="relocate" class="box-border-dark icon allowedTypes active" tooltip="<#= locale("queue", "filters.relocate") #>"><span class="icon-34x34-relocate icon-bg-black"></span></div><div class="text"><input data-filter="textMatch" type="text" class="box-border-dark textMatch" placeholder="<#= locale("queue", "filters.textMatch") #>"></div></td></tr></tbody></table></div><h5 class="twx-section collapse"><#= locale("queue", "queue.waiting") #></h5><div class="queue"><p class="center nothing"><#= locale("queue", "queue.noneAdded") #></p></div></div><div class="box-paper footer has-footer-upper rich-text twOverflow-content-log"><h5 class="twx-section collapse"><#= locale("queue", "queue.sent") #></h5><div class="sent"><p class="center nothing"><#= locale("queue", "queue.noneSent") #></p></div><h5 class="twx-section collapse"><#= locale("queue", "queue.expired") #></h5><div class="expired"><p class="center nothing"><#= locale("queue", "queue.noneExpired") #></p></div></div></div><footer class="win-foot"><ul class="list-btn list-center buttons"><li class="twOverflow-button-log"><a class="btn-orange btn-border clear"><#= locale("queue", "general.clear") #></a></li><li class="twOverflow-button-add"><a class="btn-orange btn-border add" name="attack"><span class="icon-26x26-attack-small"></span> <#= locale("common", "attack") #></a></li><li class="twOverflow-button-add"><a class="btn-orange btn-border add" name="support"><span class="icon-26x26-support"></span> <#= locale("common", "support") #></a></li><li class="twOverflow-button-add"><a class="btn-orange btn-border add" name="relocate"><span class="icon-26x26-relocate"></span> <#= locale("common", "relocate") #></a></li><li class="twOverflow-button"><a class="btn-green btn-border switch"><#= locale("common", "activate") #></a></li></ul></footer></div>',
                replaces: c,
                css: '#CommandQueue input[type="text"]{width:200px}#CommandQueue input.unit{width:80px;height:34px}#CommandQueue form .padded{padding:2px 8px}#CommandQueue .custom-select{width:240px}#CommandQueue .originVillage,#CommandQueue .targetVillage{padding:0 7px}#CommandQueue .actions{text-align:center}#CommandQueue .actions a{height:26px;line-height:26px;padding:0 10px}#CommandQueue .clear-units{font-size:12px;font-weight:normal;text-decoration:none;font-style:italic}#CommandQueue .clear-units:hover{text-shadow:0 1px 1px #000;color:#c4926f}#CommandQueue .add-units td{text-align:center}#CommandQueue .add-units .unit-icon{top:-1px}#CommandQueue .add-units input{height:34px;line-height:26px;color:#000;font-size:14px;background:url(data:image/png;base64,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) top left #b89064;box-shadow:inset 0 0 0 1px #000,inset 0 0 0 2px #a2682c,inset 0 0 0 3px #000,inset -3px -3px 2px 0 #fff,inset 0 0 9px 5px rgba(99,54,0,0.5);text-align:center;width:80px}#CommandQueue .command{margin-bottom:10px}#CommandQueue .command .time-left{width:93px;display:inline-block;padding:0 0 0 3px}#CommandQueue .command .sent-time,#CommandQueue .command .arrive-time{width:160px;display:inline-block;padding:0 0 0 5px}#CommandQueue .command td{padding:3px 6px}#CommandQueue .officers td{width:111px;text-align:center}#CommandQueue .officers label{margin-left:5px}#CommandQueue .officers span{margin-left:2px}#CommandQueue .units div.unit{float:left}#CommandQueue .units div.unit span.icon{transform:scale(.7);width:25px;height:25px}#CommandQueue .units div.unit span.amount{vertical-align:-2px;margin:0 5px 0 2px}#CommandQueue .units div.officer{float:left;margin:0 2px}#CommandQueue .units div.officer span{transform:scale(.7);width:25px;height:25px}#CommandQueue .remove-command{float:right;margin-top:3px}#CommandQueue .tbl-units td{text-align:center}#CommandQueue .travelTimes{margin-top:10px;font-size:13px}#CommandQueue .travelTimes th{text-align:center}#CommandQueue .travelTimes .travelTime{display:block;color:#1c4b1c}#CommandQueue .travelTimes .travelTime.box-time-sub-icon{position:relative}#CommandQueue .travelTimes .travelTime.box-time-sub-icon .time-icon{position:absolute;top:-4px;left:7px;transform:scale(.7)}#CommandQueue .dateType{width:200px}#CommandQueue .dateType .custom-select-handler{text-align:left}#CommandQueue .filters .icon{width:38px;float:left;margin:0 6px}#CommandQueue .filters .icon.active:before{box-shadow:0 0 0 1px #000,-1px -1px 0 2px #ac9c44,0 0 0 3px #ac9c44,0 0 0 4px #000;border-radius:1px;content:"";position:absolute;width:38px;height:38px;left:-1px;top:-1px}#CommandQueue .filters .text{margin-left:262px}#CommandQueue .filters .text input{height:36px;margin-top:1px;width:100%;text-align:left;padding:0 5px}#CommandQueue .filters .text input::placeholder{color:white}#CommandQueue .filters .text input:focus::placeholder{color:transparent}#CommandQueue .filters td{padding:6px}#CommandQueue .icon-34x34-barbarian-village:before{filter:grayscale(100%);background-image:url(https://i.imgur.com/ozI4k0h.png);background-position:-220px -906px}#CommandQueue .icon-20x20-time-arrival:before{transform:scale(.8);background-image:url(https://i.imgur.com/ozI4k0h.png);background-position:-529px -454px}#CommandQueue .icon-20x20-attack:before{transform:scale(.8);background-image:url(https://i.imgur.com/ozI4k0h.png);background-position:-546px -1086px;width:26px;height:26px}#CommandQueue .icon-20x20-support:before{transform:scale(.8);background-image:url(https://i.imgur.com/ozI4k0h.png);background-position:-462px -360px;width:26px;height:26px}#CommandQueue .icon-20x20-relocate:before{transform:scale(.8);background-image:url(https://i.imgur.com/ozI4k0h.png);background-position:-1090px -130px;width:26px;height:26px}#CommandQueue .icon-26x26-attack:before{background-image:url(https://i.imgur.com/ozI4k0h.png);background-position:-546px -1086px}'
            }),
            s = new k("Commander",{
                classHover: !1,
                classBlur: !1,
                onClick: function() {
                    r.openWindow()
                }
            }),
            t = $(r.$window),
            u = t.find("a.switch"),
            v = t.find("form.addForm"),
            w = t.find("input.origin"),
            x = t.find("input.target"),
            y = t.find("input.date"),
            z = t.find(".officers input"),
            $travelTimes = t.find("table.travelTimes"),
            B = t.find(".dateType"),
            C = t.find(".filters"),
            D = t.find("td.catapult-target"),
            E = t.find("input.unit.catapult"),
            F = t.find(".originVillage"),
            G = t.find(".targetVillage"),
            H = t.find(".clear-units"),
            I = t.find(".insert-preset"),
            A = {
                queue: t.find("div.queue"),
                sent: t.find("div.sent"),
                expired: t.find("div.expired")
            },
            $travelTimes.find(".attack").forEach(function(a) {
                O.attack[a.dataset.unit] = a
            }),
            $travelTimes.find(".support").forEach(function(a) {
                O.support[a.dataset.unit] = a
            }),
            setInterval(function() {
                da() && na()
            }, 1e3),
            Ba(),
            Ca(),
            ea(),
            va(),
            f.emit(g.GET_PRESETS, {}, Ja),
            r
        }
        var r, s, t, u, v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L, M, N = {
            NOT_OWN_VILLAGE: "notOwnVillage",
            NOT_ENOUGH_UNITS: "notEnoughUnits",
            TIME_LIMIT: "timeLimit",
            COMMAND_REMOVED: "commandRemoved",
            COMMAND_SENT: "commandSent"
        }, O = {
            attack: {},
            support: {}
        }, P = null, Q = null, R = {}, S = e.getGameData(), T = {
            origin: !1,
            target: !1,
            date: !1
        }, U = {
            selectedVillage: !1,
            barbarianTarget: !1,
            allowedTypes: !0,
            attack: !0,
            support: !0,
            relocate: !0,
            textMatch: !0
        }, V = ["selectedVillage", "barbarianTarget", "allowedTypes", "textMatch"], W = {
            allowedTypes: {
                attack: !0,
                support: !0,
                relocate: !0
            },
            textMatch: ""
        }, X = S.getOrderedOfficerNames(), Y = S.getOrderedUnitNames(), Z = ["knight", "heavy_cavalry", "axe", "sword", "ram", "snob", "trebuchet"], _ = "arrive", aa = !1, ba = function() {
            $travelTimes.css("display", "none")
        }, ca = function() {
            $travelTimes.css("display", "")
        }, da = function() {
            return r.isVisible("add") && T.origin && T.target && T.date
        }, ea = function(a) {
            ha(),
            fa(),
            ga(),
            za()
        }, fa = function() {
            a.getSentCommands().forEach(function(a) {
                ua(a, "sent")
            })
        }, ga = function() {
            a.getExpiredCommands().forEach(function(a) {
                ua(a, "expired")
            })
        }, ha = function() {
            a.getWaitingCommands().forEach(function(a) {
                ua(a, "queue")
            })
        }, ia = function() {
            A.queue.find(".command").remove(),
            R = {}
        }, ja = function() {
            ia(),
            ha()
        }, ka = function(a) {
            return Y.includes(a)
        }, la = function(a) {
            return X.includes(a)
        }, ma = function(a) {
            var b = new Date(a || n.gameTime() + l.getTimeOffset())
              , c = b.getMilliseconds()
              , d = n.zerofill(c - c % 100, 3)
              , e = n.zerofill(b.getSeconds(), 2)
              , f = n.zerofill(b.getMinutes(), 2);
            return n.zerofill(b.getHours(), 2) + ":" + f + ":" + e + ":" + d + " " + n.zerofill(b.getDate(), 2) + "/" + n.zerofill(b.getMonth() + 1, 2) + "/" + b.getFullYear()
        }, na = function() {
            if (!T.origin || !T.target)
                return $travelTimes.hide();
            var b = (w.val(),
            x.val(),
            Ga());
            if (T.date)
                var c = l.fixDate(y.val())
                  , d = l.getTimeFromString(c);
            ["attack", "support"].forEach(function(c) {
                Z.forEach(function(e) {
                    var f = {};
                    f[e] = 1;
                    var g = a.getTravelTime(P, Q, f, c, b)
                      , h = o("readableMillisecondsFilter")(g);
                    if ("arrive" === _)
                        if (T.date) {
                            var i = d - g;
                            Fa(i) || (h = oa(h))
                        } else
                            h = oa(h);
                    O[c][e].innerHTML = h
                })
            }),
            ca()
        }, oa = function(a) {
            return '<span class="text-red">' + a + "</span>"
        }, pa = function(a) {
            a.css("color", "#a1251f")
        }, qa = function(a) {
            a.css("color", "")
        }, ra = function(a) {
            t.find("[data-setting]").forEach(function(b) {
                var c = b.dataset.setting;
                a(b, c)
            })
        }, sa = function(b) {
            var c = {
                units: {},
                officers: {},
                type: b,
                origin: P,
                target: Q
            };
            ra(function(a, b) {
                var d = a.value;
                if ("dateType" === b)
                    c.dateType = a.dataset.value;
                else if ("catapultTarget" === b)
                    c.catapultTarget = a.dataset.value || null;
                else {
                    if (!d)
                        return !1;
                    ka(b) ? c.units[b] = isNaN(d) ? d : parseInt(d, 10) : la(b) ? a.checked && (c.officers[b] = 1) : d && (c[b] = d)
                }
            }),
            a.addCommand(c)
        }, ta = function(a, b) {
            var c = A[b].find(".command").filter(function(b) {
                return b.dataset.id === a.id
            });
            $(c).remove(),
            xa(a.id),
            Aa(b),
            r.isVisible("queue") && r.recalcScrollbar()
        }, ua = function(c, d) {
            var e = document.createElement("div");
            e.dataset.id = c.id,
            e.className = "command";
            var f = i("village", l.genVillageLabel(c.origin), c.origin.id)
              , g = i("village", l.genVillageLabel(c.target), c.target.id)
              , h = l.formatDate(c.arriveTime - M)
              , j = l.formatDate(c.sendTime - M)
              , k = !!Object.keys(c.officers).length;
            if (e.innerHTML = p.render('<table class="tbl-border-light"><colgroup><col width="100px"></colgroup><tbody><tr><th colspan="2"><span class="icon-bg-<#= iconColor #> icon-26x26-<#= type #>" tooltip="<#= locale("common", type) #>"></span> <# if (section === "queue") { #> <span class="size-26x26 icon-bg-black icon-26x26-time-duration" tooltip="<#= locale("queue", "command.timeLeft") #>"></span> <span class="time-left">00:00:00</span> <# } #> <span class="size-26x26 icon-bg-black icon-20x20-units-outgoing" tooltip="<#= locale("queue", "command.out") #>"></span> <span class="sent-time"><#= sendTime #></span><span class="size-26x26 icon-bg-black icon-20x20-time-arrival" tooltip="<#= locale("queue", "command.arrive") #>"></span> <span class="arrive-time"><#= arriveTime #></span> <# if (section === "queue") { #> <a href="#" class="remove-command size-20x20 btn-red icon-20x20-close" tooltip="<#= locale("queue", "queue.remove") #>"></a> <# } #> </th></tr><tr><td><#= locale("common", "villages") #></td><td><a class="origin"></a> <span class="size-20x20 icon-26x26-<#= type #>"></span> <a class="target"></a></td></tr><tr><td><#= locale("common", "units") #></td><td class="units"> <# for (var unit in units) { #> <div class="unit"> <# if (unit === "catapult" && type === "attack") { #> <span class="icon-34x34-unit-<#= unit #> icon"></span><span class="amount"><#= units[unit] #> <span>(<#= locale("common", catapultTarget) #>)</span></span> <# } else { #> <span class="icon-34x34-unit-<#= unit #> icon"></span><span class="amount"><#= units[unit] #></span> <# } #> </div> <# } #> <# if (hasOfficers) { #> <# for (var officer in officers) { #> <div class="officer"><span class="icon-34x34-premium_officer_<#= officer #>"></span></div> <# } #> <# } #> </td></tr></tbody></table>', {
                sendTime: j,
                type: c.type,
                arriveTime: h,
                units: c.units,
                hasOfficers: k,
                officers: c.officers,
                section: d,
                locale: b,
                catapultTarget: c.catapultTarget,
                iconColor: "attack" === c.type ? "red" : "blue"
            }),
            e.querySelector(".origin").replaceWith(f.elem),
            e.querySelector(".target").replaceWith(g.elem),
            "queue" === d) {
                var m = e.querySelector(".remove-command")
                  , n = e.querySelector(".time-left");
                m.addEventListener("click", function(b) {
                    a.removeCommand(c, N.COMMAND_REMOVED)
                }),
                wa(n, c.id)
            }
            A[d].append(e),
            r.setTooltips(),
            Aa(d)
        }, va = function() {
            var b = a.getWaitingCommandsObject();
            setInterval(function() {
                var a = n.gameTime() + M;
                if (!r.isVisible("queue"))
                    return !1;
                for (var c in R) {
                    var d = b[c]
                      , e = d.sendTime - a;
                    e > 0 && (R[c].innerHTML = o("readableMillisecondsFilter")(e, !1, !0))
                }
            }, 1e3)
        }, wa = function(a, b) {
            R[b] = a
        }, xa = function(a) {
            delete R[a]
        }, ya = function(b) {
            var c = a.getWaitingCommandsObject();
            A.queue.find(".command").forEach(function(a) {
                var d = c[a.dataset.id];
                d && b(a, d)
            })
        }, za = function(b) {
            var c = a.getWaitingCommands();
            V.forEach(function(b) {
                U[b] && (c = a.filterCommands(b, W, c))
            });
            var d = c.map(function(a) {
                return a.id
            });
            ya(function(a, b) {
                a.style.display = d.includes(b.id) ? "" : "none"
            }),
            r.recalcScrollbar()
        }, Aa = function(b) {
            var c = A[b]
              , d = c.find("p.nothing")
              , e = "queue" === b ? a.getWaitingCommands() : c.find("div");
            d.css("display", 0 === e.length ? "" : "none")
        }, Ba = function() {
            m.bind("Queue/command/add/invalidOrigin", function(a) {
                l.emitNotif("error", b("queue", "error.origin"))
            }),
            m.bind("Queue/command/add/invalidTarget", function(a) {
                l.emitNotif("error", b("queue", "error.target"))
            }),
            m.bind("Queue/command/add/invalidDate", function(a) {
                l.emitNotif("error", b("queue", "error.invalidDate"))
            }),
            m.bind("Queue/command/add/noUnits", function(a) {
                l.emitNotif("error", b("queue", "error.noUnits"))
            }),
            m.bind("Queue/command/add/alreadySent", function(a) {
                l.emitNotif("error", b("queue", "error.alreadySent", {
                    date: l.formatDate(a.sendTime),
                    type: b("common", a.type)
                }))
            }),
            m.bind("Queue/command/remove", function(a) {
                ta(a, "queue"),
                c.$broadcast(h.TOOLTIP_HIDE, "twoverflow-tooltip"),
                l.emitNotif("success", Ea(a.type, "removed"))
            }),
            m.bind("Queue/command/remove/error", function(a) {
                l.emitNotif("error", b("queue", "error.removeError"))
            }),
            m.bind("Queue/command/send/timeLimit", function(a) {
                ta(a, "queue"),
                ua(a, "expired"),
                l.emitNotif("error", Ea(a.type, "expired"))
            }),
            m.bind("Queue/command/send/notOwnVillage", function(a) {
                ta(a, "queue"),
                ua(a, "expired"),
                l.emitNotif("error", b("queue", "error.notOwnVillage"))
            }),
            m.bind("Queue/command/send/noUnitsEnough", function(a) {
                ta(a, "queue"),
                ua(a, "expired"),
                l.emitNotif("error", b("queue", "error.noUnitsEnough"))
            }),
            m.bind("Queue/command/add", function(a) {
                ja(),
                za(),
                l.emitNotif("success", Ea(a.type, "added"))
            }),
            m.bind("Queue/command/send", function(a) {
                ta(a, "queue"),
                ua(a, "sent"),
                l.emitNotif("success", Ea(a.type, "sent"))
            }),
            m.bind("Queue/start", function(a) {
                s.$elem.removeClass("btn-green").addClass("btn-red"),
                u.removeClass("btn-green").addClass("btn-red"),
                u.html(b("common", "deactivate")),
                a || l.emitNotif("success", Ea("title", "activated"))
            }),
            m.bind("Queue/stop", function() {
                s.$elem.removeClass("btn-red").addClass("btn-green"),
                u.removeClass("btn-red").addClass("btn-green"),
                u.html(b("common", "activate")),
                l.emitNotif("success", Ea("title", "deactivated"))
            }),
            B.on("selectSelected", function() {
                _ = B[0].dataset.value,
                na()
            }),
            u.on("click", function(b) {
                a.isRunning() ? a.stop() : a.start()
            }),
            t.find(".buttons .add").on("click", function() {
                sa(this.name)
            }),
            t.find("a.clear").on("click", function() {
                Da()
            }),
            t.find("a.addSelected").on("click", function() {
                P = e.getSelectedVillage().data,
                F.html(l.genVillageLabel(P)),
                T.origin = !0,
                P && Q && ca(),
                a.getVillageByCoords(P.x, P.y, function(a) {
                    P = a,
                    na()
                })
            }),
            t.find("a.addMapSelected").on("click", function() {
                if (!aa)
                    return l.emitNotif("error", b("queue", "error.noMapSelectedVillage"));
                Q = aa,
                G.html(l.genVillageLabel(Q)),
                T.target = !0,
                P && Q && ca(),
                a.getVillageByCoords(Q.x, Q.y, function(a) {
                    Q = a,
                    na()
                })
            }),
            t.find("a.addCurrentDate").on("click", function() {
                y.val(ma()),
                y.trigger("input")
            }),
            t.find("a.currentDatePlus").on("click", function() {
                y.val(Ia(y.val(), 100))
            }),
            t.find("a.currentDateMinus").on("click", function() {
                y.val(Ia(y.val(), -100))
            });
            var d = function(a) {
                return function() {
                    var b = "origin" === a ? w : x
                      , c = b.val();
                    if (c.length < 2)
                        return j.hide();
                    j.search(c, function(c) {
                        c.length && j.show(c, b[0], "commandQueue-" + a)
                    }, ["village"])
                }
            };
            w.on("input", d("origin")),
            x.on("input", d("target")),
            c.$on(h.SELECT_SELECTED, function(a, b, c) {
                "commandQueue-origin" === b ? (T.origin = !0,
                P = c,
                qa(w),
                na(),
                F.html(c.name)) : "commandQueue-target" === b && (T.target = !0,
                Q = c,
                qa(x),
                na(),
                G.html(c.name)),
                P && Q || ba()
            }),
            y.on("input", function() {
                T.date = l.isValidDateTime(y.val()),
                T.date ? qa(y) : pa(y),
                na()
            }),
            z.on("change", function() {
                na()
            }),
            E.on("input", function(a) {
                a.target.value ? D.css("display", "") : D.css("display", "none")
            }),
            H.on("click", La),
            c.$on(h.SHOW_CONTEXT_MENU, function(a, b) {
                aa = b.data
            }),
            c.$on(h.DESTROY_CONTEXT_MENU, function() {
                aa = !1
            }),
            c.$on(h.VILLAGE_SELECTED_CHANGED, function() {
                za()
            }),
            c.$on(h.ARMY_PRESET_UPDATE, Ja),
            c.$on(h.ARMY_PRESET_DELETED, Ja),
            I.on("selectSelected", function() {
                var a = I[0].dataset.value;
                Ka(a)
            })
        }, Ca = function() {
            C.find(".selectedVillage").on("click", function() {
                U.selectedVillage ? this.classList.remove("active") : this.classList.add("active"),
                U.selectedVillage = !U.selectedVillage,
                za()
            }),
            C.find(".barbarianTarget").on("click", function() {
                U.barbarianTarget ? this.classList.remove("active") : this.classList.add("active"),
                U.barbarianTarget = !U.barbarianTarget,
                za()
            }),
            C.find(".allowedTypes").on("click", function() {
                var a = this.dataset.filter
                  , b = U[a];
                b ? this.classList.remove("active") : this.classList.add("active"),
                U[a] = !b,
                W.allowedTypes[a] = !b,
                za()
            }),
            C.find(".textMatch").on("input", function(a) {
                clearTimeout(K),
                W[this.dataset.filter] = this.value,
                K = setTimeout(function() {
                    za()
                }, 250)
            })
        }, Da = function() {
            a.getSentCommands().forEach(function(a) {
                ta(a, "sent")
            }),
            a.getExpiredCommands().forEach(function(a) {
                ta(a, "expired")
            }),
            a.clearRegisters()
        }, Ea = function(a, c, d) {
            return d && (a = d + "." + a),
            b("queue", a) + " " + b("queue", c)
        }, Fa = function(a) {
            return !(n.gameTime() + M > a)
        }, Ga = function() {
            var a = {};
            return X.forEach(function(b) {
                v.find(".officers ." + b).val() && (a[b] = !0)
            }),
            a
        }, Ha = function() {
            var a = Y.filter(function(a) {
                return "catapult" !== a
            });
            return a.push("catapult"),
            a
        }, Ia = function(a, b) {
            return l.isValidDateTime(a) ? (a = l.fixDate(a),
            a = l.getTimeFromString(a),
            a += b,
            ma(a)) : ""
        }, Ja = function() {
            var a = b("queue", "add.insert-preset")
              , c = e.getPresetList().presets
              , d = I.find(".custom-select-data").html("")
              , f = (I.find(".custom-select-handler").html(a),
            document.createElement("span"));
            f.dataset.name = a,
            f.dataset.value = "",
            d.append(f),
            I[0].dataset.name = a;
            for (var g in c) {
                var h = document.createElement("span");
                h.dataset.name = c[g].name,
                h.dataset.value = g,
                h.dataset.icon = "size-26x26 icon-26x26-preset",
                d.append(h)
            }
        }, Ka = function(a) {
            var b = e.getPresetList().presets[a];
            if (!b)
                return !1;
            La(),
            t.find(".add-units input.unit").forEach(function(a) {
                a.value = b.units[a.dataset.setting] || ""
            }),
            z.forEach(function(a) {
                var c = a.dataset.setting;
                b.officers[c] && (a.checked = !0,
                $(a).parent().addClass("icon-26x26-checkbox-checked"))
            })
        }, La = function() {
            t.find(".add-units input.unit").forEach(function(a) {
                a.value = ""
            }),
            z.forEach(function(a) {
                a.checked = !1
            }),
            z.parent().forEach(function(a) {
                $(a).removeClass("icon-26x26-checkbox-checked")
            })
        };
        a.interface = function() {
            a.interface = q()
        }
    }),
    define("two/farm", ["two/locale", "two/farm/Village", "two/utils", "two/eventQueue", "helper/math", "conf/conf", "struct/MapData", "helper/mapconvert", "helper/time", "conf/locale", "conf/gameStates", "Lockr"], function(a, b, d, i, k, l, m, n, o, p, q, r) {
        var s, t, u, v, w, x, y = !1, z = /(\(|\{|\[|\"|\')[^\)\}\]\"\']+(\)|\}|\]|\"|\')/, A = null, B = [], C = null, D = null, E = {}, F = null, G = !0, H = !0, I = [], J = null, K = null, L = null, M = [], N = [], O = {}, P = !1, Q = "", R = {}, S = "paused", T = [function(a) {
            if (a.id < 0)
                return !0
        }
        , function(a) {
            if (a.character_id === w.getId())
                return !0
        }
        , function(a) {
            if (a.attack_protection)
                return !0
        }
        , function(a) {
            if (a.character_id) {
                if (!N.includes(a.id))
                    return !0
            }
        }
        , function(a) {
            return a.points < xa.settings.minPoints || (a.points > xa.settings.maxPoints || void 0)
        }
        , function(a) {
            var b = C.position
              , c = k.actualDistance(b, a);
            return c < xa.settings.minDistance || (c > xa.settings.maxDistance || void 0)
        }
        ], U = function(a) {
            var b = {};
            for (var c in a)
                a[c] > 0 && (b[c] = a[c]);
            return b
        }, V = function() {
            r.set("farm-lastEvents", s)
        }, W = function() {
            var a = e.getGroupList().getGroups();
            J = xa.settings.groupIgnore in a && a[xa.settings.groupIgnore],
            K = xa.settings.groupInclude in a && a[xa.settings.groupInclude],
            L = xa.settings.groupOnly in a && a[xa.settings.groupOnly]
        }, X = function() {
            var a = e.getGroupList();
            M = [],
            N = [],
            J && (M = a.getGroupVillageIds(J.id)),
            K && (N = a.getGroupVillageIds(K.id))
        }, Y = function() {
            var a = w.getVillageList().map(function(a) {
                return new b(a)
            }).filter(function(a) {
                return !M.includes(a.id)
            });
            if (L) {
                var c = e.getGroupList()
                  , d = c.getGroupVillageIds(L.id);
                a = a.filter(function(a) {
                    return d.includes(a.id)
                })
            }
            if (A = a,
            D = 1 === A.length,
            C = A[0],
            xa.commander.running && P)
                for (var f = 0; f < a.length; f++) {
                    var g = a[f];
                    if (!O[g.id]) {
                        P = !1,
                        xa.commander.analyse();
                        break
                    }
                }
            xa.triggerEvent("Farm/villagesUpdate")
        }, Z = function(a) {
            var b = function(b) {
                if (I = [],
                !xa.settings.presetName)
                    return void (a && a());
                for (var c in b)
                    if (b.hasOwnProperty(c)) {
                        var d = b[c].name
                          , e = d.replace(z, "").trim();
                        e === xa.settings.presetName && (b[c].cleanName = e,
                        b[c].units = U(b[c].units),
                        I.push(b[c]))
                    }
                a && a()
            };
            e.getPresetList().isLoaded() ? b(e.getPresetList().getPresets()) : f.emit(g.GET_PRESETS, {}, function(a) {
                xa.triggerEvent("Farm/presets/loaded"),
                b(a.presets)
            })
        }, $ = function() {
            var a = []
              , b = function(a) {
                var b = ka(a.target_village_id);
                return !!b && (ja(b),
                !0)
            }
              , d = function(a) {
                oa(a.id, function(a) {
                    var b = a.ReportAttack
                      , c = b.attVillageId
                      , d = b.defVillageId;
                    if (R.hasOwnProperty(c) || (R[c] = []),
                    R[c].includes(d))
                        return !1;
                    R[c].push(d),
                    xa.triggerEvent("Farm/priorityTargetAdded", [{
                        id: d,
                        name: b.defVillageName,
                        x: b.defVillageX,
                        y: b.defVillageY
                    }])
                })
            }
              , e = function() {
                a.forEach(function(a) {
                    d(a)
                }),
                a = []
            }
              , f = function(c, e) {
                if (!xa.commander.running || "attack" !== e.type)
                    return !1;
                xa.settings.ignoreOnLoss && 1 !== e.result && b(e),
                xa.settings.priorityTargets && "full" === e.haul && (j.isTemplateOpen("report") ? a.push(e) : d(e))
            }
              , g = function(a, b) {
                "report" === b && e()
            };
            c.$on(h.REPORT_NEW, f),
            c.$on(h.WINDOW_CLOSED, g)
        }, _ = function() {
            var a = function(a, b) {
                var c = xa.settings.remoteId;
                if (1 !== b.participants.length || b.title !== c)
                    return !1;
                switch (b.message.content.trim().toLowerCase()) {
                case "on":
                case "start":
                case "init":
                case "begin":
                    xa.restart(),
                    pa(b.message_id, qa()),
                    xa.triggerEvent("Farm/remoteCommand", ["on"]);
                    break;
                case "off":
                case "stop":
                case "pause":
                case "end":
                    xa.tempDisableNotifs(function() {
                        xa.pause()
                    }),
                    pa(b.message_id, qa()),
                    xa.triggerEvent("Farm/remoteCommand", ["off"]);
                    break;
                case "status":
                case "current":
                    pa(b.message_id, qa()),
                    xa.triggerEvent("Farm/remoteCommand", ["status"])
                }
                return !1
            };
            c.$on(h.MESSAGE_SENT, a)
        }, aa = function() {
            var a = function() {
                if (Z(),
                xa.triggerEvent("Farm/presets/change"),
                xa.commander.running) {
                    !!I.length ? xa.getGlobalWaiting() && (la(),
                    xa.restart()) : (xa.triggerEvent("Farm/noPreset"),
                    xa.pause())
                }
            };
            c.$on(h.ARMY_PRESET_UPDATE, a),
            c.$on(h.ARMY_PRESET_DELETED, a)
        }, ba = function() {
            var a = function() {
                W(),
                X(),
                xa.triggerEvent("Farm/groupsChanged")
            }
              , b = function(a, b) {
                if (Y(),
                !K)
                    return !1;
                K.id === b.group_id && (E = {})
            };
            c.$on(h.GROUPS_UPDATED, a),
            c.$on(h.GROUPS_CREATED, a),
            c.$on(h.GROUPS_DESTROYED, a),
            c.$on(h.GROUPS_VILLAGE_LINKED, b),
            c.$on(h.GROUPS_VILLAGE_UNLINKED, b)
        }, ca = function() {
            var a = function(a) {
                if (delete O[a],
                P) {
                    if (P = !1,
                    xa.settings.stepCycle)
                        return !1;
                    xa.commander.running && (ha(a),
                    xa.commander.analyse())
                }
            }
              , b = function(b, c) {
                var d = c.village_id
                  , e = O[d] || !1;
                if ("units" === e || "commands" === e)
                    return a(d),
                    !1
            }
              , d = function(b, c) {
                var d = c.villageId;
                if ("fullStorage" === (O[d] || !1))
                    a(d);
                else {
                    var e = ga(d);
                    xa.isFullStorage(e) && xa.setWaitingVillage(d, "fullStorage")
                }
            };
            c.$on(h.VILLAGE_ARMY_CHANGED, b),
            c.$on(h.VILLAGE_RESOURCES_CHANGED, d)
        }, da = function() {
            var a = function() {
                xa.commander.running && setTimeout(function() {
                    xa.restart()
                }, 5e3)
            };
            m.setRequestFn(function(a) {
                f.emit(g.MAP_GETVILLAGES, a)
            }),
            c.$on(h.RECONNECT, a)
        }, ea = function() {
            i.bind("Farm/sendCommand", function() {
                fa(),
                S = "attacking"
            }),
            i.bind("Farm/noPreset", function() {
                S = "paused"
            }),
            i.bind("Farm/noUnits", function() {
                S = "noUnits"
            }),
            i.bind("Farm/noUnitsNoCommands", function() {
                S = "noUnitsNoCommands"
            }),
            i.bind("Farm/start", function() {
                S = "attacking"
            }),
            i.bind("Farm/pause", function() {
                S = "paused"
            }),
            i.bind("Farm/loadingTargets/start", function() {
                S = "loadingTargets"
            }),
            i.bind("Farm/loadingTargets/end", function() {
                S = "analyseTargets"
            }),
            i.bind("Farm/commandLimit/single", function() {
                S = "commandLimit"
            }),
            i.bind("Farm/commandLimit/multi", function() {
                S = "noVillages"
            }),
            i.bind("Farm/stepCycle/end", function() {
                S = "stepCycle/end",
                H && xa.settings.stepCycleNotifs && d.emitNotif("error", a("farm", "events.stepCycle/end"))
            }),
            i.bind("Farm/stepCycle/end/noVillages", function() {
                S = "stepCycle/end/noVillages",
                H && d.emitNotif("error", a("farm", "events.stepCycle/end/noVillages"))
            }),
            i.bind("Farm/stepCycle/next", function() {
                if (S = "stepCycle/next",
                H && xa.settings.stepCycleNotifs) {
                    var b = o.gameTime() + xa.cycle.getInterval();
                    d.emitNotif("success", a("farm", "events.stepCycle/next", {
                        time: d.formatDate(b)
                    }))
                }
            }),
            i.bind("Farm/fullStorage", function() {
                S = "fullStorage"
            })
        }, fa = function() {
            u = o.gameTime(),
            r.set("farm-lastAttack", u)
        }, ga = function(a) {
            var b = A.indexOf(a);
            return -1 !== b && A[b]
        }, ha = function(a) {
            var b = ga(a);
            return !!b && (C = b,
            !0)
        }, ia = function(a, b) {
            f.emit(g.ASSIGN_PRESETS, {
                village_id: C.id,
                preset_ids: a
            }, b)
        }, ja = function(a) {
            if (!J)
                return !1;
            f.emit(g.GROUPS_LINK_VILLAGE, {
                group_id: J.id,
                village_id: a.id
            }, function() {
                xa.triggerEvent("Farm/ignoredVillage", [a])
            })
        }, ka = function(a) {
            for (var b in E)
                for (var c = E[b], d = 0; d < c.length; d++) {
                    var e = c[d];
                    if (e.id === a)
                        return e
                }
            return !1
        }, la = function() {
            O = {}
        }, ma = function() {
            setInterval(function() {
                if (xa.commander.running) {
                    var a = 3e5;
                    xa.settings.stepCycle && xa.cycle.intervalEnabled() && (a += xa.cycle.getInterval() + 6e4);
                    o.gameTime() - u > a && xa.tempDisableNotifs(function() {
                        xa.pause(),
                        xa.start(!0)
                    })
                }
            }, 6e4)
        }, na = function() {
            setInterval(function() {
                E = {}
            }, 3e5)
        }, oa = function(a, b) {
            f.emit(g.REPORT_GET, {
                id: a
            }, b)
        }, pa = function(a, b) {
            f.emit(g.MESSAGE_REPLY, {
                message_id: a,
                message: b
            })
        }, qa = function() {
            var b = a("common", "status")
              , c = a("farm", "events.selectedVillage")
              , e = a("farm", "events.lastAttack")
              , f = {};
            if ("stepCycle/next" === S) {
                var g = o.gameTime() + xa.cycle.getInterval();
                f.time = d.formatDate(g)
            }
            var h = a("farm", "events." + S, f)
              , i = d.genVillageLabel(C)
              , j = d.formatDate(u)
              , k = C.id
              , l = [];
            return l.push("[b]", b, ":[/b] ", h, "[br]"),
            l.push("[b]", c, ":[/b] "),
            l.push("[village=", k, "]", i, "[/village][br]"),
            l.push("[b]", e, ":[/b] ", j),
            l.join("")
        }, ra = function() {
            var a = o.gameTime();
            if (xa.settings.stepCycle && xa.cycle.intervalEnabled()) {
                if (a > t + xa.cycle.getInterval() + 6e4)
                    return !0
            } else if (a > t + 18e5)
                return !0;
            return !1
        }, sa = function(a, b, c, d, e, f) {
            if (m.hasTownDataInChunk(a, b)) {
                var g = m.loadTownData(a, b, c, d, e);
                return f(g)
            }
            xa.triggerEvent("Farm/loadingTargets/start");
            var h = n.scaledGridCoordinates(a, b, c, d, e)
              , i = h.length
              , j = 0;
            m.loadTownDataAsync(a, b, c, d, function() {
                if (++j === i) {
                    xa.triggerEvent("Farm/loadingTargets/end");
                    var g = m.loadTownData(a, b, c, d, e);
                    f(g)
                }
            })
        }, ta = function(a) {
            for (var b = a.length, c = []; b--; ) {
                var d = a[b]
                  , e = d.data;
                for (var f in e) {
                    var g = e[f];
                    for (var h in g) {
                        var i = g[h];
                        c.push(i)
                    }
                }
            }
            return c
        }, ua = function(a) {
            return a.filter(function(a) {
                return T.every(function(b) {
                    return !b(a)
                })
            })
        }, va = function(a) {
            for (var b, c = [], d = C.position, e = 0; e < a.length; e++)
                b = a[e],
                c.push({
                    x: b.x,
                    y: b.y,
                    distance: k.actualDistance(d, b),
                    id: b.id,
                    name: b.name,
                    pid: b.character_id
                });
            return c
        }, wa = function() {
            var a = r.get("farm-settings", {}, !0);
            for (var b in xa.settingsMap)
                xa.settings[b] = a.hasOwnProperty(b) ? a[b] : xa.settingsMap[b].default
        }, xa = {};
        return xa.version = "4.0.1",
        xa.settings = {},
        xa.settingsMap = {
            maxDistance: {
                default: 10,
                updates: ["targets"],
                inputType: "text",
                min: 0,
                max: 50
            },
            minDistance: {
                default: 0,
                updates: ["targets"],
                inputType: "text",
                min: 0,
                max: 50
            },
            maxTravelTime: {
                default: "01:00:00",
                updates: [],
                inputType: "text",
                pattern: /\d{1,2}\:\d{2}\:\d{2}/
            },
            randomBase: {
                default: 3,
                updates: [],
                inputType: "text",
                min: 0,
                max: 9999
            },
            presetName: {
                default: "",
                updates: ["preset"],
                inputType: "select"
            },
            groupIgnore: {
                default: "0",
                updates: ["groups"],
                inputType: "select"
            },
            groupInclude: {
                default: "0",
                updates: ["groups", "targets"],
                inputType: "select"
            },
            groupOnly: {
                default: "0",
                updates: ["groups", "villages", "targets"],
                inputType: "select"
            },
            minPoints: {
                default: 0,
                updates: ["targets"],
                inputType: "text",
                min: 0,
                max: 13e3
            },
            maxPoints: {
                default: 12500,
                updates: ["targets"],
                inputType: "text",
                min: 0,
                max: 13e3
            },
            eventsLimit: {
                default: 20,
                updates: ["events"],
                inputType: "text",
                min: 0,
                max: 150
            },
            ignoreOnLoss: {
                default: !0,
                updates: [],
                inputType: "checkbox"
            },
            priorityTargets: {
                default: !0,
                updates: [],
                inputType: "checkbox"
            },
            eventAttack: {
                default: !0,
                updates: ["events"],
                inputType: "checkbox"
            },
            eventVillageChange: {
                default: !0,
                updates: ["events"],
                inputType: "checkbox"
            },
            eventPriorityAdd: {
                default: !0,
                updates: ["events"],
                inputType: "checkbox"
            },
            eventIgnoredVillage: {
                default: !0,
                updates: ["events"],
                inputType: "checkbox"
            },
            remoteId: {
                default: "remote",
                updates: [],
                inputType: "text"
            },
            hotkeySwitch: {
                default: "shift+z",
                updates: [],
                inputType: "text"
            },
            hotkeyWindow: {
                default: "z",
                updates: [],
                inputType: "text"
            },
            stepCycle: {
                default: !1,
                updates: ["villages"],
                inputType: "checkbox"
            },
            stepCycleNotifs: {
                default: !1,
                updates: [],
                inputType: "checkbox"
            },
            stepCycleInterval: {
                default: "00:00:00",
                updates: [],
                inputType: "text",
                pattern: /\d{1,2}\:\d{2}\:\d{2}/
            },
            commandsPerVillage: {
                default: 48,
                updates: ["waitingVillages"],
                inputType: "text",
                min: 1,
                max: 50
            },
            ignoreFullStorage: {
                default: !0,
                updates: ["fullStorage"],
                inputType: "checkbox"
            }
        },
        xa.init = function() {
            a.create("farm", {
                en: {
                    langName: "English",
                    title: "FarmOverflow",
                    "events.attacking": "Attacking.",
                    "events.commandLimit": "Limit of 50 attacks reached, waiting return.",
                    "events.lastAttack": "Last attack",
                    "events.nextVillage": "Changing to village %{village}",
                    "events.noPreset": "No presets avaliable.",
                    "events.noSelectedVillage": "No villages avaliable.",
                    "events.noUnits": "No units avaliable in village, waiting attacks return.",
                    "events.noUnitsNoCommands": "No villages has units or commands returning.",
                    "events.noVillages": "No villages avaliable, waiting attacks return.",
                    "events.nothingYet": "Nothing available yet...",
                    "events.presetFirst": "Set a preset first!",
                    "events.selectedVillage": "Village selected",
                    "events.sendCommand": "%{origin} attack %{target}",
                    "events.loadingTargets": "Loading targets...",
                    "events.checkingTargets": "Checking targets...",
                    "events.restartingCommands": "Restarting commands...",
                    "events.ignoredVillage": "Target %{target} ignored! (caused loss)",
                    "events.priorityTargetAdded": "%{target} added to priorities.",
                    "events.analyseTargets": "Analysing targets.",
                    "events.stepCycle/restart": "Restarting the cycle of commands..",
                    "events.stepCycle/end": "The list of villages ended, waiting for the next run.",
                    "events.stepCycle/end/noVillages": "No villages available to start the cycle.",
                    "events.stepCycle/next": "The list of villages is over, next cycle: %{time}.",
                    "events.stepCycle/next/noVillages": "No village available to start the cycle, next cycle: %{time}.",
                    "events.fullStorage": "The storage of the village is full.",
                    "general.disabled": "— Disabled —",
                    "general.paused": "FarmOverflow paused.",
                    "general.started": "FarmOverflow started.",
                    "settings.docs": "To understand the settings, read the documentation",
                    "settings.settings": "Settings",
                    "settings.presets": "Presets",
                    "settings.groupIgnore": "Ignore Group",
                    "settings.groupInclude": "Include Group",
                    "settings.groupOnly": "Only Group",
                    "settings.randomBase": "Random Interval",
                    "settings.commandsPerVillage": "Commands Limit",
                    "settings.priorityTargets": "Prioritize Targets",
                    "settings.ignoreOnLoss": "Ignore on Loss",
                    "settings.ignoreFullStorage": "Skip Full Storage",
                    "settings.stepCycle/header": "Step Cycle Settings",
                    "settings.stepCycle": "Enable Step Cycle",
                    "settings.stepCycle/interval": "Interval",
                    "settings.stepCycle/notifs": "Notifications",
                    "settings.targetFilters": "Target Filters",
                    "settings.minDistance": "Minimum distance",
                    "settings.maxDistance": "Maximum distance",
                    "settings.minPoints": "Minimum points",
                    "settings.maxPoints": "Maximum points",
                    "settings.maxTravelTime": "Maximum travel time",
                    "settings.eventsLimit": "Limit of logs",
                    "settings.eventAttack": "Log attacks",
                    "settings.eventVillageChange": "Log village changes",
                    "settings.eventPriorityAdd": "Log priority targets",
                    "settings.eventIgnoredVillage": "Log ignored villages",
                    "settings.remote": "Remote Control Message Subject",
                    "settings.hotkeySwitch": "Start/pause hotkey",
                    "settings.hotkeyWindow": "Open window hotkey",
                    "settings.saved": "Settings saved!",
                    "settingError.minDistance": "The target distance must be between %{min} and %{max}.",
                    "settingError.maxDistance": "The target distance must be between %{min} and %{max}.",
                    "settingError.maxTravelTime": "Maximum travel time format must be hh:mm:ss.",
                    "settingError.randomBase": "The random interval base must be between %{min} and %{max}.",
                    "settingError.minPoints": "The target pontuation must be a value between %{min} and %{max}.",
                    "settingError.maxPoints": "The target pontuation must be a value between %{min} and %{max}.",
                    "settingError.eventsLimit": "The amount of events must be a value between %{min} and %{max}.",
                    "settingError.stepCycle/interval": "Format of interval between cycles must be hh:mm:ss.",
                    "settingError.commandsPerVillage": "The limit of commands per village must be a value between %{min} and %{max}."
                },
                pl: {
                    langName: "Polski",
                    title: "Farmer",
                    "events.attacking": "Atakuje.",
                    "events.commandLimit": "Limit 50 ataków osiągnięty, oczekiwanie na powrót wojsk.",
                    "events.lastAttack": "Ostatni atak",
                    "events.nextVillage": "Przejście do wioski %{village}",
                    "events.noPreset": "Brak dostępnych szablonów.",
                    "events.noSelectedVillage": "Brak dostępnych wiosek.",
                    "events.noUnits": "Brak dostępnych jednostek w wiosce, oczekiwanie na powrót wojsk.",
                    "events.noUnitsNoCommands": "Brak jednostek w wioskach lub powracających wojsk.",
                    "events.noVillages": "Brak dostępnych wiosek, oczekiwanie na powrót wojsk.",
                    "events.nothingYet": "Odpoczywam...",
                    "events.presetFirst": "Wybierz najpierw szablon!",
                    "events.selectedVillage": "Wybrana wioska",
                    "events.sendCommand": "%{origin} atakuje %{target}",
                    "events.loadingTargets": "Ładowanie celów...",
                    "events.checkingTargets": "Sprawdzanie celów...",
                    "events.restartingCommands": "Restartowanie poleceń...",
                    "events.ignoredVillage": "Cel %{target} pominięty! (caused loss)",
                    "events.priorityTargetAdded": "%{target} dodany do priorytetowych.",
                    "events.analyseTargets": "Analizowanie celów.",
                    "events.stepCycle/restart": "Restartowanie cyklu poleceń...",
                    "events.stepCycle/end": "Lista wiosek zakończona, oczekiwanie na następny cykl.",
                    "events.stepCycle/end/noVillages": "Brak wiosek do rozpoczęcia cyklu.",
                    "events.stepCycle/next": "Lista wiosek się skończyła, następny cykl: %{time}.",
                    "events.stepCycle/next/noVillages": "Brak wioski do rozpoczęcia cyklu, następny cykl: %{time}.",
                    "events.fullStorage": "Magazyn w wiosce jest pełny",
                    "general.disabled": "— Wyłączony —",
                    "general.paused": "Farmer zatrzymany",
                    "general.started": "Farmer uruchomiony",
                    "settings.docs": "Miłego farmienia!",
                    "settings.settings": "Ustawienia",
                    "settings.presets": "Szablony",
                    "settings.groupIgnore": "Pomijaj wioski z grupy",
                    "settings.groupInclude": "Dodaj wioski z grupy",
                    "settings.groupOnly": "Tylko wioski z grupy",
                    "settings.randomBase": "Domyślny odstęp (sek)",
                    "settings.commandsPerVillage": "Limit poleceń",
                    "settings.priorityTargets": "Priorytyzuj cele",
                    "settings.ignoreOnLoss": "Pomijaj cele jeśli straty",
                    "settings.ignoreFullStorage": "Pomijaj wioski jeśli magazyn pełny",
                    "settings.stepCycle/header": "Cykl Farmienia",
                    "settings.stepCycle": "Włącz Cykl farmienia",
                    "settings.stepCycle/interval": "Odstęp między cyklami",
                    "settings.stepCycle/notifs": "Powiadomienia",
                    "settings.targetFilters": "Filtry celów",
                    "settings.minDistance": "Minimalna odległość",
                    "settings.maxDistance": "Maksymalna odległość",
                    "settings.minPoints": "Minimalna liczba punktów",
                    "settings.maxPoints": "Maksymalna liczba punktów",
                    "settings.maxTravelTime": "Maksymalny czas podróży",
                    "settings.eventsLimit": "Limit logów",
                    "settings.eventAttack": "Logi ataków",
                    "settings.eventVillageChange": "Logi zmiany wiosek",
                    "settings.eventPriorityAdd": "Logi celów priorytetowych",
                    "settings.eventIgnoredVillage": "Logi pominiętych wiosek",
                    "settings.remote": "Sterowanie Zdalne za pomocą wiadomości PW",
                    "settings.hotkeySwitch": "Skrót Start/Pauza",
                    "settings.hotkeyWindow": "Skrót okna Farmera",
                    "settings.saved": "Ustawienia zapisane!",
                    "settingError.minDistance": "Odległość celu musi być większa niż %{min}.",
                    "settingError.maxDistance": "Odległość celu nie może przekraczać %{max}.",
                    "settingError.maxTravelTime": "Maksymalny czas podróży hh:mm:ss.",
                    "settingError.randomBase": "Domyślny odstęp musi być pomiędzy %{min} and %{max}.",
                    "settingError.minPoints": "Minimalna liczba punktów celu to %{min}.",
                    "settingError.maxPoints": "Maksymalna liczba punktów celu to %{max}.",
                    "settingError.eventsLimit": "Liczba zdarzeń musi być wartością między %{min} i %{max}.",
                    "settingError.stepCycle/interval": "Format odstępu między cyklami powinien mieć postać hh:mm:ss.",
                    "settingError.commandsPerVillage": "Limit poleceń na wioskę musi być wartością między %{min} and %{max}."
                },
                pt: {
                    langName: "Português",
                    title: "FarmOverflow",
                    "events.attacking": "Atacando.",
                    "events.commandLimit": "Limite de 50 ataques atingido, aguardando retorno.",
                    "events.lastAttack": "Último ataque",
                    "events.nextVillage": "Alternando para a aldeia %{village}",
                    "events.noPreset": "Nenhuma predefinição disponível.",
                    "events.noSelectedVillage": "Nenhuma aldeia disponível.",
                    "events.noUnits": "Sem unidades na aldeia, aguardando ataques retornarem.",
                    "events.noUnitsNoCommands": "Nenhuma aldeia tem tropas nem ataques retornando.",
                    "events.noVillages": "Nenhuma aldeia disponível, aguardando ataques retornarem.",
                    "events.nothingYet": "Nada por aqui ainda...",
                    "events.presetFirst": "Configure uma predefinição primeiro!",
                    "events.selectedVillage": "Aldeia selecionada",
                    "events.sendCommand": "%{origin} ataca %{target}",
                    "events.loadingTargets": "Carregando alvos...",
                    "events.checkingTargets": "Checando alvos...",
                    "events.restartingCommands": "Reiniciando comandos...",
                    "events.ignoredVillage": "Alvo %{target} ignorado! (causou baixas)",
                    "events.priorityTargetAdded": "%{target} adicionado as prioridades.",
                    "events.analyseTargets": "Analisando alvos.",
                    "events.stepCycle/restart": "Reiniciando o ciclo de comandos..",
                    "events.stepCycle/end": "A lista de aldeias acabou, esperando próxima execução.",
                    "events.stepCycle/end/noVillages": "Nenhuma aldeia disponível para iniciar o ciclo.",
                    "events.stepCycle/next": "A lista de aldeias acabou, próximo ciclo: %{time}.",
                    "events.stepCycle/next/noVillages": "Nenhuma aldeia disponível para iniciar o ciclo, próximo ciclo: %{time}.",
                    "events.fullStorage": "O armazém da aldeia está cheio.",
                    "general.disabled": "— Desativado —",
                    "general.paused": "FarmOverflow pausado.",
                    "general.started": "FarmOverflow iniciado.",
                    "settings.docs": "Para entender as configurações, leia a documentação",
                    "settings.settings": "Configurações",
                    "settings.presets": "Predefinições",
                    "settings.groupIgnore": "Grupo Ignorar",
                    "settings.groupInclude": "Grupo Incluir",
                    "settings.groupOnly": "Grupo Apenas",
                    "settings.randomBase": "Intervalo Aleatório",
                    "settings.commandsPerVillage": "Limite de Comandos",
                    "settings.priorityTargets": "Priorizar Alvos",
                    "settings.ignoreOnLoss": "Ignorar Alvos Hostis",
                    "settings.ignoreFullStorage": "Ignorar Armazéns Lotados",
                    "settings.stepCycle/header": "Configurações de Ciclos",
                    "settings.stepCycle": "Ativar Ciclo",
                    "settings.stepCycle/interval": "Intervalo",
                    "settings.stepCycle/notifs": "Notificações",
                    "settings.targetFilters": "Filtro de Alvos",
                    "settings.minDistance": "Distância mínima",
                    "settings.maxDistance": "Distância máxima",
                    "settings.minPoints": "Pontuação mínima",
                    "settings.maxPoints": "Pontuação máxima",
                    "settings.maxTravelTime": "Tempo máximo de viagem",
                    "settings.eventsLimit": "Limite de registros",
                    "settings.eventAttack": "Registrar ataques",
                    "settings.eventVillageChange": "Registrar troca de aldeias",
                    "settings.eventPriorityAdd": "Registrar alvos prioritarios",
                    "settings.eventIgnoredVillage": "Registrar alvos ignorados",
                    "settings.remote": "Controle Remoto - Mensagem",
                    "settings.hotkeySwitch": "Atalho para inicar/pausar",
                    "settings.hotkeyWindow": "Atalho para abrir janela",
                    "settings.saved": "Configurações salvas!",
                    "settingError.minDistance": "A distância deve ser um valor entre %{min} e %{max}.",
                    "settingError.maxDistance": "A distância deve ser um valor entre %{min} e %{max}.",
                    "settingError.maxTravelTime": "O formato do tempo máximo de viagem deve ser hh:mm:ss.",
                    "settingError.randomBase": "O intervalo entre cada ataque deve ser um valor entre %{min} e %{max}.",
                    "settingError.minPoints": "A pontuação do alvo deve ser entre %{min} e %{max}.",
                    "settingError.maxPoints": "A pontuação do alvo deve ser entre %{min} e %{max}.",
                    "settingError.eventsLimit": "O número de eventos deve ser entre %{min} e %{max}.",
                    "settingError.stepCycle/interval": "O formato do intervalo entre ataques deve ser hh:mm:ss.",
                    "settingError.commandsPerVillage": "A limite de comandos por aldeia deve ser um valor entre %{min} e %{max}."
                }
            }, "en"),
            y = !0,
            xa.commander = xa.createCommander(),
            w = e.getSelectedCharacter(),
            x = e.getGameState(),
            s = r.get("farm-lastEvents", [], !0),
            t = r.get("farm-lastActivity", o.gameTime(), !0),
            u = r.get("farm-lastAttack", -1, !0),
            v = r.get("farm-indexes", {}, !0),
            wa(),
            W(),
            X(),
            Y(),
            Z(),
            $(),
            _(),
            ba(),
            aa(),
            ca(),
            da(),
            ea(),
            ma(),
            na()
        }
        ,
        xa.start = function(b) {
            if (!I.length)
                return !b && H && d.emitNotif("error", a("farm", "events.presetFirst")),
                !1;
            if (!C)
                return !b && H && d.emitNotif("error", a("farm", "events.noSelectedVillage")),
                !1;
            if (!x.getGameState(q.ALL_VILLAGES_READY)) {
                var e = c.$on(h.GAME_STATE_ALL_VILLAGES_READY, function() {
                    e(),
                    xa.start()
                });
                return !1
            }
            return ra() && (R = {},
            v = {}),
            xa.settings.stepCycle ? xa.cycle.startStep(b) : xa.cycle.startContinuous(),
            xa.updateActivity(),
            !0
        }
        ,
        xa.pause = function() {
            return xa.breakCommander(),
            xa.triggerEvent("Farm/pause"),
            clearTimeout(xa.cycle.getTimeoutId()),
            H && d.emitNotif("success", a("common", "paused")),
            !0
        }
        ,
        xa.breakCommander = function() {
            clearTimeout(xa.commander.timeoutId),
            xa.commander.running = !1
        }
        ,
        xa.restart = function() {
            xa.tempDisableNotifs(function() {
                xa.pause(),
                xa.start()
            })
        }
        ,
        xa.switch = function() {
            xa.commander.running ? xa.pause() : xa.start()
        }
        ,
        xa.updateActivity = function() {
            t = o.gameTime(),
            r.set("farm-lastActivity", t)
        }
        ,
        xa.updateSettings = function(a) {
            var b, c, d, e = {};
            for (var f in a)
                if (b = xa.settingsMap[f],
                c = a[f],
                b && c !== xa.settings[f]) {
                    if (b.hasOwnProperty("pattern")) {
                        if (!b.pattern.test(c))
                            return xa.triggerEvent("Farm/settingError", [f]),
                            !1
                    } else if (b.hasOwnProperty("min") && (c < b.min || c > b.max))
                        return xa.triggerEvent("Farm/settingError", [f, {
                            min: b.min,
                            max: b.max
                        }]),
                        !1;
                    b.updates.forEach(function(a) {
                        e[a] = !0
                    }),
                    xa.settings[f] = c
                }
            if (r.set("farm-settings", xa.settings),
            e.groups && (W(),
            X()),
            e.villages && Y(),
            e.preset && (Z(),
            la()),
            e.targets && (E = {}),
            e.events && xa.triggerEvent("Farm/resetEvents"),
            e.fullStorage)
                for (d in O)
                    "fullStorage" === O[d] && delete O[d];
            if (e.waitingVillages)
                for (d in O)
                    "commands" === O[d] && delete O[d];
            return xa.commander.running && xa.tempDisableEvents(function() {
                xa.restart()
            }),
            xa.triggerEvent("Farm/settingsChange", [e]),
            !0
        }
        ,
        xa.nextTarget = function(a) {
            var b = C.id;
            if (!E[b])
                return xa.commander.analyse(),
                !1;
            var c = E[b];
            if (xa.settings.priorityTargets && R[b])
                for (var d; d = R[b].shift(); )
                    if (!M.includes(d))
                        for (var e = 0; e < c.length; e++)
                            if (c[e].id === d)
                                return F = c[e],
                                !0;
            var f = v[b]
              , g = !1;
            for (a || (f = ++v[b]); f < c.length; f++) {
                var h = c[f];
                {
                    if (!M.includes(h.id)) {
                        F = h,
                        g = !0;
                        break
                    }
                    xa.triggerEvent("Farm/ignoredTarget", [h])
                }
            }
            return g ? v[b] = f : (F = c[0],
            v[b] = 0),
            r.set("farm-indexes", v),
            !0
        }
        ,
        xa.hasTarget = function() {
            var a = C.id
              , b = v[a]
              , c = E[a];
            return !!c.length && ((void 0 === b || b > c.length) && (v[a] = b = 0),
            !!c[b])
        }
        ,
        xa.getTargets = function(a) {
            var b = C.position
              , c = C.id;
            if (c in E)
                return a();
            var d = l.MAP_CHUNK_SIZE
              , e = b.x - d
              , f = b.y - d;
            sa(e, f, 2 * d, 2 * d, d, function(b) {
                var d = ta(b)
                  , e = ua(d)
                  , f = va(e);
                if (0 === f.length)
                    return xa.nextVillage() ? xa.getTargets(a) : xa.triggerEvent("Farm/noTargets"),
                    !1;
                E[c] = f.sort(function(a, b) {
                    return a.distance - b.distance
                }),
                v.hasOwnProperty(c) ? v[c] > E[c].length && (v[c] = 0,
                r.set("farm-indexes", v)) : (v[c] = 0,
                r.set("farm-indexes", v)),
                a()
            })
        }
        ,
        xa.nextVillage = function() {
            if (D)
                return !1;
            if (xa.settings.stepCycle)
                return xa.cycle.nextVillage();
            var a = B.shift();
            if (a) {
                return xa.getFreeVillages().some(function(b) {
                    return b.id === a.id
                }) ? (C = a,
                xa.triggerEvent("Farm/nextVillage", [C]),
                xa.updateActivity(),
                !0) : xa.nextVillage()
            }
            return B = xa.getFreeVillages(),
            B.length ? xa.nextVillage() : (D ? xa.triggerEvent("Farm/noUnits") : xa.triggerEvent("Farm/noVillages"),
            !1)
        }
        ,
        xa.checkPresets = function(a) {
            if (!I.length)
                return xa.pause(),
                xa.triggerEvent("Farm/noPreset"),
                !1;
            var b = C.id
              , c = e.getPresetList().getPresetsByVillageId(b)
              , d = !1
              , f = [];
            if (I.forEach(function(a) {
                c.hasOwnProperty(a.id) || (d = !0,
                f.push(a.id))
            }),
            d) {
                for (var g in c)
                    f.push(g);
                ia(f, a)
            } else
                a()
        }
        ,
        xa.targetsLoaded = function() {
            return E.hasOwnProperty(C.id)
        }
        ,
        xa.hasVillage = function() {
            return !!C
        }
        ,
        xa.isWaiting = function() {
            return O.hasOwnProperty(C.id)
        }
        ,
        xa.isIgnored = function() {
            return M.includes(C.id)
        }
        ,
        xa.isAllWaiting = function() {
            for (var a = 0; a < A.length; a++) {
                var b = A[a].id;
                if (!O.hasOwnProperty(b))
                    return !1
            }
            return !0
        }
        ,
        xa.setLastEvents = function(a) {
            s = a,
            V()
        }
        ,
        xa.getLastEvents = function() {
            return s
        }
        ,
        xa.getSelectedVillage = function() {
            return C
        }
        ,
        xa.isSingleVillage = function() {
            return D
        }
        ,
        xa.getSelectedTarget = function() {
            return F
        }
        ,
        xa.getNotifsEnabled = function() {
            return H
        }
        ,
        xa.getEventsEnabled = function() {
            return G
        }
        ,
        xa.getSelectedPresets = function() {
            return I
        }
        ,
        xa.setWaitingVillage = function(a, b) {
            O[a] = b || !0
        }
        ,
        xa.getWaitingVillages = function() {
            return O
        }
        ,
        xa.setGlobalWaiting = function() {
            P = !0
        }
        ,
        xa.getGlobalWaiting = function() {
            return P
        }
        ,
        xa.getLastError = function() {
            return Q
        }
        ,
        xa.setLastError = function(a) {
            Q = a
        }
        ,
        xa.isInitialized = function() {
            return y
        }
        ,
        xa.getLastAttack = function() {
            return u
        }
        ,
        xa.createCommander = function() {
            return new (require("two/farm/Commander"))
        }
        ,
        xa.setSelectedVillage = function(a) {
            C = a
        }
        ,
        xa.setLeftVillages = function(a) {
            B = a
        }
        ,
        xa.isFullStorage = function(a) {
            if (a = a || C,
            a.original.isReady()) {
                var b = a.original.getResources()
                  , c = b.getComputed()
                  , d = b.getMaxStorage();
                return ["wood", "clay", "iron"].every(function(a) {
                    return c[a].currentStock === d
                })
            }
            return !1
        }
        ,
        xa.getFreeVillages = function() {
            return A.filter(function(a) {
                return !O[a.id] && (!xa.settings.ignoreFullStorage || !xa.isFullStorage(a) || (O[a.id] = "fullStorage",
                !1))
            })
        }
        ,
        xa.tempDisableNotifs = function(a) {
            H = !1,
            a(),
            H = !0
        }
        ,
        xa.tempDisableEvents = function(a) {
            G = !1,
            a(),
            G = !0
        }
        ,
        xa.triggerEvent = function(a, b) {
            G && i.trigger(a, b)
        }
        ,
        xa
    }),
    define("two/farm/analytics", ["two/farm", "two/eventQueue", "Lockr"], function(a, b, c) {
        a.analytics = function() {
            ga("create", "UA-92130203-4", "auto", "FarmOverflow");
            var a = e.getPlayer()
              , c = a.getSelectedCharacter()
              , d = [];
            d.push(c.getName()),
            d.push(c.getId()),
            d.push(c.getWorldId()),
            b.bind("Farm/sendCommand", function() {
                ga("FarmOverflow.send", "event", "commands", "attack", d.join("~"))
            })
        }
    }),
    define("two/farm/Commander", ["two/farm", "two/utils", "helper/math"], function(a, b, d) {
        function e() {
            return this.preventNextCommand = !1,
            this.timeoutId = null,
            this.running = !1,
            this
        }
        var i = !1;
        return e.prototype.analyse = function() {
            var b = this;
            if (b.running) {
                if (!a.getSelectedPresets().length)
                    return a.pause(),
                    void a.triggerEvent("Farm/noPreset");
                if (!a.hasVillage())
                    return a.triggerEvent("Farm/noVillageSelected");
                var c = a.getSelectedVillage();
                if (!c.loaded())
                    return void c.load(function() {
                        b.analyse()
                    });
                if (a.isWaiting() || a.isIgnored())
                    return void (a.nextVillage() ? b.analyse() : a.triggerEvent(a.getLastError()));
                if (a.settings.ignoreFullStorage && a.isFullStorage())
                    return void (a.nextVillage() ? b.analyse() : b.handleError("fullStorage"));
                if (!a.targetsLoaded())
                    return a.getTargets(function() {
                        b.analyse()
                    });
                if (!a.hasTarget())
                    return void (a.nextVillage() ? b.analyse() : a.triggerEvent("Farm/noTargets"));
                a.nextTarget(!0),
                a.checkPresets(function() {
                    if (c.countCommands() >= a.settings.commandsPerVillage)
                        return b.handleError("commandLimit");
                    var d = b.getPreset();
                    if (d.error)
                        return b.handleError(d.error);
                    b.getPresetNext(d),
                    b.send(d)
                })
            }
        }
        ,
        e.prototype.handleError = function(b) {
            a.setLastError(b || this.preventNextCommand),
            this.preventNextCommand = !1;
            var c = a.getSelectedVillage()
              , d = c.id;
            switch (a.getLastError()) {
            case "timeLimit":
                a.nextTarget(),
                this.analyse();
                break;
            case "noUnits":
                if (a.triggerEvent("Farm/noUnits", [c]),
                a.setWaitingVillage(d, "units"),
                a.isSingleVillage())
                    return void (0 === c.countCommands() ? a.triggerEvent("Farm/noUnitsNoCommands") : (a.setGlobalWaiting(),
                    a.settings.stepCycle && a.cycle.endStep()));
                a.nextVillage() ? this.analyse() : a.setGlobalWaiting();
                break;
            case "commandLimit":
                a.setWaitingVillage(d, "commands");
                var e = a.isSingleVillage()
                  , f = a.isAllWaiting();
                if (e || f) {
                    var g = e ? "Farm/commandLimit/single" : "Farm/commandLimit/multi";
                    if (a.triggerEvent(g, [c]),
                    a.setGlobalWaiting(),
                    a.settings.stepCycle)
                        return a.cycle.endStep()
                }
                a.nextVillage(),
                this.analyse();
                break;
            case "fullStorage":
                if (a.setWaitingVillage(d, "fullStorage"),
                a.isSingleVillage()) {
                    if (a.setGlobalWaiting(),
                    a.settings.stepCycle)
                        return a.cycle.endStep();
                    a.triggerEvent("Farm/fullStorage")
                }
            }
        }
        ,
        e.prototype.getPreset = function(b) {
            for (var c = !1, d = b || a.getSelectedVillage().units, e = a.getSelectedPresets(), f = 0; f < e.length; f++) {
                var g = e[f]
                  , h = !0;
                for (var i in g.units)
                    d[i].in_town < g.units[i] && (h = !1);
                if (h) {
                    if (this.checkPresetTime(g))
                        return g;
                    c = !0
                } else
                    ;
            }
            return {
                error: c ? "timeLimit" : "noUnits"
            }
        }
        ,
        e.prototype.getPresetNext = function(b) {
            var c = angular.copy(a.getSelectedVillage().units)
              , d = b.units;
            for (var e in d)
                c[e].in_town -= d[e];
            var f = this.getPreset(c);
            f.error && (this.preventNextCommand = f.error)
        }
        ,
        e.prototype.checkPresetTime = function(c) {
            var e = a.getSelectedTarget()
              , f = l.calculateTravelTime(c, {
                barbarian: !e.pid,
                officers: !1
            })
              , g = a.getSelectedVillage().position
              , h = {
                x: e.x,
                y: e.y
            }
              , i = d.actualDistance(g, h)
              , j = l.getTravelTimeForDistance(c, f, i, "attack");
            return b.time2seconds(a.settings.maxTravelTime) > j
        }
        ,
        e.prototype.send = function(c, d) {
            var e = Date.now();
            if (i && e - i < 100)
                return !1;
            if (i = e,
            !this.running)
                return !1;
            var h, j, k = this, l = a.getSelectedVillage();
            return k.simulate(),
            h = k.onCommandError(function() {
                j(),
                l.updateCommands(function() {
                    k.analyse()
                })
            }),
            j = k.onCommandSend(function() {
                h(),
                a.nextTarget();
                var c;
                c = b.randomSeconds(a.settings.randomBase),
                c = 100 + 1e3 * c,
                k.timeoutId = setTimeout(function() {
                    if (k.preventNextCommand)
                        return k.handleError();
                    k.analyse()
                }, c),
                a.updateActivity()
            }),
            f.emit(g.SEND_PRESET, {
                start_village: l.id,
                target_village: a.getSelectedTarget().id,
                army_preset_id: c.id,
                type: "attack"
            }),
            !0
        }
        ,
        e.prototype.onCommandSend = function(b) {
            var d = a.getSelectedVillage()
              , e = angular.copy(d.units)
              , f = c.$on(h.VILLAGE_UNIT_INFO, function(c, g) {
                if (d.id !== g.village_id)
                    return !1;
                var h = d.units;
                if (angular.equals(e, h))
                    return !1;
                a.triggerEvent("Farm/sendCommand", [d, a.getSelectedTarget()]),
                f(),
                b()
            });
            return f
        }
        ,
        e.prototype.onCommandError = function(b) {
            var d = c.$on(h.MESSAGE_ERROR, function(c, e) {
                return !(!e.cause || !e.code) && ("Command/sendPreset" === e.cause && ("Command/attackLimitExceeded" === e.code && (a.triggerEvent("Farm/sendCommandError", [e.code]),
                d(),
                void b())))
            });
            return d
        }
        ,
        e.prototype.simulate = function(b) {
            !function() {
                f.emit(g.GET_ATTACKING_FACTOR, {
                    target_id: a.getSelectedTarget().id
                })
            }(),
            b && b()
        }
        ,
        e
    }),
    define("two/farm/cycle", ["two/farm", "two/locale", "two/utils", "two/eventQueue"], function(a, b, c, d) {
        var e = []
          , f = null
          , g = {};
        g.intervalEnabled = function() {
            return !!g.getInterval()
        }
        ,
        g.startContinuous = function() {
            if (a.commander = a.createCommander(),
            a.commander.running = !0,
            a.triggerEvent("Farm/start"),
            a.getNotifsEnabled() && c.emitNotif("success", b("farm", "general.started")),
            !a.getFreeVillages().length)
                return void (a.isSingleVillage() ? a.isFullStorage() ? a.triggerEvent("Farm/fullStorage") : a.triggerEvent("Farm/noUnits") : a.triggerEvent("Farm/noVillages"));
            a.setLeftVillages(a.getFreeVillages()),
            a.commander.analyse()
        }
        ,
        g.startStep = function(f) {
            a.commander = a.createCommander(),
            a.commander.running = !0,
            a.tempDisableNotifs(function() {
                a.triggerEvent("Farm/start")
            });
            var h = a.getFreeVillages();
            if (0 === h.length)
                return void (g.intervalEnabled() ? (a.triggerEvent("Farm/stepCycle/next/noVillages"),
                g.setNextCycle()) : (a.triggerEvent("Farm/stepCycle/next/noVillages"),
                a.tempDisableNotifs(function() {
                    a.pause()
                })));
            f ? d.bind("Farm/stepCycle/restart") : a.getNotifsEnabled() && c.emitNotif("success", b("farm", "general.started")),
            e = h,
            a.commander.analyse()
        }
        ,
        g.endStep = function() {
            return g.intervalEnabled() ? (a.triggerEvent("Farm/stepCycle/next"),
            a.breakCommander(),
            g.setNextCycle()) : (a.triggerEvent("Farm/stepCycle/end"),
            a.tempDisableNotifs(function() {
                a.pause()
            })),
            !1
        }
        ,
        g.setNextCycle = function() {
            var a = g.getInterval();
            f = setTimeout(function() {
                g.startStep(!0)
            }, a)
        }
        ,
        g.nextVillage = function() {
            var b = e.shift();
            return b ? a.getFreeVillages().some(function(a) {
                return a.id === b.id
            }) ? (a.setSelectedVillage(b),
            a.triggerEvent("Farm/nextVillage", [b]),
            !0) : g.nextVillage() : g.endStep()
        }
        ,
        g.getInterval = function() {
            var b = a.settings.stepCycleInterval
              , c = !1;
            return !!b && (b = b.split(/\:/g).map(function(a) {
                return isNaN(c) && (c = !0),
                parseInt(a, 10)
            }),
            !c && (b = 1e3 * b[0] * 60 * 60 + 1e3 * b[1] * 60 + 1e3 * b[2]))
        }
        ,
        g.getTimeoutId = function() {
            return f
        }
        ,
        a.cycle = g
    }),
    define("two/farm/Village", ["models/CommandListModel", "models/CommandModel", "conf/village"], function(a, b, c) {
        function d(a) {
            this.original = a,
            this.id = a.data.villageId,
            this.x = a.data.x,
            this.y = a.data.y,
            this.name = a.data.name,
            this.units = a.unitInfo.units,
            this.position = a.getPosition()
        }
        return d.prototype.countCommands = function() {
            return this.original.getCommandListModel().getOutgoingCommands(!0).length
        }
        ,
        d.prototype.updateCommands = function(c) {
            var d = this;
            f.emit(g.GET_OWN_COMMANDS, {
                village_id: d.id
            }, function(e) {
                for (var f = new a([],d.id), g = 0; g < e.commands.length; g++) {
                    var h = new b(e.commands[g]);
                    f.add(h)
                }
                d.original.setCommandListModel(f),
                c()
            })
        }
        ,
        d.prototype.commandsLoaded = function() {
            return this.original.isReady(c.OWN_COMMANDS)
        }
        ,
        d.prototype.unitsLoaded = function() {
            return this.original.isReady(c.UNITS)
        }
        ,
        d.prototype.loaded = function() {
            return !!this.original.isReady() && (!!this.original.isInitialized() && (this.commandsLoaded() && this.unitsLoaded()))
        }
        ,
        d.prototype.load = function(a) {
            var b = this;
            return m.ensureVillageDataLoaded(this.id, function() {
                b.original.isInitialized() || m.initializeVillage(b.original),
                a()
            })
        }
        ,
        d
    }),
    require(["two/ready", "two/farm", "two/farm/ui", "two/farm/analytics", "two/farm/cycle"], function(a, b) {
        if (b.isInitialized())
            return !1;
        a(function() {
            b.init(),
            b.interface(),
            b.analytics()
        })
    }),
    define("two/farm/ui", ["two/farm", "two/locale", "two/ui", "two/ui/buttonLink", "two/FrontButton", "two/utils", "two/eventQueue", "helper/time", "ejs"], function(a, b, c, d, f, g, h, i, j) {
        function l() {
            return w = e.getGroupList().getGroups(),
            v = b("farm", "general.disabled"),
            m = new c("FarmOverflow",{
                activeTab: "settings",
                template: '<div class="win-content message-list-wrapper searchable-list ng-scope"><header class="win-head"><h2 class="ng-binding"><#= locale("farm", "title") #> <span class="small">v<#= version #></span></h2><ul class="list-btn"><li><a href="#" class="twOverflow-close size-34x34 btn-red icon-26x26-close"></a></li></ul></header><div class="tabs tabs-bg"><div class="tabs-two-col"><div class="tab" tab="settings"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "settings") #></a></div></div></div><div class="tab" tab="log"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "logs") #></a></div></div></div></div></div><div class="win-main"><div class="box-paper footer has-footer-upper twOverflow-content-settings"><p class="center"><#= locale("farm", "settings.docs") #> <a href="https://gitlab.com/twoverflow/farmoverflow/wikis/Documentation" target="_blank"><#= locale("common", "here") #></a>.</p><form class="settings"><h5 class="twx-section collapse"><#= locale("farm", "settings.settings") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td><span class="icon-34x34-preset"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.presets") #></span></td><td><select data-setting="presetName" class="preset"></select></td></tr><tr><td><span class="icon-20x20-queue-indicator-short"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.groupIgnore") #></span></td><td><select data-setting="groupIgnore" class="ignore"></select></td></tr><tr><td><span class="icon-20x20-queue-indicator-long"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.groupInclude") #></span></td><td><select data-setting="groupInclude" class="include"></select></td></tr><tr><td><span class="icon-20x20-favourite"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.groupOnly") #></span></td><td><select data-setting="groupOnly" class="only"></select></td></tr><tr><td><span class="ff-cell-fix"><#= locale("farm", "settings.randomBase") #></span></td><td><input data-setting="randomBase" type="number" class="textfield-border" min="0" required></td></tr><tr><td><span class="ff-cell-fix"><#= locale("farm", "settings.commandsPerVillage") #></span></td><td><input data-setting="commandsPerVillage" type="number" class="textfield-border" min="0" max="50" required></td></tr><tr><td><span class="icon-34x34-name_changed"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.priorityTargets") #></span></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-priorityTargets"><input id="settings-priorityTargets" type="checkbox" data-setting="priorityTargets"></label></td></tr><tr><td><span class="ff-cell-fix"><#- locale("farm", "settings.ignoreOnLoss") #></span></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-ignoreOnLoss"><input id="settings-ignoreOnLoss" type="checkbox" data-setting="ignoreOnLoss"></label></td></tr><tr><td><span class="ff-cell-fix"><#- locale("farm", "settings.ignoreFullStorage") #></span></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-ignoreFullStorage"><input id="settings-ignoreFullStorage" type="checkbox" data-setting="ignoreFullStorage"></label></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("farm", "settings.stepCycle/header") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td><span class="ff-cell-fix"><#= locale("farm", "settings.stepCycle") #></span></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-stepCycle"><input id="settings-stepCycle" type="checkbox" data-setting="stepCycle"></label></td></tr><tr><td><span class="ff-cell-fix"><#= locale("farm", "settings.stepCycle/interval") #></span></td><td><input data-setting="stepCycleInterval" type="text" class="textfield-border" placeholder="00:00:00"></td></tr><tr><td><span class="ff-cell-fix"><#= locale("farm", "settings.stepCycle/notifs") #></span></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-stepCycle/notifs"><input id="settings-stepCycle/notifs" type="checkbox" data-setting="stepCycleNotifs"></label></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("farm", "settings.targetFilters") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td><span class="icon-26x26-double-arrow"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.minDistance") #></span></td><td><input data-setting="minDistance" type="number" class="textfield-border" min="0" max="60" required></td></tr><tr><td><span class="icon-26x26-double-arrow"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.maxDistance") #></span></td><td><input data-setting="maxDistance" type="number" class="textfield-border" min="1" max="60" required></td></tr><tr><td><span class="icon-34x34-points-per-village"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.minPoints") #></span></td><td><input data-setting="minPoints" type="number" class="textfield-border" required></td></tr><tr><td><span class="icon-34x34-points-per-village"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.maxPoints") #></span></td><td><input data-setting="maxPoints" type="number" class="textfield-border" required></td></tr><tr><td><span class="icon-26x26-time"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.maxTravelTime") #></span></td><td><input data-setting="maxTravelTime" type="text" class="textfield-border" pattern="\\d{1,2}:\\d{1,2}:\\d{1,2}" required></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("common", "logs") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td><span class="icon-26x26-info"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.eventsLimit") #></span></td><td><input data-setting="eventsLimit" type="number" class="textfield-border" min="1" required></td></tr><tr><td><#= locale("farm", "settings.eventAttack") #></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-eventAttack"><input id="settings-eventAttack" type="checkbox" data-setting="eventAttack"></label></td></tr><tr><td><#= locale("farm", "settings.eventVillageChange") #></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-eventVillageChange"><input id="settings-eventVillageChange" type="checkbox" data-setting="eventVillageChange"></label></td></tr><tr><td><#= locale("farm", "settings.eventPriorityAdd") #></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-eventPriorityAdd"><input id="settings-eventPriorityAdd" type="checkbox" data-setting="eventPriorityAdd"></label></td></tr><tr><td><#= locale("farm", "settings.eventIgnoredVillage") #></td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-eventIgnoredVillage"><input id="settings-eventIgnoredVillage" type="checkbox" data-setting="eventIgnoredVillage"></label></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("common", "others") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td><span class="icon-26x26-message-misc"></span> <span class="ff-cell-fix"><#= locale("farm", "settings.remote") #></span></td><td><input data-setting="remoteId" type="text" class="textfield-border" min="3" max="45"></td></tr><tr><td><#= locale("farm", "settings.hotkeySwitch") #></td><td><input data-setting="hotkeySwitch" type="text" class="textfield-border"></td></tr><tr><td><#= locale("farm", "settings.hotkeyWindow") #></td><td><input data-setting="hotkeyWindow" type="text" class="textfield-border"></td></tr></tbody></table></form></div><div class="box-paper footer has-footer-upper twOverflow-content-log"><div class="screen-tribe-news rich-text"><h5 class="twx-section collapse"><#= locale("common", "status") #></h5><table class="tbl-border-light tbl-news tbl-big-header"><colgroup><col width="135px"><col width="*"></colgroup><tbody><tr class="list-item"><td class="status" colspan="2" class="cell-center"><#= locale("common", "paused") #></td></tr><tr class="reduced"><td><#= locale("farm", "events.selectedVillage") #></td><td class="selected"></td></tr><tr class="reduced"><td><#= locale("farm", "events.lastAttack") #></td><td class="last"><#= locale("common", "none") #></td></tr></tbody></table><h5 class="twx-section collapse"><#= locale("common", "logs") #></h5><table class="tbl-border-light tbl-news tbl-big-header"><colgroup><col width="76px"><col></colgroup><tbody class="events"><tr class="reduced nothing"><td colspan="2"><div><span><#= locale("farm", "events.nothingYet") #></span></div></td></tr></tbody></table></div></div></div><footer class="win-foot"><ul class="list-btn list-center"><li class="twOverflow-button-settings"><a class="btn-orange btn-border save"><#= locale("common", "save") #></a></li><li class="twOverflow-button"><a class="btn-green btn-border start"><#= locale("common", "start") #></a></li></ul></footer></div>',
                replaces: {
                    version: a.version,
                    author: {
                        name: "Relaxeaza",
                        email: "mafrazzrafael@gmail.com",
                        url: "https://gitlab.com/relaxeaza",
                        gitlab_user_id: 518047
                    },
                    locale: b
                },
                css: '#FarmOverflow input[type="text"],#FarmOverflow input[type="number"],#FarmOverflow select{color:#000;min-width:70%}#FarmOverflow .info a{font-weight:bold;color:#544231}#FarmOverflow .settings .custom-select{width:70%}#FarmOverflow .settings .helper{font-weight:bold;vertical-align:-1px;font-family:helvetica;color:rgba(0,0,0,0.3)}#FarmOverflow .settings .helper:hover{color:#000}#FarmOverflow .settings [class^="icon-"]{display:inline;margin:0 9px 0 0}#FarmOverflow .settings .icon-34x34-preset,#FarmOverflow .settings .icon-26x26-time,#FarmOverflow .settings .icon-26x26-info,#FarmOverflow .settings .icon-26x26-double-arrow{zoom:.6}#FarmOverflow .settings .icon-34x34-preset:before,#FarmOverflow .settings .icon-26x26-time:before,#FarmOverflow .settings .icon-26x26-info:before,#FarmOverflow .settings .icon-26x26-double-arrow:before{-moz-transform:scale(.6)}#FarmOverflow .settings .icon-20x20-queue-indicator-short,#FarmOverflow .settings .icon-20x20-queue-indicator-long,#FarmOverflow .settings .icon-20x20-favourite{vertical-align:0;margin:0 5px 0 0}#FarmOverflow .settings .icon-34x34-preset,#FarmOverflow .settings .icon-26x26-time{vertical-align:3px}#FarmOverflow .settings .icon-26x26-double-arrow{vertical-align:4px}#FarmOverflow .settings .icon-26x26-info{vertical-align:5px}#FarmOverflow .settings .icon-34x34-points-per-village,#FarmOverflow .settings .icon-34x34-name_changed{vertical-align:6px;zoom:.5}#FarmOverflow .settings .icon-34x34-points-per-village:before,#FarmOverflow .settings .icon-34x34-name_changed:before{-moz-transform:scale(.5)}#FarmOverflow .settings .icon-26x26-message-misc{vertical-align:1px}#FarmOverflow .settings .icon-34x34-general{zoom:.5}#FarmOverflow .settings .icon-34x34-general:before{-moz-transform:scale(.5)}#FarmOverflow .settings .icon-26x26-time-spy{zoom:.7}#FarmOverflow .settings .icon-26x26-time-spy:before{-moz-transform:scale(.7)}#FarmOverflow .settings td{text-align:center}#FarmOverflow .events tr{height:30px}#FarmOverflow .events tr td.tribe-event-time{white-space:nowrap}'
            }),
            n = new f("Farmer",{
                classHover: !1,
                classBlur: !1,
                onClick: function() {
                    m.openWindow()
                }
            }),
            o = $(m.$window),
            p = o.find(".events"),
            q = o.find(".last"),
            r = o.find(".status"),
            s = o.find(".start"),
            t = o.find(".settings"),
            u = o.find(".preset"),
            x = {
                groupIgnore: o.find(".ignore"),
                groupInclude: o.find(".include"),
                groupOnly: o.find(".only")
            },
            h.bind("Farm/sendCommand", function(c, d) {
                if (r.html(b("farm", "events.attacking")),
                I(i.gameTime()),
                !a.settings.eventAttack)
                    return !1;
                F({
                    links: {
                        origin: {
                            type: "village",
                            name: g.genVillageLabel(c),
                            id: c.id
                        },
                        target: {
                            type: "village",
                            name: g.genVillageLabel(d),
                            id: d.id
                        }
                    },
                    icon: "attack-small",
                    type: "sendCommand"
                })
            }),
            h.bind("Farm/nextVillage", function(b) {
                if (H(),
                !a.settings.eventVillageChange)
                    return !1;
                F({
                    links: {
                        village: {
                            type: "village",
                            name: g.genVillageLabel(b),
                            id: b.id
                        }
                    },
                    icon: "village",
                    type: "nextVillage"
                })
            }),
            h.bind("Farm/ignoredVillage", function(b) {
                if (!a.settings.eventIgnoredVillage)
                    return !1;
                F({
                    links: {
                        target: {
                            type: "village",
                            name: g.genVillageLabel(b),
                            id: b.id
                        }
                    },
                    icon: "check-negative",
                    type: "ignoredVillage"
                })
            }),
            h.bind("Farm/priorityTargetAdded", function(b) {
                if (!a.settings.eventPriorityAdd)
                    return !1;
                F({
                    links: {
                        target: {
                            type: "village",
                            name: g.genVillageLabel(b),
                            id: b.id
                        }
                    },
                    icon: "parallel-recruiting",
                    type: "priorityTargetAdded"
                })
            }),
            h.bind("Farm/noPreset", function() {
                F({
                    icon: "info",
                    type: "noPreset"
                }),
                r.html(b("common", "paused"))
            }),
            h.bind("Farm/noUnits", function() {
                a.isSingleVillage() && r.html(b("farm", "events.noUnits"))
            }),
            h.bind("Farm/noUnitsNoCommands", function() {
                r.html(b("farm", "events.noUnitsNoCommands"))
            }),
            h.bind("Farm/start", function() {
                r.html(b("farm", "events.attacking"))
            }),
            h.bind("Farm/pause", function() {
                r.html(b("common", "paused"))
            }),
            h.bind("Farm/noVillages", function() {
                r.html(b("farm", "events.noVillages"))
            }),
            h.bind("Farm/stepCycle/end", function() {
                r.html(b("farm", "events.stepCycle/nnd"))
            }),
            h.bind("Farm/stepCycle/next", function() {
                var c = i.gameTime() + a.cycle.getInterval();
                r.html(b("farm", "events.stepCycle/next", {
                    time: g.formatDate(c)
                }))
            }),
            h.bind("Farm/stepCycle/next/noVillages", function() {
                var c = i.gameTime() + a.cycle.getInterval();
                r.html(b("farm", "events.stepCycle/next/noVillages", {
                    time: g.formatDate(c)
                }))
            }),
            h.bind("Farm/villagesUpdate", function() {
                H()
            }),
            h.bind("Farm/loadingTargets/start", function() {
                r.html(b("farm", "events.loadingTargets"))
            }),
            h.bind("Farm/loadingTargets/end", function() {
                r.html(b("farm", "events.analyseTargets"))
            }),
            h.bind("Farm/attacking", function() {
                r.html(b("farm", "events.attacking"))
            }),
            h.bind("Farm/commandLimit/single", function() {
                r.html(b("farm", "events.commandLimit"))
            }),
            h.bind("Farm/commandLimit/multi", function() {
                r.html(b("farm", "events.noVillages"))
            }),
            h.bind("Farm/resetEvents", function() {
                y = 0,
                D()
            }),
            h.bind("Farm/groupsChanged", function() {
                J()
            }),
            h.bind("Farm/presets/loaded", function() {
                K()
            }),
            h.bind("Farm/presets/change", function() {
                K()
            }),
            h.bind("Farm/start", function() {
                s.html(b("common", "pause")),
                s.removeClass("btn-green").addClass("btn-red"),
                n.$elem.removeClass("btn-green").addClass("btn-red")
            }),
            h.bind("Farm/pause", function() {
                s.html(b("common", "start")),
                s.removeClass("btn-red").addClass("btn-green"),
                n.$elem.removeClass("btn-red").addClass("btn-green")
            }),
            h.bind("Farm/settingError", function(a, c) {
                var d = "settingError." + a;
                g.emitNotif("error", b("farm", d, c))
            }),
            h.bind("Farm/fullStorage", function() {
                r.html(b("farm", "events.fullStorage"))
            }),
            e.getPresetList().isLoaded() && K(),
            C(),
            E(),
            J(),
            H(),
            I(),
            D(),
            m
        }
        var m, n, o, p, q, r, s, t, u, v, w, x, y = 1, z = /(\(|\{|\[|\"|\')[^\)\}\]\"\']+(\)|\}|\]|\"|\')/, A = function(a) {
            o.find("[data-setting]").forEach(function(b) {
                var c = b.dataset.setting;
                a(b, c)
            })
        }, B = function() {
            var c = {};
            return A(function(b, d) {
                switch (a.settingsMap[d].inputType) {
                case "text":
                    c[d] = "number" === b.type ? parseInt(b.value, 10) : b.value;
                    break;
                case "select":
                    c[d] = b.dataset.value;
                    break;
                case "checkbox":
                    c[d] = b.checked
                }
            }),
            !!a.updateSettings(c) && (g.emitNotif("success", b("farm", "settings.saved")),
            !0)
        }, C = function() {
            A(function(b, c) {
                switch (a.settingsMap[c].inputType) {
                case "text":
                    b.value = a.settings[c];
                    break;
                case "select":
                    b.dataset.value = a.settings[c];
                    break;
                case "checkbox":
                    a.settings[c] && (b.checked = !0,
                    b.parentElement.classList.add("icon-26x26-checkbox-checked"))
                }
            })
        }, D = function() {
            var b = a.getLastEvents();
            b.length > 0 && p.find(".nothing").remove(),
            b.some(function(b) {
                return y >= a.settings.eventsLimit || !(!a.settings.eventAttack && "sendCommand" === b.type) && (!(!a.settings.eventVillageChange && "nextVillage" === b.type) && (!(!a.settings.eventPriorityAdd && "priorityTargetAdded" === b.type) && (!(!a.settings.eventIgnoredVillage && "ignoredVillage" === b.type) && void F(b, !0))))
            })
        }, E = function() {
            k.add(a.settings.hotkeySwitch, function() {
                a.switch()
            }),
            k.add(a.settings.hotkeyWindow, function() {
                m.openWindow()
            }),
            s.on("click", function() {
                a.switch()
            }),
            o.find(".save").on("click", function(a) {
                B()
            })
        }, F = function(b, c) {
            p.find(".nothing").remove(),
            y >= a.settings.eventsLimit && p.find("tr:last-child").remove();
            var d = a.getLastEvents();
            d.length >= a.settings.eventsLimit && d.pop(),
            G(p, b, c),
            y++,
            c || (b.timestamp = i.gameTime(),
            d.unshift(b),
            a.setLastEvents(d))
        }, G = function(a, c, e) {
            var f = {}
              , h = {}
              , k = c.links
              , l = c.timestamp || i.gameTime()
              , n = document.createElement("tr");
            if (k) {
                for (var o in k)
                    f[o] = d(k[o].type, k[o].name, k[o].id),
                    h[o] = '<a id="' + f[o].id + '"></a>';
                c.content = b("farm", "events." + c.type, h)
            }
            var p = g.formatDate(l)
              , q = g.formatDate(l, "HH:mm:ss");
            if (n.innerHTML = j.render('<td class="tribe-event-time" tooltip="<#= longDate #>"><#= shortDate #></td><td class="tribe-event-detail"><span class="icon-bg-black icon-26x26-<#= icon #>"></span><div class="text-tribe-news"><span><#- content #></span></div></td>', {
                longDate: p,
                shortDate: q,
                icon: c.icon,
                content: c.content
            }),
            k)
                for (var o in f)
                    n.querySelector("#" + f[o].id).replaceWith(f[o].elem);
            a[e ? "append" : "prepend"](n),
            m.isVisible("log") && m.recalcScrollbar(),
            m.setTooltips()
        }, H = function() {
            var c = o.find(".selected")
              , e = a.getSelectedVillage();
            if (!e)
                return c.html(b("common", "none"));
            var f = d("village", g.genVillageLabel(e), e.id);
            c.html(""),
            c.append(f.elem)
        }, I = function(b) {
            if (!b && -1 === (b = a.getLastAttack()))
                return !1;
            q.html(g.formatDate(b))
        }, J = function() {
            for (var b in x) {
                var c = x[b].find(".custom-select-handler").html("")
                  , d = x[b].find(".custom-select-data").html("");
                L(d, "0");
                for (var e in w) {
                    var f = w[e].name
                      , g = a.settings[b];
                    "" === g || "0" === g ? (c.html(v),
                    x[b][0].dataset.name = v,
                    x[b][0].dataset.value = "") : g == e && (c.html(f),
                    x[b][0].dataset.name = f,
                    x[b][0].dataset.value = e),
                    M(d, {
                        name: f,
                        value: e,
                        icon: w[e].icon
                    }),
                    x[b].append(d)
                }
                a.settings[b] || c.html(v)
            }
        }, K = function() {
            var b = {}
              , c = e.getPresetList().presets
              , d = !1
              , f = a.settings.presetName
              , g = u.find(".custom-select-handler").html("")
              , h = u.find(".custom-select-data").html("");
            L(h);
            for (var i in c) {
                var j = c[i].name.replace(z, "").trim();
                j in b || j && ("" === f ? (g.html(v),
                u[0].dataset.name = v,
                u[0].dataset.value = "") : f === j && (g.html(j),
                u[0].dataset.name = j,
                u[0].dataset.value = j,
                d = !0),
                M(h, {
                    name: j,
                    value: j,
                    icon: "size-26x26 icon-26x26-preset"
                }),
                b[j] = !0)
            }
            d || (g.html(v),
            u[0].dataset.name = v,
            u[0].dataset.value = "")
        }, L = function(a, b) {
            var c = document.createElement("span");
            c.dataset.name = v,
            c.dataset.value = b || "",
            a.append(c)
        }, M = function(a, b) {
            var c = document.createElement("span");
            for (var d in b)
                c.dataset[d] = b[d];
            a.append(c)
        };
        a.interface = function() {
            a.interface = l()
        }
    }),
    define("two/minimap", ["two/locale", "two/eventQueue", "two/ready", "Lockr", "struct/MapData", "conf/conf", "helper/time", "helper/mapconvert", "cdn"], function(b, d, f, g, i, j, k, l, m) {
        var n, o, p, q, r, s, t, u, v, w, x, y, z = 5, A = 1, B = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, C = {
            village: {},
            character: {},
            tribe: {}
        }, D = {}, E = null, F = {}, G = {}, H = !0, I = function(a) {
            var b = ca.getVillageBlock()
              , c = ca.getVillageAxisOffset()
              , d = Math.ceil(F.x + a.offsetX)
              , e = Math.ceil(F.y + a.offsetY);
            return Math.floor(e / b % 2) % 2 && (d -= c),
            d -= d % b,
            e -= e % b,
            {
                x: Math.ceil((d - G.x / 2) / b),
                y: Math.ceil((e - G.y / 2) / b)
            }
        }, J = function(a, b) {
            return {
                x: a / j.TILESIZE.x,
                y: b / j.TILESIZE.y / j.TILESIZE.off
            }
        }, K = function(a, b) {
            b = 1 / (b || 1);
            var c = J(a[0] * b, a[1] * b)
              , d = J(a[2] * b, a[3] * b);
            return [c.x - 1, c.y - 1, d.x + 3 || 1, d.y + 3 || 1]
        }, L = function() {
            var a = !1
              , b = {};
            s.addEventListener("mousedown", function(c) {
                c.preventDefault(),
                H = !0,
                a = !0,
                b = {
                    x: F.x + c.pageX,
                    y: F.y + c.pageY
                },
                E && (d.trigger("minimap/villageClick", [E, c]),
                3 === c.which && ba(E))
            }),
            s.addEventListener("mouseup", function() {
                a = !1,
                b = {},
                H || d.trigger("minimap/stop-move")
            }),
            s.addEventListener("mousemove", function(c) {
                H = !1,
                a && (F.x = b.x - c.pageX,
                F.y = b.y - c.pageY,
                d.trigger("minimap/start-move"));
                var e = I(c);
                if (e.x in C.village && e.y in C.village[e.x])
                    return Z(e, c);
                $()
            }),
            s.addEventListener("mouseleave", function() {
                E && $(),
                d.trigger("minimap/mouseLeave")
            }),
            s.addEventListener("click", function(a) {
                if (!H)
                    return !1;
                var b = I(a);
                c.$broadcast(h.MAP_CENTER_ON_POSITION, b.x, b.y, !0),
                X(2, b.x, b.y)
            }),
            s.addEventListener("contextmenu", function(a) {
                return a.preventDefault(),
                !1
            })
        }, M = function(a, b) {
            for (var c, d, e, f, g = v.getId(), h = v.getTribeId(), i = ca.getVillageBlock(), j = ca.getVillageSize(), k = ca.getVillageAxisOffset(), l = 0; l < a.length; l++)
                c = a[l],
                c.id < 0 || (b ? (f = b,
                d = c[0] * i,
                e = c[1] * i,
                c[1] % 2 && (d += k)) : (d = c.x * i,
                e = c.y * i,
                c.y % 2 && (d += k),
                f = null === c.character_id ? c.id in n.village ? n.village[c.id].color : ca.defaultColors.barbarian : c.character_id === g ? c.id === x.getId() ? ca.defaultColors.selected : c.character_id in n.character ? n.character[c.character_id].color : ca.defaultColors.player : c.id in n.village ? n.village[c.id].color : c.character_id in n.character ? n.character[c.character_id].color : c.tribe_id in n.tribe ? n.tribe[c.tribe_id].color : h && h === c.tribe_id ? ca.defaultColors.tribe : w ? w.isAlly(c.tribe_id) ? ca.defaultColors.ally : w.isEnemy(c.tribe_id) ? ca.defaultColors.enemy : w.isNAP(c.tribe_id) ? ca.defaultColors.friendly : ca.defaultColors.ugly : ca.defaultColors.ugly),
                r.fillStyle = f,
                r.fillRect(d, e, j, j))
        }, N = function(a) {
            var b, c = m.getPath(j.getMapPath());
            b = new XMLHttpRequest,
            b.open("GET", c, !0),
            b.responseType = "arraybuffer",
            b.addEventListener("load", function(c) {
                a(b.response)
            }, !1),
            b.send()
        }, O = function() {
            var a, b, c, d = ca.getVillageBlock(), e = Math.round(d / 2);
            N(function(f) {
                for (y = new DataView(f),
                b = 1; b < 999; b++)
                    for (c = 1; c < 999; c++)
                        a = l.toTile(y, b, c),
                        a.key.b && (a.key.c ? (r.fillStyle = "rgba(255,255,255,0.8)",
                        r.fillRect(b * d + e - 1, c * d + e - 1, 3, 1),
                        r.fillRect(b * d + e, c * d + e - 2, 1, 3)) : (r.fillStyle = "rgba(255,255,255,1)",
                        r.fillRect(b * d + e, c * d + e - 1, 1, 1)))
            })
        }, P = function() {
            M(i.getTowns())
        }, Q = function() {
            var a, b, c, d, e, f = ca.getVillageBlock(), g = ca.getVillageSize(), h = ca.getVillageAxisOffset();
            for (a in D)
                for (c = 0; c < D[a].length; c++)
                    b = D[a][c],
                    d = a * f,
                    e = b * f,
                    b % 2 && (d += h),
                    r.fillStyle = ca.defaultColors.ghost,
                    r.fillRect(d, e, g, g)
        }, R = function(a) {
            S(),
            p.drawImage(q, -a.x, -a.y)
        }, S = function() {
            p.clearRect(0, 0, o.width, o.height)
        }, T = function(a) {
            U();
            var b = ca.getVillageBlock()
              , c = ca.getLineSize()
              , d = ca.getMapPosition()
              , e = (d[0] + d[2] - 2) * b - a.x
              , f = (d[1] + d[3] - 2) * b - a.y;
            t.fillStyle = "rgba(255,255,255,0.25)",
            t.fillRect(0 | e, 0, 1, c),
            t.fillRect(0, 0 | f, c, 1)
        }, U = function() {
            t.clearRect(0, 0, s.width, s.height)
        }, V = function() {
            var a = {
                id: x.getId(),
                x: x.getX(),
                y: x.getY()
            };
            x = v.getSelectedVillage(),
            M([{
                character_id: v.getId(),
                id: a.id,
                x: a.x,
                y: a.y
            }, {
                character_id: v.getId(),
                id: x.getId(),
                x: x.getX(),
                y: x.getY()
            }])
        }, W = function() {
            if (ca.interface.isVisible("minimap")) {
                var b = {
                    x: F.x - G.x / 2,
                    y: F.y - G.y / 2
                };
                R(b),
                T(b)
            }
            a.requestAnimationFrame(W)
        }, X = function(a, b, c) {
            var d = 25 * a
              , e = (b || x.getX()) - d / 2
              , f = (c || x.getY()) - d / 2;
            i.loadTownDataAsync(e, f, d, d, function() {})
        }, Y = function(a) {
            for (var b = 0; b < a.length; b++) {
                var c = a[b];
                c.id < 0 || (c.x in C.village || (C.village[c.x] = {}),
                c.x in D || (D[c.x] = []),
                C.village[c.x][c.y] = c.character_id || 0,
                D[c.x].push(c.y),
                c.character_id && (c.character_id in C.character ? C.character[c.character_id].push([c.x, c.y]) : C.character[c.character_id] = [[c.x, c.y]],
                c.tribe_id && (c.tribe_id in C.tribe ? C.tribe[c.tribe_id].push(c.character_id) : C.tribe[c.tribe_id] = [c.character_id])))
            }
            g.set("minimap-cacheVillages", D)
        }, Z = function(a, b) {
            if (E) {
                if (E.x === a.x && E.y === a.y)
                    return !1;
                $()
            }
            d.trigger("minimap/villageHover", [i.getTownAt(a.x, a.y), b]),
            E = {
                x: a.x,
                y: a.y
            };
            var c = C.village[a.x][a.y];
            _(c ? C.character[c] : [[a.x, a.y]])
        }, $ = function() {
            if (!E)
                return !1;
            var a = C.village[E.x][E.y];
            aa(a ? C.character[a] : [[E.x, E.y]]),
            E = !1,
            d.trigger("minimap/villageBlur")
        }, _ = function(a) {
            M(a, ca.defaultColors.quickHighlight)
        }, aa = function(a) {
            for (var b = [], c = 0; c < a.length; c++)
                b.push(i.getTownAt(a[c][0], a[c][1]));
            M(b)
        }, ba = function(a) {
            var b = C.village[a.x][a.y];
            if (!b)
                return !1;
            ca.addHighlight({
                type: "character",
                id: b
            }, ca.colorPalette.random())
        }, ca = {};
        return ca.version = "1.2.0",
        ca.defaultColors = {
            selected: "#ffffff",
            barbarian: "#969696",
            player: "#f0c800",
            tribe: "#0000DB",
            ally: "#00a0f4",
            enemy: "#ED1212",
            friendly: "#BF4DA4",
            ugly: "#A96534",
            ghost: "#3E551C",
            quickHighlight: "#ffffff"
        },
        ca.colorPalette = ["#000000", "#010067", "#d5ff00", "#ff0056", "#9e008e", "#0e4ca1", "#ffe502", "#005f39", "#00ff00", "#95003a", "#ff937e", "#a42400", "#001544", "#91d0cb", "#620e00", "#6b6882", "#0000ff", "#007db5", "#6a826c", "#00ae7e", "#c28c9f", "#be9970", "#008f9c", "#5fad4e", "#ff0000", "#ff00f6", "#ff029d", "#683d3b", "#ff74a3", "#968ae8", "#98ff52", "#a75740", "#01fffe", "#ffeee8", "#fe8900", "#bdc6ff", "#01d0ff", "#bb8800", "#7544b1", "#a5ffd2", "#ffa6fe", "#774d00", "#7a4782", "#263400", "#004754", "#43002c", "#b500ff", "#ffb167", "#ffdb66", "#90fb92", "#7e2dd2", "#bdd393", "#e56ffe", "#deff74", "#00ff78", "#009bff", "#006401", "#0076ff", "#85a900", "#00b917", "#788231", "#00ffc6", "#ff6e41", "#e85ebe"],
        ca.setVillageSize = function(a) {
            z = a
        }
        ,
        ca.getVillageSize = function() {
            return z
        }
        ,
        ca.setVillageMargin = function(a) {
            A = a
        }
        ,
        ca.getVillageMargin = function() {
            return A
        }
        ,
        ca.getVillageBlock = function() {
            return z + A
        }
        ,
        ca.getLineSize = function() {
            return 1e3 * (z + A)
        }
        ,
        ca.getVillageAxisOffset = function() {
            return Math.round(z / 2)
        }
        ,
        ca.addHighlight = function(a, b) {
            var c = !1;
            if (!a.type || !a.id)
                return d.trigger("minimap/highlight/add/error/no-entry"),
                !1;
            if (!B.test(b))
                return d.trigger("minimap/highlight/add/error/invalid-color"),
                !1;
            n[a.type].hasOwnProperty(a.id) && (c = !0);
            var e = {
                color: b
            };
            return "village" === a.type && (e.x = a.x,
            e.y = a.y),
            n[a.type][a.id] = e,
            g.set("minimap-highlights", n),
            c ? d.trigger("minimap/highlight/update", [a, b]) : d.trigger("minimap/highlight/add", [a, b]),
            P(),
            !0
        }
        ,
        ca.removeHighlight = function(a) {
            return !!n[a.type][a.id] && (delete n[a.type][a.id],
            g.set("minimap-highlights", n),
            d.trigger("minimap/highlight/remove", [a]),
            P(),
            !0)
        }
        ,
        ca.getHighlight = function(a, b) {
            return !!n[a].hasOwnProperty(b) && n[a][b]
        }
        ,
        ca.getHighlights = function() {
            return n
        }
        ,
        ca.eachHighlight = function(a) {
            for (var b in n)
                for (var c in n[b])
                    a(b, c, n[b][c])
        }
        ,
        ca.setViewport = function(a) {
            o = a,
            p = o.getContext("2d")
        }
        ,
        ca.setCross = function(a) {
            s = a,
            t = s.getContext("2d")
        }
        ,
        ca.setCurrentPosition = function(a, b) {
            var c = ca.getVillageBlock();
            F.x = a * c + 50,
            F.y = b * c + (1e3 - (document.body.clientHeight - 238) / 2) + 50
        }
        ,
        ca.getMapPosition = function() {
            var b = a.twx.game.map.engine.getView();
            return K([-b.x, -b.y, u.width / 2, u.height / 2], b.z)
        }
        ,
        ca.init = function() {
            b.create("minimap", {
                en: {
                    title: "Minimap",
                    minimap: "Minimap",
                    highlights: "Highlights",
                    add: "Add highlight",
                    remove: "Remove highlight",
                    "entry/id": "Village/player/tribe",
                    "highlight/add/success": "Highlight added",
                    "highlight/add/error": "Specify a highlight first",
                    "highlight/update/success": "Highlight updated",
                    "highlight/remove/success": "Highlight removed",
                    "highlight/villages": "Villages",
                    "highlight/players": "Players",
                    "highlight/tribes": "Tribes",
                    "highlight/add/error/exists": "Highlight already exists!",
                    "highlight/add/error/no-entry": "Select a village/player/tribe first!",
                    "highlight/add/error/invalid-color": "Invalid color!",
                    village: "Village",
                    player: "Player",
                    tribe: "Tribe",
                    color: "Color (Hex)"
                },
                pl: {
                    title: "Minimapa",
                    minimap: "Kartograf",
                    highlights: "Podświetlenie",
                    add: "Dodaj podświetlenie",
                    remove: "Usuń podświetlenie",
                    "entry/id": "Wioska/gracz/plemie",
                    "highlight/add/success": "Podświetlenie dodane",
                    "highlight/add/error": "Najpierw sprecyzuj podświetlenie",
                    "highlight/update/success": "Podświetlenie zaktualizowane",
                    "highlight/remove/success": "Podświetlenie usunięte",
                    "highlight/villages": "Wioski",
                    "highlight/players": "Gracze",
                    "highlight/tribes": "Plemiona",
                    "highlight/add/error/exists": "Podświetlenie już istnieje!",
                    "highlight/add/error/no-entry": "Najpierw wybierz wioskę/gracza/plemię!",
                    "highlight/add/error/invalid-color": "Nieprawidłowy kolor!",
                    village: "Wioska",
                    player: "Gracz",
                    tribe: "Plemię",
                    color: "Kolor (Hex)"
                },
                pt: {
                    title: "Minimap",
                    minimap: "Minimapa",
                    highlights: "Marcações",
                    add: "Adicionar marcação",
                    remove: "Remover marcação",
                    "entry/id": "Aldeia/jogador/tribo",
                    "highlight/add/success": "Marcação adicionada",
                    "highlight/add/error": "Especifique uma marcação primeiro",
                    "highlight/update/success": "Marcação atualizada",
                    "highlight/remove/success": "Marcação removida",
                    "highlight/villages": "Aldeias",
                    "highlight/players": "Jogadores",
                    "highlight/tribes": "Tribos",
                    "highlight/add/error/exists": "Marcação já existe!",
                    "highlight/add/error/no-entry": "Selecione uma aldeia/jogador/tribo primeiro!",
                    "highlight/add/error/invalid-color": "Cor inválida!",
                    village: "Aldeia",
                    player: "Jogador",
                    tribe: "Tribo",
                    color: "Cor (Hex)"
                }
            }, "en"),
            ca.initialized = !0,
            q = document.createElement("canvas"),
            r = q.getContext("2d"),
            n = g.get("minimap-highlights", {
                village: {},
                character: {},
                tribe: {}
            }, !0)
        }
        ,
        ca.run = function() {
            if (!ca.interfaceInitialized)
                throw new Error("Minimap interface not initialized");
            f(function() {
                u = document.getElementById("main-canvas"),
                v = e.getSelectedCharacter(),
                w = v.getTribeRelations(),
                D = g.get("minimap-cacheVillages", {}, !0);
                var a = ca.getVillageBlock();
                F.x = 500 * a,
                F.y = 500 * a,
                G.x = 686,
                G.y = 2e3,
                o.setAttribute("width", G.x),
                o.setAttribute("height", G.y),
                p.imageSmoothingEnabled = !1,
                q.setAttribute("width", 1e3 * a),
                q.setAttribute("height", 1e3 * a),
                q.imageSmoothingEnabled = !1,
                s.setAttribute("width", G.x),
                s.setAttribute("height", G.y),
                t.imageSmoothingEnabled = !1,
                x = v.getSelectedVillage(),
                F.x = x.getX() * a,
                F.y = x.getY() * a,
                O(),
                L(),
                Q(),
                P(),
                Y(i.getTowns()),
                X(2),
                W(),
                c.$on(h.MAP_VILLAGE_DATA, function(a, b) {
                    M(b.villages),
                    Y(b.villages)
                }),
                c.$on(h.VILLAGE_SELECTED_CHANGED, function() {
                    V()
                }),
                c.$on(h.TRIBE_RELATION_CHANGED, function(a, b) {
                    P()
                })
            }, ["initial_village", "tribe_relations"])
        }
        ,
        ca
    }),
    define("two/minimap/data", ["two/minimap"], function(a) {
        var b = {};
        a.data = b
    }),
    require(["two/ready", "two/minimap", "two/minimap/data", "two/minimap/ui"], function(a, b) {
        if (b.initialized)
            return !1;
        a(function() {
            b.init(),
            b.interface(),
            b.run()
        })
    }),
    define("two/minimap/ui", ["two/minimap", "two/locale", "two/ui", "two/ui/autoComplete", "two/FrontButton", "two/utils", "two/eventQueue", "ejs", "struct/MapData", "cdn"], function(a, b, d, e, j, k, l, m, n, o) {
        var p, q, r, s, t, u, v, w, x, y, z, A, B, C, D = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, E = {}, F = function(a, b) {
            f.emit(g.TRIBE_GET_PROFILE, {
                tribe_id: a
            }, b)
        }, G = function(a, b) {
            f.emit(g.CHAR_GET_PROFILE, {
                character_id: a
            }, b)
        }, H = function(a, b, c) {
            n.loadTownDataAsync(a, b, 1, 1, c)
        }, I = function(c, d, e) {
            e && s[c.type].find("[id$=" + c.id + "]").remove();
            var f = document.createElement("tr");
            f.id = c.type + "-" + c.id,
            f.innerHTML = m.render('<td class="entry-icon"><span class="icon-26x26-rte-<#= type #>"></span></td><td class="entry-name"></td><td><input class="entry-color" style="background:<#= color #>" disabled="disabled"></td><td><a href="#" class="entry-remove size-26x26 btn-red icon-20x20-close" tooltip="<#= locale("minimap", "remove") #>"></a></td>', {
                type: c.type,
                id: c.id,
                color: d,
                locale: b
            }),
            s[c.type].append(f);
            var g = f.querySelector(".entry-icon")
              , h = f.querySelector(".entry-name")
              , i = f.querySelector(".entry-remove");
            g.addEventListener("click", function() {
                N(c.type, c.id)
            }),
            h.addEventListener("click", function() {
                N(c.type, c.id)
            }),
            i.addEventListener("click", function() {
                a.removeHighlight(c)
            }),
            "tribe" === c.type ? F(c.id, function(a) {
                h.innerHTML = a.name
            }) : "character" === c.type ? G(c.id, function(a) {
                h.innerHTML = a.character_name
            }) : "village" === c.type && H(c.x, c.y, function(a) {
                h.innerHTML = k.genVillageLabel(a)
            }),
            p.setTooltips()
        }, J = function(a) {
            var b = p.$window.querySelector("#" + a.type + "-" + a.id);
            b && b.remove()
        }, K = function() {
            a.eachHighlight(function(a, b, c) {
                var d = {
                    type: a,
                    id: b
                };
                "village" === a && (d.x = c.x,
                d.y = c.y),
                I(d, c.color)
            })
        }, L = function(a, b) {
            A.villageName.html(k.genVillageLabel(a)),
            A.villagePoints.html(a.points.toLocaleString()),
            a.character_id ? (A.playerName.html(a.character_name),
            A.playerPoints.html(a.character_points.toLocaleString())) : (A.playerName.html("-"),
            A.playerPoints.html("-")),
            a.tribe_id ? (A.tribeName.html(a.tribe_name + "(" + a.tribe_tag + ")"),
            A.tribePoints.html(a.tribe_points.toLocaleString())) : (A.tribeName.html("-"),
            A.tribePoints.html("-")),
            A.provinceName.html(a.province_name),
            z.css("display", ""),
            z.css("top", b.pageY - 83 + "px"),
            z.css("left", b.pageX + 80 + "px")
        }, M = function() {
            z.css("display", "none")
        }, N = function(a, b) {
            "village" === a ? i.openVillageInfo(b) : "character" === a ? i.openCharacterProfile(b) : "tribe" === a && i.openTribeProfile(b)
        }, O = function() {
            t.on("input", function() {
                var a = t.val();
                if (a.length < 2)
                    return e.hide();
                e.search(a, function(a) {
                    a.length && e.show(a, t[0], "minimap")
                })
            }),
            x.on("click", function() {
                a.addHighlight(E, w.val())
            }),
            w.on("focus", S),
            w.on("blur", function() {
                setTimeout(T, 150)
            }),
            w.on("keyup", function() {
                R(this.value)
            }),
            y.find("td").on("click", function() {
                R(this.dataset.color),
                T()
            }),
            c.$on(h.SELECT_SELECTED, function(a, b, c) {
                if ("minimap" !== b)
                    return !1;
                E.id = c.id,
                E.type = c.type,
                "village" === c.type && (E.x = c.x,
                E.y = c.y),
                u[0].className = "icon-26x26-rte-" + c.type,
                v.html(c.name)
            }),
            l.bind("minimap/highlight/add", function(a, c) {
                I(a, c),
                k.emitNotif("success", b("minimap", "highlight/add/success"))
            }),
            l.bind("minimap/highlight/update", function(a, c) {
                I(a, c, !0),
                k.emitNotif("success", b("minimap", "highlight/update/success"))
            }),
            l.bind("minimap/highlight/remove", function(a) {
                J(a),
                k.emitNotif("success", b("minimap", "highlight/remove/success"))
            }),
            l.bind("minimap/highlight/add/error/exists", function() {
                k.emitNotif("error", b("minimap", "highlight/add/error/exists"))
            }),
            l.bind("minimap/highlight/add/error/no-entry", function() {
                k.emitNotif("error", b("minimap", "highlight/add/error/no-entry"))
            }),
            l.bind("minimap/highlight/add/error/invalid-color", function() {
                k.emitNotif("error", b("minimap", "highlight/add/error/invalid-color"))
            }),
            l.bind("minimap/villageHover", L),
            l.bind("minimap/villageBlur", M),
            l.bind("minimap/mouseLeave", function() {
                M(),
                B.trigger("mouseup")
            }),
            l.bind("minimap/start-move", function() {
                M(),
                B.css("cursor", "url(" + o.getPath("/img/cursor/grab_pushed.png") + "), move")
            }),
            l.bind("minimap/stop-move", function() {
                B.css("cursor", "")
            })
        }, P = function(a) {
            var b = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);
            return b ? {
                r: parseInt(b[1], 16),
                g: parseInt(b[2], 16),
                b: parseInt(b[3], 16)
            } : null
        }, Q = function(a) {
            var b = P(a);
            return (299 * b.r + 587 * b.g + 114 * b.b) / 1e3 > 127.5 ? "#000" : "#fff"
        }, R = function(a) {
            if (!D.test(a))
                return !1;
            w.val(a),
            w.css("background", a),
            w.css("color", Q(a))
        }, S = function() {
            y[0].style.display = ""
        }, T = function() {
            y.hide()
        }, U = function() {
            return p = new d("Minimap",{
                activeTab: "minimap",
                template: '<div class="win-content message-list-wrapper searchable-list ng-scope"><header class="win-head"><h2><#= locale("minimap", "title") #> <span class="small">v<#= version #></span></h2><ul class="list-btn"><li><a href="#" class="twOverflow-close size-34x34 btn-red icon-26x26-close"></a></li></ul></header><div class="tabs tabs-bg"><div class="tabs-three-col"><div class="tab" tab="minimap"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("minimap", "minimap") #></a></div></div></div><div class="tab" tab="highlights"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("minimap", "highlights") #></a></div></div></div><div class="tab" tab="settings"><div class="tab-inner"><div><a href="#" class="btn-icon btn-orange"><#= locale("common", "settings") #></a></div></div></div></div></div><div class="win-main"><div class="box-paper footer has-footer-upper twOverflow-content-minimap"><canvas class="cross"></canvas><canvas class="minimap"></canvas></div><div class="box-paper footer has-footer-upper twOverflow-content-highlights"><h5 class="twx-section"><#= locale("minimap", "add") #></h5><form class="addForm"><table class="tbl-border-light tbl-striped"><colgroup><col width="30%"><col width="6%"><col><col width="12%"><col width="7%"></colgroup><tbody><tr><td class="item-input"><input type="text" class="textfield-border" autocomplete="off" placeholder="<#= locale("minimap", "entry/id") #>"></td><td><span class="item-icon"></span></td><td class="item-name"></td><td class="item-color"><input type="text" class="textfield-border" value="#000000" tooltip="<#= locale("minimap", "color") #>"></td><td class="item-add"><span class="btn-orange icon-26x26-plus" tooltip="<#= locale("minimap", "add") #>"></span></td></tr></tbody></table><table class="tbl-border-light tbl-striped color-picker" style="display: none"><tbody><tr> <# colorPalette.forEach(function (color) { #> <td style="background: <#= color #>" data-color="<#= color #>"></td> <# }) #> </tr></tbody></table></form><div class="highlights"><h5 class="twx-section"><#= locale("minimap", "highlights") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="6%"><col><col width="7%"><col width="7%"></colgroup> <# types.forEach(function (type) { #> <tbody class="<#= type #>"></tbody> <# }) #> </table></div></div><div class="box-paper footer has-footer-upper twOverflow-content-settings"><h5 class="twx-section"><#= locale("common", "misc") #></h5><form class="settings"><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody><tr><td>Villages right click action</td><td><select data-setting="rightClickAction"><option value="quick-highlight-village" selected="selected">Quick highlight village</option><option value="quick-highlight-player">Quick highlight player</option><option value="quick-highlight-tribe">Quick highlight tribe</option></select></td></tr><tr><td>Show floating minimap</td><td><label class="size-26x26 btn-orange icon-26x26-checkbox" for="settings-floatingMinimap"><input id="settings-floatingMinimap" type="checkbox" data-setting="floatingMinimap"></label></td></tr></tbody></table><h5 class="twx-section"><#= locale("common", "colors") #></h5><table class="tbl-border-light tbl-striped"><colgroup><col width="40%"><col></colgroup><tbody></tbody></table></form></div></div></div><div class="minimap-tooltip box-border-darker box-wrapper" style="display: none"><table class="tbl-border-light tbl-striped"><colgroup><col width="50%"><col width="50%"></colgroup><tbody><tr><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-26x26-village"></span><div class="text"><span>Village</span> <span class="overflow-ellipsis village-name"></span></div></div></td><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-26x26-points"></span><div class="text"><span>Village points</span> <span class="village-points"></span></div></div></td></tr><tr><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-player"></span><div class="text text-limited"><span>Player name</span> <span class="overflow-ellipsis player-name"></span></div></div></td><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-26x26-points"></span><div class="text"><span>Player Points</span> <span class="player-points"></span></div></div></td></tr><tr><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-tribe"></span><div class="text text-limited"><span>Tribe name</span> <span class="overflow-ellipsis tribe-name"></span></div></div></td><td class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-tribe-points"></span><div class="text"><span>Tribe points</span> <span class="tribe-points"></span></div></div></td></tr><tr><td colspan="2" class="cell-space-left"><div class="ff-cell-fix"><span class="size-34x34 icon-bg-black icon-34x34-province"></span><div class="text"><span>Province name</span> <span class="overflow-ellipsis province-name"></span></div></div></td></tr></tbody></table></div>',
                css: '#Minimap .minimap{background:#436213;position:absolute;left:0;top:0;z-index:0}#Minimap .cross{position:absolute;left:0;top:0;z-index:2}#Minimap .addForm input{width:100%}#Minimap .addForm .item-color input{font-weight:100}#Minimap .addForm td{text-align:center}#Minimap .highlights table{margin-bottom:10px}#Minimap .highlights td{text-align:center}#Minimap .highlights td.entry-name{text-align:left}#Minimap .highlights td.entry-name:hover{color:#fff;text-shadow:0 1px 0 #000}#Minimap .entry-color{background:#000000;height:26px;width:26px;display:inline-block;box-shadow:0 0 0 1px #421f09 inset,0 0 0 2px #976543 inset,0 0 0 3px #421f09 inset,0 0 1px 5px rgba(0,0,0,0.4) inset;text-shadow:1px 1px 0 #000;outline:none;border:none}#Minimap .entry-name{text-align:left;padding:0 10px}#Minimap .color-picker{height:30px;margin-top:11px}#Minimap .minimap-tooltip{position:absolute;width:440px;z-index:4000;padding:3px;background:url("data:image/png; base64,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") #45505c;transition:opacity .5s;top:20px;left:20px}#Minimap .minimap-tooltip.left{left:-410px}#Minimap .minimap-tooltip.top{top:-220px}#Minimap .minimap-tooltip .text span{width:100%;float:left;line-height:17px;font-size:13px;display:inline-block}#Minimap .minimap-tooltip .text-limited span{width:180px}',
                replaces: {
                    locale: b,
                    version: a.version,
                    types: ["village", "character", "tribe"],
                    colorPalette: a.colorPalette,
                    defaultColors: a.defaultColors
                },
                onTabClick: function(a) {
                    "minimap" === a ? p.$scrollbar.disable() : p.$scrollbar.enable()
                }
            }),
            q = new j("Minimap",{
                classHover: !1,
                classBlur: !1,
                onClick: function() {
                    var b = a.getMapPosition();
                    a.setCurrentPosition(b[0], b[1]),
                    p.openWindow()
                }
            }),
            p.$scrollbar.disable(),
            r = $(p.$window),
            t = r.find(".item-input input"),
            u = r.find(".item-icon"),
            v = r.find(".item-name"),
            w = r.find(".item-color input"),
            x = r.find(".item-add span"),
            y = r.find(".color-picker"),
            z = r.find(".minimap-tooltip"),
            A = {
                villageName: z.find(".village-name"),
                villagePoints: z.find(".village-points"),
                playerName: z.find(".player-name"),
                playerPoints: z.find(".player-points"),
                tribeName: z.find(".tribe-name"),
                tribePoints: z.find(".tribe-points"),
                provinceName: z.find(".province-name")
            },
            s = {
                village: r.find(".village"),
                character: r.find(".character"),
                tribe: r.find(".tribe")
            },
            B = r.find(".cross"),
            C = r.find(".minimap"),
            a.setViewport(C[0]),
            a.setCross(B[0]),
            O(),
            K(),
            a.interfaceInitialized = !0,
            p
        };
        a.interface = function() {
            a.interface = U()
        }
    }),
    define("two/ui", ["two/utils", "queues/EventQueue", "helper/dom", "ejs"], function(b, d, e, f) {
        function g(a, b) {
            var d = this;
            return k.push(d),
            d.windowId = a,
            d.activeTab = b.activeTab,
            d.settings = b,
            m(a, b.css),
            d.buildWindow(),
            d.bindTabs(),
            d.setCollapse(),
            d.setTooltips(),
            d.setCheckboxes(),
            d.setSelects(),
            d.$window.querySelector(".twOverflow-close").addEventListener("click", function() {
                d.closeWindow()
            }),
            c.$on(h.WINDOW_CLOSED, function(b, c, e) {
                (e || c === a) && d.closeWindow()
            }),
            d
        }
        var i = !1
          , k = []
          , l = function() {
            k.forEach(function(a) {
                a.closeWindow()
            })
        }
          , m = function(a, b) {
            var c = document.createElement("style");
            c.type = "text/css",
            c.id = "twOverflow-style-" + a,
            c.innerHTML = b,
            document.querySelector("head").appendChild(c)
        }
          , n = function(d) {
            var e = !1
              , f = document.createElement("span")
              , g = document.createElement("span")
              , i = document.createElement("span")
              , j = document.createElement("span")
              , k = function(a) {
                var c = a.srcElement || a.target;
                b.matchesElem(c, ".custom-select") || l()
            }
              , l = function() {
                c.$broadcast(h.SELECT_HIDE, "custom-select"),
                $(a).off("click", k),
                $(".win-main").off("mousewheel", l),
                e = !1,
                o()
            }
              , m = function(a, b) {
                g.innerHTML = a.name,
                f.dataset.name = a.name,
                f.dataset.value = a.value,
                $(f).trigger("selectSelected"),
                l()
            }
              , n = function() {
                i.classList.remove("icon-26x26-arrow-down"),
                i.classList.add("icon-26x26-arrow-up")
            }
              , o = function() {
                i.classList.remove("icon-26x26-arrow-up"),
                i.classList.add("icon-26x26-arrow-down")
            };
            d.querySelectorAll("option").forEach(function(a) {
                var b = document.createElement("span");
                b.dataset.name = a.innerText,
                b.dataset.value = a.value,
                j.appendChild(b),
                a.hasAttribute("selected") && (g.innerHTML = a.innerText,
                f.dataset.name = a.innerText,
                f.dataset.value = a.value)
            });
            for (var p in d.dataset)
                f.dataset[p] = d.dataset[p];
            f.className = "custom-select " + d.className,
            i.className = "custom-select-button icon-26x26-arrow-down",
            g.className = "custom-select-handler",
            j.className = "custom-select-data",
            f.appendChild(g),
            f.appendChild(i),
            f.appendChild(j),
            f.addEventListener("click", function() {
                if (e)
                    return l();
                var b = j.querySelectorAll("span")
                  , d = []
                  , i = {};
                b.forEach(function(a) {
                    var b = {
                        name: a.dataset.name,
                        value: a.dataset.value
                    };
                    a.dataset.icon && (b.leftIcon = isNaN(a.dataset.icon) ? a.dataset.icon : parseInt(a.dataset.icon, 10)),
                    a.dataset.name === g.innerHTML && (i = b),
                    d.push(b)
                }),
                c.$broadcast(h.SELECT_SHOW, "custom-select", d, i, m, f, !0),
                e = !0,
                n(),
                $(".win-main").on("mousewheel", l),
                $(a).on("click", k)
            }),
            d.replaceWith(f)
        };
        return g.prototype.buildWindow = function() {
            this.$wrapper = $("#wrapper"),
            this.$window = document.createElement("section"),
            this.$window.id = this.windowId,
            this.$window.className = "twOverflow-window twx-window screen left",
            this.$window.style.visibility = "hidden",
            this.$window.innerHTML = f.render(this.settings.template, this.settings.replaces),
            this.$wrapper.append(this.$window),
            this.$scrollbar = jsScrollbar(this.$window.querySelector(".win-main"))
        }
        ,
        g.prototype.openWindow = function() {
            j.closeAll(),
            l(),
            this.$window.style.visibility = "visible",
            this.$wrapper.addClass("window-open"),
            this.resizeWindowFrame()
        }
        ,
        g.prototype.resizeWindowFrame = function() {
            d.trigger(d.types.RESIZE, {
                instant: !0,
                right: !0
            })
        }
        ,
        g.prototype.closeWindow = function() {
            "visible" === this.$window.style.visibility && (this.settings.onClose && this.settings.onClose(),
            this.$window.style.visibility = "hidden",
            this.$wrapper.removeClass("window-open"),
            this.resizeWindowFrame())
        }
        ,
        g.prototype.toggleWindow = function(a) {
            this.$window.style.visibility = a,
            this.$wrapper.toggleClass("window-open"),
            this.resizeWindowFrame()
        }
        ,
        g.prototype.tabsState = function(a, b) {
            var c = this;
            if (a === b)
                return !1;
            c.$tabs.forEach(function(d) {
                var e = d.getAttribute("tab");
                if (e !== a && e !== b)
                    return !1;
                e === a ? c.disableTab(e, d) : e === b && c.enableTab(e, d)
            })
        }
        ,
        g.prototype.bindTabs = function() {
            var a = this;
            a.$tabs = a.$window.querySelectorAll(".tab"),
            a.$tabs.forEach(function(b) {
                var c = b.getAttribute("tab");
                b.addEventListener("click", function() {
                    a.tabsState(a.activeTab, c),
                    a.activeTab = c,
                    a.settings.onTabClick && a.settings.onTabClick(c)
                }),
                a.activeTab === c ? a.enableTab(c, b) : a.disableTab(c, b),
                a.recalcScrollbar()
            })
        }
        ,
        g.prototype.enableTab = function(a, b) {
            var c = this.$window.querySelector(".twOverflow-content-" + a)
              , d = this.$window.querySelectorAll(".twOverflow-button-" + a)
              , e = this.$window.querySelectorAll(".twOverflow-button")
              , f = b.querySelector(".tab-inner > div")
              , g = b.querySelector("a")
              , h = this.$window.querySelector("footer");
            c.style.display = "",
            b.classList.add("tab-active"),
            f.classList.add("box-border-light"),
            g.classList.remove("btn-icon", "btn-orange"),
            h && (h.style.display = d.length || e.length ? "" : "none",
            d.length && d.forEach(function(a) {
                a.style.display = ""
            })),
            this.$scrollbar.content = c,
            this.recalcScrollbar()
        }
        ,
        g.prototype.disableTab = function(a, b) {
            var c = this.$window.querySelector(".twOverflow-content-" + a)
              , d = this.$window.querySelectorAll(".twOverflow-button-" + a)
              , e = (this.$window.querySelectorAll(".twOverflow-button"),
            b.querySelector(".tab-inner > div"))
              , f = b.querySelector("a")
              , g = this.$window.querySelector("footer");
            c.style.display = "none",
            b.classList.remove("tab-active"),
            e.classList.remove("box-border-light"),
            f.classList.add("btn-icon", "btn-orange"),
            g && d.length && d.forEach(function(a) {
                a.style.display = "none"
            })
        }
        ,
        g.prototype.destroy = function() {
            document.querySelector("#twOverflow-style-" + this.windowId).remove(),
            this.$window.remove()
        }
        ,
        g.prototype.setCollapse = function() {
            var a = this;
            a.$window.querySelectorAll(".twx-section.collapse").forEach(function(b) {
                var c = !b.classList.contains("hidden-content")
                  , d = document.createElement("span");
                d.className = "min-max-btn";
                var e = document.createElement("a");
                e.className = "btn-orange icon-26x26-" + (c ? "minus" : "plus"),
                c || (b.nextSibling.style.display = "none"),
                d.appendChild(e),
                b.appendChild(d),
                d.addEventListener("click", function() {
                    "none" === b.nextSibling.style.display ? (b.nextSibling.style.display = "",
                    e.className = e.className.replace("plus", "minus"),
                    c = !0) : (b.nextSibling.style.display = "none",
                    e.className = e.className.replace("minus", "plus"),
                    c = !1),
                    a.recalcScrollbar()
                })
            })
        }
        ,
        g.prototype.setTooltips = function() {
            var a = this
              , b = $("#tooltip");
            b.find(".tooltip-content-wrapper");
            a.$window.querySelectorAll("[tooltip]").forEach(function(a) {
                var b = a.getAttribute("tooltip");
                a.removeAttribute("tooltip"),
                a.addEventListener("mouseenter", function(a) {
                    c.$broadcast(h.TOOLTIP_SHOW, "twoverflow-tooltip", b, !0, a)
                }),
                a.addEventListener("mouseleave", function() {
                    c.$broadcast(h.TOOLTIP_HIDE, "twoverflow-tooltip")
                })
            })
        }
        ,
        g.prototype.setCheckboxes = function() {
            this.$window.querySelectorAll("input[type=checkbox]").forEach(function(a) {
                a.addEventListener("click", function() {
                    $(a).parent().toggleClass("icon-26x26-checkbox-checked")
                })
            })
        }
        ,
        g.prototype.isVisible = function(a) {
            var b = "visible" === this.$window.style.visibility;
            return b && a && (b = this.activeTab === a),
            b
        }
        ,
        g.prototype.recalcScrollbar = function() {
            this.$scrollbar.recalc()
        }
        ,
        g.prototype.setSelects = function() {
            this.$window.querySelectorAll("select").forEach(function(a) {
                n(a)
            })
        }
        ,
        g.init = function() {
            i = !0,
            m("own", '#twOverflow-leftbar{position:relative;top:0;left:0;margin-bottom:7px}#twOverflow-leftbar .button{white-space:nowrap;position:relative;top:-17px;left:0;min-width:70px;height:24px;padding:0 3px}#twOverflow-leftbar .label,#twOverflow-leftbar .quickview{margin:5px 0;font-size:12px}#twOverflow-leftbar .quickview{display:none}#wrapper.window-open #twOverflow-leftbar .button{left:720px}.twOverflow-window{visibility:hidden}.twOverflow-window h3{color:#000}.twOverflow-window p{color:#000;margin:7px 0;padding:0 40px}.twOverflow-window p span.sample{font-weight:bold;font-style:italic}.twOverflow-window p span.brazil{color:green;font-weight:bold}.twOverflow-window p .opensource{background:url(https://i.imgur.com/KFHdWXN.png);width:15px;height:15px;display:inline-block;vertical-align:-2px}.twOverflow-window input::placeholder{color:#6d563c}.twOverflow-window input[type="text"],.twOverflow-window input[type="number"],.twOverflow-window select{color:black;text-align:center}.twOverflow-window select{width:100%;padding:0 0 0 5px;font-size:14px;border:1px solid #976543;height:28px;text-decoration:none;text-align-last:center;border-radius:2px;font-weight:600;font-family:"Trebuchet MS";color:white;box-shadow:0 0 0 1px #421f09 inset,0 0 0 2px #976543 inset,0 0 0 3px #421f09 inset,0 -1px 1px 4px rgba(215,181,144,0.7) inset,0 0 1px 5px rgba(0,0,0,0.4) inset;-webkit-appearance:none;-moz-appearance:none;outline:none;background-image:url(https://i.imgur.com/SlaWRrX.png),url(https://i.imgur.com/e2qKrmX.png);background-repeat:no-repeat,repeat;background-position:293px -3px,top left;background-color:#b28e68}.twOverflow-window .custom-select{position:relative;display:inline-block}.twOverflow-window .custom-select .custom-select-button{height:21px;position:absolute;right:1px;top:1px}.twOverflow-window .custom-select .custom-select-handler{text-align:center;line-height:25px;height:25px;display:block;background:url("data:image/png;base64,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") top left #ceab84;box-shadow:inset 0 0 0 1px #533a1f,inset 0 0 0 2px #dcba94,0 0 2px rgba(0,0,0,0.6);padding:0 10px}.twOverflow-window .custom-select .custom-select-data{display:none}.twOverflow-window .center{text-align:center}.twOverflow-window .reduced{height:30px}@keyframes expand-button{100%{width:250px}}@keyframes contract-button{0%{width:250px}}.expand-button{animation:expand-button .1s forwards}.contract-button{animation:contract-button .1s forwards}.icon-26x26-preset{background-image:url(data:image/png;base64,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);margin-top:2px;margin-left:5px}')
        }
        ,
        g.isInitialized = function() {
            return i
        }
        ,
        g
    }),
    define("two/ui/autoComplete", ["two/utils", "two/locale", "helper/dom", "struct/MapData"], function(b, d, e, i) {
        var j = "two-autocomplete"
          , k = !1
          , l = function(a) {
            var c = a.srcElement || a.target;
            b.matchesElem(c, ".custom-select") || n.hide()
        }
          , m = function(a) {
            n.hide(),
            c.$broadcast(h.SELECT_HIDE, j),
            c.$broadcast(h.SELECT_SELECTED, j, a)
        }
          , n = {};
        return n.hide = function() {
            c.$broadcast(h.SELECT_HIDE, j),
            $(a).off("click", l),
            $(".win-main").off("mousewheel", n.hide),
            k = !1
        }
        ,
        n.show = function(b, e, f, g) {
            return j = f,
            !!b.length && (c.$broadcast(h.SELECT_SHOW, j, b, null, m, e, !0, 0, d("common", "no-results")),
            k || (k = !0,
            $(".win-main").on("mousewheel", n.hide),
            $(a).on("click", l)),
            !0)
        }
        ,
        n.search = function(a, c, d, e) {
            var h = [];
            if (b.isValidCoords(a)) {
                var j = a.split("|").map(function(a) {
                    return parseInt(a, 10)
                });
                return void i.loadTownDataAsync(j[0], j[1], 1, 1, function(a) {
                    a && h.push({
                        id: a.id,
                        type: "village",
                        name: b.genVillageLabel(a)
                    }),
                    c(h)
                })
            }
            f.emit(g.AUTOCOMPLETE, {
                types: d || ["village", "character", "tribe"],
                string: a,
                amount: e || 5
            }, function(a) {
                for (var d in a.result)
                    a.result[d].forEach(function(a, c) {
                        a.type = d,
                        a.leftIcon = "size-34x34 icon-26x26-rte-" + d,
                        "village" === d && (a.name = b.genVillageLabel(a)),
                        h.push(a)
                    });
                c(h)
            })
        }
        ,
        n
    }),
    define("two/ui/buttonLink", ["ejs"], function(a) {
        return function(b, c, d) {
            var e = Math.round(1e5 * Math.random())
              , f = a.render('<a id="l<#= uid #>" class="img-link icon-20x20-<#= type #> btn btn-orange padded"><#= text #></a>', {
                type: b,
                text: c,
                uid: e
            })
              , g = document.createElement("div");
            g.innerHTML = f,
            g = g.firstChild;
            var h;
            switch (b) {
            case "village":
                h = function() {
                    i.openVillageInfo(d)
                }
                ;
                break;
            case "character":
                h = function() {
                    i.openCharacterProfile(d)
                }
            }
            return g.addEventListener("click", h),
            {
                html: f,
                id: "l" + e,
                elem: g
            }
        }
    }),
    define("two/FrontButton", ["ejs"], function(a) {
        function b(a, b) {
            this.options = b = angular.merge({
                label: a,
                className: "",
                classHover: "expand-button",
                classBlur: "contract-button",
                tooltip: !1,
                onClick: function() {}
            }, b),
            this.buildWrapper(),
            this.appendButton();
            var d = this.$elem
              , e = d.find(".label")
              , f = d.find(".quickview");
            return b.classHover && d.on("mouseenter", function() {
                d.addClass(b.classHover),
                d.removeClass(b.classBlur),
                e.hide(),
                f.show()
            }),
            b.classBlur && d.on("mouseleave", function() {
                d.addClass(b.classBlur),
                d.removeClass(b.classHover),
                f.hide(),
                e.show()
            }),
            b.tooltip && (d.on("mouseenter", function(a) {
                c.$broadcast(h.TOOLTIP_SHOW, "twoverflow-tooltip", b.tooltip, !0, a)
            }),
            d.on("mouseleave", function() {
                c.$broadcast(h.TOOLTIP_HIDE, "twoverflow-tooltip")
            })),
            b.onClick && this.click(b.onClick),
            this
        }
        return b.prototype.updateQuickview = function(a) {
            this.$elem.find(".quickview").html(a)
        }
        ,
        b.prototype.hover = function(a) {
            this.$elem.on("mouseenter", a)
        }
        ,
        b.prototype.click = function(a) {
            this.$elem.on("click", a)
        }
        ,
        b.prototype.buildWrapper = function() {
            var a = document.getElementById("twOverflow-leftbar");
            a || (a = document.createElement("div"),
            a.id = "twOverflow-leftbar",
            $("#toolbar-left").prepend(a)),
            this.$wrapper = a
        }
        ,
        b.prototype.appendButton = function() {
            var b = a.render('<div class="btn-border btn-green button <#= className #>"><div class="top-left"></div><div class="top-right"></div><div class="middle-top"></div><div class="middle-bottom"></div><div class="middle-left"></div><div class="middle-right"></div><div class="bottom-left"></div><div class="bottom-right"></div><div class="label"><#= label #></div><div class="quickview"></div></div>', {
                className: this.options.className,
                label: this.options.label
            })
              , c = document.createElement("div");
            c.innerHTML = b;
            var d = c.children[0];
            this.$wrapper.appendChild(d),
            this.$elem = $(d)
        }
        ,
        b.prototype.destroy = function() {
            this.$elem.remove()
        }
        ,
        b
    }),
    require(["two/ready", "two/ui"], function(a, b) {
        if (b.isInitialized())
            return !1;
        a(function() {
            b.init()
        })
    })
}(this);
//# sourceMappingURL=tw2overflow.map
